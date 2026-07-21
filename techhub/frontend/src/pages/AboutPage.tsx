import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";

/* ============================================================
   디자인 토큰 (모듈 레벨)
   ============================================================ */

const T = {
  ink: "#0B1220",
  slate700: "#334155",
  slate500: "#697386",
  slate400: "#94A3B8",
  line: "#EBEEF3",
  blue: "#1C6BFF",
  blueDeep: "#1D4ED8",
  surface: "#FFFFFF",
  canvas: "#F4F6F9",
  radiusLg: 16,
  radiusMd: 12,
  shadowCard: "0 1px 2px rgba(11, 18, 32, 0.04), 0 8px 24px rgba(11, 18, 32, 0.05)",
  shadowHover: "0 2px 4px rgba(11, 18, 32, 0.05), 0 16px 36px rgba(11, 18, 32, 0.10)",
} as const;

/** 호버·모션은 인라인 스타일로 불가하므로 클래스 1회 주입 (모듈 레벨 상수) */
const GLOBAL_CSS = `
  .axab-lift { transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s cubic-bezier(.2,.8,.2,1); }
  .axab-lift:hover { transform: translateY(-3px); box-shadow: ${T.shadowHover}; }
  .axab-type:hover .axab-arrow { opacity: 1; transform: translateX(0); }
  .axab-arrow { opacity: 0; transform: translateX(-4px); transition: opacity .18s ease, transform .18s ease; }
  .axab-cta-primary { transition: transform .18s ease, box-shadow .18s ease; }
  .axab-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(28, 107, 255, .38); }
  .axab-cta-ghost { transition: border-color .18s ease, color .18s ease; }
  .axab-cta-ghost:hover { border-color: #94A3B8 !important; }
`;

/* ============================================================
   데이터 정의 (모듈 레벨)
   ============================================================ */

const HERO_FACTS = [
  { k: "29", v: "개 관계사" },
  { k: "7", v: "가지 자산 유형" },
];

const PROBLEM_SOLUTION = [
  {
    no: "01",
    icon: "scatter",
    problem: "흩어진 자산",
    problemDesc: "29개 관계사의 자동화·AI 자산이 어디에 무엇이 있는지 알 수 없습니다.",
    solution: "한곳에 모은 카탈로그",
    solutionDesc: "그룹의 모든 자동화·AI 도구를 하나의 지도에서 탐색합니다.",
  },
  {
    no: "02",
    icon: "duplicate",
    problem: "중복 개발",
    problemDesc: "여러 팀이 이미 있는 기능을 모른 채 다시 만듭니다.",
    solution: "먼저 찾고, 재사용",
    solutionDesc: "등록하기 전에 검색하고, 있는 것은 그대로 가져다 씁니다.",
  },
  {
    no: "03",
    icon: "question",
    problem: "무엇을 써야 할지 모름",
    problemDesc: "AI 모델과 도구가 많아질수록 선택은 더 어려워집니다.",
    solution: "질문에 답하는 콘텐츠",
    solutionDesc: "\u201C나는 어떤 Agent를 써야 할까\u201D에 카탈로그가 직접 답합니다.",
  },
  {
    no: "04",
    icon: "share",
    problem: "사례의 단절",
    problemDesc: "옆 회사의 좋은 활용법이 우리 팀까지 오지 않습니다.",
    solution: "우수 사례 전파",
    solutionDesc: "프롬프트 원문과 제작기를 그대로 따라 쓸 수 있게 공유합니다.",
  },
];

const GROUP_LABEL: Record<PlatformId, string> = {
  n8n: "자동화도구",
  pa: "자동화도구",
  assistant: "AI Agent (LLM)",
  "ai-orchestration": "AI Agent (LLM)",
  ml: "ML",
  vibe: "VIBE",
  etc: "AI 프로젝트",
};

const TYPE_ONELINE: Record<PlatformId, string> = {
  n8n: "사내 n8n 서버에서 상시 실행되는 워크플로우 자동화",
  pa: "Microsoft 환경(클라우드·개인 PC)에서 실행되는 자동화",
  assistant: "HK GPT 모델에 프롬프트를 입혀 만든, 복사해 쓸 수 있는 맞춤 비서",
  "ai-orchestration": "\u201C나는 어떤 모델을 써야 할까\u201D에 답하는 AI 모델 카탈로그",
  ml: "독립적으로 개발·운영되는 머신러닝·통계 모델",
  vibe: "AI 코딩 도구로 직원이 직접 만든 프로그램",
  etc: "팀에서 구축한 AI 시스템·서비스 사례를 블로그 형식으로 소개",
};

const CONCEPT_CARDS = [
  {
    q: "나는 어떤 Agent를\n써야 할까?",
    type: "AI Agent",
    desc: "모델별로 무엇을 잘하는지, 한 번 쓰면 얼마나 드는지 — 처리 가능한 글 분량, 1회 사용량, 비용 등급으로 비교해 답합니다.",
  },
  {
    q: "이런 프롬프트를 쓰니\n편하더라",
    type: "나만의 비서",
    desc: "그대로 복사해 바로 쓸 수 있는 프롬프트 원문과, 어떤 Agent를 썼고 어떤 환경이 필요한지까지 함께 공유합니다.",
  },
  {
    q: "내가 만든 프로그램을\n공유합니다",
    type: "Vibe Coding",
    desc: "어떤 문제를, 어떤 도구로, 어떻게 해결했는지 — 동료의 제작 이야기를 사례로 소개합니다.",
  },
];

const FLOW_STEPS = [
  { step: "01", title: "탐색", desc: "검색하거나 관계사 × 유형 지도에서 자산을 찾습니다." },
  { step: "02", title: "확인", desc: "상세 페이지에서 사용법을 확인하고 담당자에게 문의합니다." },
  { step: "03", title: "등록", desc: "내 자산을 신청하면 관리자가 검토 후 게시합니다." },
  { step: "04", title: "공유", desc: "좋아요와 게시글로 사용 경험을 나눕니다." },
];

const FAQ_ITEMS = [
  {
    q: "누가 쓸 수 있나요?",
    a: "콜마그룹 임직원 누구나 SSO로 접속해 자유롭게 탐색하고 등록을 신청할 수 있습니다.",
  },
  {
    q: "등록하면 평가에 반영되나요?",
    a: "아니요. 플랫폼의 집계 데이터(절감 시간, 등록 건수 등)는 그룹 현황 파악과 활용 확산을 위한 것이며, 개인·부서 평가 지표로 사용하지 않습니다.",
  },
  {
    q: "무엇이든 등록할 수 있나요?",
    a: "일곱 가지 유형에 해당하는 자동화·AI 자산만 다룹니다. 일반 IT 프로젝트, 시스템 구축·개선 과제(MES·SRM·ERP 등), 플랫폼 인프라 구축, BI는 등록 대상이 아닙니다.",
  },
  {
    q: "문의는 어디로 하나요?",
    a: "각 자산 상세 페이지의 담당자 연락처 또는 게시글(Q&A)을 이용해 주세요. AI Agent 카탈로그 관련 문의는 관리자에게 전달됩니다.",
  },
];

/* ============================================================
   모듈 레벨 서브컴포넌트 (페이지 함수 내부 정의 금지)
   ============================================================ */

/** 에디토리얼형 섹션 헤더 — 번호 + 헤어라인 + 좌측 정렬 타이틀 */
function SectionHeading({ index, eyebrow, title, sub }: {
  index: string; eyebrow: string; title: string; sub?: string;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <span style={{
          fontSize: 12, fontWeight: 800, color: T.blue,
          fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em",
        }}>
          {index}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          color: T.slate400, textTransform: "uppercase",
        }}>
          {eyebrow}
        </span>
        <span style={{ flex: 1, height: 1, background: T.line }} />
      </div>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: T.ink,
        letterSpacing: "-0.02em", margin: sub ? "0 0 8px" : 0, lineHeight: 1.3,
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 14, color: T.slate500, margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function WhyIcon({ name }: { name: string }) {
  const common = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
    stroke: "#F87171", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "scatter":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="5" r="2" />
          <circle cx="16" cy="17" r="2.5" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="11" r="1.5" />
        </svg>
      );
    case "duplicate":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "question":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.3a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 2-2.4 3.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="17" cy="6" r="2.5" />
          <circle cx="17" cy="18" r="2.5" />
          <path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6" />
        </svg>
      );
    default:
      return null;
  }
}

/** Problem → Solution 카드 — 좌측 세로 스플릿, 절제된 대비 */
function WhyCard({ item }: { item: (typeof PROBLEM_SOLUTION)[number] }) {
  return (
    <div
      className="axab-lift"
      style={{
        background: T.surface, borderRadius: T.radiusLg, overflow: "hidden",
        borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
        boxShadow: T.shadowCard, display: "flex", flexDirection: "column",
      }}
    >
      {/* PROBLEM 존 */}
      <div style={{
        position: "relative",
        background: "linear-gradient(150deg, #0E1526 0%, #1A2438 100%)",
        padding: "20px 22px 22px",
      }}>
        <div style={{
          position: "absolute", top: 10, right: 18,
          fontSize: 48, fontWeight: 900, color: "rgba(148, 163, 184, 0.10)",
          letterSpacing: "-0.04em", lineHeight: 1, userSelect: "none",
          fontVariantNumeric: "tabular-nums",
        }}>
          {item.no}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(248, 113, 113, 0.10)",
            border: "1px solid rgba(248, 113, 113, 0.22)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <WhyIcon name={item.icon} />
          </div>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#F87171",
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            Problem
          </div>
        </div>
        <div style={{
          fontSize: 16.5, fontWeight: 800, color: "#F4F6F9",
          marginBottom: 6, letterSpacing: "-0.01em", position: "relative",
        }}>
          {item.problem}
        </div>
        <div style={{ fontSize: 12.5, color: "#8C9AB1", lineHeight: 1.65, position: "relative" }}>
          {item.problemDesc}
        </div>
      </div>

      {/* SOLUTION 존 */}
      <div style={{ position: "relative", padding: "22px 22px 22px", flex: 1 }}>
        <div style={{
          position: "absolute", top: 0, left: 22, right: 22, height: 2,
          background: `linear-gradient(90deg, ${T.blue}, rgba(28, 107, 255, 0))`,
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
          <div style={{
            fontSize: 10, fontWeight: 800, color: T.blue,
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            Solution
          </div>
        </div>
        <div style={{ fontSize: 16.5, fontWeight: 800, color: T.ink, marginBottom: 6, letterSpacing: "-0.01em" }}>
          {item.solution}
        </div>
        <div style={{ fontSize: 12.5, color: T.slate500, lineHeight: 1.65 }}>
          {item.solutionDesc}
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ id, color }: { id: PlatformId; color: string }) {
  const common = {
    width: 19, height: 19, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "n8n":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="6" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <path d="M7.4 11l9.2-4M7.4 13l9.2 4" />
        </svg>
      );
    case "pa":
      return (
        <svg {...common}>
          <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
      );
    case "assistant":
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
          <path d="M9 11h.01M13 11h.01M17 11h.01" />
        </svg>
      );
    case "ai-orchestration":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "ml":
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <path d="M5 20v-6M10 20V9M15 20v-9M20 20V5" />
        </svg>
      );
    case "vibe":
      return (
        <svg {...common}>
          <polyline points="8 6 3 12 8 18" />
          <polyline points="16 6 21 12 16 18" />
          <path d="M13 4l-2 16" />
        </svg>
      );
    case "etc":
      return (
        <svg {...common}>
          <path d="M5 3h10l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M15 3v4h4" />
          <path d="M8 12h7M8 16h7" />
        </svg>
      );
    default:
      return null;
  }
}

function TypeCard({ id, name, color, bg, onClick }: {
  id: PlatformId; name: string; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="axab-lift axab-type"
      style={{
        textAlign: "left", background: T.surface, borderRadius: T.radiusMd,
        borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
        padding: "18px 18px 16px", cursor: "pointer",
        boxShadow: T.shadowCard,
        display: "flex", flexDirection: "column", gap: 11, fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <TypeIcon id={id} color={color} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink, letterSpacing: "-0.01em" }}>
            {name}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: T.slate400,
            letterSpacing: "0.08em", marginTop: 3, textTransform: "uppercase",
          }}>
            {GROUP_LABEL[id]}
          </div>
        </div>
        <span className="axab-arrow" style={{ display: "inline-flex", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: T.slate500, lineHeight: 1.65 }}>
        {TYPE_ONELINE[id]}
      </div>
    </button>
  );
}

function ConceptCard({ item, accentIndex }: { item: (typeof CONCEPT_CARDS)[number]; accentIndex: number }) {
  const accents = ["#1C6BFF", "#7C3AED", "#0891B2"];
  const accent = accents[accentIndex % accents.length];
  return (
    <div
      className="axab-lift"
      style={{
        background: T.surface, borderRadius: T.radiusLg,
        borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
        padding: "24px 22px", display: "flex", flexDirection: "column",
        boxShadow: T.shadowCard, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}, ${accent}00)`,
      }} />
      <div style={{
        fontSize: 40, fontWeight: 900, color: accent, opacity: 0.16,
        lineHeight: 1, marginBottom: 4, userSelect: "none",
        fontFamily: "Georgia, serif",
      }}>
        &ldquo;
      </div>
      <div style={{
        fontSize: 17, fontWeight: 800, color: T.ink, lineHeight: 1.45,
        letterSpacing: "-0.01em", marginBottom: 12, whiteSpace: "pre-line", flex: 1,
      }}>
        {item.q}
      </div>
      <div style={{
        alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, color: accent,
        background: `${accent}12`, borderRadius: 12, padding: "3px 10px", marginBottom: 10,
      }}>
        {item.type}
      </div>
      <div style={{ fontSize: 12.5, color: T.slate500, lineHeight: 1.7 }}>
        {item.desc}
      </div>
    </div>
  );
}

function FaqRow({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${T.line}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", textAlign: "left", background: "transparent", border: "none",
          padding: "18px 4px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: 12, fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: open ? T.blue : T.ink, transition: "color .15s ease" }}>
          {q}
        </span>
        <span style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: open ? T.blue : "#F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .18s ease",
        }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={open ? "#fff" : T.slate400} strokeWidth="2.4" strokeLinecap="round"
            style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform .18s ease" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 4px 20px", fontSize: 13, color: T.slate500, lineHeight: 1.8, maxWidth: 640 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   페이지 본체
   ============================================================ */

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: T.canvas, minHeight: "100vh", color: T.ink, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>

      <Navbar />

      {/* HERO — 라이트 톤, 도트 그리드 텍스처 */}
      <section style={{
        background: "#FFFFFF",
        padding: "76px 32px 0", textAlign: "center",
        position: "relative", overflow: "hidden",
        borderBottom: `1px solid ${T.line}`,
      }}>
        {/* 도트 그리드 배경 */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(28, 107, 255, 0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
            color: T.blue, background: "rgba(28, 107, 255, 0.06)",
            border: "1px solid rgba(28, 107, 255, 0.18)", borderRadius: 20,
            padding: "6px 16px", marginBottom: 26, textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue }} />
            Kolmar Group
          </div>

          <div style={{
            fontSize: 46, fontWeight: 900, color: T.ink,
            letterSpacing: "-0.035em", lineHeight: 1.14, marginBottom: 18,
          }}>
            그룹의 자동화·AI 자산,
            <br />
            <span style={{
              background: `linear-gradient(100deg, ${T.blue}, #0891B2)`,
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              AX Platform
            </span>
            에서 만나세요
          </div>

          <p style={{
            fontSize: 15, color: T.slate500, lineHeight: 1.75,
            maxWidth: 520, margin: "0 auto 32px",
          }}>
            누가, 무엇을, 어떻게 쓰고 있는지 — 탐색하고, 따라 쓰고,
            내 것을 공유하는 그룹 단일 카탈로그입니다.
          </p>

          <div style={{ marginBottom: 44 }}>
            <button
              onClick={() => navigate("/projects")}
              className="axab-cta-primary"
              style={{
                background: T.blue, color: "#fff", border: "none", borderRadius: 9,
                padding: "13px 30px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                marginRight: 10, boxShadow: "0 4px 14px rgba(28, 107, 255, 0.30)",
              }}
            >
              자산 탐색하기
            </button>
            <button
              onClick={() => navigate("/projects/new")}
              className="axab-cta-ghost"
              style={{
                background: "#fff", color: T.ink, borderTop: `1.5px solid ${T.line}`,
                borderRight: `1.5px solid ${T.line}`, borderBottom: `1.5px solid ${T.line}`,
                borderLeft: `1.5px solid ${T.line}`, borderRadius: 9,
                padding: "13px 30px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              내 자산 등록하기
            </button>
          </div>

          {/* 팩트 스트립 */}
          <div style={{
            display: "inline-flex", background: "#FFFFFF",
            borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
            borderLeft: `1px solid ${T.line}`, borderBottom: "none",
            borderRadius: "14px 14px 0 0", overflow: "hidden",
            boxShadow: "0 -2px 16px rgba(11, 18, 32, 0.04)",
          }}>
            {HERO_FACTS.map((f, i) => (
              <div key={i} style={{
                padding: "16px 34px 18px",
                borderLeft: i === 0 ? "none" : `1px solid ${T.line}`,
              }}>
                <span style={{
                  fontSize: 24, fontWeight: 900, color: T.ink,
                  letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
                }}>
                  {f.k}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.slate500, marginLeft: 5 }}>
                  {f.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "72px 32px 56px", width: "100%", boxSizing: "border-box" }}>

        {/* 01 — 왜 AX Platform인가 */}
        <div style={{ marginBottom: 88 }}>
          <SectionHeading
            index="01"
            eyebrow="Why AX Platform"
            title="왜 AX Platform인가요?"
            sub="현장의 네 가지 문제를, 네 가지 방식으로 해결합니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {PROBLEM_SOLUTION.map((ps) => (
              <WhyCard key={ps.no} item={ps} />
            ))}
          </div>
        </div>

        {/* 02 — 무엇을 다루나 */}
        <div style={{ marginBottom: 88 }}>
          <SectionHeading
            index="02"
            eyebrow="What We Cover"
            title="무엇을 다루나요?"
            sub={"자산은 기술이 아니라 \u201C쓰려면 어디로 가야 하는가\u201D를 기준으로 나눕니다."}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 14 }}>
            {PLATFORMS.map((p) => (
              <TypeCard
                key={p.id}
                id={p.id}
                name={p.name}
                color={p.color}
                bg={p.bg}
                onClick={() => navigate(`/projects?platform=${p.id}`)}
              />
            ))}
          </div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "#FFFFFF", borderTop: `1px dashed #CBD5E1`,
            borderRight: `1px dashed #CBD5E1`, borderBottom: `1px dashed #CBD5E1`,
            borderLeft: `1px dashed #CBD5E1`, borderRadius: 10,
            padding: "14px 16px", fontSize: 12.5, color: T.slate500, lineHeight: 1.7,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.slate400} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="9" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>
              <strong style={{ color: T.slate700, fontWeight: 700 }}>다루지 않는 것</strong>
              &nbsp;— 일반 IT 프로젝트, 시스템 구축·개선 과제(MES·SRM·ERP 등), 플랫폼 인프라 구축, BI
            </span>
          </div>
        </div>

        {/* 03 — 질문에서 출발하는 콘텐츠 */}
        <div style={{ marginBottom: 88 }}>
          <SectionHeading
            index="03"
            eyebrow="Content Concept"
            title="질문에서 출발합니다"
            sub="모든 콘텐츠는 여러분이 실제로 품는 질문에 답하는 형식입니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {CONCEPT_CARDS.map((c, i) => (
              <ConceptCard key={i} item={c} accentIndex={i} />
            ))}
          </div>
        </div>

        {/* 04 — 어떻게 이용하나 */}
        <div style={{ marginBottom: 88 }}>
          <SectionHeading
            index="04"
            eyebrow="How It Works"
            title="어떻게 이용하나요?"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative", marginBottom: 18 }}>
            <div style={{
              position: "absolute", top: 25, left: "12.5%", right: "12.5%", height: 2,
              background: `linear-gradient(90deg, ${T.blue}, #93C5FD)`,
              opacity: 0.35, zIndex: 0,
            }} />
            {FLOW_STEPS.map((f, i) => (
              <div key={i} style={{ position: "relative", padding: "0 14px" }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: T.surface, color: T.blue,
                  borderTop: `2px solid ${T.blue}`, borderRight: `2px solid ${T.blue}`,
                  borderBottom: `2px solid ${T.blue}`, borderLeft: `2px solid ${T.blue}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, margin: "0 auto 16px",
                  position: "relative", zIndex: 1, fontVariantNumeric: "tabular-nums",
                  boxShadow: "0 2px 10px rgba(28, 107, 255, 0.14)",
                }}>
                  {f.step}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: T.slate500, lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: T.slate400 }}>
            AI Agent 유형은 관리자가 카탈로그로 직접 관리합니다.
          </div>
        </div>

        {/* 05 — FAQ */}
        <div style={{ marginBottom: 72 }}>
          <SectionHeading index="05" eyebrow="FAQ" title="자주 묻는 질문" />
          <div style={{
            background: T.surface, borderRadius: T.radiusLg, padding: "6px 22px",
            borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
            borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
            boxShadow: T.shadowCard,
          }}>
            {FAQ_ITEMS.map((f, i) => (
              <FaqRow key={i} q={f.q} a={f.a} isLast={i === FAQ_ITEMS.length - 1} />
            ))}
          </div>
        </div>

        {/* CTA — Next Phase 통합 배너 */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #0E1526 0%, #14213B 60%, #16324F 100%)",
          borderRadius: 18, padding: "42px 36px", textAlign: "center",
          boxShadow: "0 12px 32px rgba(11, 18, 32, 0.22)",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(rgba(147, 197, 253, 0.14) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 60% 90% at 50% 100%, #000 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 90% at 50% 100%, #000 20%, transparent 100%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F4F6F9", letterSpacing: "-0.015em", marginBottom: 10 }}>
              지금 우리 회사의 자산부터 둘러보세요
            </div>
            <div style={{ fontSize: 13.5, color: "#93A5C0", marginBottom: 26, lineHeight: 1.7 }}>
              이미 만들어진 도구가 여러분을 기다리고 있습니다.
              <br />
              곧 <strong style={{ color: "#93C5FD", fontWeight: 700 }}>AX 검색 AI</strong>가 질문만으로 가장 적합한 자산과 담당자를 찾아드립니다.
            </div>
            <button
              onClick={() => navigate("/projects")}
              className="axab-cta-primary"
              style={{
                background: "#FFFFFF", color: T.blueDeep, border: "none", borderRadius: 9,
                padding: "13px 32px", fontSize: 14, fontWeight: 800, cursor: "pointer",
              }}
            >
              자산 탐색하기
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}