import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import s from "./Register.module.css";
import catImg from "../assets/loginKedi.png";

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
      <div className={s.wrapper}>
        {/* IMAGE SIDE */}
        <div className={s.imageBox}>
          <img src={catImg} alt="Cat" className={s.petImg} />

          {/* PET INFO CARD */}
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

        {/* FORM SIDE */}
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
