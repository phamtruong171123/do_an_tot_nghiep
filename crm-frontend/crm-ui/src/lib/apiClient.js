const API_BASE =  "http://localhost:4000";

// Khóa lưu token – đổi nếu bạn muốn
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Giữ callback xử lý khi auth lỗi (để redirect /logout, v.v.)
let onAuthError = null;
export function setOnAuthError(handler) {
  onAuthError = typeof handler === "function" ? handler : null;
}

// ==== Token store ====
export function getToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    ""
  );
}

export function setToken(token, { persist = true } = {}) {
  // persist=true dùng localStorage; false dùng sessionStorage
  if (!token) return clearToken();
  (persist ? localStorage : sessionStorage).setItem(ACCESS_TOKEN_KEY, token);
  if (!persist) localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    ""
  );
}

export function setRefreshToken(token, { persist = true } = {}) {
  if (!token) return clearRefreshToken();
  (persist ? localStorage : sessionStorage).setItem(REFRESH_TOKEN_KEY, token);
  if (!persist) localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ==== Helper headers ====
function buildHeaders(initHeaders, hasBody, bodyIsFormData, token) {
  const headers = new Headers(initHeaders || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Nếu gửi JSON, set Content-Type. Với FormData thì KHÔNG set.
  if (hasBody && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

// ==== Chuẩn hoá lỗi ====
async function toApiError(res) {
  let message = `HTTP ${res.status}`;
  try {
    const data = await res.clone().json();
    if (data && (data.error || data.message)) {
      message = data.error || data.message;
    }
  } catch {
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {}
  }
  const err = new Error(message);
  err.status = res.status;
  return err;
}

// ====  refresh token ====

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.accessToken) {
      setToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      return data.accessToken;
    }
  } catch {}
  return null;
}

// ==== Core fetch ====
// options:
// - method, body, headers, credentials
// - baseUrl: override API_BASE
// - useRefresh: true/false (mặc định true, thử refresh khi 401)
// - raw: true để trả về Response gốc
export async function apiFetch(pathOrUrl, options = {}) {
  const {
    method = "GET",
    body,
    headers,
    credentials = "include", 
    baseUrl = API_BASE,
    useRefresh = true,
    raw = false,
    signal,
  } = options;

  // Cho phép truyền full URL hoặc path
  const url =
    /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${baseUrl}${pathOrUrl}`;

  const token = getToken();
  if (!token) {
    const noTokErr = new Error("Thiếu token. Vui lòng đăng nhập lại.");
    noTokErr.code = "NO_TOKEN";
    throw noTokErr;
  }

  const bodyIsFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasBody = typeof body !== "undefined" && body !== null;

  const res = await fetch(url, {
    method,
    credentials,
    headers: buildHeaders(headers, hasBody, bodyIsFormData, token),
    body: hasBody && !bodyIsFormData && method !== "GET" && method !== "HEAD"
      ? JSON.stringify(body)
      : hasBody
      ? body
      : undefined,
    signal,
  });

  if (res.status === 401 && useRefresh) {
    // Thử refresh 1 lần rồi gọi lại
    const newToken = await tryRefreshToken();
    if (newToken) {
      const res2 = await fetch(url, {
        method,
        credentials,
        headers: buildHeaders(headers, hasBody, bodyIsFormData, newToken),
        body: hasBody && !bodyIsFormData && method !== "GET" && method !== "HEAD"
          ? JSON.stringify(body)
          : hasBody
          ? body
          : undefined,
        signal,
      });
      if (!res2.ok) {
        if (res2.status === 401 && onAuthError) onAuthError(res2);
        if (raw) return res2;
        throw await toApiError(res2);
      }
      return raw ? res2 : parseAuto(res2);
    }
    // refresh fail
    if (onAuthError) onAuthError(res);
    if (raw) return res;
    throw await toApiError(res);
  }

  if (!res.ok) {
    if ((res.status === 401 || res.status === 403) && onAuthError) onAuthError(res);
    if (raw) return res;
    throw await toApiError(res);
  }

  return raw ? res : parseAuto(res);
}

// Tự parse JSON nếu có, fallback text
async function parseAuto(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// ==== Sugar methods ====
export const apiGet = (path, opts = {}) =>
  apiFetch(path, { ...opts, method: "GET" });

export const apiPost = (path, data, opts = {}) =>
  apiFetch(path, { ...opts, method: "POST", body: data });

export const apiPut = (path, data, opts = {}) =>
  apiFetch(path, { ...opts, method: "PUT", body: data });

export const apiPatch = (path, data, opts = {}) =>
  apiFetch(path, { ...opts, method: "PATCH", body: data });

export const apiDelete = (path, opts = {}) =>
  apiFetch(path, { ...opts, method: "DELETE" });

// ==== Tiện ích gửi FormData (upload file) ====
export function toFormData(obj = {}) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((iv) => fd.append(k, iv));
    else if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
}
