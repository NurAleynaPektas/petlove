import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { fetchCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

const TOKEN_KEY = "petlove-token";
const PROFILE_LS_KEY = "petlove-profile";

function getBackendToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function safeReadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}


function mergeUserWithLocalProfile(backendUser) {
  const u = backendUser && typeof backendUser === "object" ? backendUser : null;
  if (!u) return null;

  const ls = safeReadProfile();

  const lsName = typeof ls.name === "string" ? ls.name.trim() : "";
  const lsPhone = typeof ls.phone === "string" ? ls.phone.trim() : "";
  const lsAvatar = typeof ls.avatar === "string" ? ls.avatar.trim() : "";

  return {
    ...u,
   
    name: lsName || u.name || u.displayName || u.fullName || u.username,
    displayName:
      lsName || u.displayName || u.name || u.fullName || u.username || "User",
    phone: lsPhone || u.phone,
    avatar: lsAvatar || u.avatar,
    photoURL: lsAvatar || u.photoURL,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [readyInternal, setReadyInternal] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  const [fbAuthed, setFbAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot(fbUserParam) {
      if (!alive) return;
      setReadyInternal(false);

      const fbUser = fbUserParam ?? auth.currentUser;

      if (!fbUser) {
        setFbAuthed(false);
        setUser(null);
        setReadyInternal(true);
        return;
      }

      setFbAuthed(true);

      const backendToken = getBackendToken();
      if (!backendToken) {
        setUser(null);
        setReadyInternal(true);
        return;
      }

      try {
        const data = await fetchCurrentUser();
        const u = data?.user || data?.data?.user || data?.result || data;

        if (!alive) return;

        setUser(mergeUserWithLocalProfile(u || null));
      } catch (e) {
        if (!alive) return;
        setUser(null);
      } finally {
        if (!alive) return;
        setReadyInternal(true);
      }
    }

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!alive) return;
      setAuthChecked(true);
      boot(fbUser);
    });

    function onAuthChanged() {
      boot(auth.currentUser);
    }
    window.addEventListener("petlove-auth-changed", onAuthChanged);

    function onProfileChanged() {
      setProfileTick((t) => t + 1);
      setUser((prev) => (prev ? mergeUserWithLocalProfile(prev) : prev));

    }
    window.addEventListener("petlove-profile-changed", onProfileChanged);

    function onStorage(e) {
      if (e.key === PROFILE_LS_KEY) {
        setProfileTick((t) => t + 1);
        setUser((prev) => mergeUserWithLocalProfile(prev));
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      unsub();
      window.removeEventListener("petlove-auth-changed", onAuthChanged);
      window.removeEventListener("petlove-profile-changed", onProfileChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      ready: authChecked && readyInternal,
      profileTick,
      isAuthed: fbAuthed,
    }),
    [user, readyInternal, profileTick, fbAuthed, authChecked],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
