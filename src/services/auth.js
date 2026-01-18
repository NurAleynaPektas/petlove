import { apiGet, apiPost, setToken, clearToken } from "./api";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.result?.token ||
    data?.result?.accessToken ||
    null
  );
}

function notifyProfileChanged() {
  try {
    window.dispatchEvent(new Event("petlove-profile-changed"));
  } catch {
    
  }
}

export async function backendSignup({ name, email, password }) {
  const data = await apiPost("/users/signup", { name, email, password });
  const token = extractToken(data);
  if (token) setToken(token); 
  return data;
}

export async function backendSignin({ email, password }) {
  const data = await apiPost("/users/signin", { email, password });
  const token = extractToken(data);
  if (token) setToken(token); 
  return data;
}

export function fetchCurrentUser() {
  return apiGet("/users/current");
}

export async function backendSignout() {
  try {
    await apiPost("/users/signout");
  } catch {
   
  } finally {
    clearToken(); 
    notifyProfileChanged(); 
    await signOut(auth);
  }
}
