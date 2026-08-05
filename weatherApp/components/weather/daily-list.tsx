"use client";

import { Droplets } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import {
  convertTemp,
  describeCode,
  describeDate,
  formatTemp,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

/** 7일 예보 — 카드를 좌우로 나열, 아래 막대는 그 날의 최저~최고 기온 범위 */
export function DailyList({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const days = data.days;
  const todayStr = data.current.time.slice(0, 10);

  // 일주일 전체의 기온 범위를 기준으로 막대 위치를 계산한다
  const weekMin = Math.min(...days.map((d) => d.min));
  const weekMax = Math.max(...days.map((d) => d.max));
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <Card className="glass wx-rise gap-3 border-border/50 py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold">7일 예보</CardTitle>
        <span className="text-xs text-muted-foreground">
          이번 주 {formatTemp(weekMin, unit)} ~ {formatTemp(weekMax, unit)}
        </span>
      </CardHeader>
      <CardContent className="px-5">
        <ol className="scroll-x flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-7 md:overflow-visible">
          {days.map((day) => {
            const info = describeCode(day.code, true);
            const when = describeDate(day.date, todayStr);
            const rainy = day.pop >= 30;
            const left = ((day.min - weekMin) / span) * 100;
            const width = Math.max(((day.max - day.min) / span) * 100, 8);

            return (
              <li
                key={day.date}
                className={`flex min-w-[96px] flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-transform duration-200 hover:-translate-y-0.5 ${
                  when.isToday
                    ? "border-foreground/25 bg-background/60"
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
                <WeatherIcon icon={info.icon} className="size-7" />
                <span className="text-[11px] text-muted-foreground">{info.label}</span>
                <span
                  className="flex items-center gap-0.5 text-xs tabular-nums"
                  style={{ color: rainy ? "var(--wx-rain)" : undefined }}
                >
                  <Droplets className={`size-3 ${rainy ? "" : "text-muted-foreground"}`} />
                  <span className={rainy ? "font-medium" : "text-muted-foreground"}>
                    {day.pop}%
                  </span>
                </span>

                <div className="mt-1 w-full">
                  <div className="flex items-baseline justify-between text-xs tabular-nums">
                    <span className="text-muted-foreground">{formatTemp(day.min, unit)}</span>
                    <span className="font-semibold">{formatTemp(day.max, unit)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
                      style={{ marginLeft: `${left}%`, width: `${width}%` }}
                      title={`${Math.round(convertTemp(day.min, unit))}° ~ ${Math.round(
                        convertTemp(day.max, unit),
                      )}°`}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
