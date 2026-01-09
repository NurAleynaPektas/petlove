import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "petlove-profile") setProfileTick((t) => t + 1);
    }
    window.addEventListener("storage", onStorage);

    function onProfileChanged() {
      setProfileTick((t) => t + 1);
    }
    window.addEventListener("petlove-profile-changed", onProfileChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("petlove-profile-changed", onProfileChanged);
    };
  }, []);

  const value = useMemo(
    () => ({ user, ready, profileTick }),
    [user, ready, profileTick]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
