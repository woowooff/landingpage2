"use client";

import { Droplets } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import {
  describeCode,
  formatHour,
  formatTemp,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

/** 지금부터 24시간 — 카드를 좌우로 나열 (가로 스크롤) */
export function HourlyStrip({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  return (
    <Card className="glass wx-rise gap-3 border-border/50 py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-semibold">24시간 예보</CardTitle>
        <span className="text-xs text-muted-foreground">가로로 밀어서 보기 →</span>
      </CardHeader>
      <CardContent className="px-5">
        <ol className="scroll-x flex gap-2 overflow-x-auto pb-2">
          {data.hours.map((hour, i) => {
            const info = describeCode(hour.code, hour.isDay);
            const rainy = hour.pop >= 30;
            return (
              <li
                key={hour.time}
                className="flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-background/35 px-2 py-3"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {i === 0 ? "지금" : formatHour(hour.time)}
                </span>
                <WeatherIcon icon={info.icon} className="size-7" />
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
