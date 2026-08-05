import { NextResponse } from "next/server";

/**
 * 날씨 비서 챗봇 (Google Gemini).
 *
 * 이 파일은 "서버에서만" 실행된다. API 키는 브라우저로 절대 내려가지 않는다.
 * 키는 로컬은 .env.local, 배포는 Vercel 환경변수(GEMINI_API_KEY)에 넣는다.
 */

const MODEL = "gemini-3.5-flash-lite"; // 가장 빠르고 저렴한 등급 (무료 등급 사용 가능)
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 무료 등급을 넘지 않도록 스스로 거는 안전장치
const LIMIT_PER_USER_PER_DAY = 30;
const LIMIT_TOTAL_PER_DAY = 300;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 10;

type ChatMessage = { role: "user" | "model"; text: string };

// 서버 메모리에 그날 사용량만 기록 (서버가 재시작되면 초기화된다 — 가벼운 방지턱)
const usage = new Map<string, { day: string; count: number }>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function overLimit(key: string, limit: number) {
  const day = todayKey();
  const found = usage.get(key);
  if (!found || found.day !== day) {
    usage.set(key, { day, count: 1 });
    return false;
  }
  if (found.count >= limit) return true;
  found.count += 1;
  return false;
}

const SYSTEM_PROMPT = `너는 날씨 앱 안에 사는 '날씨 비서'야. 한국어로 답한다.

말투 — 옆자리 친구처럼 편하고 다정하게:
- 정중하지만 딱딱하지 않은 해요체를 쓴다. ("~예요", "~해요", "~하시면 좋아요")
- 답 첫머리에 가벼운 공감이나 반응을 한마디 얹어도 좋다. (예: "오늘 진짜 덥겠어요!", "아침엔 좀 쌀쌀하겠네요.")
- 설명서처럼 나열하지 말고, 말하듯이 자연스럽게.
- 이모지는 한 답변에 1개까지만.

지켜야 할 규칙:
1. 아래 [날씨 정보]에 있는 숫자만 근거로 답한다. 없는 정보는 지어내지 말고 "그건 지금 화면에 없는 정보예요"라고 솔직히 말한다.
2. 답은 짧게. 2~4문장.
3. 숫자만 읊지 말고 '그래서 뭘 하면 좋은지'까지 말해 준다. (예: "낮에 31도까지 올라가요. 반팔에 모자 하나 챙기시면 딱 좋겠어요.")
4. 날씨와 상관없는 질문(코딩, 뉴스, 개인 상담 등)은 부드럽게 사양하고 날씨 쪽 질문을 제안한다.`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "아직 챗봇 열쇠(API 키)가 설정되지 않았어요. 설치 안내를 확인해 주세요." },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_HISTORY) : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  if (!lastUser || !lastUser.text.trim()) {
    return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }
  if (lastUser.text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `질문이 너무 길어요. ${MAX_MESSAGE_LENGTH}자 안으로 줄여 주세요.` },
      { status: 400 },
    );
  }

  // 사용량 제한 (한 사람 / 전체)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (overLimit(`ip:${ip}`, LIMIT_PER_USER_PER_DAY)) {
    return NextResponse.json(
      { error: "오늘은 여기까지예요. 내일 다시 물어봐 주세요. (하루 사용 제한)" },
      { status: 429 },
    );
  }
  if (overLimit("all", LIMIT_TOTAL_PER_DAY)) {
    return NextResponse.json(
      { error: "오늘 챗봇 사용량을 모두 썼어요. 내일 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  const context = (body.context ?? "").slice(0, 2000);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${SYSTEM_PROMPT}\n\n[날씨 정보]\n${context}` }],
        },
        contents: messages.map((m) => ({
          role: m.role === "model" ? "model" : "user",
          parts: [{ text: m.text.slice(0, MAX_MESSAGE_LENGTH) }],
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
      // 너무 오래 기다리지 않게
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini 오류:", res.status, detail.slice(0, 500));

      if (res.status === 429) {
        return NextResponse.json(
          { error: "무료 사용량을 다 썼어요. 잠시 후(또는 내일) 다시 시도해 주세요." },
          { status: 429 },
        );
      }
      if (res.status === 400 || res.status === 403) {
        return NextResponse.json(
          { error: "챗봇 열쇠(API 키)에 문제가 있어요. 키가 맞는지 확인해 주세요." },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { error: "챗봇이 잠시 대답하지 못했어요. 잠시 후 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return NextResponse.json(
        { error: "답변을 만들지 못했어요. 다르게 물어봐 주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("챗봇 요청 실패:", err);
    return NextResponse.json(
      { error: "챗봇 연결에 실패했어요. 인터넷 상태를 확인해 주세요." },
      { status: 502 },
    );
  }
}
