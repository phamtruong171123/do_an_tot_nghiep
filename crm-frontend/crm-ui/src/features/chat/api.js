import { apiPost, apiGet } from "../../lib/apiClient";

function normalizeThread(c) {
  const title = c.title || c.externalUserId || "Khách hàng";

  return {
    id: c.id,
    title,
    // avatar cho ThreadList + ChatHeader
    iconUrl: c.avatarUrl || null,
    participants: [
      {
        id: c.externalUserId,
        name: title,
        avatarUrl: c.avatarUrl || null,
      },
    ],
    // ThreadListItem đang dùng updatedAt
    updatedAt: c.lastMessageAt || null,
    lastMessageSnippet: c.lastMessageSnippet || "",
    unread: c.unread ?? 0,

    // lưu thêm, có thể dùng sau này
    type: c.type,
    externalUserId: c.externalUserId,
    assignee: c.assignee || null,
  };
}

// Chuẩn hóa 1 message từ backend 
function normalizeMessage(m) {
  const dir = String(m.direction || "").toUpperCase();

  return {
    id: m.id,
    text: m.text || "",
    html: null,
    attachments: [],             // hiện tại backend chưa có, để trống
    sentAt: m.createdAt,         // MessageBubble dùng msg.sentAt
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