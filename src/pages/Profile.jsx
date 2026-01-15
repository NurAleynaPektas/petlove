import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { backendSignout } from "../services/auth";
import {
  getUserStorageId,
  favKey,
  viewedKey,
  readFavs,
  readViewed,
  writeFavs,
  writeViewed,
  migrateLegacyToUser,
} from "../utils/userStorage";
import s from "./Profile.module.css";

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

function safeWriteProfile(obj) {
  localStorage.setItem(PROFILE_LS_KEY, JSON.stringify(obj));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function myPetsKey(userId) {
  return userId ? `petlove-my-pets:${userId}` : "petlove-my-pets";
}

function readMyPets(userId) {
  try {
    const key = myPetsKey(userId);
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeMyPets(userId, arr) {
  const key = myPetsKey(userId);
  localStorage.setItem(key, JSON.stringify(arr));
}

function toDDMMYYYY(val) {
  if (!val) return "";
  if (typeof val === "string" && val.includes("-")) {
    const [y, m, d] = val.split("-");
    if (y && m && d) return `${d}.${m}.${y}`;
  }
  return String(val);
}

function Stars({ value = 1 }) {
  const n = Math.max(1, Math.min(5, Number(value) || 1));
  return (
    <div className={s.stars} aria-label={`Rating ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < n ? s.starOn : s.starOff}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
      <span className={s.starNum}>{n}</span>
    </div>
  );
}

export default function Profile() {
  
  const { user, ready, isAuthed } = useAuth();
  const navigate = useNavigate();

  const userId = useMemo(() => getUserStorageId(user), [user]);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    migrateLegacyToUser(user);
  }, [ready, user]);

  const [tab, setTab] = useState("favorites");
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+380");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("User");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("+380");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const [uploadErr, setUploadErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const [favorites, setFavorites] = useState([]);
  const [viewed, setViewed] = useState([]);

  // ✅ NEW
  const [myPets, setMyPets] = useState([]);

  const emptyText = useMemo(() => {
    if (tab === "favorites") {
      return (
        <>
          Oops, looks like there aren’t any furries on our adorable page yet.
          Don’t worry! View your pets on the “find your favorite pet” page and
          add them to your favorites.
        </>
      );
    }
    return (
      <>
        You haven’t viewed any notices yet. Go to “find your favorite pet” page
        and open a card to see it here.
      </>
    );
  }, [tab]);

  useEffect(() => {
    if (!ready) return;

    const ls = safeReadProfile();
    const lsPhone = typeof ls.phone === "string" ? ls.phone : "";
    const lsAvatar = typeof ls.avatar === "string" ? ls.avatar : "";
    const lsName = typeof ls.name === "string" ? ls.name : "";

    const nextName = lsName || user?.name || user?.displayName || "User";
    const nextEmail = user?.email || "";
    const nextPhone = lsPhone || "+380";

    setName(nextName);
    setEmail(nextEmail);
    setPhone(nextPhone);
    setAvatarUrl(lsAvatar || user?.photoURL || "");
  }, [ready, user]);

  const syncLists = () => {
    if (!userId) {
      setFavorites([]);
      setViewed([]);
      return;
    }

    const favs = readFavs(userId);
    const v = readViewed(userId);

    favs.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
    v.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));

    setFavorites(favs);
    setViewed(v);
  };

  const syncPets = () => {
    const pets = readMyPets(userId);
 
    pets.sort((a, b) =>
      String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
    );
    setMyPets(pets);
  };

  useEffect(() => {
    if (!ready) return;

    syncLists();
    syncPets();

    const onFav = () => syncLists();
    const onViewed = () => syncLists();
    const onPets = () => syncPets();

    const onStorage = (e) => {
      const fk = favKey(userId);
      const vk = viewedKey(userId);
      const pk = myPetsKey(userId);

      if (e.key === fk || e.key === vk || e.key === pk) {
        syncLists();
        syncPets();
      }
    };

    window.addEventListener("petlove-favs-changed", onFav);
    window.addEventListener("petlove-viewed-changed", onViewed);
    window.addEventListener("petlove-my-pets-changed", onPets);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("petlove-favs-changed", onFav);
      window.removeEventListener("petlove-viewed-changed", onViewed);
      window.removeEventListener("petlove-my-pets-changed", onPets);
      window.removeEventListener("storage", onStorage);
    };
  }, [ready, userId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setEditOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!ready) return null;

  if (!isAuthed) {
    return (
      <div className={s.page}>
        <div className={s.centerCard}>
          <h2 className={s.centerTitle}>Please log in</h2>
          <p className={s.centerText}>
            Profile is available only for authorized users.
          </p>
          <div className={s.centerBtns}>
            <button className={s.primaryBtn} onClick={() => navigate("/login")}>
              Log in
            </button>
            <button
              className={s.secondaryBtn}
              onClick={() => navigate("/register")}
            >
              Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  const list = tab === "favorites" ? favorites : viewed;

  async function handleLogout() {
    try {
      await backendSignout();
      localStorage.removeItem("petlove-profile");
      window.dispatchEvent(new Event("petlove-profile-changed"));
      navigate("/home");
    } catch (e) {
      console.error("Logout error:", e);
      alert("Logout failed.");
    }
  }

  function openEdit() {
    setSaveErr("");
    setUploadErr("");

    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditAvatarUrl(avatarUrl);

    setEditOpen(true);
  }

  async function handlePickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadErr("");

    if (!file.type.startsWith("image/")) {
      setUploadErr("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadErr("Max 2MB image.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setEditAvatarUrl(dataUrl);
    } catch {
      setUploadErr("Upload failed.");
    } finally {
      e.target.value = "";
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (saving) return;

    setSaveErr("");
    setSaving(true);

    try {
      const nextName = String(editName || "").trim() || "User";
      const nextPhone = String(editPhone || "").trim() || "+380";

      const prev = safeReadProfile();
      safeWriteProfile({
        ...prev,
        name: nextName,
        phone: nextPhone,
        avatar: editAvatarUrl || "",
      });

      window.dispatchEvent(new Event("petlove-profile-changed"));

      setName(nextName);
      setPhone(nextPhone);
      setAvatarUrl(editAvatarUrl || "");

      setEditOpen(false);
    } catch (err) {
      console.log("PROFILE SAVE ERROR:", err);
      setSaveErr("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleRemoveFromList(card) {
    const id = String(card?.id || "");
    if (!id) return;
    if (!userId) return;

    if (tab === "favorites") {
      const next = favorites.filter((x) => String(x?.id) !== id);
      setFavorites(next);
      writeFavs(userId, next);
      return;
    }

    const next = viewed.filter((x) => String(x?.id) !== id);
    setViewed(next);
    writeViewed(userId, next);
  }

  function handleLearnMoreFromProfile() {
    navigate("/notices");
  }

  function handleDeleteMyPet(pet) {
    const id = String(pet?.id || "");
    if (!id) return;

    const next = myPets.filter((x) => String(x?.id) !== id);
    setMyPets(next);
    writeMyPets(userId, next);
    window.dispatchEvent(new Event("petlove-my-pets-changed"));
  }

  return (
    <div className={s.page}>
      <div className={s.layout}>
        {/* LEFT */}
        <aside className={s.left}>
          <div className={s.leftCard}>
            <div className={s.leftTop}>
              <span className={s.userBadge}>User</span>
              <button
                className={s.editBtn}
                type="button"
                aria-label="Edit"
                onClick={openEdit}
              >
                ✎
              </button>
            </div>

            <div className={s.avatarWrap}>
              <img
                className={s.avatar}
                src={avatarUrl || "https://i.pravatar.cc/120?img=3"}
                alt="User"
              />
            </div>

            <div className={s.sectionTitle}>My information</div>

            <div className={s.form}>
              <input className={s.input} value={name} readOnly />
              <input className={s.input} value={email} readOnly />
              <input className={s.input} value={phone} readOnly />

              <div className={s.petsRow}>
                <div className={s.sectionTitle}>My pets</div>
                <button
                  className={s.addPetBtn}
                  type="button"
                  onClick={() => navigate("/add-pet")}
                >
                  Add pet +
                </button>
              </div>

              {/* ✅ MY PETS (MOBILE LAYOUT) */}
              <div className={s.petsList}>
                {myPets.map((p) => {
                  const img = p?.imgURL || p?.imgUrl || p?.img || "";
                  const title = p?.title || "Untitled";
                  const petName = p?.name || "—";
                  const bday = toDDMMYYYY(p?.birthday) || "—";
                  const sex =
                    p?.gender === "female"
                      ? "Female"
                      : p?.gender === "male"
                      ? "Male"
                      : "Unknown";
                  const species = p?.species ? String(p.species) : "—";

                  return (
                    <article key={p.id} className={s.petCard}>
                      <div className={s.petMain}>
                        <div className={s.petAvatarWrap}>
                          {img ? (
                            <img
                              className={s.petAvatar}
                              src={img}
                              alt={title}
                            />
                          ) : (
                            <div
                              className={s.petAvatarFallback}
                              aria-hidden="true"
                            >
                              🐾
                            </div>
                          )}
                        </div>

                        <div className={s.petContent}>
                          <h3 className={s.petTitle}>{title}</h3>

                          <div className={s.petMetaGrid}>
                            <div className={s.petMetaItem}>
                              <div className={s.petMetaLabel}>Name</div>
                              <div className={s.petMetaValue}>{petName}</div>
                            </div>

                            <div className={s.petMetaItem}>
                              <div className={s.petMetaLabel}>Birthday</div>
                              <div className={s.petMetaValue}>{bday}</div>
                            </div>

                            <div className={s.petMetaItem}>
                              <div className={s.petMetaLabel}>Sex</div>
                              <div className={s.petMetaValue}>{sex}</div>
                            </div>

                            <div className={s.petMetaItem}>
                              <div className={s.petMetaLabel}>Species</div>
                              <div className={s.petMetaValue}>{species}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        className={s.petTrashBtn}
                        type="button"
                        aria-label="Delete pet"
                        title="Delete"
                        onClick={() => handleDeleteMyPet(p)}
                      >
                        <span className={s.petTrashIcon} aria-hidden="true">
                          🗑
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>

              <button
                className={s.logoutBtn}
                type="button"
                onClick={handleLogout}
              >
                LOG OUT
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className={s.right}>
          <div className={s.tabs}>
            <button
              type="button"
              className={`${s.tab} ${tab === "favorites" ? s.tabActive : ""}`}
              onClick={() => setTab("favorites")}
            >
              My favorite pets
            </button>
            <button
              type="button"
              className={`${s.tab} ${tab === "viewed" ? s.tabActive : ""}`}
              onClick={() => setTab("viewed")}
            >
              Viewed
            </button>
          </div>

          {list.length === 0 ? (
            <div className={s.emptyRight}>
              <p className={s.emptyText}>{emptyText}</p>
            </div>
          ) : (
            <div className={s.grid}>
              {list.map((it) => (
                <article key={it.id} className={s.card}>
                  <div className={s.thumb}>
                    <img className={s.img} src={it.img} alt={it.title} />
                  </div>

                  <div className={s.body}>
                    <div className={s.topRow}>
                      <h3 className={s.cardTitle}>{it.title}</h3>
                      <Stars value={it.stars} />
                    </div>

                    <div className={s.desc}>{it.desc}</div>

                    <div className={s.bottomRow}>
                      <div className={s.price}>
                        {it.price === null || it.price === undefined
                          ? "$—"
                          : `$${Number(it.price).toFixed(2)}`}
                      </div>

                      <div className={s.actions}>
                        <button
                          className={s.learnBtn}
                          type="button"
                          onClick={handleLearnMoreFromProfile}
                        >
                          Learn more
                        </button>

                        <button
                          className={s.binSmall}
                          type="button"
                          title="Remove"
                          onClick={() => handleRemoveFromList(it)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {editOpen && (
        <div className={s.modalOverlay} onMouseDown={() => setEditOpen(false)}>
          <div className={s.modal} onMouseDown={(e) => e.stopPropagation()}>
            <button
              className={s.modalClose}
              type="button"
              aria-label="Close"
              onClick={() => setEditOpen(false)}
            >
              ×
            </button>

            <h3 className={s.modalTitle}>Edit information</h3>

            <form className={s.modalForm} onSubmit={handleSaveEdit}>
              <div className={s.modalAvatarRow}>
                <img
                  className={s.modalAvatar}
                  src={editAvatarUrl || "https://i.pravatar.cc/120?img=3"}
                  alt="Avatar"
                />

                <div className={s.modalUploadRow}>
                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/*"
                    className={s.fileInput}
                    onChange={handlePickAvatar}
                  />
                  <label className={s.uploadBtn} htmlFor="avatarUpload">
                    Upload photo <span className={s.uploadIcon}>⤴</span>
                  </label>
                </div>
              </div>

              {uploadErr && <div className={s.modalError}>{uploadErr}</div>}

              <label className={s.modalLabel}>
                Name
                <input
                  className={s.modalInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                />
              </label>

              <label className={s.modalLabel}>
                Email
                <input
                  className={s.modalInput}
                  value={editEmail}
                  readOnly
                  title="Email change requires a separate flow"
                />
              </label>

              <label className={s.modalLabel}>
                Phone
                <input
                  className={s.modalInput}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Phone"
                />
              </label>

              {saveErr && <div className={s.modalError}>{saveErr}</div>}

              <div className={s.modalBtns}>
                <button
                  className={s.modalPrimary}
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className={s.modalGhost}
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
