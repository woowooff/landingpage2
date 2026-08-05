"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import {
  convertTemp,
  describeCode,
  formatHour,
  formatTemp,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

const W = 1000; // 그래프 안쪽 좌표계 (실제 크기는 화면에 맞춰 늘어남)
const H = 120;
const PAD = 22;

/** 지금부터 24시간 — 기온 그래프 + 좌우로 나열된 카드 */
export function HourlyStrip({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const hours = data.hours;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLOListElement>(null);
  const dragRef = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const temps = hours.map((h) => convertTemp(h.temp, unit));
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const span = Math.max(tMax - tMin, 1);
  const last = hours.length - 1;

  const points = temps.map((t, i) => ({
    x: (i / last) * W,
    y: PAD + (1 - (t - tMin) / span) * (H - PAD * 2),
  }));

  // 부드러운 곡선 만들기 (점과 점 사이를 완만하게 이음)
  let line = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    line += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
  }
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  const maxIdx = temps.indexOf(tMax);
  const minIdx = temps.indexOf(tMin);
  const shown = activeIdx ?? 0;
  const shownHour = hours[shown];
  const shownInfo = describeCode(shownHour.code, shownHour.isDay);
  const tipLeft = Math.min(Math.max((shown / last) * 100, 9), 91);

  function scrollStrip(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <Card className="glass wx-rise gap-3 border-border/50 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold">24시간 예보</CardTitle>
        <span className="text-xs text-muted-foreground">
          그래프에 마우스를 올리거나 손가락으로 문질러 보세요
        </span>
        <div className="col-start-2 row-span-2 row-start-1 hidden gap-1 self-start sm:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="이전 시간대 보기"
            onClick={() => scrollStrip(-1)}
            className="size-8 rounded-full"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="다음 시간대 보기"
            onClick={() => scrollStrip(1)}
            className="size-8 rounded-full"
          >
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        {/* ── 기온 그래프 ── */}
        <div className="relative mb-3 h-32 w-full select-none">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full text-foreground"
            aria-hidden
          >
            <defs>
              <linearGradient id="wx-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#wx-area)" />
            <path
              d={line}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {activeIdx !== null && (
              <line
                x1={points[activeIdx].x}
                y1={0}
                x2={points[activeIdx].x}
                y2={H}
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* 최고·최저 지점 표시 (모든 점에 숫자를 달지 않는다) */}
          {[maxIdx, minIdx].map((idx, k) => (
            <span
              key={k}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full text-[11px] font-semibold tabular-nums"
              style={{
                left: `${Math.min(Math.max((idx / last) * 100, 6), 94)}%`,
                top: `${(points[idx].y / H) * 100}%`,
              }}
            >
              {formatTemp(hours[idx].temp, unit)}
            </span>
          ))}

          {/* 지금 위치한 점 */}
          {activeIdx !== null && (
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
              style={{
                left: `${(activeIdx / last) * 100}%`,
                top: `${(points[activeIdx].y / H) * 100}%`,
                backgroundColor: "var(--chart-1)",
              }}
            />
          )}

          {/* 툴팁 */}
          {activeIdx !== null && (
            <div
              className="glass pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: `${tipLeft}%` }}
              role="status"
            >
              <div className="font-medium">
                {activeIdx === 0 ? "지금" : formatHour(shownHour.time)}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <WeatherIcon icon={shownInfo.icon} className="size-3.5" />
                <span className="font-semibold tabular-nums">
                  {formatTemp(shownHour.temp, unit)}
                </span>
                <span className="text-muted-foreground">{shownInfo.label}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                <Droplets className="size-3" />
                <span className="tabular-nums">비 올 확률 {shownHour.pop}%</span>
              </div>
            </div>
          )}

          {/* 마우스·손가락을 받는 투명한 판 */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const idx = Math.round(ratio * last);
              setActiveIdx(Math.min(Math.max(idx, 0), last));
            }}
            onPointerLeave={() => setActiveIdx(null)}
          />
        </div>

        {/* ── 시간별 카드 (좌우 배치 · 드래그로 밀 수 있음) ── */}
        <ol
          ref={scrollerRef}
          className="scroll-x flex cursor-grab gap-2 overflow-x-auto pb-2 active:cursor-grabbing"
          onPointerDown={(e) => {
            const el = scrollerRef.current;
            if (!el) return;
            dragRef.current = {
              down: true,
              startX: e.clientX,
              startScroll: el.scrollLeft,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const el = scrollerRef.current;
            if (!el || !dragRef.current.down) return;
            const dx = e.clientX - dragRef.current.startX;
            if (Math.abs(dx) > 3) dragRef.current.moved = true;
            el.scrollLeft = dragRef.current.startScroll - dx;
          }}
          onPointerUp={() => (dragRef.current.down = false)}
          onPointerLeave={() => {
            dragRef.current.down = false;
            setActiveIdx(null);
          }}
        >
          {hours.map((hour, i) => {
            const info = describeCode(hour.code, hour.isDay);
            const rainy = hour.pop >= 30;
            const on = activeIdx === i;
            return (
              <li
                key={hour.time}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all duration-200 ${
                  on
                    ? "-translate-y-0.5 border-foreground/30 bg-background/70 shadow-sm"
                    : "border-border/40 bg-background/35"
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {i === 0 ? "지금" : formatHour(hour.time)}
                </span>
                <WeatherIcon
                  icon={info.icon}
                  className={`size-7 ${on ? "wx-anim-bob" : ""}`}
                />
                <strong className="text-base font-semibold tabular-nums">
                  {formatTemp(hour.temp, unit)}
                </strong>
                <span
                  className="flex items-center gap-0.5 text-xs tabular-nums"
                  style={{ color: rainy ? "var(--wx-rain)" : undefined }}
                >
                  <Droplets className={`size-3 ${rainy ? "" : "text-muted-foreground"}`} />
                  <span className={rainy ? "font-medium" : "text-muted-foreground"}>
                    {hour.pop}%
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
