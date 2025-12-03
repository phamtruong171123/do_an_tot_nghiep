import { apiGet, apiPost, apiPatch } from "../../lib/apiClient";

// Chuẩn hoá dữ liệu deal cho list
export function normalizeDealSummary(raw) {
  return {
    id: raw.id,
    code: raw.code,
    title: raw.title,
    customerName: raw.customer?.name || "",
    stage: raw.stage,
    amount:
      typeof raw.amount === "number" ? raw.amount : null,
    appointmentAt: raw.appointmentAt || null,
    createdAt: raw.createdAt || null,
  };
}

// GET /api/deals?limit=&offset=&customerId=
export async function fetchDeals({
  customerId,
  limit = 20,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (customerId !== undefined && customerId !== null) {
    params.set("customerId", String(customerId));
  }

  const res = await apiGet(`/api/deals?${params.toString()}`);
  const items = Array.isArray(res.items) ? res.items : [];

  return {
    items: items.map(normalizeDealSummary),
    total: typeof res.total === "number" ? res.total : items.length,
  };
}

// POST /api/deals
export async function createDeal(form) {
  const payload = {
    customerId: Number(form.customerId),
    title: form.title?.trim() || "",
  };

  if (form.amount !== "" && form.amount !== undefined && form.amount !== null) {
    payload.amount = Number(form.amount);
  }

  if (form.appointmentAt) {
    payload.appointmentAt = form.appointmentAt;
  }

  const res = await apiPost("/api/deals", payload);
  return normalizeDealSummary(res);
}

// PATCH /api/deals/:id  (nếu sau này cần chỉnh stage, amount,...)
export async function updateDeal(id, patch) {
  const payload = { ...patch };
  if (payload.amount != null) payload.amount = Number(payload.amount);

  const res = await apiPatch(`/api/deals/${id}`, payload);
  return res;
}

// GET /api/deals/:id (detail + activities)
export async function fetchDealDetail(id) {
  const res = await apiGet(`/api/deals/${id}`);
  return res;
}

// POST /api/deals/:id/activities
export async function createDealActivity(dealId, { content, activityAt }) {
  const payload = { content };
  if (activityAt) payload.activityAt = activityAt;
  return apiPost(`/api/deals/${dealId}/activities`, payload);
}

// Recent deals cho 1 customer – dùng cho CustomerDetail
export async function fetchRecentDealsForCustomer(customerId, limit = 5) {
  const { items } = await fetchDeals({
    customerId,
    limit,
    offset: 0,
  });
  return items;
}
