import type { Request, Response } from "express";
import { saveInboundMessage, findOrCreateConversationByPageAndUser, saveOutboundMessage } from "../chat/chat.service";
import { sendTextMessageViaGraph } from "./facebook.service";
import { broadcastMessage } from "../chat/chat.socket";
import { autoReplyByFaqIfMatch } from "../ai/aiSuggestion.service";

/** GET /api/facebook/webhook (Facebook verify) */
export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
    
  }
  return res.sendStatus(403);
}

/** POST /api/facebook/webhook (nhận tin NHẮN ĐẾN từ khách) */
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    // Chỉ xử lý event từ Page
    if (body?.object !== "page") return res.sendStatus(404);

    for (const entry of body.entry ?? []) {
      const pageId = String(entry.id ?? "");
      if (!pageId) continue;

      for (const ev of entry.messaging ?? []) {
        const senderId = String(ev?.sender?.id ?? "");
        const recipientId = String(ev?.recipient?.id ?? "");
        if (!senderId || !recipientId) continue;

        // Theo thiết kế: webhook này CHỈ xử lý tin từ khách -> page
        const userPsid = senderId;

        const message = ev.message;
        const postback = ev.postback;

        // Chuẩn hoá về 1 kiểu "inbound text"
        let inboundText = "";
        let mid: string | undefined = undefined;

        if (message) {
          mid = message.mid as string | undefined;

          const textRaw = (message.text || "").trim();
          inboundText =
            textRaw ||
            (Array.isArray(message.attachments) &&
            message.attachments.length > 0
              ? `[${message.attachments[0].type} attachment]`
              : "");
        } else if (postback) {
          inboundText =
            String(postback.title || postback.payload || "").trim() ||
            "[postback]";
        }

        // Nếu không rơi vào message/postback hoặc không có nội dung xử lý
        if (!inboundText) {
          if (ev.delivery) console.log("[FB DELIVERY]", ev.delivery);
          if (ev.read) console.log("[FB READ]", ev.read);
          continue;
        }

  
        const saved = await saveInboundMessage(pageId, userPsid, inboundText, mid);
        const m = saved.message;

        // Broadcast INBOUND cho FE
        broadcastMessage(saved.conversationId, {
          id: m.id,
          direction: m.direction, // "IN"
          text: m.text,
          sentBy:m.sentBy,
          createdAt: m.createdAt,
          status: m.status,
        });

        // AUTO-REPLY nếu match FAQ
        await autoReplyByFaqIfMatch({
          pageId,
          psid: userPsid,
          conversationId: saved.conversationId,
          text: inboundText,
        });
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("[FB webhook] error:", err);
    return res.sendStatus(500);
  }
}


function normalizeAttachments(raw?: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    const type = a?.type || "unknown";
    const payload = a?.payload || {};
    return {
      type,
      url: payload?.url || null,
      sticker_id: a?.sticker_id || null,
      raw: a,
    };
  });
}

/**
 * POST /api/facebook/send
 * body: { pageId?: string, toUserId: string, text: string }
 * - Dùng để debug gửi ra Facebook / tạo hội thoại nếu chưa có
 */
export async function sendMessage(req: Request, res: Response) {
  const pageId = String(req.body?.pageId || process.env.FB_PAGE_ID || "");
  const psid   = String(req.body?.toUserId || "");
  const text   = String(req.body?.text || "");
  
  console.log("Send message request:", { pageId, psid, text });
  if (!pageId) return res.status(400).json({ error: "pageId required (env FB_PAGE_ID or in body)" });
  if (!psid || !text) return res.status(400).json({ error: "toUserId & text required" });

  try {
    
    const { conversation: conv } = await findOrCreateConversationByPageAndUser(pageId, psid);

    // gửi ra Facebook
    const fb = await sendTextMessageViaGraph(pageId, psid, text);

    // lưu OUT vào DB
    const msg = await saveOutboundMessage(conv.id, text, fb?.message_id);

    // realtime
    broadcastMessage(conv.id, {
      id: msg.id,
      direction: msg.direction,
      text: msg.text,
      sentBy:msg.sentBy,
      createdAt: msg.createdAt,
      status: msg.status,
    });
   
    return res.json({ ok: true, message: msg });
  
  } catch (e: any) {
    console.error("Send error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Send failed" });
  }
}



