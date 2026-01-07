import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import {
  fetchNotices,
  fetchNoticeCategories,
  fetchNoticeSex,
  fetchNoticeSpecies,
  fetchCities,
  addFavoriteNotice,
  removeFavoriteNotice,
} from "../services/notices";
import s from "./Notices.module.css";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.notices)) return data.notices;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.result?.notices)) return data.result.notices;
  if (Array.isArray(data?.result?.results)) return data.result.results;
  return [];
}

function normalizePaged(data) {
  const items = normalizeArray(data) || [];
  const page = Number(data?.page || data?.result?.page || 1);
  const totalPages = Number(
    data?.totalPages || data?.result?.totalPages || data?.pages || 1
  );
  return { items, page, totalPages: totalPages || 1 };
}

function getNoticeId(it) {
  const raw =
    it?._id || it?.id || it?.noticeId || it?._id?.$oid || it?._id?._id;

  if (typeof raw === "string" || typeof raw === "number") return String(raw);

  if (raw && typeof raw === "object") {
    try {
      return JSON.stringify(raw);
    } catch {
      return null;
    }
  }

  return null;
}
function pickFirstString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function getDescription(it) {
  return pickFirstString(it?.comment);
}
function buildKey(it, index) {
  const id = getNoticeId(it);
  if (id) return id;
  const title = it?.title || it?.name || "item";
  return `${title}-${index}`;
}

export default function Notices() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sex, setSex] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("popular");

  // pagination
  const [page, setPage] = useState(1);
  const limit = 6;

  // dropdown data
  const [categories, setCategories] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [cities, setCities] = useState([]); 

  // notices
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortChips = [
    { key: "popular", label: "Popular" },
    { key: "unpopular", label: "Unpopular" },
    { key: "cheap", label: "Cheap" },
    { key: "expensive", label: "Expensive" },
  ];

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [c1, c2, c3, c4] = await Promise.allSettled([
          fetchNoticeCategories(),
          fetchNoticeSex(),
          fetchNoticeSpecies(),
          fetchCities(),
        ]);

        if (!alive) return;
        if (c1.status === "fulfilled") {
          const arr = normalizeArray(c1.value);
          setCategories(arr.filter((x) => typeof x === "string" && x.trim()));
        }

        if (c2.status === "fulfilled") {
          const arr = normalizeArray(c2.value);
          setSexes(arr.filter((x) => typeof x === "string" && x.trim()));
        }

        if (c3.status === "fulfilled") {
          const arr = normalizeArray(c3.value);
          setSpeciesList(arr.filter((x) => typeof x === "string" && x.trim()));
        }

        if (c4.status === "fulfilled") {
          const raw = normalizeArray(c4.value);
          const mapped = raw
            .map((x) => {
              if (typeof x === "string") return x;

              return x?.cityEn || x?.cityUA || x?.cityUa || x?.name || "";
            })
            .filter(Boolean);

          setCities(Array.from(new Set(mapped)));
        }
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, sex, species, location, sort]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchNotices({
          page,
          limit,
          search: search.trim(),
          category,
          sex,
          species,
          location,
          sort,
        });

        const normalized = normalizePaged(data);

        if (!alive) return;
        setItems(normalized.items);
        setTotalPages(normalized.totalPages);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Notices alınamadı.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, search, category, sex, species, location, sort]);

  async function toggleFavorite(item) {
    const id = getNoticeId(item);
    if (!id) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const wasFav = Boolean(item?.favorite || item?.isFavorite);

    setItems((prev) =>
      prev.map((x) => {
        const xid = getNoticeId(x);
        if (xid !== id) return x;
        return { ...x, favorite: !wasFav, isFavorite: !wasFav };
      })
    );

    try {
      if (wasFav) await removeFavoriteNotice(id);
      else await addFavoriteNotice(id);
    } catch (e) {
      setItems((prev) =>
        prev.map((x) => {
          const xid = getNoticeId(x);
          if (xid !== id) return x;
          return { ...x, favorite: wasFav, isFavorite: wasFav };
        })
      );
      alert(e?.message || "Favorite işlemi başarısız.");
    }
  }

  const pages = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i++) arr.push(i);
    return arr;
  }, [totalPages]);

  return (
    <div className={s.page}>
      <h1 className={s.title}>Find your favorite pet</h1>

      {/* FILTERS */}
      <section className={s.filters}>
        <div className={s.row}>
          <div className={s.inputWrap}>
            <input
              className={s.input}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={s.icon} aria-hidden="true">
              ⌕
            </span>
          </div>

          <select
            className={s.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className={s.select}
            value={sex}
            onChange={(e) => setSex(e.target.value)}
          >
            <option value="">By gender</option>
            {sexes.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            className={s.select}
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            <option value="">By type</option>
            {speciesList.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            className={s.select}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Location</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={s.chips}>
          {sortChips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`${s.chip} ${sort === c.key ? s.chipActive : ""}`}
              onClick={() => setSort(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* LIST */}
      {error && <div className={s.error}>{error}</div>}

      {loading ? (
        <div className={s.loading}>Loading…</div>
      ) : (
        <div className={s.grid}>
          {items.map((it, index) => {
            const key = buildKey(it, index);

            const title = it?.title || it?.name || "Pet";
            const img =
              it?.imgURL || it?.imgUrl || it?.imageUrl || it?.photo || "";
            const price = it?.price ?? it?.cost;

            const fav = Boolean(it?.favorite || it?.isFavorite);

            const metaLeft = [it?.breed, it?.location, it?.category]
              .filter(Boolean)
              .join(" • ");
            const metaRight = [it?.sex, it?.species]
              .filter(Boolean)
              .join(" • ");

            return (
              <article key={key} className={s.card}>
                <div className={s.thumb}>
                  {img ? (
                    <img
                      className={s.img}
                      src={img}
                      alt={title}
                      loading="lazy"
                    />
                  ) : (
                    <div className={s.imgFallback} />
                  )}
                </div>

                <div className={s.cardBody}>
                  {/* Title + Rating */}
                  <div className={s.cardTop}>
                    <h3 className={s.cardTitle}>{title}</h3>

                    <div className={s.rating}>
                      <span className={s.star} aria-hidden="true">
                        ★
                      </span>
                      <span className={s.rateNum}>
                        {it?.rating ?? it?.popularity ?? it?.favoriteCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className={s.infoRow}>
                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Name</span>
                      <span className={s.infoValue}>{it?.name || "—"}</span>
                    </div>

                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Birthday</span>
                      <span className={s.infoValue}>
                        {it?.birthday || it?.date || it?.birth || "—"}
                      </span>
                    </div>

                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Sex</span>
                      <span className={s.infoValue}>{it?.sex || "—"}</span>
                    </div>

                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Species</span>
                      <span className={s.infoValue}>{it?.species || "—"}</span>
                    </div>

                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Category</span>
                      <span className={s.infoValue}>{it?.category || "—"}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={s.description}>
                    <p className={s.desc}>
                      {getDescription(it) || "No description"}
                    </p>
                    <span className={s.price}>
                      {price !== undefined && price !== null
                        ? `$${price}`
                        : "$ —"}
                    </span>
                  </div>
                  {/* Price + Actions */}
                  <div className={s.bottom}>
                    <div className={s.actions}>
                      <button className={s.learn} type="button">
                        Learn more
                      </button>

                      <button
                        type="button"
                        className={`${s.heartBtn} ${
                          fav ? s.heartActiveBtn : ""
                        }`}
                        onClick={() => toggleFavorite(it)}
                        aria-label="Toggle favorite"
                        title="Favorite"
                      >
                        ♥
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      <div className={s.pagination}>
        {pages.map((p) => (
          <button
            key={p}
            className={`${s.pageNum} ${p === page ? s.active : ""}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
