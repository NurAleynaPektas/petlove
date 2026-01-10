import { apiGet, apiPost, clearToken, setToken } from "./api";
function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.result?.token ||
    data?.result?.accessToken ||
    null
  );
}

export async function signup({ name, email, password }) {
  const data = await apiPost("/users/signup", { name, email, password });
  const token = extractToken(data);
  if (token) {
    setToken(token);
    window.dispatchEvent(new Event("petlove-auth-changed"));
  }
  return data;
}

export async function signin({ email, password }) {
  const data = await apiPost("/users/signin", { email, password });
  const token = extractToken(data);
  if (token) {
    setToken(token);
    window.dispatchEvent(new Event("petlove-auth-changed"));
  }
  return data;
}

export function fetchCurrentUser() {
  return apiGet("/users/current");
}

export async function signout() {

  try {
    await apiPost("/users/signout");
  } catch {
  } finally {
    clearToken();
    window.dispatchEvent(new Event("petlove-auth-changed"));
  }
}
