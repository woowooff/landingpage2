"use client";

import { Wind } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pm10Grade, pm25Grade, type AirPoint, type Grade } from "@/lib/weather";

function AirRow({
  title,
  sub,
  value,
  grade,
}: {
  title: string;
  sub: string;
  value: number | null;
  grade: Grade | null;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {title} <span className="text-xs text-muted-foreground">{sub}</span>
        </span>
        {grade && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: grade.color }}
          >
            {grade.label}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <strong className="text-2xl font-semibold tabular-nums">
          {value == null ? "--" : Math.round(value)}
        </strong>
        <span className="text-xs text-muted-foreground">㎍/㎥</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.round((grade?.ratio ?? 0) * 100)}%`,
            backgroundColor: grade?.color ?? "transparent",
          }}
        />
      </div>
    </div>
  );
}

/** 미세먼지 카드 (한국 환경부 4단계 기준) */
export function AirCard({ air }: { air: AirPoint }) {
  return (
    <Card className="glass wx-rise h-full gap-3 border-border/50 py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
          <Wind className="size-4 text-teal-600 dark:text-teal-300" />
          미세먼지
        </CardTitle>
        <span className="text-xs text-muted-foreground">한국 환경부 기준 4단계</span>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        <AirRow
          title="초미세먼지"
          sub="PM2.5"
          value={air.pm25}
          grade={pm25Grade(air.pm25)}
        />
        <AirRow title="미세먼지" sub="PM10" value={air.pm10} grade={pm10Grade(air.pm10)} />
        {air.pm25 == null && air.pm10 == null && (
          <p className="text-xs text-muted-foreground">
            이 지역은 미세먼지 정보를 제공하지 않아요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
