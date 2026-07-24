import type { CSSProperties } from "react";

/* ============================================================
   디자인 토큰 (단일 소스)
   ------------------------------------------------------------
   LandingPage의 색 체계를 기준으로 삼은 전 화면 공용 토큰.
   중립색·주조색 드리프트를 구조적으로 막기 위해, 화면 코드는
   인라인 hex 리터럴 대신 이 모듈을 참조한다.
   styles/layout.ts(CONTENT_MAX_WIDTH)와 동일 위치·성격.
   ============================================================ */

// ── 색 (globals.css의 CSS 변수를 리터럴로 정의) ──
export const COLOR = {
  primary: "#2D73F4",
  primaryHover: "#1E5FD8",
  primaryWeak: "#E7F0FF",
  text: "#1F2937",
  text2: "#4B5563",
  text3: "#9CA3AF",
  border: "#E5E7EB",
  bgSubtle: "#F3F5F7",
  page: "#FAFBFF",
} as const;

// ── 원본 .whShadow-box 그림자 ──
export const SHADOW = "2.5px 4.33px 29px 0px rgba(0,0,0,0.06)";

// ── 카드 기본형 ──
export const cardBase: CSSProperties = { background: "#fff", borderRadius: 16, boxShadow: SHADOW };

// ── 폰트 변수 (globals.css의 CSS 변수) ──
export const headingFont = "var(--font-heading)";
export const landingFont = "var(--font-landing)";
export const uiFont = "var(--font-ui)";
