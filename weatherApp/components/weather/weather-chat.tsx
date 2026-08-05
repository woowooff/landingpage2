"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWeatherContext, type Unit, type WeatherBundle } from "@/lib/weather";

type Bubble = { role: "user" | "model"; text: string; error?: boolean };

const SUGGESTIONS = ["오늘 뭐 입을까?", "우산 챙겨야 해?", "빨래 널어도 될까?"];

/** 화면 오른쪽 아래에 떠 있는 날씨 비서 챗봇 */
export function WeatherChat({ data, unit }: { data: WeatherBundle; unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 새 말풍선이 생기면 아래로 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // 열면 입력창에 커서, ESC로 닫기
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const history: Bubble[] = [...messages, { role: "user", text: question }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => !m.error)
            .map(({ role, text }) => ({ role, text })),
          context: buildWeatherContext(data, unit),
        }),
      });

      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        json.reply
          ? { role: "model", text: json.reply }
          : { role: "model", text: json.error ?? "잠시 후 다시 시도해 주세요.", error: true },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "연결에 실패했어요. 인터넷 상태를 확인해 주세요.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 떠 있는 버튼 */}
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "날씨 비서 닫기" : "날씨 비서 열기"}
        aria-expanded={open}
        className="fixed right-4 bottom-4 z-50 size-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>

      {/* 채팅창 */}
      {open && (
        <section
          aria-label="날씨 비서"
          className="glass wx-rise fixed right-4 bottom-20 z-50 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border/60 shadow-xl sm:right-6 sm:bottom-24"
        >
          <header className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">날씨 비서</p>
              <p className="truncate text-xs text-muted-foreground">
                {data.city.name}의 날씨를 보고 답해요
              </p>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" role="log">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl rounded-bl-sm border border-border/40 bg-background/60 px-3 py-2 text-sm">
                  안녕하세요! {data.city.name} 날씨를 보고 답해 드릴게요. 뭐가 궁금하세요?
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="flex items-center gap-1 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-xs transition hover:-translate-y-0.5 hover:bg-background/80 active:scale-95"
                    >
                      <Sparkles className="size-3 text-primary" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`wx-rise max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                      : m.error
                        ? "rounded-2xl rounded-bl-sm border border-destructive/40 bg-background/60 text-destructive"
                        : "rounded-2xl rounded-bl-sm border border-border/40 bg-background/60"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <p className="flex gap-1 rounded-2xl rounded-bl-sm border border-border/40 bg-background/60 px-3 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-muted-foreground"
                      style={{ animation: `wx-bob 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/50 px-3 py-3"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="날씨에 대해 물어보세요"
              maxLength={500}
              aria-label="질문 입력"
              className="h-10 rounded-full border-border/60 bg-background/60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="보내기"
              className="size-10 shrink-0 rounded-full"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
