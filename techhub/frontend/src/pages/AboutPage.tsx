import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PROBLEMS = [
  { title: "중복 개발", desc: "유사한 기술과 기능을 여러 팀이 따로 만듭니다" },
  { title: "담당자 추적 비용", desc: "누가 무엇을 담당하는지 찾는 데 시간이 듭니다" },
  { title: "온보딩 지연", desc: "신규 구성원이 기존 자산을 파악하기 어렵습니다" },
  { title: "기술 현황 미파악", desc: "조직 차원에서 보유 기술을 알 수 없습니다" },
];

const FEATURES = [
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
          흩어진 기술을 한곳으로,<br />중복을 줄이고 협업을 늘립니다
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
          Kolmar Tech Hub는 사내 IT 프로젝트를 등록·탐색·연결하는 내부 플랫폼입니다.
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

        {/* 핵심 가치 + 로드맵 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "22px 24px" }}>
            <SectionLabel small>핵심 가치</SectionLabel>
            {[
              "역할 단순화 — User / Admin 2단계",
              "관리자 검토 후 게시되는 신뢰 구조",
              "고정 분류 + 자유 태그 병행 운영",
              "Microsoft Teams / 이메일 알림 연동",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#475569", padding: "6px 0", borderTop: i > 0 ? "1px solid #F8FAFC" : "none" }}>
                <span style={{ color: "#2563EB", fontWeight: 700 }}>•</span>{t}
              </div>
            ))}
          </div>
          <div style={{ background: "#0F172A", borderRadius: 10, padding: "22px 24px" }}>
            <SectionLabel small dark>다음 단계 (Phase 2)</SectionLabel>
            <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.8 }}>
              자연어로 "이런 기능을 만들고 싶은데 참고할 게 있나?"라고 질문하면 유사 프로젝트를 추천하는
              <strong style={{ color: "#93C5FD" }}> RAG 기반 검색</strong>을 준비하고 있습니다.
            </div>
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
