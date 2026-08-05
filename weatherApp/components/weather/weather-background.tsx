"use client";

import { THEME_GRADIENT, type WxTheme } from "@/lib/weather";

/**
 * 날씨·낮밤에 따라 바뀌는 배경.
 * 8가지 그라데이션을 미리 깔아두고 투명도만 바꿔서 부드럽게 전환한다.
 */
export function WeatherBackground({ theme }: { theme: WxTheme }) {
  const themes = Object.keys(THEME_GRADIENT) as WxTheme[];

  return (
    <>
      {themes.map((t) => (
        <div
          key={t}
          aria-hidden
          className="wx-layer"
          style={{ backgroundImage: THEME_GRADIENT[t], opacity: t === theme ? 1 : 0 }}
        />
      ))}
      {/* 오른쪽 위에서 은은하게 퍼지는 빛 */}
      <div
        aria-hidden
        className="wx-layer"
        style={{
          backgroundImage:
            "radial-gradient(1100px 520px at 78% -12%, rgba(255,255,255,0.4), transparent 70%)",
        }}
      />
    </>
  );
}
