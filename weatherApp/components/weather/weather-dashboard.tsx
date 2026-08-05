"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CloudSun, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AirCard } from "@/components/weather/air-card";
import { CitySearch } from "@/components/weather/city-search";
import { CurrentCard } from "@/components/weather/current-card";
import { DailyList } from "@/components/weather/daily-list";
import { HourlyStrip } from "@/components/weather/hourly-strip";
import { StatTiles } from "@/components/weather/stat-tiles";
import { WeatherBackground } from "@/components/weather/weather-background";
import {
  DEFAULT_CITIES,
  describeCode,
  fetchWeather,
  THEME_IS_DARK,
  type City,
  type Unit,
  type WeatherBundle,
  type WxTheme,
} from "@/lib/weather";

const KEY_CITIES = "wx.cities";
const KEY_ACTIVE = "wx.active";
const KEY_UNIT = "wx.unit";
const MAX_CITIES = 8;

export function WeatherDashboard() {
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_CITIES[0].id);
  const [unit, setUnit] = useState<Unit>("C");
  const [data, setData] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(false); // 저장된 설정을 다 읽었는지

  // 저장해 둔 즐겨찾기·단위 불러오기
  useEffect(() => {
    try {
      const savedCities = localStorage.getItem(KEY_CITIES);
      if (savedCities) {
        const parsed: City[] = JSON.parse(savedCities);
        if (Array.isArray(parsed) && parsed.length > 0) setCities(parsed);
      }
      const savedActive = localStorage.getItem(KEY_ACTIVE);
      if (savedActive) setActiveId(savedActive);
      const savedUnit = localStorage.getItem(KEY_UNIT);
      if (savedUnit === "C" || savedUnit === "F") setUnit(savedUnit);
    } catch {
      /* 저장된 값이 깨졌으면 기본값 사용 */
    }
    setReady(true);
  }, []);

  const active = useMemo(
    () => cities.find((c) => c.id === activeId) ?? cities[0],
    [cities, activeId],
  );

  // 도시가 바뀌면 날씨를 새로 가져온다
  useEffect(() => {
    if (!ready || !active) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchWeather(active, controller.signal)
      .then((bundle) => setData(bundle))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error && err.message.includes("실패")
            ? "날씨 서버에서 정보를 받지 못했어요. 잠시 후 다시 시도해 주세요."
            : "인터넷 연결을 확인한 뒤 새로고침해 주세요.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [ready, active, refreshKey]);

  // 설정 저장
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY_CITIES, JSON.stringify(cities));
    localStorage.setItem(KEY_ACTIVE, activeId);
    localStorage.setItem(KEY_UNIT, unit);
  }, [ready, cities, activeId, unit]);

  // 지금 날씨에 맞는 배경 테마 + 낮/밤 자동 다크모드
  const theme: WxTheme = data
    ? describeCode(data.current.code, data.current.isDay).theme
    : "clear-day";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", THEME_IS_DARK[theme]);
  }, [theme]);

  const addCity = useCallback((city: City) => {
    setCities((prev) => {
      const exists = prev.find((c) => c.id === city.id);
      if (exists) return prev;
      return [...prev, city].slice(-MAX_CITIES);
    });
    setActiveId(city.id);
  }, []);

  const removeCity = useCallback(
    (id: string) => {
      setCities((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId],
  );

  return (
    <div className="relative min-h-dvh">
      <WeatherBackground theme={theme} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        {/* 상단 바 */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="size-6 text-sky-600 dark:text-sky-300" strokeWidth={1.7} />
            <span className="text-lg font-semibold tracking-tight">오늘의 날씨</span>
          </div>

          <div className="flex items-center gap-2">
            <CitySearch onSelect={addCity} />

            <div className="glass flex shrink-0 items-center rounded-full border border-border/60 p-0.5">
              {(["C", "F"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    unit === u
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  °{u}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="새로고침"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="glass shrink-0 rounded-full border border-border/60"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </header>

        {/* 즐겨찾기 도시 */}
        <nav aria-label="즐겨찾기 도시" className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => {
            const on = city.id === active?.id;
            return (
              <span
                key={city.id}
                className={`glass group flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm transition ${
                  on
                    ? "border-foreground/25 bg-background/70 font-semibold"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <button type="button" onClick={() => setActiveId(city.id)} className="py-0.5">
                  {city.name}
                </button>
                {cities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCity(city.id)}
                    aria-label={`${city.name} 삭제`}
                    className="rounded-full p-1 opacity-50 transition hover:bg-foreground/10 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            );
          })}
        </nav>

        {error && (
          <Card className="glass mt-4 border-destructive/40">
            <CardContent className="flex items-center gap-2 p-4 text-sm">
              <AlertCircle className="size-4 text-destructive" />
              {error}
            </CardContent>
          </Card>
        )}

        {data ? (
          <>
            <main className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
              <CurrentCard data={data} unit={unit} />
              <StatTiles data={data} unit={unit} />
            </main>

            <div className="mt-3">
              <HourlyStrip data={data} unit={unit} />
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <DailyList data={data} unit={unit} />
              <AirCard air={data.air} />
            </div>
          </>
        ) : (
          <LoadingSkeleton />
        )}

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          데이터 ·{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Open-Meteo
          </a>{" "}
          (무료 · 비상업용)
        </footer>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
