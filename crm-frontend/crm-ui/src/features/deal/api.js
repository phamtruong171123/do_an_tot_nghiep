import { apiGet, apiPost, apiPatch } from "../../lib/apiClient";

// Chuẩn hoá dữ liệu deal cho list
export function normalizeDealSummary(raw) {
  return {
    id: raw.id,
    code: raw.code,
    title: raw.title,
    stage: raw.stage,
    amount: raw.amount ?? null,
    currency: raw.currency || "",
    customerName: raw.customer?.name || "",
    ownerName: raw.owner?.fullName || raw.owner?.username || "",
    createdAt: raw.createdAt,
    appointmentAt: raw.appointmentAt,

    unitPrice: raw.unitPrice ?? null,
    quantity: raw.quantity ?? null,
    paidAmount: raw.paidAmount ?? null,
    costNote: raw.costNote ?? "",
  };
}

// GET /api/deals?customerId=&page=&pageSize=&search=&sortBy=&sortOrder=&stage=
export async function fetchDeals(opts = {}) {
  const { page, pageSize, limit, offset, search, sortBy, sortOrder, customerId, stage, view } =
    opts;

  const effectivePageSize =
    typeof pageSize === "number" ? pageSize : typeof limit === "number" ? limit : 20;

  let effectivePage = typeof page === "number" ? page : 1;

  if (
    typeof page !== "number" &&
    typeof offset === "number" &&
    typeof limit === "number" &&
    limit > 0
  ) {
    effectivePage = Math.floor(offset / limit) + 1;
  }

  const params = new URLSearchParams();
  params.set("page", String(effectivePage));
  params.set("pageSize", String(effectivePageSize));

  if (customerId != null) params.set("customerId", String(customerId));
  if (stage) params.set("stage", stage);
  if (search) params.set("search", search);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);
  if (view) params.set("view", view);

  const url = `/api/deals?${params.toString()}`;
  const res = await apiGet(url);

  const rawItems = Array.isArray(res?.items) ? res.items : [];

  const total =
    typeof res?.total === "number"
      ? res.total
      : typeof res?.count === "number"
        ? res.count
        : rawItems.length;

  return {
    items: rawItems.map(normalizeDealSummary),
    total,
    page: typeof res?.page === "number" ? res.page : effectivePage,
    pageSize: typeof res?.pageSize === "number" ? res.pageSize : effectivePageSize,
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

  if (form.quantity !== "" && form.quantity !== undefined && form.quantity !== null) {
    payload.quantity = form.quantity;
  }
  if (form.unitPrice !== "" && form.unitPrice !== undefined && form.unitPrice !== null) {
    payload.unitPrice = form.unitPrice;
  }
  if (form.paidAmount !== "" && form.paidAmount !== undefined && form.paidAmount !== null) {
    payload.paidAmount = form.paidAmount;
  }

  if (form.appointmentAt) payload.appointmentAt = form.appointmentAt;

  const res = await apiPost("/api/deals", payload);
  return normalizeDealSummary(res);
}

// PATCH /api/deals/:id
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

// Recent deals cho 1 customer
export async function fetchRecentDealsForCustomer(customerId, limit = 5) {
  const { items } = await fetchDeals({
    customerId,
    page: 1,
    pageSize: limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  return items;
}

//approve/reject contract
export async function requestContractApproval(id) {
  return apiPost(`/api/deals/${id}/request-contract-approval`, {});
}

export async function approveContract(id) {
  return apiPost(`/api/deals/${id}/approve-contract`, {});
}

export async function rejectContract(id, reason) {
  return apiPost(`/api/deals/${id}/reject-contract`, { reason });
}
