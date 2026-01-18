import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Formik } from "formik";
import * as yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { backendSignin } from "../services/auth";
import s from "./Login.module.css";
import dogImg from "../assets/loginKopek.png";

const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

const schema = yup.object({
  email: yup
    .string()
    .required("Email zorunlu.")
    .matches(emailRegex, "Email formatı geçersiz."),
  password: yup
    .string()
    .required("Password zorunlu.")
    .min(7, "Password en az 7 karakter olmalı."),
});

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const initialValues = {
    email: "",
    password: "",
  };

  async function handleLogin(values, helpers) {
    setServerError("");

    const email = String(values.email || "").trim();
    const password = String(values.password || "");

    try {
      // Firebase auth
      await signInWithEmailAndPassword(auth, email, password);

      // Backend auth (token vs)
      await backendSignin({ email, password });

      navigate("/profile", { replace: true });
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      const msg = String(err?.message || "").toLowerCase();

      if (msg.includes("user-not-found")) {
        setServerError("Bu email ile kullanıcı bulunamadı.");
      } else if (
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setServerError("Email veya şifre hatalı.");
      } else if (msg.includes("too-many-requests")) {
        setServerError("Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.");
      } else if (msg.includes("email or password invalid")) {
        setServerError("Email veya şifre hatalı (backend).");
      } else if (msg.includes("unauthorized") || msg.includes("401")) {
        setServerError("Giriş başarısız (401). Tekrar deneyin.");
      } else {
        setServerError("Giriş başarısız. Lütfen tekrar deneyin.");
      }
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        <div className={s.imageBox}>
          <img src={dogImg} alt="Dog" className={s.dogImg} />

          <div className={s.petCard}>
            <div className={s.petTop}>
              <div className={s.petAvatar}>🐶</div>

              <div className={s.petInfo}>
                <p className={s.petName}>Rich</p>
                <p className={s.petDate}>Birthday: 21.09.2020</p>
              </div>
            </div>

            <p className={s.petDesc}>
              Rich would be the perfect addition to an active family that loves
              to play and go on walks. I bet he would love having a doggy
              playmate too!
            </p>
          </div>
        </div>

        <div className={s.formBox}>
          <h1 className={s.title}>Log in</h1>
          <p className={s.text}>
            Welcome! Please enter your credentials to login to the platform:
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={handleLogin}
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
                  Email
                  <input
                    className={s.input}
                    type="email"
                    name="email"
                    placeholder="Enter your email"
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
                  Password
                  <input
                    className={s.input}
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={values.password}
                    onChange={(e) => {
                      setServerError("");
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                  />
                  {touched.password && errors.password && (
                    <span className={s.fieldError}>{errors.password}</span>
                  )}
                </label>

                {serverError && <p className={s.error}>{serverError}</p>}

                <button className={s.btn} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "LOG IN"}
                </button>
              </form>
            )}
          </Formik>

          <p className={s.text}>
            Don’t have an account?{" "}
            <NavLink className={s.link} to="/register">
              Registration
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
