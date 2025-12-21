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

// GET /api/deals?limit=&offset=&customerId=
export async function fetchDeals({
  page = 1,
  pageSize = 20,
  search,
  sortBy,
  sortOrder,
  customerId,
} = {}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (customerId != null) params.set("customerId", String(customerId));
  if (search) params.set("search", search);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);

  const url = `/api/deals?${params.toString()}`;


  const res = await apiGet(url);
 
 return {
    
    items: res.items.map(normalizeDealSummary),
    total: res.items.length,
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
