import s from "./Home.module.css";
import heroImg from "../assets/homeDesc.png";

export default function Home() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1 className={s.title}>
            Take good <span className={s.soft}>care</span> of your{" "}
            <br className={s.br} />
            small pets
          </h1>

          <p className={s.text}>
            Choosing a pet for your home is a choice that is meant to enrich
            your life with immeasurable joy and tenderness.
          </p>
        </div>
      </section>

      <section className={s.media}>
        <div className={s.mediaInner}>
          <img className={s.image} src={heroImg} alt="Girl hugging a dog" />
        </div>
      </section>
    </div>
  );
}
