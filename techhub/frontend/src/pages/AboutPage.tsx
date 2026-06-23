import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PROBLEMS = [
  { title: "중복 개발", desc: "유사한 기술과 기능을 여러 팀이 따로 만듭니다" },
  { title: "담당자 확인 부담", desc: "누가 무엇을 담당하는지 찾는 데 시간과 노력이 듭니다" },
  { title: "온보딩 지연", desc: "신규 구성원이 기존 자산을 파악하기 어렵습니다" },
  { title: "기술 현황 파악 불가", desc: "조직 차원에서 보유 기술을 파악할 수 없습니다" },
];

const FEATURES = [
  { step: "01", title: "등록", desc: "진행 중인 프로젝트를 4단계 폼으로 간단히 등록 신청합니다." },
  { step: "02", title: "검토", desc: "관리자가 내용을 검토하고 분류를 정리한 뒤 승인합니다." },
  { step: "03", title: "탐색", desc: "전 임직원이 검색과 필터로 필요한 프로젝트를 찾습니다." },
  { step: "04", title: "연결", desc: "담당자에게 바로 연락하거나 업데이트를 받아봅니다." },
];

const CORE_VALUES = [
  { title: "역할 단순화", desc: "User / Admin 2단계로 누구나 쉽게 참여합니다" },
  { title: "신뢰 구조", desc: "관리자 검토를 거쳐 게시되는 검증된 정보만 노출됩니다" },
  { title: "유연한 분류", desc: "고정 분류와 자유 태그를 함께 운영해 빠짐없이 담아냅니다" },
  { title: "기술 확산", desc: "그룹 및 사내 전체로 검증된 기술과 노하우를 퍼뜨립니다" },
  { title: "알림 연동", desc: "Microsoft Teams와 이메일로 진행 상황을 바로 전달합니다" },
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
          흩어진 기술을 한곳으로,<br />중복을 줄이고 협업을 늘립니다
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
          Kolmar Tech Hub는 그룹 IT 프로젝트를 등록·탐색·연결하는 사내 플랫폼입니다.
        </p>
      </section>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 32px" }}>

        {/* 문제 정의 */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>왜 필요한가</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10,
                padding: "18px 16px", borderTop: "3px solid #EF4444",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 작동 방식 */}
        <div style={{ marginBottom: 48 }}>
          <SectionLabel>어떻게 작동하는가</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ position: "relative", padding: "0 14px" }}>
                {i < FEATURES.length - 1 && (
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

        {/* 핵심 가치 — 5개 그리드 카드형 */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>핵심 가치</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {CORE_VALUES.map((v, i) => (
              <div key={i} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10,
                padding: "18px 14px", borderTop: "3px solid #2563EB",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{v.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2 — 풀와이드 배너 */}
        <div style={{ background: "#0F172A", borderRadius: 10, padding: "24px 28px", marginBottom: 48 }}>
          <SectionLabel small dark>다음 단계 (Phase 2)</SectionLabel>
          <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.8 }}>
            "이런 기능을 만들고 싶은데 참고할 게 있나?"처럼 자연어로 질문하면,
            그룹과 사내에 이미 존재하는 유사 프로젝트를 추천해주는
            <strong style={{ color: "#93C5FD" }}> RAG 기반 검색</strong>을 준비하고 있습니다.
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