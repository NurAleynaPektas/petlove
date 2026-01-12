import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}


export function useRouteLoader({
  enabled = true,
  minShowMs = 550, 
  rampMs = 700,
  finishMs = 180, 
} = {}) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef(0);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

   
    if (lastKeyRef.current === location.key) return;
    lastKeyRef.current = location.key;


    setIsLoading(true);
    setProgress(0);
    startTimeRef.current = performance.now();


    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const p = (elapsed / rampMs) * 90;
      setProgress(clamp(p, 0, 90));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(100);

      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, finishMs);
    }, minShowMs);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
    };
   
  }, [location.key, enabled]);

  return { isLoading, progress };
}
