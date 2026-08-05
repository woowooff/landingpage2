"use client";

import { useEffect, useState } from "react";
import { Droplets, Sun, Sunrise, Sunset, Umbrella } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import {
  convertTemp,
  describeCode,
  describeDate,
  formatClock,
  formatTemp,
  uvLevel,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

/** 7일 예보 — 카드를 좌우로 나열, 누르면 그날 상세가 아래에 펼쳐진다 */
export function DailyList({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const days = data.days;
  const todayStr = data.current.time.slice(0, 10);
  const [selected, setSelected] = useState(0);

  // 도시가 바뀌면 다시 '오늘'로
  useEffect(() => {
    setSelected(0);
  }, [data.city.id]);

  const weekMin = Math.min(...days.map((d) => d.min));
  const weekMax = Math.max(...days.map((d) => d.max));
  const span = Math.max(weekMax - weekMin, 1);

  const day = days[selected];
  const dayInfo = describeCode(day.code, true);
  const dayWhen = describeDate(day.date, todayStr);

  return (
    <Card className="glass wx-rise gap-3 border-border/50 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold">7일 예보</CardTitle>
        <span className="text-xs text-muted-foreground">
          날짜를 누르면 그날 자세히 보여요 · 이번 주 {formatTemp(weekMin, unit)} ~{" "}
          {formatTemp(weekMax, unit)}
        </span>
      </CardHeader>

      <CardContent className="px-5">
        <ol className="scroll-x flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-7 md:overflow-visible">
          {days.map((d, i) => {
            const info = describeCode(d.code, true);
            const when = describeDate(d.date, todayStr);
            const rainy = d.pop >= 30;
            const on = i === selected;
            const left = ((d.min - weekMin) / span) * 100;
            const width = Math.max(((d.max - d.min) / span) * 100, 8);

            return (
              <li key={d.date} className="min-w-[96px] flex-1">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={on}
                  className={`flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-background/55 ${
                    on
                      ? "-translate-y-0.5 border-foreground/35 bg-background/70 shadow-sm"
                      : "border-border/40 bg-background/35"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      when.weekday === 0
                        ? "text-rose-500 dark:text-rose-300"
                        : when.weekday === 6
                          ? "text-sky-600 dark:text-sky-300"
                          : ""
                    }`}
                  >
                    {when.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{when.sub}</span>
                  <WeatherIcon icon={info.icon} className={`size-7 ${on ? "wx-anim-bob" : ""}`} />
                  <span className="text-[11px] text-muted-foreground">{info.label}</span>
                  <span
                    className="flex items-center gap-0.5 text-xs tabular-nums"
                    style={{ color: rainy ? "var(--wx-rain)" : undefined }}
                  >
                    <Droplets className={`size-3 ${rainy ? "" : "text-muted-foreground"}`} />
                    <span className={rainy ? "font-medium" : "text-muted-foreground"}>
                      {d.pop}%
                    </span>
                  </span>

                  <div className="mt-1 w-full">
                    <div className="flex items-baseline justify-between text-xs tabular-nums">
                      <span className="text-muted-foreground">{formatTemp(d.min, unit)}</span>
                      <span className="font-semibold">{formatTemp(d.max, unit)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400 transition-all duration-300"
                        style={{ marginLeft: `${left}%`, width: `${width}%` }}
                        title={`${Math.round(convertTemp(d.min, unit))}° ~ ${Math.round(
                          convertTemp(d.max, unit),
                        )}°`}
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* 선택한 날 상세 */}
        <div
          key={day.date}
          className="wx-rise mt-3 rounded-xl border border-border/40 bg-background/40 p-4"
        >
          <div className="flex items-center gap-3">
            <WeatherIcon icon={dayInfo.icon} className="size-10" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {dayWhen.isToday ? "오늘" : `${dayWhen.sub} (${dayWhen.label})`} · {dayInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">
                최저 {formatTemp(day.min, unit)} / 최고 {formatTemp(day.max, unit)}
              </p>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
            <div className="flex items-center gap-1.5">
              <Umbrella className="size-3.5 text-sky-600 dark:text-sky-300" />
              <dt className="text-muted-foreground">강수확률</dt>
              <dd className="font-semibold tabular-nums">{day.pop}%</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="size-3.5 text-amber-500 dark:text-amber-300" />
              <dt className="text-muted-foreground">자외선</dt>
              <dd className="font-semibold tabular-nums">
                {Math.round(day.uv)} <span className="font-normal">{uvLevel(day.uv)}</span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Sunrise className="size-3.5 text-violet-500 dark:text-violet-300" />
              <dt className="text-muted-foreground">일출</dt>
              <dd className="font-semibold tabular-nums">{formatClock(day.sunrise)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Sunset className="size-3.5 text-violet-500 dark:text-violet-300" />
              <dt className="text-muted-foreground">일몰</dt>
              <dd className="font-semibold tabular-nums">{formatClock(day.sunset)}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
