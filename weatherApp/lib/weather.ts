// Open-Meteo 날씨 데이터 처리 (API 키 불필요)
// 문서: https://open-meteo.com/en/docs

export type Unit = "C" | "F";

export type City = {
  id: string;
  name: string;
  admin?: string;
  country?: string;
  lat: number;
  lon: number;
};

/** 처음 접속했을 때 기본으로 들어있는 즐겨찾기 도시 */
export const DEFAULT_CITIES: City[] = [
  { id: "1846266", name: "제주시", admin: "제주특별자치도", country: "대한민국", lat: 33.5097, lon: 126.5219 },
  { id: "1835848", name: "서울", admin: "서울특별시", country: "대한민국", lat: 37.5665, lon: 126.978 },
  { id: "1838524", name: "부산", admin: "부산광역시", country: "대한민국", lat: 35.1028, lon: 129.0403 },
];

/** 날씨 아이콘 종류 (lucide 아이콘과 1:1로 연결됨) */
export type IconKey =
  | "sun"
  | "moon"
  | "cloud-sun"
  | "cloud-moon"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

/** 배경 그라데이션 테마 */
export type WxTheme =
  | "clear-day"
  | "clear-night"
  | "cloud-day"
  | "cloud-night"
  | "rain"
  | "snow"
  | "fog"
  | "storm";

type CodeInfo = { label: string; icon: IconKey; theme: WxTheme };

/** WMO 날씨 코드 → 한국어 설명 (낮/밤에 따라 아이콘·배경이 달라짐) */
export function describeCode(code: number, isDay: boolean): CodeInfo {
  const day = isDay;
  switch (code) {
    case 0:
      return { label: "맑음", icon: day ? "sun" : "moon", theme: day ? "clear-day" : "clear-night" };
    case 1:
      return { label: "대체로 맑음", icon: day ? "sun" : "moon", theme: day ? "clear-day" : "clear-night" };
    case 2:
      return { label: "구름 조금", icon: day ? "cloud-sun" : "cloud-moon", theme: day ? "cloud-day" : "cloud-night" };
    case 3:
      return { label: "흐림", icon: "cloud", theme: day ? "cloud-day" : "cloud-night" };
    case 45:
    case 48:
      return { label: "안개", icon: "fog", theme: "fog" };
    case 51:
      return { label: "약한 이슬비", icon: "drizzle", theme: "rain" };
    case 53:
      return { label: "이슬비", icon: "drizzle", theme: "rain" };
    case 55:
      return { label: "강한 이슬비", icon: "drizzle", theme: "rain" };
    case 56:
    case 57:
      return { label: "어는 이슬비", icon: "drizzle", theme: "rain" };
    case 61:
      return { label: "약한 비", icon: "rain", theme: "rain" };
    case 63:
      return { label: "비", icon: "rain", theme: "rain" };
    case 65:
      return { label: "강한 비", icon: "rain", theme: "rain" };
    case 66:
    case 67:
      return { label: "어는 비", icon: "rain", theme: "rain" };
    case 71:
      return { label: "약한 눈", icon: "snow", theme: "snow" };
    case 73:
      return { label: "눈", icon: "snow", theme: "snow" };
    case 75:
      return { label: "많은 눈", icon: "snow", theme: "snow" };
    case 77:
      return { label: "싸락눈", icon: "snow", theme: "snow" };
    case 80:
      return { label: "약한 소나기", icon: "rain", theme: "rain" };
    case 81:
      return { label: "소나기", icon: "rain", theme: "rain" };
    case 82:
      return { label: "강한 소나기", icon: "rain", theme: "rain" };
    case 85:
    case 86:
      return { label: "소낙눈", icon: "snow", theme: "snow" };
    case 95:
      return { label: "뇌우", icon: "storm", theme: "storm" };
    case 96:
    case 99:
      return { label: "우박을 동반한 뇌우", icon: "storm", theme: "storm" };
    default:
      return { label: "정보 없음", icon: day ? "sun" : "moon", theme: day ? "clear-day" : "clear-night" };
  }
}

export type HourPoint = {
  time: string; // "2026-08-05T15:00"
  temp: number; // ℃
  pop: number; // 강수확률 %
  code: number;
  isDay: boolean;
};

export type DayPoint = {
  date: string; // "2026-08-05"
  code: number;
  max: number; // ℃
  min: number; // ℃
  pop: number; // 강수확률 %
  sunrise: string;
  sunset: string;
  uv: number;
};

export type AirPoint = {
  pm25: number | null;
  pm10: number | null;
};

export type WeatherBundle = {
  city: City;
  fetchedAt: number;
  timezone: string;
  current: {
    time: string;
    temp: number;
    feels: number;
    humidity: number;
    wind: number; // km/h
    code: number;
    isDay: boolean;
  };
  hours: HourPoint[]; // 지금부터 24시간
  days: DayPoint[]; // 오늘부터 7일
  air: AirPoint;
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
  return (await res.json()) as T;
}

/** 도시 이름으로 검색 (한국어 우선) */
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const url = `${GEO_URL}?${new URLSearchParams({
    name: q,
    count: "6",
    language: "ko",
    format: "json",
  })}`;

  type GeoRes = {
    results?: Array<{
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    }>;
  };

  const data = await getJson<GeoRes>(url, signal);
  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    admin: r.admin1,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

/** 한 도시의 현재·시간별·주간 날씨 + 미세먼지를 한 번에 가져오기 */
export async function fetchWeather(city: City, signal?: AbortSignal): Promise<WeatherBundle> {
  const common = { latitude: String(city.lat), longitude: String(city.lon), timezone: "auto" };

  const forecastUrl = `${FORECAST_URL}?${new URLSearchParams({
    ...common,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    forecast_days: "7",
  })}`;

  const airUrl = `${AIR_URL}?${new URLSearchParams({
    ...common,
    current: "pm10,pm2_5",
  })}`;

  type ForecastRes = {
    timezone: string;
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      is_day: number;
      weather_code: number;
      wind_speed_10m: number;
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: (number | null)[];
      weather_code: number[];
      is_day: number[];
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: (number | null)[];
      sunrise: string[];
      sunset: string[];
      uv_index_max: (number | null)[];
    };
  };

  type AirRes = { current?: { pm10?: number | null; pm2_5?: number | null } };

  // 미세먼지는 실패해도 날씨는 보여준다
  const [forecast, air] = await Promise.all([
    getJson<ForecastRes>(forecastUrl, signal),
    getJson<AirRes>(airUrl, signal).catch(() => ({ current: undefined }) as AirRes),
  ]);

  // 현재 시각에 해당하는 시간별 예보 위치를 찾아 24개만 자른다
  const nowKey = forecast.current.time.slice(0, 13); // "2026-08-05T15"
  let start = forecast.hourly.time.findIndex((t) => t.slice(0, 13) === nowKey);
  if (start < 0) start = forecast.hourly.time.findIndex((t) => t >= forecast.current.time);
  if (start < 0) start = 0;

  const hours: HourPoint[] = forecast.hourly.time
    .slice(start, start + 24)
    .map((time, i) => ({
      time,
      temp: forecast.hourly.temperature_2m[start + i],
      pop: forecast.hourly.precipitation_probability[start + i] ?? 0,
      code: forecast.hourly.weather_code[start + i],
      isDay: forecast.hourly.is_day[start + i] === 1,
    }));

  const days: DayPoint[] = forecast.daily.time.map((date, i) => ({
    date,
    code: forecast.daily.weather_code[i],
    max: forecast.daily.temperature_2m_max[i],
    min: forecast.daily.temperature_2m_min[i],
    pop: forecast.daily.precipitation_probability_max[i] ?? 0,
    sunrise: forecast.daily.sunrise[i],
    sunset: forecast.daily.sunset[i],
    uv: forecast.daily.uv_index_max[i] ?? 0,
  }));

  return {
    city,
    fetchedAt: Date.now(),
    timezone: forecast.timezone,
    current: {
      time: forecast.current.time,
      temp: forecast.current.temperature_2m,
      feels: forecast.current.apparent_temperature,
      humidity: forecast.current.relative_humidity_2m,
      wind: forecast.current.wind_speed_10m,
      code: forecast.current.weather_code,
      isDay: forecast.current.is_day === 1,
    },
    hours,
    days,
    air: { pm25: air.current?.pm2_5 ?? null, pm10: air.current?.pm10 ?? null },
  };
}

/* ── 표시용 변환 함수들 ─────────────────────────────────── */

export function convertTemp(celsius: number, unit: Unit): number {
  return unit === "C" ? celsius : celsius * (9 / 5) + 32;
}

/** 12 → "12°" */
export function formatTemp(celsius: number, unit: Unit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`;
}

/** "2026-08-05T15:00" → "오후 3시" */
export function formatHour(iso: string): string {
  const h = Number(iso.slice(11, 13));
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}시`;
}

/** "2026-08-05T06:12" → "06:12" */
export function formatClock(iso: string): string {
  return iso.slice(11, 16);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-08-05" → { label: "수", sub: "8/5", isToday: true } */
export function describeDate(dateStr: string, todayStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const isToday = dateStr === todayStr;
  return {
    label: isToday ? "오늘" : WEEKDAYS[date.getDay()],
    sub: `${m}/${d}`,
    isToday,
    weekday: date.getDay(),
  };
}

/** 자외선 지수 → 한국어 단계 */
export function uvLevel(uv: number): string {
  if (uv < 3) return "낮음";
  if (uv < 6) return "보통";
  if (uv < 8) return "높음";
  if (uv < 11) return "매우 높음";
  return "위험";
}

export type Grade = { label: string; color: string; ratio: number };

/** 초미세먼지(PM2.5) 한국 환경부 4단계 */
export function pm25Grade(v: number | null): Grade | null {
  if (v == null) return null;
  const ratio = Math.min(v / 100, 1);
  if (v <= 15) return { label: "좋음", color: "var(--wx-good)", ratio };
  if (v <= 35) return { label: "보통", color: "var(--wx-normal)", ratio };
  if (v <= 75) return { label: "나쁨", color: "var(--wx-bad)", ratio };
  return { label: "매우 나쁨", color: "var(--wx-worst)", ratio };
}

/** 미세먼지(PM10) 한국 환경부 4단계 */
export function pm10Grade(v: number | null): Grade | null {
  if (v == null) return null;
  const ratio = Math.min(v / 200, 1);
  if (v <= 30) return { label: "좋음", color: "var(--wx-good)", ratio };
  if (v <= 80) return { label: "보통", color: "var(--wx-normal)", ratio };
  if (v <= 150) return { label: "나쁨", color: "var(--wx-bad)", ratio };
  return { label: "매우 나쁨", color: "var(--wx-worst)", ratio };
}

/** 배경 그라데이션 정의 (테마별 CSS background 값) */
export const THEME_GRADIENT: Record<WxTheme, string> = {
  "clear-day":
    "linear-gradient(180deg, #6db6ec 0%, #9dd2f6 38%, #c8e7fb 70%, #eff7fd 100%)",
  "clear-night":
    "linear-gradient(180deg, #070c1c 0%, #101c3d 45%, #1d2f5e 75%, #2c4372 100%)",
  "cloud-day":
    "linear-gradient(180deg, #93a9bd 0%, #b3c4d3 40%, #d3dee6 72%, #f0f4f7 100%)",
  "cloud-night":
    "linear-gradient(180deg, #0d1220 0%, #1b2436 45%, #2a3547 75%, #3a4759 100%)",
  rain: "linear-gradient(180deg, #253749 0%, #38546d 42%, #547691 74%, #7d9db3 100%)",
  snow: "linear-gradient(180deg, #a8bbcb 0%, #c4d3de 40%, #dde7ee 72%, #f4f8fa 100%)",
  fog: "linear-gradient(180deg, #a9afb8 0%, #c2c7cd 42%, #d9dcdf 74%, #f1f2f4 100%)",
  storm:
    "linear-gradient(180deg, #14161f 0%, #262b3b 42%, #3b4256 74%, #565e75 100%)",
};

/** 이 테마가 어두운 배경인지 (다크모드 자동 전환용) */
export const THEME_IS_DARK: Record<WxTheme, boolean> = {
  "clear-day": false,
  "clear-night": true,
  "cloud-day": false,
  "cloud-night": true,
  rain: true,
  snow: false,
  fog: false,
  storm: true,
};
