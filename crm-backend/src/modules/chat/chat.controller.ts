import { Request, Response } from "express";
import {
  assignConversation,
  getConversationWithChannel,
  listConversations,
  listMessages,
  saveOutboundMessage,
} from "./chat.service";
import { sendTextMessageViaGraph } from "../facebook/facebook.service";
import { broadcastMessage } from "./chat.socket";

export async function listConversationsHandler(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const q = (req.query.q as string) || "";
  const mine = String(req.query.mine || "0") === "1";

  // nếu chưa có auth, tạm dùng DEFAULT_ASSIGNEE_USER_ID khi mine=1
  const meId = (req as any)?.user?.id ?? (mine && process.env.DEFAULT_ASSIGNEE_USER_ID
    ? Number(process.env.DEFAULT_ASSIGNEE_USER_ID)
    : null);

  const rows = await listConversations({ q, mineUserId: mine ? meId : null, limit });

  return res.json({
    items: rows.map((c) => ({
      id: c.id,
      type: c.channel.type,
      externalUserId: c.externalUserId,
      title: c.title,
      avatarUrl: `https://graph.facebook.com/${c.externalUserId}/picture?type=normal`,
      lastMessageSnippet: c.lastMessageText || "",
      lastMessageAt: c.lastMessageAt || c.updatedAt,
      assignee: c.assignee ? { id: c.assignee.id, name: c.assignee.username } : null,
      unread: 0,
    })),
  });
}

export async function listMessagesHandler(req: Request, res: Response) {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await listMessages(id, limit);

  return res.json({
    items: rows.map((m) => ({
      id: m.id,
      direction: m.direction,
      text: m.text,
      createdAt: m.createdAt,
      status: m.status,
    })),
  });
}

export async function postMessageHandler(req: Request, res: Response) {
  const { id } = req.params;
  const text = String(req.body?.text || "");
  if (!text) return res.status(400).json({ error: "Text required" });

  const conv = await getConversationWithChannel(id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  // gửi ra Facebook
  const fb = await sendTextMessageViaGraph(conv.channel.pageId, conv.externalUserId, text);
  const msg = await saveOutboundMessage(conv.id, text, fb?.message_id);

  broadcastMessage(conv.id, {
    id: msg.id,
    direction: msg.direction,
    text: msg.text,
    createdAt: msg.createdAt,
    status: msg.status,
  });

  return res.json({
    id: msg.id,
    conversationId: conv.id,
    direction: "OUT",
    text,
    status: "sent",
    createdAt: msg.createdAt,
  });
}

export async function assignConversationHandler(req: Request, res: Response) {
  const { id } = req.params;
  const userId = Number((req.body as any)?.userId);
  if (!userId) return res.status(400).json({ error: "userId required (number)" });

  try {
    const conv = await assignConversation(id, userId);
    return res.json({
      id: conv.id,
      assignee: conv.assignee ? { id: conv.assignee.id, name: conv.assignee.username } : null,
      assignedAt: conv.assignedAt,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Assign failed" });
  }
}
