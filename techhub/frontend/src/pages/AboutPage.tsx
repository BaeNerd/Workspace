import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ============================================================
   데이터 정의
   ============================================================ */

const PROBLEM_SOLUTION = [
  {
    no: "01",
    icon: "duplicate",
    problem: "중복 개발",
    problemDesc: "여러 팀이 유사한 기능을 반복 개발합니다.",
    solution: "협업 기반 재사용",
    solutionDesc: "기존 자산을 탐색하여 리소스를 최적화합니다.",
  },
  {
    no: "02",
    icon: "person",
    problem: "담당자 확인 부담",
    problemDesc: "프로젝트 담당자를 찾는 데 시간이 소요됩니다.",
    solution: "명확한 책임자 연결",
    solutionDesc: "담당자를 즉시 확인하고 바로 협업합니다.",
  },
  {
    no: "03",
    icon: "rocket",
    problem: "온보딩 지연",
    problemDesc: "신규 구성원이 자산을 파악하기 어렵습니다.",
    solution: "빠른 온보딩 지원",
    solutionDesc: "체계적인 분류로 자산을 빠르게 학습합니다.",
  },
  {
    no: "04",
    icon: "eye",
    problem: "기술 현황 파악 불가",
    problemDesc: "조직 내 보유 기술 가시성이 낮습니다.",
    solution: "기술 자산 가시화",
    solutionDesc: "조직의 모든 기술 현황을 한눈에 봅니다.",
  },
];

const CORE_VALUES = [
  {
    title: "신뢰 기반 관리",
    desc: "검증된 정보만 제공합니다.",
    sub: "관리자 검토 후 게시되는 신뢰 구조",
  },
  {
    title: "유연한 분류 체계",
    desc: "표준 분류와 자유 태그를 지원합니다.",
    sub: "고정 분류 + 자유 태그 병행 운영",
  },
  {
    title: "실시간 협업 연동",
    desc: "Teams / 이메일 알림을 제공합니다.",
    sub: "승인·반려·업데이트 즉시 통보",
  },
];

const FLOW_STEPS = [
  { step: "01", title: "등록", desc: "진행 중인 프로젝트를 4단계 폼으로 간단히 등록 신청합니다." },
  { step: "02", title: "검토", desc: "관리자가 내용을 검토하고 분류를 정리한 뒤 승인합니다." },
  { step: "03", title: "탐색", desc: "전 임직원이 검색과 필터로 필요한 프로젝트를 찾습니다." },
  { step: "04", title: "연결", desc: "담당자에게 바로 연락하거나 업데이트를 받아봅니다." },
];

/* ============================================================
   모듈 레벨 서브컴포넌트 (페이지 함수 내부 정의 금지)
   ============================================================ */

function SectionLabel({ children, small, dark }: { children: React.ReactNode; small?: boolean; dark?: boolean }) {
  return (
    <div style={{
      fontSize: small ? 11 : 12, fontWeight: 700,
      color: dark ? "#93C5FD" : "#2563EB",
      letterSpacing: "0.08em", textTransform: "uppercase",
      marginBottom: small ? 12 : 18,
    }}>
      {children}
    </div>
  );
}

/** PPT 슬라이드형 섹션 헤더 — eyebrow + 대형 타이틀 + 서브카피 (중앙 정렬) */
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

/** PROBLEM/SOLUTION 카드용 아이콘 */
function WhyIcon({ name }: { name: string }) {
  const common = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none",
    stroke: "#FCA5A5", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "duplicate":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "person":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="18" cy="8" r="3" />
          <path d="M18 6.8v1.4M18 10.6h.01" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      );
    default:
      return null;
  }
}

/** PPT형 Problem → Solution 카드 (상단 다크 PROBLEM 존 → 화살표 배지 → 하단 SOLUTION 존) */
function WhyCard({ item }: { item: (typeof PROBLEM_SOLUTION)[number] }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: "1.5px solid #E2E8F0",
      boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
      display: "flex", flexDirection: "column",
    }}>
      {/* PROBLEM 존 — 다크 네이비 */}
      <div style={{
        position: "relative",
        background: "linear-gradient(150deg, #0F172A 0%, #1E293B 100%)",
        padding: "22px 22px 26px",
      }}>
        {/* 대형 번호 워터마크 */}
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

      {/* 화살표 배지 — 두 존 경계에 겹쳐 배치 */}
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

      {/* SOLUTION 존 — 라이트 블루 */}
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

/* ============================================================
   페이지 본체
   ============================================================ */

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* HERO — deck 워딩 반영: KOLMAR GROUP · AX PLATFORM / Kolmar Tech Hub */}
      <section style={{
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "72px 32px 64px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* 배경 장식 — 은은한 방사형 글로우 */}
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 640, height: 640, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0) 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            color: "#93C5FD", background: "rgba(147, 197, 253, 0.12)",
            border: "1px solid rgba(147, 197, 253, 0.25)", borderRadius: 20,
            padding: "5px 16px", marginBottom: 22, textTransform: "uppercase",
          }}>
            Kolmar Group · AX Platform
          </div>

          <div style={{
            fontSize: 44, fontWeight: 900, color: "#F8FAFC",
            letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16,
          }}>
            Kolmar Tech Hub
          </div>

          <h1 style={{
            fontSize: 20, fontWeight: 700, color: "#BFDBFE",
            letterSpacing: "-0.01em", margin: "0 0 16px", lineHeight: 1.5,
          }}>
            그룹 IT 프로젝트를 등록·탐색·연결하여<br />조직의 기술 생산성을 극대화합니다
          </h1>

          <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
            Kolmar Tech Hub는 콜마그룹 전체의 IT 프로젝트를 한곳에서 등록·탐색·연결하는 내부 플랫폼입니다.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 32px 48px" }}>

        {/* 왜 Tech Hub인가 — PPT형 Problem → Solution 2×2 그리드 */}
        <div style={{ marginBottom: 64 }}>
          <SectionHeading
            eyebrow="Why Tech Hub"
            title="왜 Tech Hub인가요?"
            sub="현장의 네 가지 문제를, 네 가지 방식으로 해결합니다."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {PROBLEM_SOLUTION.map((ps) => (
              <WhyCard key={ps.no} item={ps} />
            ))}
          </div>
        </div>

        {/* 어떻게 작동하는가 — 등록→검토→탐색→연결 */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>어떻게 작동하는가</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
            {FLOW_STEPS.map((f, i) => (
              <div key={i} style={{ position: "relative", padding: "0 14px" }}>
                {i < FLOW_STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: 22, left: "calc(50% + 30px)", right: -14, height: 2, background: "#E2E8F0" }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: "#2563EB", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, margin: "0 auto 16px", position: "relative", zIndex: 1,
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
        </div>

        {/* 핵심 가치 3개 */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>핵심 가치</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {CORE_VALUES.map((v, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{v.title}</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 10 }}>{v.desc}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>{v.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2 예고 */}
        <div style={{ background: "#0F172A", borderRadius: 10, padding: "22px 24px", marginBottom: 48 }}>
          <SectionLabel dark small>NEXT PHASE</SectionLabel>
          <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.8 }}>
            <strong style={{ color: "#93C5FD" }}>RAG 기반 AI 검색</strong>이 도입될 예정입니다.
            질문만으로 가장 적합한 프로젝트와 담당자를 즉시 찾아드립니다.
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <button onClick={() => navigate("/projects")} style={{
            background: "#2563EB", color: "#fff", border: "none", borderRadius: 8,
            padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginRight: 10,
          }}>
            Tech Hub 둘러보기
          </button>
          <button onClick={() => navigate("/projects/new")} style={{
            background: "#fff", color: "#0F172A", border: "1.5px solid #E2E8F0", borderRadius: 8,
            padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            프로젝트 등록하기
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}