import { apiPost, apiGet, apiPatch } from "../../lib/apiClient";


export function normalizeThread(raw) {
  const externalId = raw.externalUserId;

  // nếu backend không có tên hoặc trả "Facebook User" thì dùng FB-id
  const displayTitle =
    raw.title && raw.title !== "Facebook User"
      ? raw.title
      : externalId
      ? `FB-${externalId}`
      : "Facebook User";

  return {
    id: raw.id,
    title: displayTitle,
    iconUrl: raw.avatarUrl || null, // null thì FE sẽ dùng ảnh default
    participants: [
      {
        id: externalId,
        name: displayTitle,
        avatarUrl: raw.avatarUrl || null,
      },
    ],
    updatedAt: raw.lastMessageAt,
    lastMessageSentBy: raw.lastMessageSentBy || null,
    lastMessageSnippet: raw.lastMessageSnippet || "",
    unread: raw.unread ,
  };
}

// Chuẩn hóa 1 message từ backend 
export function normalizeMessage(m) {
  const dir = String(m.direction || "").toUpperCase();

  return {
    id: m.id,
    text: m.text || "",
    html: null,
    attachments: [],             // hiện tại backend chưa có
    sentAt: m.createdAt,         // MessageBubble dùng msg.sentAt
    sentBy: m.sentBy,
    
    status: m.status || "",
    isMine: dir === "OUT",       // OUT = tin của Agent
  };
}

// ==== API chính ====

// GET /api/chat/conversations
export async function fetchThreads({ q = "", mine = false, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (mine) params.set("mine", "1");
  if (limit) params.set("limit", String(limit));

  const res = await apiGet(`/api/chat/conversations?${params.toString()}`);
  
  const items = Array.isArray(res?.items) ? res.items : [];
  return items.map(normalizeThread);
}

// GET /api/chat/conversations/:id/messages
export async function fetchMessages(conversationId, { limit = 200 } = {}) {
  const res = await apiGet(`/api/chat/conversations/${conversationId}/messages?limit=${limit}`);
  const items = Array.isArray(res?.items) ? res.items : [];
  return items.map(normalizeMessage);
}

// POST /api/chat/conversations/:id/messages
export async function sendMessage(conversationId, text) {
  const payload = { text };
  const res = await apiPost(`/api/chat/conversations/${conversationId}/messages`, payload);
  // backend đã trả 1 object duy nhất
  return normalizeMessage(res);
}

// Patch /api/chat/conversations/:id/read
export async function markConversationRead(conversationId) {
  return apiPatch(`/api/chat/conversations/${conversationId}/read`, {});
}

// lấy unreadConversationCount 
export async function fetchUnreadCount() {
  const data = await apiGet("/api/chat/conversations/unread-count");

  return data.total ?? 0;
}
