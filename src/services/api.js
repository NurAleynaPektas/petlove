const BASE_URL = "https://petlove.b.goit.study/api";
const TOKEN_KEY = "petlove-token";

function getBackendToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(BASE_URL + path);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url;
}

async function parseErrorMessage(res) {
  const raw = await res.text().catch(() => "");
  if (!raw) return `Request failed: ${res.status}`;
  try {
    const j = JSON.parse(raw);
    return j?.message || j?.error || raw;
  } catch {
    return raw;
  }
}

async function request(path, { method = "GET", params = {}, body } = {}) {
  const url = buildUrl(path, params);

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getBackendToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiGet = (path, params = {}) =>
  request(path, { method: "GET", params });
export const apiPost = (path, body = undefined, params = {}) =>
  request(path, { method: "POST", params, body });
export const apiDelete = (path, params = {}) =>
  request(path, { method: "DELETE", params });
export const apiPatch = (path, body = undefined, params = {}) =>
  request(path, { method: "PATCH", params, body });
export function setToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);

    window.dispatchEvent(new Event("petlove-auth-changed"));
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);

    window.dispatchEvent(new Event("petlove-auth-changed"));
  } catch {}
}
