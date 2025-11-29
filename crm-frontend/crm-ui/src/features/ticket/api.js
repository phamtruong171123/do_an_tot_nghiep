import { apiGet, apiPost, apiPatch } from "../../lib/apiClient";

// Map dữ liệu BE → FE cho list ticket
export function normalizeTicketSummary(raw) {
  const customerName = raw.customer?.name || "";
  const assigneeName =
    raw.assignee?.name || raw.assignee?.username || "";
  const notesCount= typeof raw.notesCount === "number" ? raw.notesCount : 0;
   
  return {
    id: raw.id,
    code: raw.code,
    subject: raw.subject,
    customerName,
    dueAt: raw.dueAt || null,
    isOverdue: !!raw.isOverdue,
    assigneeId: raw.assigneeId ?? null,
    assigneeName,
    status: raw.status,
    priority: raw.priority,
    notesCount,
  };
}

// GET /api/tickets
export async function fetchTickets({
  status,    // "OPEN" | "PENDING" | "CLOSED" | undefined
  mine,      // boolean
  q,         // search string
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams();

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (mine) params.set("mine", "1");
  if (status && status !== "ALL") params.set("status", status);
  if (q && q.trim()) params.set("q", q.trim());

  const res = await apiGet(`/api/tickets?${params.toString()}`);

  return {
    items: Array.isArray(res.items)
      ? res.items.map(normalizeTicketSummary)
      : [],
    total: typeof res.total === "number" ? res.total : 0,
  };
}

// POST /api/tickets

export async function createTicketFromForm(form) {
  const payload = {
    subject: form.subject?.trim() || "",
    description: null,
    priority: form.priority || "NORMAL",
    conversationId: null,
    customerId: null,
    assigneeId: null, 
  };

  const res = await apiPost("/api/tickets", payload);
  return normalizeTicketSummary(res);
}

// PATCH /api/tickets/:id
export async function updateTicketFromForm(id, form) {
  const payload = {};
  

  if (form.subject !== undefined) {
    payload.subject = form.subject?.trim() || "";
  }
  if (form.status !== undefined) {
    payload.status = form.status;
  }
  if (form.priority !== undefined) {
    payload.priority = form.priority;
  }

  // hiện tại form có dueAt, assigneeName, customerName là mock → chưa map lên BE
  // Sau này nếu có chọn assignee/customer thật thì bổ sung assigneeId, customerId vào đây.

  if(form.assigneeId !== undefined){
    payload.assigneeId = form.assigneeId;
  }

  const res = await apiPatch(`/api/tickets/${id}`, payload);
  return normalizeTicketSummary(res);
}

export async function fetchActiveUsers() {
  const res = await apiGet('/api/users?status=ACTIVE');

  return (res.items || res || []).map((u) => ({
    id: u.id,
    name: u.fullName || u.username || `User #${u.id}`,
    username: u.username,
    role: u.role,
    status: u.status,
  }));
}

export async function fetchTicketNotes(ticketId) {
  const res = await apiGet(`/api/tickets/${ticketId}/notes`);
 
  return res;
}

export async function createTicketNote(ticketId, payload) {
  const res = await apiPost(`/api/tickets/${ticketId}/notes`, payload);
  
  return res; // trả về note mới
}
export async function getNotesCount(ticketId) {
  const res = await apiGet(`/api/tickets/${ticketId}/notes`);
  return res.length;
}
