"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { IconKey } from "@/lib/weather";

const ICONS: Record<IconKey, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

/** 아이콘마다 살짝 다른 색 (밝은 화면 / 어두운 화면 각각) */
const TINT: Record<IconKey, string> = {
  sun: "text-amber-500 dark:text-amber-300",
  moon: "text-slate-500 dark:text-slate-200",
  "cloud-sun": "text-amber-500 dark:text-amber-200",
  "cloud-moon": "text-slate-500 dark:text-slate-300",
  cloud: "text-slate-500 dark:text-slate-300",
  fog: "text-slate-400 dark:text-slate-300",
  drizzle: "text-sky-500 dark:text-sky-300",
  rain: "text-sky-600 dark:text-sky-300",
  snow: "text-sky-400 dark:text-sky-200",
  storm: "text-violet-500 dark:text-violet-300",
};

export function WeatherIcon({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return (
    <Icon aria-hidden strokeWidth={1.6} className={cn("shrink-0", TINT[icon], className)} />
  );
}
