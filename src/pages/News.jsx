import { useEffect, useMemo, useState } from "react";
import { fetchNews } from "../services/news";
import s from "./News.module.css";

function normalizeNewsResponse(data) {
  const list =
    data?.results ||
    data?.news ||
    data?.data ||
    data?.result?.news ||
    data?.result ||
    [];

  const items = Array.isArray(list) ? list : [];

  const totalPages =
    Number(data?.totalPages) ||
    Number(data?.result?.totalPages) ||
    Number(data?.pages) ||
    1;

  const page = Number(data?.page) || 1;

  return { items, totalPages: totalPages || 1, page };
}

function formatDate(value) {
  if (!value) return "";

  return String(value);
}

export default function News() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchNews({ page, limit, search: q.trim() });
        const normalized = normalizeNewsResponse(data);

        if (!alive) return;
        setItems(normalized.items);
        setTotalPages(normalized.totalPages);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "News alınamadı.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [page, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = useMemo(() => {
    const out = [];
    const max = totalPages;

    if (max <= 7) {
      for (let i = 1; i <= max; i++) out.push(i);
      return out;
    }

    const left = Math.max(2, page - 1);
    const right = Math.min(max - 1, page + 1);

    out.push(1);
    if (left > 2) out.push("...");
    for (let i = left; i <= right; i++) out.push(i);
    if (right < max - 1) out.push("...");
    out.push(max);

    return out;
  }, [page, totalPages]);

  return (
    <div className={s.page}>
      <div className={s.top}>
        <h1 className={s.title}>News</h1>

        <div className={s.searchWrap}>
          <input
            className={s.search}
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className={s.searchIcon} aria-hidden="true">
            ⌕
          </span>
        </div>
      </div>

      {error && <div className={s.error}>{error}</div>}

      {loading ? (
        <div className={s.loading}>Loading…</div>
      ) : (
        <div className={s.grid}>
          {items.map((n) => {
            const id =
              n?._id || n?.id || n?.newsId || `${n?.title}-${Math.random()}`;
            const title = n?.title || "Untitled";
            const desc = n?.text || n?.description || n?.desc || "";
            const date = formatDate(n?.date || n?.createdAt || n?.created_at);
            const img = n?.imgUrl || n?.imageUrl || n?.url || n?.photo || "";

            return (
              <article key={id} className={s.card}>
                <div className={s.thumb}>
                  {img ? (
                    <img
                      className={s.img}
                      src={img}
                      alt={title}
                      loading="lazy"
                    />
                  ) : (
                    <div className={s.imgFallback}>No image</div>
                  )}
                </div>

                <div className={s.cardBody}>
                  <h3 className={s.cardTitle}>{title}</h3>
                  <p className={s.cardText}>{desc}</p>

                  <div className={s.cardFooter}>
                    <span className={s.date}>{date}</span>
                    <button className={s.readMore} type="button">
                      Read more
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className={s.pagination}>
        <button
          className={s.pageBtn}
          onClick={() => canPrev && setPage((p) => p - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className={s.dots}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${s.pageNum} ${p === page ? s.active : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className={s.pageBtn}
          onClick={() => canNext && setPage((p) => p + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
