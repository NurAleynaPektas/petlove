import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import { backendSignup } from "../services/auth";
import s from "./Register.module.css";
import catImg from "../assets/loginKedi.png";

const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

const schema = yup.object({
  name: yup.string().required("Name zorunlu."),
  email: yup
    .string()
    .required("Email zorunlu.")
    .matches(emailRegex, "Email formatı geçersiz."),
  phone: yup.string().required("Phone zorunlu."),
  password: yup
    .string()
    .required("Password zorunlu.")
    .min(7, "Password en az 7 karakter olmalı."),
  confirm: yup
    .string()
    .required("Confirm password zorunlu.")
    .oneOf([yup.ref("password")], "Password ve Confirm password aynı olmalı."),
});

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
  window.dispatchEvent(new Event("petlove-profile-changed"));
}

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    setServerError("");

    const name = values.name.trim();
    const email = values.email.trim();
    const password = values.password;
    const phone = values.phone.trim();

    try {
      // 1) Firebase register
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {}

      // 2) Backend signup (token burada set edilecek)
      await backendSignup({ name, email, password });

      // 3) phone'u local profile cache'ine yaz
      const prev = safeReadProfile();
      safeWriteProfile({ ...prev, phone: phone || "" });

      // 4) profile'a git
      navigate("/profile", { replace: true });
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      const msg = String(err?.message || "").toLowerCase();

      if (msg.includes("email-already-in-use")) {
        setServerError("Bu email zaten kullanılıyor.");
      } else if (msg.includes("invalid-email")) {
        setServerError("Email formatı geçersiz.");
      } else if (msg.includes("weak-password")) {
        setServerError("Şifre çok zayıf. En az 7 karakter olmalı.");
      } else if (msg.includes("password field is required")) {
        setServerError("Backend signup şifre istiyor. Şifreyi kontrol et.");
      } else {
        setServerError("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    }
  };


  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        <div className={s.imageBox}>
          <img src={catImg} alt="Cat" className={s.petImg} />

          <div className={s.petCard}>
            <div className={s.petTop}>
              <div className={s.petAvatar}>🐱</div>

              <div className={s.petInfo}>
                <p className={s.petName}>Jack</p>
                <p className={s.petDate}>Birthday: 18.10.2021</p>
              </div>
            </div>

            <p className={s.petDesc}>
              Jack is a gray Persian cat with green eyes. He loves to be
              pampered and groomed, and enjoys playing with toys.
            </p>
          </div>
        </div>

        <div className={s.formBox}>
          <h1 className={s.title}>Registration</h1>
          <p className={s.text}>Thank you for your interest in our platform.</p>

          <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className={s.label}>
              <input
                className={s.input}
                placeholder="Name"
                autoComplete="name"
                {...register("name")}
              />
              {errors.name && (
                <span className={s.fieldError}>{errors.name.message}</span>
              )}
            </label>

            <label className={s.label}>
              <input
                className={s.input}
                type="email"
                placeholder="Email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <span className={s.fieldError}>{errors.email.message}</span>
              )}
            </label>

            <label className={s.label}>
              <div className={s.inputWrap}>
                <input
                  className={s.input}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  className={s.eyeBtn}
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  👁
                </button>
              </div>
              {errors.password && (
                <span className={s.fieldError}>{errors.password.message}</span>
              )}
            </label>

            <label className={s.label}>
              <div className={s.inputWrap}>
                <input
                  className={s.input}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register("confirm")}
                />
                <button
                  type="button"
                  className={s.eyeBtn}
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  👁
                </button>
              </div>
              {errors.confirm && (
                <span className={s.fieldError}>{errors.confirm.message}</span>
              )}
            </label>

            <label className={s.label}>
              <input
                className={s.input}
                placeholder="Phone"
                autoComplete="tel"
                {...register("phone")}
              />
              {errors.phone && (
                <span className={s.fieldError}>{errors.phone.message}</span>
              )}
            </label>

            {serverError && <p className={s.error}>{serverError}</p>}

            <button className={s.btn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "REGISTRATION"}
            </button>
          </form>

          <p className={s.bottomText}>
            Already have an account?{" "}
            <NavLink className={s.link} to="/login">
              Login
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
