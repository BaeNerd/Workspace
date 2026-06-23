import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STATS = [
  { value: "124", label: "등록 프로젝트" },
  { value: "38", label: "참여 부서" },
  { value: "61", label: "기술 스택" },
  { value: "9", label: "비즈니스 도메인" },
];

// TODO: 실제 연동 시 GET /api/v1/projects?sort=recent&limit=6 으로 교체
const RECENT_PROJECTS = [
  { id: "PRJ-2025-038", title: "통합 정산 자동화 시스템", dept: "재무팀", stack: ["Python", "Airflow", "PostgreSQL"], status: "운영 중", domain: "재무/회계" },
  { id: "PRJ-2025-070", title: "고객 문의 분류 ML 모델", dept: "고객서비스팀", stack: ["Python", "FastAPI", "AWS"], status: "개발 중", domain: "고객 서비스" },
  { id: "PRJ-2025-041", title: "조색 예측 ML 모델", dept: "메이크업연구소", stack: ["Python", "TensorFlow", "AWS"], status: "개발 중", domain: "제조/생산" },
  { id: "PRJ-2025-045", title: "HR 온보딩 자동화 포털", dept: "인사팀", stack: ["React", "Spring Boot"], status: "파일럿", domain: "HR/인사" },
  { id: "PRJ-2025-052", title: "내부 API Gateway 구축", dept: "IT인프라팀", stack: ["Go", "Kubernetes", "AWS"], status: "운영 중", domain: "IT 인프라" },
  { id: "PRJ-2025-063", title: "영업 CRM 고도화", dept: "영업팀", stack: ["TypeScript", "NestJS", "PostgreSQL"], status: "개발 중", domain: "영업/CRM" },
];

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/projects?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/projects");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* HERO */}
      <section style={{
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "88px 32px 80px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color: "#93C5FD", background: "rgba(147,197,253,0.12)",
            border: "1px solid rgba(147,197,253,0.25)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 24,
            textTransform: "uppercase",
          }}>
            Kolmar Project Platform
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 800, color: "#F8FAFC",
            lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            콜마의 기술 자산을<br />한곳에서 연결하세요
          </h1>
          <p style={{
            fontSize: 16, color: "#94A3B8", lineHeight: 1.7,
            marginBottom: 36, fontWeight: 400,
          }}>
            진행 중인 IT 프로젝트를 등록하고, 기술 스택과 담당자를 공유하세요.<br />
            중복 개발을 줄이고 사내 협업 기회를 발굴합니다.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/projects")} style={{
              background: "#2563EB", color: "#fff",
              border: "none", borderRadius: 8,
              padding: "13px 28px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", letterSpacing: "-0.01em",
            }}>
              상세 탐색
            </button>
            <button onClick={() => navigate("/projects/new")} style={{
              background: "transparent", color: "#E2E8F0",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
              padding: "13px 28px", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}>
              프로젝트 등록
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      {/* TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체 */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: "28px 24px", textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid #E2E8F0" : "none",
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH */}
      <section style={{ padding: "48px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <form onSubmit={handleSearchSubmit} style={{ position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="프로젝트명, 기술 스택, 부서명으로 검색하세요"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "15px 52px 15px 20px",
              fontSize: 14, color: "#0F172A",
              background: "#fff",
              border: "1.5px solid #E2E8F0",
              borderRadius: 10,
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            onFocus={e => (e.target.style.borderColor = "#2563EB")}
            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
          />
          <button type="submit" style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            width: 32, height: 32, background: "#2563EB", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "none",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {["Python", "React", "AWS", "ML/AI", "데이터 파이프라인", "운영 중"].map((tag, i) => (
            <span key={i} onClick={() => navigate(`/projects?q=${encodeURIComponent(tag)}`)} style={{
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: "#F1F5F9", color: "#475569",
              padding: "4px 12px", borderRadius: 20,
              border: "1px solid #E2E8F0",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#DBEAFE"; e.currentTarget.style.color = "#1E40AF"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* RECENT PROJECTS */}
      <section style={{ padding: "32px 32px 72px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              최근 등록
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              최신 프로젝트
            </h2>
          </div>
          <span onClick={() => navigate("/projects")} style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, cursor: "pointer", paddingBottom: 2 }}>
            전체 보기 →
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {RECENT_PROJECTS.map((p, i) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#fff",
                border: `1.5px solid ${hovered === i ? "#2563EB" : "#E2E8F0"}`,
                borderRadius: 10, padding: "18px 18px 16px",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: hovered === i ? "0 4px 16px rgba(37,99,235,0.08)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: STATUS_COLOR[p.status]?.bg,
                  color: STATUS_COLOR[p.status]?.color,
                  padding: "2px 8px", borderRadius: 20,
                }}>
                  {p.status}
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.domain}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6, lineHeight: 1.4 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
                {p.dept}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {p.stack.map((s, si) => (
                  <span key={si} style={{
                    fontSize: 10, fontWeight: 600,
                    background: "#F1F5F9", color: "#475569",
                    padding: "2px 7px", borderRadius: 4,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}