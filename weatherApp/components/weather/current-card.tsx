"use client";

import { ArrowDown, ArrowUp, Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { useCountUp } from "@/hooks/use-count-up";
import {
  convertTemp,
  describeCode,
  formatTemp,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

/** 왼쪽 큰 카드 — 지금 이 도시의 날씨 */
export function CurrentCard({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const { city, current, days } = data;
  const info = describeCode(current.code, current.isDay);
  const today = days[0];
  const animatedTemp = useCountUp(convertTemp(current.temp, unit)); // 숫자가 스르륵 올라감

  return (
    <Card className="glass wx-rise h-full border-border/50 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{city.name}</span>
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[city.admin, city.country].filter(Boolean).join(" · ") || "현재 위치"}
            </p>
          </div>
          <Badge variant="secondary" className="glass shrink-0 border border-border/50">
            {current.isDay ? "낮" : "밤"}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <WeatherIcon icon={info.icon} animate className="size-20 sm:size-24" />
          <div className="min-w-0">
            <div className="flex items-start">
              <span className="text-6xl leading-none font-semibold tracking-tight tabular-nums sm:text-7xl">
                {Math.round(animatedTemp)}
              </span>
              <span className="mt-1 ml-1 text-xl font-medium text-muted-foreground sm:text-2xl">
                °{unit}
              </span>
            </div>
            <p className="mt-2 text-base font-medium">{info.label}</p>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUp className="size-4 text-rose-500 dark:text-rose-300" />
              최고 {today ? formatTemp(today.max, unit) : "--"}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <ArrowDown className="size-4 text-sky-600 dark:text-sky-300" />
              최저 {today ? formatTemp(today.min, unit) : "--"}
            </span>
            <span className="text-muted-foreground">
              체감 {formatTemp(current.feels, unit)}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {current.time.slice(11, 16)} 기준 · 현지 시각
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
