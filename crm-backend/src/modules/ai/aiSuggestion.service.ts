import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

import { saveOutboundMessage } from "../chat/chat.service";
import { sendTextMessageViaGraph } from "../facebook/facebook.service";
import { broadcastMessage } from "../chat/chat.socket";
import { getGptConfig } from "../gptConfig/gptConfig.service";

const prisma = new PrismaClient();

export type AiSuggestionResult = {
  source: "faq_ai" | "no_faq_match" | "ai_error";
  suggestion: string | null; // Text gửi thẳng cho khách
  matchedFaqIds: number[];
};

// ===== Helper: chuẩn hoá & tokenize tiếng Việt =====
const STOPWORDS = new Set([
  "la",
  "là",
  "va",
  "và",
  "ben",
  "bên",
  "khoang",
  "khoảng",
  "bao",
  "nhieu",
  "nhiêu",
  "vay",
  "vậy",
  "a",
  "ạ",
  "em",
  "anh",
  "chi",
  "chị",
  "co",
  "cô",
  "chu",
  "chú",
  "shop",
]);

function normalizeText(input: string): string {
  return (
    input
      .toLowerCase()
      // bỏ dấu tiếng Việt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // bỏ ký tự không phải chữ/số
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function tokenize(input: string): string[] {
  const norm = normalizeText(input);
  if (!norm) return [];
  return norm.split(" ").filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

async function findFaqCandidates(text: string, limit = 3) {
  const tokens = tokenize(text);
  if (!tokens.length) return [];

  // Lấy tất cả FAQ active
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
  });

  // Chấm điểm từng FAQ theo số từ trùng
  const scored = faqs
    .map((f) => {
      const haystackTokens = new Set(tokenize(`${f.question} ${f.answer}`));

      let matches = 0;
      for (const t of tokens) {
        if (haystackTokens.has(t)) matches++;
      }

      const score = matches === 0 ? 0 : matches / tokens.length; // tỉ lệ từ trùng trên tổng số từ của câu hỏi

      return { faq: f, score };
    })
    .filter((x) => x.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.faq);
}

// Sinh câu trả lời từ FAQ bằng OpenAI
export async function generateSuggestionFromFaq(text: string): Promise<AiSuggestionResult> {
  const gptConfig = await getGptConfig();
  const apiKey = (gptConfig.apiKey || process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("Missing OpenAI API key (db/env).");
  const trimmed = text?.trim();
  if (!trimmed) {
    return { source: "ai_error", suggestion: null, matchedFaqIds: [] };
  }

  const candidates = await findFaqCandidates(trimmed, 3);
  if (!candidates.length) {
    return { source: "no_faq_match", suggestion: null, matchedFaqIds: [] };
  }

  const faqText = candidates
    .map(
      (f, idx) => `FAQ #${idx + 1}
Q: ${f.question}
A: ${f.answer}`
    )
    .join("\n\n");

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: (gptConfig.baseUrl || "https://api.openai.com/v1").trim(),
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            gptConfig.systemPrompt ||
            "You are an AI assistant that helps answer customer questions based on provided FAQ information.",
        },
        {
          role: "user",
          content: [
            `Câu hỏi của khách: "${trimmed}"`,
            "",
            "Thông tin tham khảo từ FAQ:",
            faqText,
            "",
            "Hãy viết đúng nội dung tin nhắn sẽ gửi cho khách.",
          ].join("\n"),
        },
      ],
      max_tokens: 200,
      temperature: gptConfig.temperature,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || "";

    if (!suggestion) {
      return { source: "ai_error", suggestion: null, matchedFaqIds: [] };
    }

    return {
      source: "faq_ai",
      suggestion,
      matchedFaqIds: candidates.map((c) => c.id),
    };
  } catch (err) {
    console.error("AI suggestion error:", err);
    return {
      source: "ai_error",
      suggestion: null,
      matchedFaqIds: [],
    };
  }
}

// Bối cảnh để auto-reply (Facebook)
type AutoReplyContext = {
  pageId: string; // Page Id từ webhook
  psid: string; // PSID của khách
  conversationId: string; // id Conversation trong DB
  text: string; // nội dung khách vừa gửi
};

/**
 * Auto-reply:
 *  - Nếu text match FAQ → gửi trả lời luôn cho khách
 *  - Nếu không match → không làm gì
 */
export async function autoReplyByFaqIfMatch(ctx: AutoReplyContext) {
  const rawText = ctx.text?.trim() || "";

  // Nếu chỉ là placeholder rác (ví dụ [image attachment]) thì bỏ
  if (!rawText || !/[a-zA-Z0-9\u00C0-\u1EF9]/.test(rawText)) {
    return;
  }

  try {
    const result = await generateSuggestionFromFaq(rawText);
    if (result.source !== "faq_ai" || !result.suggestion) {
      return;
    }

    const replyText = result.suggestion;

    // 1) Gửi ra Facebook
    const fbRes = await sendTextMessageViaGraph(ctx.pageId, ctx.psid, replyText);
    const externalMessageId = (fbRes as any)?.message_id || (fbRes as any)?.id || undefined;

    // 2) Lưu OUTBOUND message vào DB
    const msg = await saveOutboundMessage(ctx.conversationId, replyText, externalMessageId, "BOT");

    // 3) Broadcast cho FE qua socket (để Agent vẫn thấy bot trả lời)
    broadcastMessage(ctx.conversationId, {
      id: msg.id,
      direction: msg.direction, // "OUT"
      text: msg.text,
      sentBy: msg.sentBy,
      createdAt: msg.createdAt,
      status: msg.status,
    });
  } catch (err) {
    console.error("[autoReplyByFaqIfMatch] error:", err);

  }
}
