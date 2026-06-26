import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PROBLEM_SOLUTION = [
  {
    problem: "중복 개발",
    problemDesc: "여러 팀이 유사한 기능을 반복 개발합니다.",
    solution: "협업 기반 재사용",
    solutionDesc: "기존 자산을 탐색하여 리소스를 최적화합니다.",
  },
  {
    problem: "담당자 확인 부담",
    problemDesc: "프로젝트 담당자를 찾는 데 시간이 소요됩니다.",
    solution: "명확한 책임자 연결",
    solutionDesc: "담당자를 즉시 확인하고 바로 협업합니다.",
  },
  {
    problem: "온보딩 지연",
    problemDesc: "신규 구성원이 자산을 파악하기 어렵습니다.",
    solution: "빠른 온보딩 지원",
    solutionDesc: "체계적인 분류로 자산을 빠르게 학습합니다.",
  },
  {
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

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* HERO */}
      <section style={{
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "64px 32px 56px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          color: "#93C5FD", background: "rgba(147,197,253,0.12)",
          border: "1px solid rgba(147,197,253,0.25)", borderRadius: 20,
          padding: "4px 14px", marginBottom: 20, textTransform: "uppercase",
        }}>
          About Kolmar Tech Hub
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.3 }}>
          그룹 IT 프로젝트를 등록·탐색·연결하여<br />조직의 기술 생산성을 극대화합니다
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
          Kolmar Tech Hub는 콜마그룹 전체의 IT 프로젝트를 한곳에서 등록·탐색·연결하는 내부 플랫폼입니다.
        </p>
      </section>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 32px" }}>

        {/* 왜 Tech Hub인가 — Problem → Solution 매칭 */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>왜 Tech Hub인가요?</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PROBLEM_SOLUTION.map((ps, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", gap: 16,
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px",
              }}>
                {/* PROBLEM */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.06em", marginBottom: 6 }}>PROBLEM</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{ps.problem}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{ps.problemDesc}</div>
                </div>

                {/* ARROW */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
                  </svg>
                </div>

                {/* SOLUTION */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.06em", marginBottom: 6 }}>SOLUTION</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{ps.solution}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{ps.solutionDesc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 어떻게 작동하는가 — 등록→검토→탐색→연결 (유지) */}
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
            <strong style={{ color: "#93C5FD" }}>RAG 기반 AI 검색</strong>이 도입될 예정입니다. 질문만으로 가장 적합한 프로젝트와 담당자를 즉시 찾아드립니다.
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