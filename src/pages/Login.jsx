import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import s from "./Login.module.css";

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
    } catch (err) {
      console.error(err);
      setServerError("Email veya şifre hatalı.");
    }
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Log in</h1>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className={s.label}>
          Email
          <input
            className={s.input}
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
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
            autoComplete="current-password"
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
  );
}
