import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

function getToken() {
  try {
    return localStorage.getItem("petlove-token");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    let alive = true;

    async function boot() {
      setReady(false);

      const token = getToken();
      if (!token) {
        if (!alive) return;
        setUser(null);
        setReady(true);
        return;
      }

      try {
        const data = await fetchCurrentUser();
        const u = data?.user || data?.data?.user || data?.result || data;
        if (!alive) return;
        setUser(u || null);
      } catch (e) {
        try {
          localStorage.removeItem("petlove-token");
        } catch {}
        if (!alive) return;
        setUser(null);
      } finally {
        if (!alive) return;
        setReady(true);
      }
    }

   
    boot();

  
    function onStorage(e) {
      if (e.key === "petlove-token") boot();
      if (e.key === "petlove-profile") setProfileTick((t) => t + 1);
    }
    window.addEventListener("storage", onStorage);

   
    function onAuthChanged() {
      boot();
    }
    window.addEventListener("petlove-auth-changed", onAuthChanged);

    function onProfileChanged() {
      setProfileTick((t) => t + 1);
    }
    window.addEventListener("petlove-profile-changed", onProfileChanged);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("petlove-auth-changed", onAuthChanged);
      window.removeEventListener("petlove-profile-changed", onProfileChanged);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      profileTick,
      isAuthed: Boolean(user),
    }),
    [user, ready, profileTick]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
