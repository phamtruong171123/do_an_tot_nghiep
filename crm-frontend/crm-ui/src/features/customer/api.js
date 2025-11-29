import { apiGet, apiPatch, apiPost } from "../../lib/apiClient";

// Map BE → FE
export function normalizeCustomer(raw) {
  return {
    id: raw.id,
    name: raw.name || "",
    externalId: raw.externalId || "",
    avatarUrl: raw.avatarUrl || "",
    email: raw.email || "",
    phoneNumber: raw.phoneNumber || "",
    address: raw.address || "",
    segment: raw.segment || "POTENTIAL",
    note: raw.note || "",
    tickets: raw.tickets,
    ticketsCount:
      typeof raw.ticketsCount === "number"
        ? raw.ticketsCount
        : raw._count?.tickets ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// GET /api/customers?limit=&page=&q=&segment=&sort=
export async function fetchCustomers({
  page = 1,
  limit = 20,
  q = "",
  segment = "ALL",
  sortBy = "CREATED_AT", // "CREATED_AT" | "NAME_ASC" | "NAME_DESC"
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (q && q.trim()) params.set("q", q.trim());
  if (segment && segment !== "ALL") params.set("segment", segment);
  if (sortBy) params.set("sort", sortBy);

  const res = await apiGet(`/api/customers?${params.toString()}`);

  const rawItems = Array.isArray(res.items) ? res.items : res;
  const items = rawItems.map(normalizeCustomer);

  return {
    items,
    total: typeof res.total === "number" ? res.total : items.length,
    page: typeof res.page === "number" ? res.page : page,
    pageSize: typeof res.pageSize === "number" ? res.pageSize : limit,
  };
}

export async function fetchCustomerDetail(id) {
  const res = await apiGet(`/api/customers/${id}`);
  return normalizeCustomer(res);
}

// PATCH /api/customers/:id
/**
 * Update a customer.
 * @param {number|string} id
 * @param {{name?: string|null, note?: string|null, segment?: string, email?: string|null, phoneNumber?: string|null, address?: string|null}} payload
 */
export async function updateCustomer(id, payload) {
  const res = await apiPatch(`/api/customers/${id}`, payload);
  return normalizeCustomer(res);
}
export async function createCustomer(payload) {
 
  const res = await apiPost("/api/customers", payload);
  return res; 
}

