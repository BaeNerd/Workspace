import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";

// 랜딩 상단 지표 (사용자 효용 중심 — "지금 쓸 수 있는가 / 살아있는가").
// 집계 기준: 전수(visible 무관). visible 토글은 목록·상세의 접근 제어에만 적용하며,
//   랜딩 집계 숫자까지 가리면 목록과의 정합성 혼란만 생기므로 그룹 전체 규모를 그대로 노출한다.
// TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체.
//   값 기준: 전체 등록물 208(프로젝트 124 + 플랫폼 84) /
//            바로 쓸 수 있는 도구 = 운영 중 플랫폼 항목 수 /
//            이번 달 신규 = 최근 30일 등록(프로젝트+플랫폼 합산).
const STATS: { value: string; label: string; sub: string }[] = [
  { value: "208", label: "전체 등록물", sub: "프로젝트·자동화·AI 통합" },
  { value: "84", label: "바로 쓸 수 있는 도구", sub: "운영 중인 자동화·AI 도구" },
  { value: "14", label: "이번 달 신규", sub: "최근 30일 등록" },
];

// 4번 칸(개인화) — 로그인 사용자의 소속 관계사(코드) 기준 누적 등록 수.
// TODO: 실제 연동 시 GET /api/v1/stats/my-company?company=:code 응답으로 교체.
//   미등록(0건) 관계사는 이 맵에 없으면 0건 + 초대 문구로 자연 처리된다.
const COMPANY_REGISTRATIONS: Record<string, { name: string; count: number }> = {
  KKM: { name: "한국콜마", count: 47 },
  HKINNOEN: { name: "HK이노엔", count: 23 },
  KMBNH: { name: "콜마비앤에이치", count: 0 },
};

// 비로그인 폴백 — 참여 관계사 수(분모 없는 절대값, 천장·서열 없음).
// TODO: 실제 연동 시 GET /api/v1/stats/participating-companies 응답으로 교체.
const PARTICIPATING_COMPANIES = 18;

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

// 랜딩페이지 "최근" 섹션에 보여줄 통합 항목 — Project와 PlatformItem을 같은 모양으로 정규화
type RecentItem = {
  id: string;
  kind: "project" | PlatformId;
  title: string;
  summaryOrDept: string; // Project는 자동 요약, PlatformItem은 summary
  dept: string;
  status: string;
  tags: string[];
  updated: string;
  likes: number;
  path: string;
};

// TODO: 실제 연동 시 GET /api/v1/projects?sort=recent&limit=4 +
//       GET /api/v1/platform-items?sort=recent&limit=2 를 합쳐서 교체
const RECENT_ITEMS: RecentItem[] = [
  { id: "PRJ-2025-038", kind: "project", title: "통합 정산 자동화 시스템", summaryOrDept: "재무/회계 영역 · 재무팀에서 운영하는 데이터 파이프라인", dept: "재무팀", status: "운영 중", tags: ["Python", "Airflow", "PostgreSQL"], updated: "2025.05.12", likes: 14, path: "/projects/PRJ-2025-038" },
  { id: "PRJ-2025-070", kind: "project", title: "고객 문의 분류 ML 모델", summaryOrDept: "고객 서비스 영역 · 고객서비스팀에서 운영하는 ML/AI 모델", dept: "고객서비스팀", status: "개발 중", tags: ["Python", "FastAPI", "AWS"], updated: "2025.05.28", likes: 9, path: "/projects/PRJ-2025-070" },
  { id: "PRJ-2025-041", kind: "project", title: "조색 예측 ML 모델", summaryOrDept: "제조/생산 영역 · 메이크업연구소에서 운영하는 ML/AI 모델", dept: "메이크업연구소", status: "개발 중", tags: ["Python", "TensorFlow", "AWS"], updated: "2025.06.01", likes: 21, path: "/projects/PRJ-2025-041" },
  { id: "N8N-001", kind: "n8n", title: "신규 입사자 계정 자동 생성", summaryOrDept: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", dept: "IT인프라팀", status: "운영 중", tags: ["HR", "계정자동화", "온보딩"], updated: "2025.06.05", likes: 19, path: "/n8n/N8N-001" },
  { id: "AST-001", kind: "assistant", title: "법무 검토 보조 봇", summaryOrDept: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", dept: "법무팀", status: "운영 중", tags: ["법무", "계약서검토", "위험분석"], updated: "2025.06.10", likes: 25, path: "/assistant/AST-001" },
  { id: "AIO-002", kind: "ai-orchestration", title: "Claude (문서 분석 특화)", summaryOrDept: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델", dept: "IT개발팀", status: "운영 중", tags: ["문서분석", "긴컨텍스트", "법무"], updated: "2025.06.12", likes: 27, path: "/ai-orchestration/AIO-002" },
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])),
};

const HeartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

// 통계 셀 (모듈 레벨 — 4개 칸 공통 사용). last=true면 우측 구분선 제거.
function StatCell({ value, label, sub, last }: { value: string; label: string; sub: string; last?: boolean }) {
  return (
    <div style={{
      padding: "28px 24px", textAlign: "center",
      borderRight: last ? "none" : "1px solid #E2E8F0",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, lineHeight: 1.4 }}>
        {sub}
      </div>
    </div>
  );
}

// 4번 칸 (개인화) — 로그인 시 소속 관계사 누적 등록, 비로그인 시 참여 관계사로 폴백.
function MyCompanyStatCell() {
  const { user } = useAuth();

  if (!user) {
    return (
      <StatCell
        value={String(PARTICIPATING_COMPANIES)}
        label="참여 관계사"
        sub="그룹 전반에서 활용 중"
        last
      />
    );
  }

  const reg = COMPANY_REGISTRATIONS[user.company];
  const count = reg?.count ?? 0;
  const companyName = reg?.name ?? user.company;

  return (
    <StatCell
      value={String(count)}
      label="우리 회사 등록"
      sub={count === 0 ? `${companyName} · 첫 등록을 남겨보세요` : `${companyName} 누적`}
      last
    />
  );
}

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
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* HERO — AboutPage와 동일 규격 (패딩 72/64, 그라디언트, 글로우, 배지) */}
      <section style={{
        background: "linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)",
        padding: "72px 32px 64px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* 배경 장식 — 은은한 방사형 글로우 (AboutPage 동일) */}
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 640, height: 640, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0) 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            color: "#93C5FD", background: "rgba(147, 197, 253, 0.12)",
            border: "1px solid rgba(147, 197, 253, 0.25)",
            borderRadius: 20, padding: "5px 16px",
            textTransform: "uppercase",
          }}>
            Kolmar Group · AX Platform
          </div>

          {/* 메인 타이틀 — AboutPage와 동일하게 화이트 위계 적용 */}
          <h1 style={{
            fontSize: 40, fontWeight: 800, color: "#F8FAFC",
            lineHeight: 1.5, letterSpacing: "-0.03em", marginBottom: 18,
          }}>
            콜마의 기술 자산을<br />한곳에서 연결하세요
          </h1>
          <p style={{
            fontSize: 15, color: "#94A3B8", lineHeight: 1.7,
            marginBottom: 32, fontWeight: 400,
          }}>
            진행 중인 IT 프로젝트부터 n8n 워크플로우, AI 에이전트, AI 모델까지<br />
            한 곳에서 검색하고 연결하세요. 중복 개발을 줄이고 협업 기회를 발굴합니다.
          </p>

          <form onSubmit={handleSearchSubmit} style={{ maxWidth: 480, margin: "0 auto 24px", position: "relative" }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="프로젝트, 워크플로우, AI 모델 검색"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "13px 90px 13px 18px",
                fontSize: 14, color: "#0F172A",
                background: "#fff", border: "none",
                borderRadius: 8, outline: "none",
                boxShadow: "0 10px 30px rgba(2, 6, 23, 0.35)",
              }}
            />
            <button type="submit" style={{
              position: "absolute", right: 5, top: 5, bottom: 5,
              background: "#2563EB", color: "#fff", border: "none",
              borderRadius: 6, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              검색
            </button>
          </form>

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
      {/* TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체 (전수 기준, visible 무관) */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {STATS.map((s, i) => (
            <StatCell key={i} value={s.value} label={s.label} sub={s.sub} />
          ))}
          <MyCompanyStatCell />
        </div>
      </section>

      {/* RECENT — Project + PlatformItem 통합 */}
      <section style={{ padding: "48px 32px 72px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              최근 등록
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              최신 프로젝트 · 자동화 · AI 도구
            </h2>
          </div>
          <span onClick={() => navigate("/projects")} style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, cursor: "pointer", paddingBottom: 2 }}>
            전체 보기 →
          </span>
        </div>

        {/* 범례 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          {Object.entries(SOURCE_STYLE).map(([key, s]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748B" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
              {s.label}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {RECENT_ITEMS.map((item, i) => {
            const sourceStyle = SOURCE_STYLE[item.kind];
            const sideColor = hovered === i ? sourceStyle.color : "#E2E8F0";

            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "#fff",
                  // border 축약형 + borderTop 동시 지정 시 React 스타일 경고가 발생하므로 4면을 분해해 지정
                  borderTop: `3px solid ${sourceStyle.color}`,
                  borderRight: `1.5px solid ${sideColor}`,
                  borderBottom: `1.5px solid ${sideColor}`,
                  borderLeft: `1.5px solid ${sideColor}`,
                  borderRadius: 10, padding: "15px 17px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                  boxShadow: hovered === i ? `0 6px 18px ${sourceStyle.color}1F` : "0 1px 2px rgba(0,0,0,0.02)",
                  transform: hovered === i ? "translateY(-1px)" : "none",
                  display: "flex", flexDirection: "column",
                  minHeight: 172,
                }}
              >
                {/* 상단 줄: [상태][출처] ........... ♥ 좋아요수 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: STATUS_COLOR[item.status]?.bg,
                      color: STATUS_COLOR[item.status]?.color,
                      padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                    }}>
                      {item.status}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: sourceStyle.bg, color: sourceStyle.color,
                      padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                    }}>
                      {sourceStyle.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94A3B8", flexShrink: 0 }}>
                    <HeartIcon />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                  </div>
                </div>

                {/* 제목 */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6, lineHeight: 1.4,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {item.title}
                </div>

                {/* 요약 1줄 */}
                <div style={{
                  fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 12,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {item.summaryOrDept}
                </div>

                {/* 태그 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {item.tags.slice(0, 3).map((t, ti) => (
                    <span key={ti} style={{
                      fontSize: 10, fontWeight: 600,
                      background: "#F1F5F9", color: "#475569",
                      padding: "2px 7px", borderRadius: 4,
                    }}>
                      {item.kind === "project" ? t : `#${t}`}
                    </span>
                  ))}
                </div>

                {/* 하단 줄: 업데이트일(좌) ........... 부서명(우) */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: "auto", gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: "#CBD5E1", flexShrink: 0 }}>
                    업데이트 {item.updated}
                  </span>
                  <span style={{
                    fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, textAlign: "right",
                  }}>
                    {item.dept}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}