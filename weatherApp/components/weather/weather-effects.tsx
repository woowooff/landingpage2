"use client";

import { useMemo } from "react";

import type { WxTheme } from "@/lib/weather";

/**
 * 배경 위에 얹는 날씨 효과 (비·눈·별·햇살·구름·번개).
 * 서버와 브라우저의 결과가 같아야 하므로 무작위(random) 대신 규칙적인 계산을 쓴다.
 */
function pseudo(i: number, salt: number) {
  return (((i + 1) * (37 + salt * 17)) % 100) / 100;
}

export function WeatherEffects({ theme }: { theme: WxTheme }) {
  const drops = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: pseudo(i, 1) * 100,
        delay: pseudo(i, 2) * 1.4,
        duration: 0.55 + pseudo(i, 3) * 0.5,
        height: 10 + pseudo(i, 4) * 14,
        opacity: 0.18 + pseudo(i, 5) * 0.3,
      })),
    [],
  );

  const flakes = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        left: pseudo(i, 6) * 100,
        delay: pseudo(i, 7) * 8,
        duration: 7 + pseudo(i, 8) * 7,
        size: 3 + pseudo(i, 9) * 4,
        opacity: 0.4 + pseudo(i, 10) * 0.5,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: pseudo(i, 11) * 100,
        top: pseudo(i, 12) * 62,
        delay: pseudo(i, 13) * 4,
        duration: 2.4 + pseudo(i, 14) * 3,
        size: 1 + pseudo(i, 15) * 1.6,
      })),
    [],
  );

  const isRain = theme === "rain" || theme === "storm";
  const isSnow = theme === "snow";
  const isStars = theme === "clear-night";
  const isSunny = theme === "clear-day";
  const isCloudy = theme === "cloud-day" || theme === "cloud-night" || theme === "fog";

  return (
    <div className="wx-effects pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* 맑은 낮 — 오른쪽 위 햇살 */}
      {isSunny && (
        <div
          className="absolute -top-24 -right-16 size-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,236,170,0.95) 0%, rgba(255,214,120,0.45) 45%, transparent 70%)",
            animation: "wx-sun-glow 7s ease-in-out infinite",
          }}
        />
      )}

      {/* 맑은 밤 — 반짝이는 별 */}
      {isStars &&
        stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: `wx-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}

      {/* 흐림·안개 — 천천히 흐르는 구름 덩어리 */}
      {isCloudy &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${5 + i * 30}%`,
              top: `${4 + i * 12}%`,
              width: `${260 + i * 90}px`,
              height: `${120 + i * 40}px`,
              background: "rgba(255,255,255,0.3)",
              animation: `wx-drift ${26 + i * 9}s ease-in-out ${i * 2}s infinite alternate`,
            }}
          />
        ))}

      {/* 비 */}
      {isRain &&
        drops.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 w-px rounded-full bg-white"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              opacity: d.opacity,
              animation: `wx-fall ${d.duration}s linear ${d.delay}s infinite`,
            }}
          />
        ))}

      {/* 눈 */}
      {isSnow &&
        flakes.map((f, i) => (
          <span
            key={i}
            className="absolute top-0 rounded-full bg-white"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: f.opacity,
              animation: `wx-fall-sway ${f.duration}s linear ${f.delay}s infinite`,
            }}
          />
        ))}

      {/* 뇌우 — 가끔 번쩍 */}
      {theme === "storm" && (
        <div
          className="absolute inset-0 bg-white"
          style={{ animation: "wx-flash 9s ease-in-out infinite" }}
        />
      )}
    </div>
  );
}
