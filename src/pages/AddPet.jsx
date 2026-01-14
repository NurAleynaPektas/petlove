import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import s from "./AddPet.module.css";

import addDog from "../assets/addDog.png";

// ✅ NEW
import { useAuth } from "../app/AuthContext";
import { getUserStorageId } from "../utils/userStorage";

const SPECIES = [
  "Dog",
  "Cat",
  "Monkey",
  "Bird",
  "Snake",
  "Turtle",
  "Lizard",
  "Frog",
  "Fish",
  "Ants",
  "Bees",
  "Butterfly",
  "Spider",
  "Scorpion",
];

function fileToObjectUrl(file) {
  return URL.createObjectURL(file);
}

function formatDateInputToDDMMYYYY(val) {
  if (!val) return "";
  const [y, m, d] = val.split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
}

export default function AddPet() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // ✅ NEW
  const { user } = useAuth();
  const userId = useMemo(() => getUserStorageId(user), [user]);

  const [gender, setGender] = useState("female");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [petName, setPetName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [species, setSpecies] = useState("");

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dateShown = useMemo(
    () => formatDateInputToDDMMYYYY(birthDate),
    [birthDate]
  );

  const openFile = () => fileRef.current?.click();

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setErr("");

    if (!f.type.startsWith("image/")) {
      setErr("Please select an image file.");
      e.target.value = "";
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setErr("Max 2MB image.");
      e.target.value = "";
      return;
    }

    const objUrl = fileToObjectUrl(f);
    setPhotoFile(f);
    setPreview(objUrl);
    setPhotoUrl("");
    setUrlInput("");
    e.target.value = "";
  };

  const onChangeUrl = (v) => {
    setUrlInput(v);
    setPhotoFile(null);
    setPreview(v.trim());
    setPhotoUrl(v.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErr("");

    if (!title.trim()) return setErr("Title is required.");
    if (!petName.trim()) return setErr("Pet’s name is required.");
    if (!birthDate) return setErr("Birthday is required.");
    if (!species) return setErr("Type of pet is required.");

    setSubmitting(true);

    try {
      const payload = {
        id: crypto?.randomUUID?.() || String(Date.now()),
        gender,
        imgURL: photoUrl || preview || "",
        title: title.trim(),
        name: petName.trim(),
        birthday: birthDate, // YYYY-MM-DD
        species,
        createdAt: new Date().toISOString(),
      };

      // ✅ user’a özel key
      const key = userId ? `petlove-my-pets:${userId}` : "petlove-my-pets";

      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      const next = Array.isArray(prev) ? [payload, ...prev] : [payload];
      localStorage.setItem(key, JSON.stringify(next));

      // ✅ profile dinlesin
      window.dispatchEvent(new Event("petlove-my-pets-changed"));

      navigate("/profile");
    } catch (e2) {
      console.error(e2);
      setErr("Submit failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.left}>
          <div className={s.heroCard}>
            <img className={s.heroImg} src={addDog} alt="Pet" />
          </div>
        </div>

        <div className={s.right}>
          <div className={s.card}>
            <h1 className={s.title}>
              Add my pet <span className={s.subtitle}>/ Personal details</span>
            </h1>

            <div className={s.genderRow}>
              <button
                type="button"
                className={`${s.gbtn} ${
                  gender === "female" ? s.gActiveFemale : ""
                }`}
                onClick={() => setGender("female")}
                aria-label="Female"
                title="Female"
              >
                ♀
              </button>
              <button
                type="button"
                className={`${s.gbtn} ${
                  gender === "male" ? s.gActiveMale : ""
                }`}
                onClick={() => setGender("male")}
                aria-label="Male"
                title="Male"
              >
                ♂
              </button>
              <button
                type="button"
                className={`${s.gbtn} ${
                  gender === "unknown" ? s.gActiveUnknown : ""
                }`}
                onClick={() => setGender("unknown")}
                aria-label="Unknown"
                title="Unknown"
              >
                ⚥
              </button>

              <div className={s.previewWrap}>
                {preview ? (
                  <img className={s.previewImg} src={preview} alt="Preview" />
                ) : (
                  <div className={s.previewPlaceholder} aria-hidden="true">
                    🐾
                  </div>
                )}
              </div>
            </div>

            <form className={s.form} onSubmit={handleSubmit}>
              <div className={s.row2}>
                <input
                  className={s.input}
                  placeholder="Enter URL"
                  value={urlInput}
                  onChange={(e) => onChangeUrl(e.target.value)}
                />

                <button
                  className={s.uploadBtn}
                  type="button"
                  onClick={openFile}
                >
                  Upload photo <span className={s.uploadIcon}>⤴</span>
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={s.hiddenFile}
                  onChange={onPickFile}
                />
              </div>

              <input
                className={s.input}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className={s.input}
                placeholder="Pet’s Name"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
              />

              <div className={s.row2}>
                <div className={s.dateWrap}>
                  <input
                    className={s.input}
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    aria-label="Birthday"
                  />
                  <span className={s.dateHint} aria-hidden="true">
                    {dateShown || "00.00.0000"}
                  </span>
                </div>

                <select
                  className={s.select}
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  <option value="">Type of pet</option>
                  {SPECIES.map((x) => (
                    <option key={x} value={x.toLowerCase()}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              {err && <div className={s.error}>{err}</div>}

              <div className={s.actions}>
                <button
                  className={s.backBtn}
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>

                <button
                  className={s.submitBtn}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
