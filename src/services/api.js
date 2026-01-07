import { auth } from "./firebase";

const BASE_URL = "https://petlove.b.goit.study/api";

async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request(path, { method = "GET", params = {}, body } = {}) {
  const url = new URL(BASE_URL + path);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const headers = { "Content-Type": "application/json" };

  const token = await getFirebaseToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function apiGet(path, params = {}) {
  return request(path, { method: "GET", params });
}

export function apiPost(path, body = undefined, params = {}) {
  return request(path, { method: "POST", params, body });
}

export function apiDelete(path, params = {}) {
  return request(path, { method: "DELETE", params });
}
