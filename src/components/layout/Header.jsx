import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../app/AuthContext";
import s from "./Header.module.css";

const PROFILE_LS_KEY = "petlove-profile";

function safeReadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, ready, profileTick } = useAuth();
  const close = () => setOpen(false);
  const isAuthed = Boolean(user);
  const avatarSrc = useMemo(() => {
    const ls = safeReadProfile();
    return ls.avatar || user?.photoURL || "https://i.pravatar.cc/80?img=3";
  }, [profileTick, user]);

  if (!ready) return null;

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
      <div className={s.inner}>
        {/* LOGO */}
        <NavLink to="/home" className={s.logo} onClick={close}>
          pet💛ve
        </NavLink>

        {/* DESKTOP NAV */}
        <nav className={s.desktopNav}>
          <NavLink
            to="/news"
            className={({ isActive }) => (isActive ? s.pillActive : s.pill)}
          >
            News
          </NavLink>

          <NavLink
            to="/notices"
            className={({ isActive }) => (isActive ? s.pillActive : s.pill)}
          >
            Find pet
          </NavLink>

          <NavLink
            to="/friends"
            className={({ isActive }) => (isActive ? s.pillActive : s.pill)}
          >
            Our friends
          </NavLink>
        </nav>

        {/* RIGHT */}
        <div className={s.right}>
          {!isAuthed ? (
            <div className={s.authRow}>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? s.authBtnActive : s.authBtn
                }
              >
                LOG IN
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive ? s.authBtnSoftActive : s.authBtnSoft
                }
              >
                REGISTRATION
              </NavLink>
            </div>
          ) : (
            <div className={s.userRow}>
              <NavLink to="/profile" className={s.userPill} onClick={close}>
                <img
                  key={avatarSrc}
                  className={s.avatar}
                  src={avatarSrc}
                  alt="User avatar"
                />
                <span className={s.userName}>
                  {user?.displayName || "User"}
                </span>
              </NavLink>

              <button
                type="button"
                className={s.logoutPill}
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}

          {/* BURGER */}
          <button
            className={s.burger}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* OVERLAY MENU */}
      {open && (
        <div className={s.overlay} onClick={close}>
          <div className={s.menu} onClick={(e) => e.stopPropagation()}>
            <button className={s.close} aria-label="Close menu" onClick={close}>
              ✕
            </button>

            <nav className={s.mobileNav}>
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={close}
              >
                News
              </NavLink>

              <NavLink
                to="/notices"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={close}
              >
                Notices
              </NavLink>

              <NavLink
                to="/friends"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={close}
              >
                Friends
              </NavLink>
            </nav>

            <div className={s.divider} />

            {!isAuthed ? (
              <div className={s.menuAuth}>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? s.menuActive : s.menuLink
                  }
                  onClick={close}
                >
                  Log in
                </NavLink>

                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? s.menuActive : s.menuLink
                  }
                  onClick={close}
                >
                  Registration
                </NavLink>
              </div>
            ) : (
              <div className={s.menuUser}>
                <NavLink
                  to="/profile"
                  className={s.menuUserBar}
                  onClick={close}
                >
                  <img
                    key={avatarSrc + "-m"}
                    className={s.avatar}
                    src={avatarSrc}
                    alt="User avatar"
                  />
                  <span className={s.userName}>
                    {user?.displayName || "User"}
                  </span>
                </NavLink>

                <button
                  type="button"
                  className={s.menuLogout}
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
