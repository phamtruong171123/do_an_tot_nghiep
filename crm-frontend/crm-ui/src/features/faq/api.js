import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/apiClient";

export async function fetchFaqs(params = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);

  const query = search.toString();
  const url = query ? `/api/faq?${query}` : "/api/faq";

  return apiGet(url);
}

export async function createFaq(payload) {
  return apiPost("/api/faq", payload);
}

export async function updateFaq(id, payload) {
  return apiPut(`/api/faq/${id}`, payload);
}

export async function deleteFaq(id) {
  return apiDelete(`/api/faq/${id}`);
}
