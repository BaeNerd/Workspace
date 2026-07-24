import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";

/* ============================================================
   GuidePage (/guide) — 이용 가이드
   ------------------------------------------------------------
   처음 쓰는 직원 기준의 안내 페이지. 코드/기술 용어는 배제하고,
   왜 AX Platform인가(인트로) + ① 시작하기 ② 등록 가이드 ③ 승인 절차
   ④ 자주 묻는 질문으로 구성. 구 소개 화면(USR-02)의 "왜 AX Platform"
   섹션을 흡수했다(USR-02 폐지·결번, 2026-07).
   콘텐츠 근거: docs/AX-Platform-화면별-기획설명서.md · 등록/승인 실제 흐름.
   디자인 토큰·서브컴포넌트는 모듈 레벨 단일 체계로 맞춤.
   ============================================================ */

// 중립·주조색은 styles/tokens.ts(COLOR) 단일 소스로 승격. surface(#fff)·blueDeep(승인 슬롯 의미색)는 구조/의미색이라 리터럴 유지.
const T = {
  ink: COLOR.text,
  slate700: COLOR.text2,
  slate500: COLOR.text2,
  slate400: COLOR.text3,
  line: COLOR.border,
  blue: COLOR.primary,
  blueDeep: "#1D4ED8",
  surface: "#FFFFFF",
  canvas: COLOR.page,
  radiusLg: 16,
  radiusMd: 12,
  shadowCard: "0 1px 2px rgba(11, 18, 32, 0.04), 0 8px 24px rgba(11, 18, 32, 0.05)",
  shadowHover: "0 2px 4px rgba(11, 18, 32, 0.05), 0 16px 36px rgba(11, 18, 32, 0.10)",
} as const;

const GLOBAL_CSS = `
  .axg-lift { transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s cubic-bezier(.2,.8,.2,1); }
  .axg-lift:hover { transform: translateY(-3px); box-shadow: ${T.shadowHover}; }
  .axg-cta-primary { transition: transform .18s ease, box-shadow .18s ease; }
  .axg-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(28, 107, 255, .38); }
  @media (max-width: 860px) {
    .axg-2col { grid-template-columns: 1fr !important; }
    .axg-start-flow { grid-template-columns: 1fr !important; }
  }
`;

/* ============================================================
   데이터 (모듈 레벨)
   ============================================================ */

// 왜 AX Platform인가 — 구 소개 화면(USR-02)에서 흡수한 Problem→Solution 4조
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
    solutionDesc: "“나는 어떤 AI Model을 써야 할까”에 카탈로그가 직접 답합니다.",
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

// ① 시작하기 — 로그인 → 탐색 → 상세 확인 → 담당자 문의 여정
const START_STEPS = [
  {
    step: "01",
    title: "로그인",
    desc: "회사 계정(SSO)으로 로그인합니다. 별도 가입 절차 없이 임직원이라면 누구나 바로 이용할 수 있어요.",
  },
  {
    step: "02",
    title: "탐색",
    desc: "검색창에 하고 싶은 업무를 입력하거나, 카테고리·업무 도메인 필터로 나에게 맞는 자동화·AI 자산을 찾습니다.",
  },
  {
    step: "03",
    title: "상세 확인",
    desc: "마음에 드는 항목을 열어 무엇을 해 주는지, 어떻게 쓰는지, 누가 만들었는지를 확인합니다.",
  },
  {
    step: "04",
    title: "담당자 문의",
    desc: "바로 써 볼 수 있는 항목은 접속해서 사용하고, 문의가 필요하면 상세 페이지의 담당자 연락처나 게시글로 물어봅니다.",
  },
];

// ② 등록 가이드 — 3단계 절차
const REGISTER_STEPS = [
  {
    step: "01",
    title: "유형 선택",
    desc: "내가 만든 자산이 일곱 가지 유형 중 어디에 해당하는지 고릅니다. 유형에 따라 다음 단계에서 물어보는 내용이 달라집니다.",
  },
  {
    step: "02",
    title: "정보 입력",
    desc: "제목·요약·설명 같은 기본 정보와 유형별 세부 내용, 담당자 정보를 채웁니다. 화면 사진을 함께 올리면 이해가 훨씬 쉬워집니다.",
  },
  {
    step: "03",
    title: "최종 확인",
    desc: "입력한 내용을 한 번에 훑어보고 등록을 신청합니다. 신청 후에는 관리자 검토(승인 절차)를 거쳐 게시됩니다.",
  },
];

// 카테고리별 입력 팁 (코드 용어 최소화, 처음 등록하는 직원 눈높이)
const REGISTER_TIPS = [
  { label: "n8n 워크플로우", tip: "만든 워크플로우 파일(JSON)을 함께 올리면 동료가 그대로 가져다 쓰기 쉬워요." },
  { label: "Power Automate", tip: "플로우가 동작하는 화면 사진(스크린샷)을 첨부하면 어떤 흐름인지 한눈에 전달됩니다." },
  { label: "나만의 비서", tip: "실제로 쓴 프롬프트 원문을 공유하면 동료가 복사해 바로 활용할 수 있어요." },
  { label: "AI Model", tip: "이 유형은 관리자가 카탈로그로 직접 관리합니다. 활용 사례·후기로 참여해 주세요." },
  { label: "ML 모델", tip: "무엇을 예측·분류하는 모델인지, 어떤 데이터로 학습했는지 쉬운 말로 적어 주세요." },
  { label: "Vibe Coding", tip: "어떤 문제를, 어떤 도구로, 어떻게 해결했는지 제작 이야기를 곁들이면 좋아요." },
  { label: "AI 프로젝트", tip: "팀에서 구축한 사례를 블로그처럼 배경·과정·결과 순서로 소개해 주세요." },
];

// ③ 승인 절차 — 병렬 2슬롯
const APPROVAL_SLOTS = [
  {
    label: "관계사 승인",
    desc: "우리 관계사 관리자가 내용을 확인하고 승인합니다.",
  },
  {
    label: "전사 승인",
    desc: "전사 관리자가 그룹 공용 관점에서 확인하고 승인합니다.",
  },
];

// ④ 자주 묻는 질문 (핵심 문항 — 구 소개 FAQ의 고유 문항 흡수 포함)
const FAQ_ITEMS = [
  {
    q: "누가 쓸 수 있나요?",
    a: "콜마그룹 임직원이라면 누구나 회사 계정(SSO)으로 접속해 자유롭게 탐색하고 등록을 신청할 수 있습니다.",
  },
  {
    q: "등록하면 평가에 반영되나요?",
    a: "아니요. 등록 건수 같은 집계 데이터는 그룹 현황 파악과 활용 확산을 위한 것으로, 개인·부서 평가 지표로 사용하지 않습니다.",
  },
  {
    q: "승인은 얼마나 걸리나요?",
    a: "관계사 승인과 전사 승인 두 가지를 거칩니다. 두 승인은 순서와 상관없이 진행되며, 둘 다 완료되면 게시됩니다. 반려되면 사유를 확인하고 보완해 다시 신청할 수 있어요.",
  },
  {
    q: "무엇이든 등록할 수 있나요?",
    a: "일곱 가지 유형에 해당하는 자동화·AI 자산만 다룹니다. 일반 IT 프로젝트나 시스템 구축·개선 과제(MES·SRM·ERP 등)는 등록 대상이 아닙니다.",
  },
  {
    q: "문의는 어디로 하나요?",
    a: "각 자산 상세 페이지의 담당자 연락처 또는 게시글(Q&A)을 이용해 주세요. AI Model 카탈로그 관련 문의는 관리자에게 전달됩니다.",
  },
];

/* ============================================================
   서브컴포넌트 (모듈 레벨)
   ============================================================ */

function SectionHeading({ index, eyebrow, title, sub }: {
  index?: string; eyebrow: string; title: string; sub?: string;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        {index && (
          <span style={{ fontSize: 12, fontWeight: 800, color: T.blue, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
            {index}
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: T.slate400, textTransform: "uppercase" }}>
          {eyebrow}
        </span>
        <span style={{ flex: 1, height: 1, background: T.line }} />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em", margin: sub ? "0 0 8px" : 0, lineHeight: 1.3 }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 14, color: T.slate500, margin: 0, lineHeight: 1.7, maxWidth: 620 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/** 왜 AX Platform 섹션의 Problem 아이콘 (구 소개 화면에서 이식) */
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

/** Problem → Solution 카드 (구 소개 화면에서 이식, 가이드 톤에 맞춰 lift 클래스만 조정) */
function WhyCard({ item }: { item: (typeof PROBLEM_SOLUTION)[number] }) {
  return (
    <div
      className="axg-lift"
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

/** 번호가 매겨진 절차 카드 (시작하기·등록 가이드 공용) */
function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div
      className="axg-lift"
      style={{
        background: T.surface, borderRadius: T.radiusMd,
        borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
        boxShadow: T.shadowCard, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: "rgba(28, 107, 255, 0.08)",
        color: T.blue, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums",
      }}>
        {step}
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 13, color: T.slate500, lineHeight: 1.7 }}>{desc}</div>
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
          background: open ? T.blue : COLOR.bgSubtle,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "background .18s ease",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={open ? "#fff" : T.slate400} strokeWidth="2.4" strokeLinecap="round"
            style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform .18s ease" }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 4px 20px", fontSize: 13, color: T.slate500, lineHeight: 1.8, maxWidth: 660 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   페이지 본체
   ============================================================ */

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: T.canvas, minHeight: "100vh", color: T.ink, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>

      <Navbar />

      {/* HERO */}
      <section style={{
        background: "#FFFFFF", padding: "68px 32px 0", textAlign: "center",
        position: "relative", overflow: "hidden", borderBottom: `1px solid ${T.line}`,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(28, 107, 255, 0.10) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", paddingBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.16em", color: T.blue, background: "rgba(28, 107, 255, 0.06)",
            border: "1px solid rgba(28, 107, 255, 0.18)", borderRadius: 20, padding: "6px 16px",
            marginBottom: 24, textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue }} />
            User Guide
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: T.ink, letterSpacing: "-0.035em", lineHeight: 1.16, marginBottom: 18 }}>
            AX 플랫폼,
            <br />
            <span style={{ background: `linear-gradient(100deg, ${T.blue}, #0891B2)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              이렇게 이용하세요
            </span>
          </div>
          <p style={{ fontSize: 15, color: T.slate500, lineHeight: 1.75, maxWidth: 520, margin: "0 auto 30px" }}>
            처음 오셨나요? 찾고, 써 보고, 내 것을 나누는 방법을
            단계별로 쉽게 안내해 드립니다.
          </p>
          <div>
            <button
              onClick={() => navigate("/projects")}
              className="axg-cta-primary"
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
        </div>
      </section>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "64px 32px 56px", width: "100%", boxSizing: "border-box" }}>

        {/* 인트로 — 왜 AX Platform인가 (구 소개 화면에서 흡수) */}
        <div style={{ marginBottom: 84 }}>
          <SectionHeading
            eyebrow="Why AX Platform"
            title="왜 AX Platform인가요?"
            sub="현장의 문제를, 한곳에 모으고, 찾고, 질문에 답하고, 좋은 사례를 전파하여 해결합니다"
          />
          <div className="axg-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {PROBLEM_SOLUTION.map((ps) => (
              <WhyCard key={ps.no} item={ps} />
            ))}
          </div>
        </div>

        {/* 01 — 시작하기 */}
        <div style={{ marginBottom: 84 }}>
          <SectionHeading
            index="01"
            eyebrow="Getting Started"
            title="처음이라면, 이 순서대로"
            sub="로그인부터 담당자 문의까지 — 딱 네 단계면 원하는 자산을 찾아 쓸 수 있어요."
          />
          <div className="axg-start-flow" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {START_STEPS.map((s) => (
              <StepCard key={s.step} step={s.step} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>

        {/* 02 — 등록 가이드 */}
        <div style={{ marginBottom: 84 }}>
          <SectionHeading
            index="02"
            eyebrow="How to Register"
            title="내 자산 등록하기"
            sub="세 단계면 끝납니다. 유형을 고르고, 내용을 채우고, 확인해서 신청하면 돼요."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }} className="axg-2col">
            {REGISTER_STEPS.map((s) => (
              <StepCard key={s.step} step={s.step} title={s.title} desc={s.desc} />
            ))}
          </div>

          {/* 카테고리별 입력 팁 */}
          <div style={{
            background: T.surface, borderRadius: T.radiusLg,
            borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
            borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
            boxShadow: T.shadowCard, padding: "22px 24px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.slate700, marginBottom: 16, letterSpacing: "-0.01em" }}>
              유형별 등록 팁
            </div>
            <div className="axg-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 28px" }}>
              {REGISTER_TIPS.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{
                    marginTop: 3, flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: T.blue,
                  }} />
                  <div style={{ fontSize: 13, color: T.slate500, lineHeight: 1.6 }}>
                    <strong style={{ color: T.ink, fontWeight: 700 }}>{t.label}</strong>
                    &nbsp;— {t.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 03 — 승인 절차 */}
        <div style={{ marginBottom: 84 }}>
          <SectionHeading
            index="03"
            eyebrow="Approval"
            title="승인은 어떻게 진행되나요?"
            sub="등록을 신청하면 두 가지 승인을 거칩니다. 두 승인은 순서와 상관없이 진행돼요."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 16 }} className="axg-2col">
            {APPROVAL_SLOTS.map((slot, i) => (
              <div key={slot.label} style={{
                background: T.surface, borderRadius: T.radiusMd,
                borderTop: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
                borderBottom: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`,
                boxShadow: T.shadowCard, padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: i === 0 ? "#FBEEE4" : "#E8F0FE",
                  color: i === 0 ? "#B4602E" : T.blueDeep,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 5 }}>{slot.label}</div>
                  <div style={{ fontSize: 13, color: T.slate500, lineHeight: 1.65 }}>{slot.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "#FFFFFF", borderTop: `1px dashed #CBD5E1`, borderRight: `1px dashed #CBD5E1`,
            borderBottom: `1px dashed #CBD5E1`, borderLeft: `1px dashed #CBD5E1`, borderRadius: 10,
            padding: "14px 16px", fontSize: 12.5, color: T.slate500, lineHeight: 1.7,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.slate400} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" /><path d="M12 16h.01" />
            </svg>
            <span>
              <strong style={{ color: T.slate700, fontWeight: 700 }}>두 승인이 모두 완료되면 게시</strong>
              됩니다. 만약 반려되면 반려 사유가 함께 안내되니, 내용을 보완해 다시 신청하면 돼요.
            </span>
          </div>
        </div>

        {/* 04 — 자주 묻는 질문 */}
        <div style={{ marginBottom: 40 }}>
          <SectionHeading index="04" eyebrow="FAQ" title="자주 묻는 질문" />
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
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}
