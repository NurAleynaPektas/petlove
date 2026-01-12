import { useEffect, useState } from "react";

const LS_KEY = "petlove-initial-loader";

export function useInitialLoader({
  durationMs = 1600,
  oncePerSession = true, 
} = {}) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (oncePerSession) {
      const seen = sessionStorage.getItem(LS_KEY);
      if (seen) {
        setShow(false);
        return;
      }
      sessionStorage.setItem(LS_KEY, "1");
    }

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const p = ((now - start) / durationMs) * 100;
      setProgress(Math.min(100, Math.round(p)));
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => setShow(false), 200);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, oncePerSession]);

  return { show, progress };
}
