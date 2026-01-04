import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import s from "./Login.module.css";
import dogImg from "../assets/loginkopek.png";

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
    try {
      await signInWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      );
      navigate("/profile", { replace: true });
    } catch {
      setServerError("Email veya şifre hatalı.");
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        {/* IMAGE SIDE */}
        <div className={s.imageBox}>
          <img src={dogImg} alt="Dog" className={s.dogImg} />

          {/* PET INFO CARD */}
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

        {/* FORM SIDE */}
        <div className={s.formBox}>
          <h1 className={s.title}>Log in</h1>
          <p className={s.text}>
            Welcome! Please enter your credentials to login to the platform:
          </p>
          <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className={s.label}>
              Email
              <input
                className={s.input}
                type="email"
                placeholder="Enter your email"
                {...register("email")}
              />
              {errors.email && (
                <span className={s.fieldError}>{errors.email.message}</span>
              )}
            </label>

            <label className={s.label}>
              Password
              <input
                className={s.input}
                type="password"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password && (
                <span className={s.fieldError}>{errors.password.message}</span>
              )}
            </label>

            {serverError && <p className={s.error}>{serverError}</p>}

            <button className={s.btn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

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
