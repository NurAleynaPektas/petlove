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

 
  const [fbAuthed, setFbAuthed] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot(fbUserParam) {
      if (!alive) return;
      setReady(false);

      const fbUser = fbUserParam ?? auth.currentUser;

      
      if (!fbUser) {
        setFbAuthed(false);
        setUser(null);
        setReady(true);
        return;
      }

      
      setFbAuthed(true);

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
      } catch {
        if (!alive) return;
        
        setUser(null);
      } finally {
        if (!alive) return;
        setReady(true);
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
    }
    window.addEventListener("petlove-profile-changed", onProfileChanged);


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
      ready: authChecked && ready,
      profileTick,
      isAuthed: fbAuthed, 
    }),
    [user, ready, profileTick, fbAuthed, authChecked]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
