"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 숫자가 이전 값에서 새 값으로 스르륵 올라가는(내려가는) 효과.
 * 도시를 바꾸거나 °C/°F를 바꾸면 기온이 부드럽게 변한다.
 */
export function useCountUp(value: number, duration = 650): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // 끝에서 살짝 느려지게
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = to;
    };
  }, [value, duration]);

  return display;
}
