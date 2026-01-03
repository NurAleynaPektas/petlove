import { useState } from "react";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../app/AuthContext";
import s from "./Header.module.css";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, ready } = useAuth();

  const close = () => setOpen(false);
  if (!ready) return null;

  const isAuthed = Boolean(user);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      close();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className={s.header}>
      <div className={s.logo}>pet💛ve</div>

      <button
        className={s.burger}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {open && (
        <div className={s.overlay} onClick={close}>
          <div className={s.menu} onClick={(e) => e.stopPropagation()}>
            <button className={s.close} aria-label="Close menu" onClick={close}>
              ✕
            </button>

            {/* MAIN NAV */}
            <nav className={s.nav}>
              <NavLink
                to="/news"
                className={({ isActive }) => (isActive ? s.active : s.link)}
                onClick={close}
              >
                News
              </NavLink>

              <NavLink
                to="/notices"
                className={({ isActive }) => (isActive ? s.active : s.link)}
                onClick={close}
              >
                Notices
              </NavLink>

              <NavLink
                to="/friends"
                className={({ isActive }) => (isActive ? s.active : s.link)}
                onClick={close}
              >
                Friends
              </NavLink>
            </nav>

            {/* AUTH / USER NAV */}
            {!isAuthed ? (
              <div className={s.auth}>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? s.active : s.link)}
                  onClick={close}
                >
                  Log in
                </NavLink>

                <NavLink
                  to="/register"
                  className={({ isActive }) => (isActive ? s.active : s.link)}
                  onClick={close}
                >
                  Registration
                </NavLink>
              </div>
            ) : (
              <div className={s.userNav}>
                <NavLink to="/profile" className={s.userBar} onClick={close}>
                  <img
                    className={s.avatar}
                    src={user.photoURL || "https://i.pravatar.cc/80?img=3"}
                    alt="User avatar"
                  />
                  <span className={s.userName}>
                    {user.displayName || "User"}
                  </span>
                </NavLink>

                <button
                  type="button"
                  className={s.logoutBtn}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
