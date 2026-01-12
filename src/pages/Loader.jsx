import s from "./Loader.module.css";
import loadingImg from "../assets/Loading.png";

export default function Loader({ progress = 0 }) {
  const safe = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className={s.backdrop}>
      <div className={s.imgWrap}>
        <img src={loadingImg} alt="" className={s.img} />
      </div>

      <div className={s.percent}>{safe}%</div>
    </div>
  );
}
