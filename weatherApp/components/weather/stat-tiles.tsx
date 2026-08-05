"use client";

import {
  Droplets,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  formatClock,
  formatTemp,
  uvLevel,
  type Unit,
  type WeatherBundle,
} from "@/lib/weather";

type Tile = {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  tint: string;
};

/** 오른쪽 작은 카드 6개 — 오늘의 상세 지표 */
export function StatTiles({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const { current, days } = data;
  const today = days[0];

  const tiles: Tile[] = [
    {
      icon: Thermometer,
      label: "체감온도",
      value: formatTemp(current.feels, unit),
      note:
        current.feels - current.temp >= 1
          ? "실제보다 덥게 느껴져요"
          : current.temp - current.feels >= 1
            ? "실제보다 춥게 느껴져요"
            : "실제 기온과 비슷해요",
      tint: "text-orange-500 dark:text-orange-300",
    },
    {
      icon: Umbrella,
      label: "강수확률",
      value: `${today?.pop ?? 0}%`,
      note: (today?.pop ?? 0) >= 60 ? "우산을 챙기세요" : "오늘 최대 기준",
      tint: "text-sky-600 dark:text-sky-300",
    },
    {
      icon: Droplets,
      label: "습도",
      value: `${Math.round(current.humidity)}%`,
      note:
        current.humidity >= 70 ? "습해요" : current.humidity <= 30 ? "건조해요" : "쾌적해요",
      tint: "text-cyan-600 dark:text-cyan-300",
    },
    {
      icon: Wind,
      label: "바람",
      value: `${Math.round(current.wind)} km/h`,
      note: current.wind >= 30 ? "바람이 강해요" : current.wind >= 15 ? "조금 불어요" : "잔잔해요",
      tint: "text-teal-600 dark:text-teal-300",
    },
    {
      icon: Sun,
      label: "자외선",
      value: `${Math.round(today?.uv ?? 0)}`,
      note: uvLevel(today?.uv ?? 0),
      tint: "text-amber-500 dark:text-amber-300",
    },
    {
      icon: Sunrise,
      label: "일출 · 일몰",
      value: today ? formatClock(today.sunrise) : "--:--",
      note: today ? `일몰 ${formatClock(today.sunset)}` : "--:--",
      tint: "text-violet-500 dark:text-violet-300",
    },
  ];

  return (
    <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((tile, i) => {
        const Icon = i === 5 ? Sunrise : tile.icon;
        return (
          <Card
            key={tile.label}
            className="glass wx-rise border-border/50 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <CardContent className="flex h-full flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className={`size-4 ${tile.tint}`} />
                {tile.label}
              </span>
              <strong className="text-2xl leading-tight font-semibold tabular-nums">
                {tile.value}
              </strong>
              <span className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                {i === 5 && <Sunset className="size-3.5" />}
                {tile.note}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
