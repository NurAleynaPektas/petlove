import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import s from "./Register.module.css";

const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

const schema = yup.object({
  name: yup.string().required("Name zorunlu."),
  email: yup
    .string()
    .required("Email zorunlu.")
    .matches(emailRegex, "Email formatı geçersiz."),
  password: yup
    .string()
    .required("Password zorunlu.")
    .min(7, "Password en az 7 karakter olmalı."),
  confirm: yup
    .string()
    .required("Confirm password zorunlu.")
    .oneOf([yup.ref("password")], "Password ve Confirm password aynı olmalı."),
});

export default function Register() {
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
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      );

      await updateProfile(cred.user, { displayName: values.name.trim() });

      navigate("/profile", { replace: true });
    } catch (err) {
      console.error(err);
      setServerError("Kayıt başarısız. Email kullanılıyor olabilir.");
    }
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Registration</h1>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className={s.label}>
          Name
          <input
            className={s.input}
            placeholder="Enter your name"
            {...register("name")}
          />
          {errors.name && (
            <span className={s.fieldError}>{errors.name.message}</span>
          )}
        </label>

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
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <span className={s.fieldError}>{errors.password.message}</span>
          )}
        </label>

        <label className={s.label}>
          Confirm password
          <input
            className={s.input}
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {errors.confirm && (
            <span className={s.fieldError}>{errors.confirm.message}</span>
          )}
        </label>

        {serverError && <p className={s.error}>{serverError}</p>}

        <button className={s.btn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Registration"}
        </button>
      </form>

      <p className={s.text}>
        Already have an account?{" "}
        <NavLink className={s.link} to="/login">
          Log in
        </NavLink>
      </p>
    </div>
  );
}
