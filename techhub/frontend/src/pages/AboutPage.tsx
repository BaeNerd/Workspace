import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";

/* ============================================================
   데이터 정의 (모듈 레벨)
   ============================================================ */

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
    problemDesc: "AI 모델과 도구가 많아질수록 선택이 더 어려워집니다.",
    solution: "질문에 답하는 콘텐츠",
    solutionDesc: "\"나는 어떤 Agent를 써야 할까\"에 카탈로그가 직접 답합니다.",
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
};

const TYPE_ONELINE: Record<PlatformId, string> = {
  n8n: "사내 n8n 서버에서 상시 실행되는 워크플로우 자동화",
  pa: "Microsoft 환경(클라우드·개인 PC)에서 실행되는 자동화",
  assistant: "HK GPT 모델에 프롬프트를 입혀 만든, 복사해 쓸 수 있는 맞춤 비서",
  "ai-orchestration": "\"나는 어떤 모델을 써야 할까\"에 답하는 AI 모델 카탈로그",
  ml: "독립적으로 개발·운영되는 머신러닝·통계 모델",
  vibe: "AI 코딩 도구로 직원이 직접 만든 프로그램",
};

const CONCEPT_CARDS = [
  {
    q: "나는 어떤 Agent를 써야 할까?",
    type: "AI Agent",
    desc: "모델별로 무엇을 잘하는지, 한 번 쓰면 얼마나 드는지(처리 가능한 글 분량 · 1회 사용량 · 비용 등급)를 비교해 답합니다.",
  },
  {
    q: "이런 프롬프트를 쓰니 편하더라",
    type: "나만의 비서",
    desc: "그대로 복사해 바로 쓸 수 있는 프롬프트 원문과, 어떤 Agent를 썼고 어떤 환경이 필요한지까지 함께 공유합니다.",
  },
  {
    q: "내가 만든 프로그램을 공유합니다",
    type: "Vibe Coding",
    desc: "어떤 문제를, 어떤 도구로, 어떻게 해결했는지 — 동료의 제작 이야기를 사례로 소개합니다.",
  },
];

const STATUS_STEPS = [
  // TODO: 상태 통일 작업(platformTypes.ts STATUS_ORDER/STATUS_COLOR) 반영 시 공용 상수로 교체
  { label: "사용 가능", desc: "지금 바로 쓸 수 있어요", fg: "#059669", bg: "#ECFDF5", bd: "#A7F3D0" },
  { label: "준비 중", desc: "개발·테스트 중이에요", fg: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
  { label: "일부 제한", desc: "조건부로 쓸 수 있어요", fg: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
  { label: "사용 중지", desc: "더 이상 운영하지 않아요", fg: "#DC2626", bg: "#FEF2F2", bd: "#FECACA" },
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
    a: "여섯 가지 유형에 해당하는 자동화·AI 자산만 다룹니다. 일반 IT 프로젝트, 시스템 구축·개선 과제(MES·SRM·ERP 등), 플랫폼 인프라 구축, BI는 등록 대상이 아닙니다.",
  },
  {
    q: "문의는 어디로 하나요?",
    a: "각 자산 상세 페이지의 담당자 연락처 또는 게시글(Q&A)을 이용해 주세요. AI Agent 카탈로그 관련 문의는 관리자에게 전달됩니다.",
  },
];

/* ============================================================
   모듈 레벨 서브컴포넌트 (페이지 함수 내부 정의 금지)
   ============================================================ */

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <div style={{
        display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
        color: "#2563EB", textTransform: "uppercase", marginBottom: 12,
      }}>
        {eyebrow}
      </div>
      <h2 style={{
        fontSize: 28, fontWeight: 800, color: "#0F172A",
        letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.3,
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.7 }}>{sub}</p>
      )}
    </div>
  );
}

function WhyIcon({ name }: { name: string }) {
  const common = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
    stroke: "#FCA5A5", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
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

function WhyCard({ item }: { item: (typeof PROBLEM_SOLUTION)[number] }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: "1.5px solid #E2E8F0",
      boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        position: "relative",
        background: "linear-gradient(150deg, #0F172A 0%, #1E293B 100%)",
        padding: "22px 22px 26px",
      }}>
        <div style={{
          position: "absolute", top: 8, right: 16,
          fontSize: 56, fontWeight: 900, color: "rgba(148, 163, 184, 0.14)",
          letterSpacing: "-0.04em", lineHeight: 1, userSelect: "none",
        }}>
          {item.no}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(239, 68, 68, 0.14)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <WhyIcon name={item.icon} />
          </div>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "#F87171",
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            Problem
          </div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#F8FAFC", marginBottom: 6, letterSpacing: "-0.01em", position: "relative" }}>
          {item.problem}
        </div>
        <div style={{ fontSize: 12.5, color: "#94A3B8", lineHeight: 1.65, position: "relative" }}>
          {item.problemDesc}
        </div>
      </div>

      <div style={{ position: "relative", height: 0 }}>
        <div style={{
          position: "absolute", left: "50%", top: -17, transform: "translateX(-50%)",
          width: 34, height: 34, borderRadius: "50%",
          background: "#2563EB", border: "3px solid #fff",
          boxShadow: "0 3px 10px rgba(37, 99, 235, 0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <polyline points="6 14 12 20 18 14" />
          </svg>
        </div>
      </div>

      <div style={{
        background: "linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)",
        padding: "28px 22px 22px", flex: 1,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: "#2563EB",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Solution
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.01em" }}>
          {item.solution}
        </div>
        <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65 }}>
          {item.solutionDesc}
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ id, color }: { id: PlatformId; color: string }) {
  const common = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
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
      style={{
        textAlign: "left", background: "#fff", borderRadius: 12,
        borderTop: "1.5px solid #E2E8F0", borderRight: "1.5px solid #E2E8F0",
        borderBottom: "1.5px solid #E2E8F0", borderLeft: `4px solid ${color}`,
        padding: "18px 18px 16px", cursor: "pointer",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        display: "flex", flexDirection: "column", gap: 10, fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <TypeIcon id={id} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>{name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.06em", marginTop: 2 }}>
            {GROUP_LABEL[id]}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{TYPE_ONELINE[id]}</div>
    </button>
  );
}

function ConceptCard({ item }: { item: (typeof CONCEPT_CARDS)[number] }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12,
      padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10,
      boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
    }}>
      <div style={{
        alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, color: "#2563EB",
        background: "#EFF6FF", borderRadius: 12, padding: "3px 10px",
      }}>
        {item.type}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
        "{item.q}"
      </div>
      <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>{item.desc}</div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", textAlign: "left", background: "transparent", border: "none",
          padding: "16px 18px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: 12, fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s ease" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px", fontSize: 12.5, color: "#475569", lineHeight: 1.75 }}>
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
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* HERO — 라이트 톤 (랜딩과 통일) */}
      <section style={{
        background: "linear-gradient(165deg, #EFF6FF 0%, #FFFFFF 55%, #F0FDFA 100%)",
        padding: "68px 32px 60px", textAlign: "center",
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid #E2E8F0",
      }}>
        <div style={{
          position: "absolute", top: -140, left: "50%", transform: "translateX(-50%)",
          width: 680, height: 680, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.10) 0%, rgba(37, 99, 235, 0) 62%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            color: "#2563EB", background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.2)", borderRadius: 20,
            padding: "5px 16px", marginBottom: 22, textTransform: "uppercase",
          }}>
            Kolmar Group · AX Platform
          </div>

          <div style={{
            fontSize: 42, fontWeight: 900, color: "#0F172A",
            letterSpacing: "-0.03em", lineHeight: 1.18, marginBottom: 14,
          }}>
            콜마그룹 AX Platform
          </div>

          <h1 style={{
            fontSize: 19, fontWeight: 700, color: "#334155",
            letterSpacing: "-0.01em", margin: "0 0 14px", lineHeight: 1.55,
          }}>
            그룹의 자동화·AI 자산을 한곳에 모은 카탈로그입니다
          </h1>

          <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 30px" }}>
            누가, 무엇을, 어떻게 쓰고 있는지 — 탐색하고, 따라 쓰고, 내 것을 공유하세요.
          </p>

          <div>
            <button onClick={() => navigate("/projects")} style={{
              background: "#2563EB", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              marginRight: 10, boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
            }}>
              자산 탐색하기
            </button>
            <button onClick={() => navigate("/projects/new")} style={{
              background: "#fff", color: "#0F172A", border: "1.5px solid #E2E8F0", borderRadius: 8,
              padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              내 자산 등록하기
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 32px 48px" }}>

        {/* 왜 AX Platform인가 — Problem → Solution 2×2 */}
        <div style={{ marginBottom: 64 }}>
          <SectionHeading
            eyebrow="Why AX Platform"
            title="왜 AX Platform인가요?"
            sub="현장의 네 가지 문제를, 네 가지 방식으로 해결합니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {PROBLEM_SOLUTION.map((ps) => (
              <WhyCard key={ps.no} item={ps} />
            ))}
          </div>
        </div>

        {/* 무엇을 다루나 — 4대 그룹 · 6가지 유형 */}
        <div style={{ marginBottom: 64 }}>
          <SectionHeading
            eyebrow="What We Cover"
            title="무엇을 다루나요?"
            sub={"자산은 기술이 아니라 \"쓰려면 어디로 가야 하는가\"를 기준으로 나눕니다."}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 16 }}>
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
            background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "14px 18px", fontSize: 12.5, color: "#64748B", lineHeight: 1.7,
          }}>
            <strong style={{ color: "#475569" }}>이런 것은 다루지 않아요</strong> — 일반 IT 프로젝트,
            시스템 구축·개선 과제(MES·SRM·ERP 등), 플랫폼 인프라 구축, BI
          </div>
        </div>

        {/* 질문에서 출발하는 콘텐츠 */}
        <div style={{ marginBottom: 64 }}>
          <SectionHeading
            eyebrow="Content Concept"
            title="질문에서 출발합니다"
            sub="모든 콘텐츠는 여러분이 실제로 품는 질문에 답하는 형식입니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {CONCEPT_CARDS.map((c, i) => (
              <ConceptCard key={i} item={c} />
            ))}
          </div>
        </div>

        {/* 상태는 신호등처럼 */}
        <div style={{ marginBottom: 64 }}>
          <SectionHeading
            eyebrow="Status"
            title="상태는 신호등처럼"
            sub="모든 자산의 상태는 네 가지로 통일되어 있어 한눈에 판단할 수 있습니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {STATUS_STEPS.map((s) => (
              <div key={s.label} style={{
                background: s.bg, border: `1.5px solid ${s.bd}`, borderRadius: 12,
                padding: "16px 14px", textAlign: "center",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 800, color: s.fg, marginBottom: 6,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.fg, display: "inline-block" }} />
                  {s.label}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 어떻게 이용하나 — 탐색→확인→등록→공유 */}
        <div style={{ marginBottom: 56 }}>
          <SectionHeading
            eyebrow="How It Works"
            title="어떻게 이용하나요?"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", top: 26, left: "12.5%", right: "12.5%", height: 2, background: "#E2E8F0", zIndex: 0 }} />
            {FLOW_STEPS.map((f, i) => (
              <div key={i} style={{ position: "relative", padding: "0 14px" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", background: "#2563EB", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, margin: "0 auto 16px", position: "relative", zIndex: 1,
                }}>
                  {f.step}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
            AI Agent 유형은 관리자가 카탈로그로 직접 관리합니다.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 56 }}>
          <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ_ITEMS.map((f, i) => (
              <FaqRow key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>

        {/* Phase 2 예고 */}
        <div style={{ background: "#0F172A", borderRadius: 12, padding: "22px 24px", marginBottom: 48 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#93C5FD",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
          }}>
            Next Phase
          </div>
          <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.8 }}>
            <strong style={{ color: "#93C5FD" }}>AX 검색 AI</strong>가 도입될 예정입니다.
            질문만으로 가장 적합한 자산과 담당자를 즉시 찾아드립니다.
          </div>
        </div>

        {/* CTA 배너 */}
        <div style={{
          background: "linear-gradient(120deg, #2563EB 0%, #1D4ED8 55%, #0891B2 100%)",
          borderRadius: 14, padding: "34px 28px", textAlign: "center",
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.25)",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 8 }}>
            지금 우리 회사의 자산부터 둘러보세요
          </div>
          <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)", marginBottom: 22, lineHeight: 1.6 }}>
            이미 만들어진 도구가 여러분을 기다리고 있습니다.
          </div>
          <button onClick={() => navigate("/projects")} style={{
            background: "#fff", color: "#1D4ED8", border: "none", borderRadius: 8,
            padding: "12px 30px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}>
            자산 탐색하기
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}