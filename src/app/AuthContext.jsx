import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { fetchCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

const TOKEN_KEY = "petlove-token";

function getBackendToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
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
      if (!alive) return;
      setReady(false);

    
      const fbUser = auth.currentUser;
      if (!fbUser) {
        setUser(null);
        setReady(true);
        return;
      }

    
      const backendToken = getBackendToken();
      if (!backendToken) {
       
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
        if (!alive) return;
        setUser(null);
      } finally {
        if (!alive) return;
        setReady(true);
      }
    }

    const unsub = onAuthStateChanged(auth, () => {
      boot();
    });

    function onAuthChanged() {
      boot();
    }
    window.addEventListener("petlove-auth-changed", onAuthChanged);
    function onProfileChanged() {
      setProfileTick((t) => t + 1);
    }
    window.addEventListener("petlove-profile-changed", onProfileChanged);

  
    boot();

    return () => {
      alive = false;
      unsub();
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
