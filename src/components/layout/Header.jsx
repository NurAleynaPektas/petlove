import { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { backendSignout } from "../../services/auth";
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
  const [logoutOpen, setLogoutOpen] = useState(false); // ✅ logout confirm modal
  const { user, ready, profileTick } = useAuth();

  const closeMenu = () => setOpen(false);
  const isAuthed = Boolean(user);

  const avatarSrc = useMemo(() => {
    const ls = safeReadProfile();
    return (
      ls.avatar ||
      user?.avatar ||
      user?.photoURL ||
      "https://i.pravatar.cc/80?img=3"
    );
  }, [profileTick, user]);

  // ✅ ESC ile modal kapansın
  useEffect(() => {
    if (!logoutOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLogoutOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logoutOpen]);

  if (!ready) return null;

  // ✅ Asıl logout işlemi (Yes ile çağıracağız)
  const doLogout = async () => {
    try {
      await backendSignout();
      localStorage.removeItem("petlove-profile");
      window.dispatchEvent(new Event("petlove-profile-changed"));
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLogoutOpen(false);
      closeMenu();
    }
  };

  // ✅ butona basınca sadece modal aç
  const handleLogoutClick = () => {
    setLogoutOpen(true);
  };

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <NavLink to="/home" className={s.logo} onClick={closeMenu}>
          pet💛ve
        </NavLink>

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
              <NavLink to="/profile" className={s.userPill} onClick={closeMenu}>
                <img
                  key={avatarSrc}
                  className={s.avatar}
                  src={avatarSrc}
                  alt="User avatar"
                />
                <span className={s.userName}>
                  {user?.name || user?.displayName || "User"}
                </span>
              </NavLink>

              <button
                type="button"
                className={s.logoutPill}
                onClick={handleLogoutClick} // ✅ modal aç
              >
                Log out
              </button>
            </div>
          )}

          <button
            className={s.burger}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className={s.overlay} onClick={closeMenu}>
          <div className={s.menu} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.close}
              aria-label="Close menu"
              onClick={closeMenu}
            >
              ✕
            </button>

            <nav className={s.mobileNav}>
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={closeMenu}
              >
                News
              </NavLink>

              <NavLink
                to="/notices"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={closeMenu}
              >
                Find Pet
              </NavLink>

              <NavLink
                to="/friends"
                className={({ isActive }) =>
                  isActive ? s.menuActive : s.menuLink
                }
                onClick={closeMenu}
              >
                Our Friends
              </NavLink>
            </nav>

            {!isAuthed ? (
              <div className={s.menuAuth}>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${s.menuLink} ${s.loginBtn} ${
                      isActive ? s.menuActive : ""
                    }`
                  }
                  onClick={closeMenu}
                >
                  LOG IN
                </NavLink>

                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `${s.menuLink} ${s.registerBtn} ${
                      isActive ? s.menuActive : ""
                    }`
                  }
                  onClick={closeMenu}
                >
                  REGISTRATION
                </NavLink>
              </div>
            ) : (
              <div className={s.menuUser}>
                <button
                  type="button"
                  className={s.menuLogout}
                  onClick={handleLogoutClick} // ✅ mobile menüde de modal aç
                >
                  LOG OUT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ LOGOUT CONFIRM MODAL */}
      {logoutOpen && (
        <div
          className={s.logoutOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Logout confirmation"
          onClick={() => setLogoutOpen(false)}
        >
          <div className={s.logoutModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={s.logoutClose}
              aria-label="Close"
              onClick={() => setLogoutOpen(false)}
            >
              ✕
            </button>

            <div className={s.logoutIconWrap} aria-hidden="true">
              <div className={s.logoutIcon}>🐈</div>
            </div>

            <h3 className={s.logoutTitle}>Already leaving?</h3>

            <div className={s.logoutActions}>
              <button type="button" className={s.logoutYes} onClick={doLogout}>
                Yes
              </button>

              <button
                type="button"
                className={s.logoutCancel}
                onClick={() => setLogoutOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
