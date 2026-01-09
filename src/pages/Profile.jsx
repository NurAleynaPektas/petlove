import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../app/AuthContext";
import s from "./Profile.module.css";

const PROFILE_LS_KEY = "petlove-profile";


const demoFavorites = [
  {
    id: "1",
    title: "Lost Gecko",
    img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop",
    desc: "Friendly gecko lost around the park. Reward offered.",
    price: 81.99,
    stars: 4,
  },
  {
    id: "2",
    title: "Found Red-Eared Slider",
    img: "https://images.unsplash.com/photo-1543946603-0d3c1c3bfe2a?q=80&w=1200&auto=format&fit=crop",
    desc: "Found this turtle near the pond. Contact if yours.",
    price: 40.99,
    stars: 2,
  },
  {
    id: "3",
    title: "Golden Retriever Puppies",
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop",
    desc: "Adorable puppy looking for a loving home.",
    price: 257.99,
    stars: 1,
  },
  {
    id: "4",
    title: "Colorful Betta Fish",
    img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1200&auto=format&fit=crop",
    desc: "Free to a good home. Beautiful betta fish.",
    price: 63.99,
    stars: 1,
  },
];

const demoPets = [
  {
    id: "p1",
    title: "Golden Retriever Puppies",
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
    name: "Daisy",
    birthday: "01.10.2022",
    sex: "Female",
    species: "Dog",
  },
  {
    id: "p2",
    title: "Persian Cat for Sale",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop",
    name: "Fluffy",
    birthday: "20.06.2019",
    sex: "Female",
    species: "Cat",
  },
];

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
  const { user, ready } = useAuth();
  const navigate = useNavigate();
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


  useEffect(() => {
    if (!ready) return;

    const ls = safeReadProfile();
    const lsPhone = typeof ls.phone === "string" ? ls.phone : "";
    const lsAvatar = typeof ls.avatar === "string" ? ls.avatar : "";

    const nextName = user?.displayName || "User";
    const nextEmail = user?.email || "";
    const nextPhone = lsPhone || "+380";

    setName(nextName);
    setEmail(nextEmail);
    setPhone(nextPhone);
    setAvatarUrl(lsAvatar || user?.photoURL || "");
  }, [ready, user]);

 
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setEditOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const favorites = useMemo(() => demoFavorites, []);
  const viewed = useMemo(() => demoFavorites.slice().reverse(), []);

  if (!ready) return null;

  if (!user) {
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
      await signOut(auth);
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
      await updateProfile(user, { displayName: nextName });

      const nextPhone = String(editPhone || "").trim() || "+380";
      const prev = safeReadProfile();

      safeWriteProfile({
        ...prev,
        phone: nextPhone,
        avatar: editAvatarUrl || "",
      });

      window.dispatchEvent(new Event("petlove-profile-changed"));
      setName(nextName);
      setPhone(nextPhone);
      setAvatarUrl(editAvatarUrl || "");

      setEditOpen(false);
    } catch (err) {
      console.log("PROFILE SAVE ERROR:", err?.code, err?.message, err);
      setSaveErr("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
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

              <div className={s.petsList}>
                {demoPets.map((p) => (
                  <div key={p.id} className={s.petCard}>
                    <img className={s.petImg} src={p.img} alt={p.title} />
                    <div className={s.petInfo}>
                      <div className={s.petTitle}>{p.title}</div>

                      <div className={s.petMeta}>
                        <div className={s.petMetaItem}>
                          <span className={s.metaLabel}>Name</span>
                          <span className={s.metaValue}>{p.name}</span>
                        </div>
                        <div className={s.petMetaItem}>
                          <span className={s.metaLabel}>Birthday</span>
                          <span className={s.metaValue}>{p.birthday}</span>
                        </div>
                        <div className={s.petMetaItem}>
                          <span className={s.metaLabel}>Sex</span>
                          <span className={s.metaValue}>{p.sex}</span>
                        </div>
                        <div className={s.petMetaItem}>
                          <span className={s.metaLabel}>Species</span>
                          <span className={s.metaValue}>{p.species}</span>
                        </div>
                      </div>
                    </div>

                    <button className={s.binBtn} type="button" title="Delete">
                      🗑
                    </button>
                  </div>
                ))}
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
                    <div className={s.price}>${Number(it.price).toFixed(2)}</div>

                    <div className={s.actions}>
                      <button className={s.learnBtn} type="button">
                        Learn more
                      </button>
                      <button className={s.binSmall} type="button" title="Remove">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* EDIT MODAL */}
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
                <button className={s.modalPrimary} type="submit" disabled={saving}>
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
