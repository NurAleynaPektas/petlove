import { useState } from "react";
import { NavLink } from "react-router-dom";
import s from "./Header.module.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

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
          </div>
        </div>
      )}
    </header>
  );
}
