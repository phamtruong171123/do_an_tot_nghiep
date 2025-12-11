import { apiGet, apiPatch, apiPost } from "../../lib/apiClient";

export function fetchGptConfig() {
  return apiGet("/api/gpt-config");
}

export function saveGptConfig(payload) {
  return apiPatch("/api/gpt-config", payload);
}

export function testGptConfig(payload) {
  return apiPost("/api/gpt-config/test", payload);
}
