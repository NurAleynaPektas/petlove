import { useEffect, useMemo, useState } from "react";
import { fetchFriends } from "../services/friends";
import s from "./Friends.module.css";

function normalizeFriends(data) {
  const list = Array.isArray(data) ? data : data?.friends || data?.result || [];
  return Array.isArray(list) ? list : [];
}

function formatTime(workDays) {
  if (!workDays) return "Day and night";
  if (typeof workDays === "string") return workDays;

  const from = workDays?.from || workDays?.start || "";
  const to = workDays?.to || workDays?.end || "";
  if (from && to) return `${from} - ${to}`;
  return "Day and night";
}

export default function Friends() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchFriends();
        const list = normalizeFriends(data);
        if (!alive) return;
        setItems(list);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Friends alınamadı.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((f) => {
      const name = (f?.title || f?.name || "").toLowerCase();
      const email = (f?.email || "").toLowerCase();
      const address = (f?.address || f?.location || "").toLowerCase();
      return (
        name.includes(needle) ||
        email.includes(needle) ||
        address.includes(needle)
      );
    });
  }, [items, q]);

  return (
    <div className={s.page}>
      <div className={s.top}>
        <h1 className={s.title}>Our friends</h1>
    
      </div>

      {error && <div className={s.error}>{error}</div>}
      {loading ? (
        <div className={s.loading}>Loading…</div>
      ) : (
        <div className={s.grid}>
          {filtered.map((f) => {
            const id = f?._id || f?.id || `${f?.title}-${Math.random()}`;
            const title = f?.title || f?.name || "Friend";
            const email = f?.email || "email only";
            const address = f?.address || f?.location || "website only";
            const phone = f?.phone || "phone only";
            const logo = f?.imageUrl || f?.imgUrl || f?.logo || "";
            const workTime = formatTime(f?.workDays || f?.workTime || f?.time);

            return (
              <article key={id} className={s.card}>
                <span className={s.badge}>{workTime}</span>

                <div className={s.cardInner}>
                  <div className={s.logoWrap}>
                    {logo ? (
                      <img className={s.logo} src={logo} alt={title} />
                    ) : (
                      <div className={s.logoFallback}>{title[0]}</div>
                    )}
                  </div>

                  <div className={s.info}>
                    <h3 className={s.cardTitle}>{title}</h3>

                    <p className={s.row}>
                      <span className={s.label}>Email:</span> {email}
                    </p>
                    <p className={s.row}>
                      <span className={s.label}>Address:</span> {address}
                    </p>
                    <p className={s.row}>
                      <span className={s.label}>Phone:</span> {phone}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
