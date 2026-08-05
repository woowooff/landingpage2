import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "오늘의 날씨 — 24시간 · 7일 예보 · 미세먼지",
  description:
    "여러 도시를 즐겨찾기 해두고 오늘 날씨, 24시간 시간별 예보, 7일 예보, 미세먼지를 한 화면에서 확인하는 날씨 웹앱",
};

export const viewport: Viewport = {
  themeColor: "#6db6ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
