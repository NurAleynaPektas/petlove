import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Formik } from "formik";
import * as yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import { backendSignup } from "../services/auth";
import s from "./Register.module.css";
import catImg from "../assets/loginKedi.png";

import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";

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

function toastSuccess(message) {
  iziToast.success({
    title: "OK",
    message: String(message || ""),
    position: "topRight",
    timeout: 2200,
    close: true,
    drag: true,
    pauseOnHover: true,
  });
}
function toastError(message) {
  iziToast.error({
    title: "Error",
    message: String(message || ""),
    position: "topRight",
    timeout: 2800,
    close: true,
    drag: true,
    pauseOnHover: true,
  });
}

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initialValues = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  };

  async function handleRegister(values, helpers) {
    setServerError("");

    const name = String(values.name || "").trim();
    const email = String(values.email || "").trim();
    const password = String(values.password || "");
    const phone = String(values.phone || "").trim();

    try {
      
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        await updateProfile(cred.user, { displayName: name });
      } catch {
        
      }

      await backendSignup({ name, email, password });

     
      const prev = safeReadProfile();
      safeWriteProfile({ ...prev, phone: phone || "" });

      toastSuccess("Registration successful!");
      navigate("/profile", { replace: true });
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      const msg = String(err?.message || "").toLowerCase();

      if (msg.includes("email-already-in-use")) {
        setServerError("Bu email zaten kullanılıyor.");
        toastError("Bu email zaten kullanılıyor.");
      } else if (msg.includes("invalid-email")) {
        setServerError("Email formatı geçersiz.");
        toastError("Email formatı geçersiz.");
      } else if (msg.includes("weak-password")) {
        setServerError("Şifre çok zayıf. En az 7 karakter olmalı.");
        toastError("Şifre çok zayıf.");
      } else if (msg.includes("password field is required")) {
        setServerError("Backend signup şifre istiyor. Şifreyi kontrol et.");
        toastError("Backend signup şifre istiyor.");
      } else {
        setServerError("Kayıt başarısız. Lütfen tekrar deneyin.");
        toastError("Kayıt başarısız.");
      }
    } finally {
      helpers.setSubmitting(false);
    }
  }

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

          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={handleRegister}
            validateOnBlur={true}
            validateOnChange={false}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <form className={s.form} onSubmit={handleSubmit} noValidate>
                <label className={s.label}>
                  <input
                    className={s.input}
                    name="name"
                    placeholder="Name"
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => {
                      setServerError("");
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                  />
                  {touched.name && errors.name && (
                    <span className={s.fieldError}>{errors.name}</span>
                  )}
                </label>

                <label className={s.label}>
                  <input
                    className={s.input}
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => {
                      setServerError("");
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                  />
                  {touched.email && errors.email && (
                    <span className={s.fieldError}>{errors.email}</span>
                  )}
                </label>

                <label className={s.label}>
                  <div className={s.inputWrap}>
                    <input
                      className={s.input}
                      type={showPass ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={values.password}
                      onChange={(e) => {
                        setServerError("");
                        handleChange(e);
                      }}
                      onBlur={handleBlur}
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
                  {touched.password && errors.password && (
                    <span className={s.fieldError}>{errors.password}</span>
                  )}
                </label>

                <label className={s.label}>
                  <div className={s.inputWrap}>
                    <input
                      className={s.input}
                      type={showConfirm ? "text" : "password"}
                      name="confirm"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      value={values.confirm}
                      onChange={(e) => {
                        setServerError("");
                        handleChange(e);
                      }}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      className={s.eyeBtn}
                      onClick={() => setShowConfirm((p) => !p)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      👁
                    </button>
                  </div>
                  {touched.confirm && errors.confirm && (
                    <span className={s.fieldError}>{errors.confirm}</span>
                  )}
                </label>

                <label className={s.label}>
                  <input
                    className={s.input}
                    name="phone"
                    placeholder="Phone"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(e) => {
                      setServerError("");
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                  />
                  {touched.phone && errors.phone && (
                    <span className={s.fieldError}>{errors.phone}</span>
                  )}
                </label>

                {serverError && <p className={s.error}>{serverError}</p>}

                <button className={s.btn} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "REGISTRATION"}
                </button>
              </form>
            )}
          </Formik>

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
