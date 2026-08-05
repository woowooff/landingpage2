"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchCities, type City } from "@/lib/weather";

/** 도시 이름을 검색해서 고르는 검색창 (300ms 뒤 자동 검색) */
export function CitySearch({ onSelect }: { onSelect: (city: City) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      searchCities(term, controller.signal)
        .then((list) => {
          setResults(list);
          setOpen(true);
        })
        .catch(() => {
          /* 입력 중 취소된 요청은 무시 */
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // 바깥을 클릭하면 결과 목록 닫기
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(city: City) {
    onSelect(city);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) choose(results[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="도시 검색 (예: 제주, 서울, Tokyo)"
        aria-label="도시 검색"
        className="glass h-10 rounded-full border-border/60 pr-9 pl-9 shadow-sm"
      />
      {loading ? (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}

      {open && (
        <ul
          role="listbox"
          className="glass absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/60 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">검색 결과가 없어요</li>
          ) : (
            results.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => choose(city)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-accent"
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{city.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[city.admin, city.country].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
