import type { Request, Response } from "express";
import { saveInboundMessage, findOrCreateConversationByPageAndUser, saveOutboundMessage } from "../chat/chat.service";
import { sendTextMessageViaGraph } from "./facebook.service";
import { broadcastMessage } from "../chat/chat.socket";

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

/** POST /api/facebook/webhook (nhận tin nhắn thật từ Facebook) */
export async function receiveWebhook(req: Request, res: Response) {
 
  try {
    const body = req.body;
  
    if (body?.object !== "page") return res.sendStatus(404);

    for (const entry of body.entry || []) {
      const pageId = String(entry.id || "");
      for (const ev of entry.messaging || []) {
        const senderId = String(ev?.sender?.id || "");
        const recipientId = String(ev?.recipient?.id || "");
        if (!pageId || !senderId || !recipientId) continue;

        // Luật đơn giản: sender === pageId => OUTBOUND (echo); ngược lại INBOUND
        const isOutbound = senderId === pageId;
        const userPsid = isOutbound ? recipientId : senderId;

        // CASE: MESSAGE (text/attachments)
        if (ev.message) {
          const mid = ev.message.mid as string | undefined;
          const textRaw = (ev.message.text || "").trim();
          const text =
            textRaw ||
            (Array.isArray(ev.message.attachments) && ev.message.attachments.length
              ? `[${ev.message.attachments[0].type} attachment]`
              : "");

          if (isOutbound) {
            // OUT: cần conversationId để lưu
            const { conv } = await findOrCreateConversationByPageAndUser(pageId, userPsid);
            const msg = await saveOutboundMessage(conv.id, text, mid);

            broadcastMessage(conv.id, {
              id: msg.id,
              direction: msg.direction,
              text: msg.text,
              createdAt: msg.createdAt,
              status: msg.status,
            });
          } else {
            // IN: dùng đúng chữ ký saveInboundMessage(pageId, psid, text, mid?)
            const saved = await saveInboundMessage(pageId, userPsid, text, mid);
            const m = saved.message;

            broadcastMessage(saved.conversationId, {
              id: m.id,
              direction: m.direction,
              text: m.text,
              createdAt: m.createdAt,
              status: m.status,
            });
          }
          continue;
        }

        // CASE: POSTBACK -> coi như IN
        if (ev.postback) {
          const text =
            String(ev.postback.title || ev.postback.payload || "").trim() || "[postback]";
          const saved = await saveInboundMessage(pageId, userPsid, text);
          const m = saved.message;

          broadcastMessage(saved.conversationId, {
            id: m.id,
            direction: m.direction,
            text: m.text,
            createdAt: m.createdAt,
            status: m.status,
          });
          continue;
        }

        // CASE: khác (delivery/read) -> chỉ log
        if (ev.delivery) console.log("[FB DELIVERY]", ev.delivery);
        if (ev.read) console.log("[FB READ]", ev.read);
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (e) {
    console.error("[FB WEBHOOK][ERROR]", e);
    return res.status(200).send("OK");
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
    
    const { conv } = await findOrCreateConversationByPageAndUser(pageId, psid);

    // gửi ra Facebook
    const fb = await sendTextMessageViaGraph(pageId, psid, text);

    // lưu OUT vào DB
    const msg = await saveOutboundMessage(conv.id, text, fb?.message_id);

    // realtime
    broadcastMessage(conv.id, {
      id: msg.id,
      direction: msg.direction,
      text: msg.text,
      createdAt: msg.createdAt,
      status: msg.status,
    });
   
    return res.json({ ok: true, message: msg });
  
  } catch (e: any) {
    console.error("Send error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Send failed" });
  }
}



