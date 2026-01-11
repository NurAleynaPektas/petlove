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
import {
  getUserStorageId,
  migrateLegacyToUser,
  readFavs,
  writeFavs,
  readViewed,
  writeViewed,
} from "../utils/userStorage";
import s from "./Notices.module.css";

/*helpers */
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

function buildKey(it, index) {
  const id = getNoticeId(it);
  if (id) return id;
  const title = it?.title || it?.name || "item";
  return `${title}-${index}`;
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

function formatDate(val) {
  if (!val) return "—";
  const str = String(val).trim();
  if (!str) return "—";

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}.${mm}.${yy}`;
    }
  }
  return str;
}

function toStars(val) {
  const n = Number(val);
  const safe = Number.isFinite(n) ? n : 1;
  return Math.max(1, Math.min(5, Math.round(safe)));
}

function toCardPayload(it) {
  const id = getNoticeId(it);
  const title = it?.title || it?.name || "Pet";
  const img = it?.imgURL || it?.imgUrl || it?.imageUrl || it?.photo || "";
  const desc = pickFirstString(it?.comment) || "No description";
  const price = it?.price ?? it?.cost ?? null;
  const stars = toStars(it?.rating ?? it?.popularity ?? 1);

  return {
    id,
    title,
    img,
    desc,
    price,
    stars,
    raw: it,
    ts: Date.now(),
  };
}

function upsertById(list, item) {
  const id = item?.id;
  if (!id) return list;
  const idx = list.findIndex((x) => String(x?.id) === String(id));
  if (idx >= 0) {
    const copy = list.slice();
    copy[idx] = { ...copy[idx], ...item, ts: Date.now() };
    return copy;
  }
  return [{ ...item, ts: Date.now() }, ...list];
}

function removeById(list, id) {
  return list.filter((x) => String(x?.id) !== String(id));
}

/* component  */
export default function Notices() {
  const navigate = useNavigate();
  const { user, ready, isAuthed } = useAuth();

  const userId = useMemo(() => getUserStorageId(user), [user]);

  // login olduktan sonra
  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    migrateLegacyToUser(user);
  }, [ready, user]);

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

  // modals
  const [activeNotice, setActiveNotice] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      } catch {
        // ignore
      }
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
        const favs = userId ? readFavs(userId) : [];
        const favIds = new Set(favs.map((x) => String(x?.id)));

        const merged = normalized.items.map((it) => {
          const id = getNoticeId(it);
          const isFav = id ? favIds.has(String(id)) : false;
          return { ...it, favorite: isFav, isFavorite: isFav };
        });

        setItems(merged);
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
  }, [page, search, category, sex, species, location, sort, userId]);

  /* favorites*/
  async function toggleFavorite(item) {
    const id = getNoticeId(item);
    if (!id) return;

    if (!isAuthed) {
      setShowAuthModal(true);
      return;
    }
    if (!userId) {
      setShowAuthModal(true);
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

    
    setActiveNotice((prev) => {
      if (!prev) return prev;
      const pid = getNoticeId(prev);
      if (pid !== id) return prev;
      return { ...prev, favorite: !wasFav, isFavorite: !wasFav };
    });

   
    const payload = toCardPayload(item);
    const favsPrev = readFavs(userId);
    const favsNext = wasFav
      ? removeById(favsPrev, id)
      : upsertById(favsPrev, payload);

    writeFavs(userId, favsNext);

    try {
      if (wasFav) await removeFavoriteNotice(id);
      else await addFavoriteNotice(id);
    } catch (e) {
  const msg = String(e?.message || "").toLowerCase();

  if (!wasFav && (msg.includes("409") || msg.includes("conflict") || msg.includes("already") || msg.includes("exist"))) {
   
    return;
  }

  if (wasFav && (msg.includes("404") || msg.includes("not found"))) {
    return;
  }


  setItems((prev) =>
    prev.map((x) => {
      const xid = getNoticeId(x);
      if (xid !== id) return x;
      return { ...x, favorite: wasFav, isFavorite: wasFav };
    })
  );

  setActiveNotice((prev) => {
    if (!prev) return prev;
    const pid = getNoticeId(prev);
    if (pid !== id) return prev;
    return { ...prev, favorite: wasFav, isFavorite: wasFav };
  });

  writeFavs(userId, favsPrev);

  alert(e?.message || "Favorite işlemi başarısız.");
}

  }

  /* viewed */
  function pushViewed(it) {
    if (!userId) return;

    const payload = toCardPayload(it);
    if (!payload.id) return;

    const prev = readViewed(userId);
    const next = upsertById(prev, payload);
    writeViewed(userId, next);
  }

  /* pagination */
  const pages = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i++) arr.push(i);
    return arr;
  }, [totalPages]);

  /*  modal controls */
  function closeModals() {
    setActiveNotice(null);
    setShowAuthModal(false);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeModals();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onLearnMore(it) {
    if (!isAuthed) {
      setShowAuthModal(true);
      return;
    }
    pushViewed(it);
    setActiveNotice(it);
  }

  function onAuthGoLogin() {
    closeModals();
    navigate("/login");
  }

  function onAuthGoRegister() {
    closeModals();
    navigate("/register");
  }

  function onContact(it) {
    const email = it?.email;
    const phone = it?.phone;

    if (email) {
      window.location.href = `mailto:${email}`;
      return;
    }
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    alert("Contact info not available.");
  }

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

            const stars = toStars(it?.rating ?? it?.popularity ?? 1);

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
                  <div className={s.cardTop}>
                    <h3 className={s.cardTitle}>{title}</h3>

                    <div
                      className={s.starsRowCard}
                      aria-label={`Rating ${stars}`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`${s.starIcon} ${
                            i < stars ? s.starOn : s.starOff
                          }`}
                          aria-hidden="true"
                        >
                          ★
                        </span>
                      ))}
                      <span className={s.starCount}>{stars}</span>
                    </div>
                  </div>

                  <div className={s.infoRow}>
                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Name</span>
                      <span className={s.infoValue}>{it?.name || "—"}</span>
                    </div>

                    <div className={s.infoItem}>
                      <span className={s.infoLabel}>Birthday</span>
                      <span className={s.infoValue}>
                        {formatDate(it?.birthday || it?.birthDate || it?.date)}
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

                  <p className={s.desc}>
                    {getDescription(it) || "No description"}
                  </p>

                  <div className={s.bottom}>
                    <span className={s.price}>
                      {price !== undefined && price !== null
                        ? `$${price}`
                        : "$ —"}
                    </span>

                    <div className={s.actions}>
                      <button
                        className={s.learn}
                        type="button"
                        onClick={() => onLearnMore(it)}
                      >
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
            type="button"
          >
            {p}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {(activeNotice || showAuthModal) && (
        <div className={s.modalOverlay} onMouseDown={closeModals}>
          <div className={s.modal} onMouseDown={(e) => e.stopPropagation()}>
            <button
              className={s.modalClose}
              onClick={closeModals}
              aria-label="Close"
              type="button"
            >
              ×
            </button>

            {/* AUTH MODAL */}
            {showAuthModal && !activeNotice && (
              <div className={s.authModal}>
                <div className={s.authIcon}>🐶</div>
                <h3 className={s.authTitle}>Attention</h3>
                <p className={s.authText}>
                  We would like to remind you that certain functionality is
                  available only to authorized users. If you have an account,
                  please log in with your credentials. If you do not already
                  have an account, you must register to access these features.
                </p>
                <div className={s.authBtns}>
                  <button
                    className={s.authPrimary}
                    onClick={onAuthGoLogin}
                    type="button"
                  >
                    Log in
                  </button>
                  <button
                    className={s.authSecondary}
                    onClick={onAuthGoRegister}
                    type="button"
                  >
                    Registration
                  </button>
                </div>
              </div>
            )}

            {/* DETAIL MODAL */}
            {activeNotice && (
              <NoticeDetailModal
                it={activeNotice}
                onToggleFav={() => toggleFavorite(activeNotice)}
                onContact={() => onContact(activeNotice)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* detail modal */
function NoticeDetailModal({ it, onToggleFav, onContact }) {
  const title = it?.title || it?.name || "Pet";
  const img = it?.imgURL || it?.imgUrl || it?.imageUrl || it?.photo || "";
  const fav = Boolean(it?.favorite || it?.isFavorite);
  const price = it?.price ?? it?.cost;
  const desc = pickFirstString(it?.comment);

  const badgeText = it?.category || "Pet";
  const stars = toStars(it?.rating ?? it?.popularity ?? 1);

  return (
    <div className={s.detailModal}>
      <div className={s.detailImgWrap}>
        <div className={s.detailBadge}>{badgeText}</div>

        {img ? (
          <img className={s.detailImg} src={img} alt={title} />
        ) : (
          <div className={s.detailImgFallback} />
        )}
      </div>

      <h3 className={s.detailTitle}>{title}</h3>

      <div className={s.starsRow} aria-label={`Rating ${stars}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`${s.starIcon} ${i < stars ? s.starOn : s.starOff}`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        <span className={s.starCount}>{stars}</span>
      </div>

      <div className={s.detailInfoRow}>
        <Info label="Name" value={it?.name || "—"} />
        <Info
          label="Birthday"
          value={formatDate(it?.birthday || it?.birthDate || it?.date)}
        />
        <Info label="Sex" value={it?.sex || "—"} />
        <Info label="Species" value={it?.species || "—"} />
      </div>

      <p className={s.detailDesc}>{desc || "No description"}</p>

      <div className={s.detailPrice}>
        {price !== undefined && price !== null ? `$${price}` : "$ —"}
      </div>

      <div className={s.detailBtns}>
        <button className={s.btnPrimary} onClick={onToggleFav} type="button">
          {fav ? "Added ❤️" : "Add to "} <span className={s.btnHeart}>♡</span>
        </button>
        <button className={s.btnGhost} onClick={onContact} type="button">
          Contact
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className={s.detailInfoItem}>
      <span className={s.infoLabel}>{label}</span>
      <span className={s.infoValue}>{value}</span>
    </div>
  );
}
