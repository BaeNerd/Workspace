import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId, PlatformItemStatus } from "../types/platformTypes";

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> =
  Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }]));

const DOMAINS = ["영업", "생산", "연구", "재무", "HR", "IT"] as const;
type Domain = typeof DOMAINS[number];

// 도메인 칩 파스텔 컬러 (배경 / 글자)
const DOMAIN_CHIP: Record<Domain, { bg: string; fg: string }> = {
  "영업": { bg: "#FBEEE4", fg: "#B4602E" },
  "생산": { bg: "#E8F0FE", fg: "#2563C9" },
  "연구": { bg: "#E2F5F7", fg: "#0E7490" },
  "재무": { bg: "#E6F5EC", fg: "#1F7A46" },
  "HR":   { bg: "#F0EAFB", fg: "#6D4BC4" },
  "IT":   { bg: "#EDF0F4", fg: "#4B5768" },
};

// 지표 4카드 (v2 그라디언트 스타일)
// TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체
const STAT_CARDS = [
  { value: 208, label: "전체 AX 항목", grad: "linear-gradient(135deg, #FF9F43, #FF7E5F)" },
  { value: 84,  label: "바로 쓸 수 있는 도구", grad: "linear-gradient(135deg, #1C6BFF, #4E9BFF)" },
  { value: 14,  label: "신규 업데이트", grad: "linear-gradient(135deg, #12B8C8, #4ED6E0)" },
  { value: 47,  label: "우리 회사 등록", grad: "linear-gradient(135deg, #22C060, #6FDD97)" },
];

type FeedItem = {
  id: string; kind: PlatformId; title: string; summary: string;
  dept: string; status: PlatformItemStatus; tags: string[]; likes: number; views: number;
  updated: string; path: string; domain: Domain;
};

// TODO: 실제 연동 시 GET /api/v1/platform-items?sort=recent 응답으로 교체
const ALL_ITEMS: FeedItem[] = [
  // n8n
  { id: "N8N-001", kind: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달", dept: "IT인프라팀", status: "사용 가능", tags: ["Outlook", "긴급메일"], likes: 22, views: 420, updated: "2025.07.03", path: "/n8n/N8N-001", domain: "IT" },
  { id: "N8N-002", kind: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림 발송", dept: "구매팀", status: "사용 가능", tags: ["구매", "승인알림", "ERP"], likes: 11, views: 210, updated: "2025.06.08", path: "/n8n/N8N-002", domain: "생산" },
  { id: "N8N-003", kind: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", dept: "재무팀", status: "사용 가능", tags: ["매출리포트", "ERP"], likes: 17, views: 380, updated: "2025.06.12", path: "/n8n/N8N-003", domain: "재무" },
  { id: "N8N-004", kind: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", dept: "품질관리팀", status: "준비 중", tags: ["품질관리", "생산"], likes: 5, views: 180, updated: "2025.06.18", path: "/n8n/N8N-004", domain: "생산" },
  { id: "N8N-005", kind: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD·Teams·이메일 계정을 자동 생성하고 환영 메시지 발송", dept: "IT인프라팀", status: "사용 가능", tags: ["HR", "온보딩", "계정자동화"], likes: 13, views: 290, updated: "2025.07.01", path: "/n8n/N8N-005", domain: "HR" },
  // Power Automate
  { id: "PA-001", kind: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동 보관", dept: "경영지원팀", status: "사용 가능", tags: ["SharePoint", "전자결재"], likes: 18, views: 350, updated: "2025.07.01", path: "/pa/PA-001", domain: "재무" },
  { id: "PA-002", kind: "pa", title: "양식 제출 → Teams 알림 플로우", summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송", dept: "인사팀", status: "사용 가능", tags: ["Forms", "Teams", "알림"], likes: 9, views: 240, updated: "2025.06.15", path: "/pa/PA-002", domain: "HR" },
  { id: "PA-003", kind: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동으로 게시", dept: "기획팀", status: "사용 가능", tags: ["Teams", "SharePoint"], likes: 14, views: 310, updated: "2025.07.04", path: "/pa/PA-003", domain: "HR" },
  { id: "PA-004", kind: "pa", title: "재고 부족 알림 자동화", summary: "ERP 재고 수준이 기준치 이하로 내려가면 구매 담당자에게 즉시 Teams 알림 발송", dept: "구매팀", status: "준비 중", tags: ["재고관리", "ERP", "알림"], likes: 7, views: 190, updated: "2025.06.22", path: "/pa/PA-004", domain: "생산" },
  // 나만의 비서
  { id: "AST-001", kind: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", dept: "법무팀", status: "사용 가능", tags: ["법무", "계약서검토"], likes: 32, views: 890, updated: "2025.06.10", path: "/assistant/AST-001", domain: "재무" },
  { id: "AST-002", kind: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", dept: "IT개발팀", status: "사용 가능", tags: ["회의록", "요약"], likes: 23, views: 620, updated: "2025.06.14", path: "/assistant/AST-002", domain: "HR" },
  { id: "AST-003", kind: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", dept: "IT개발팀", status: "준비 중", tags: ["코드리뷰", "GitHub"], likes: 12, views: 280, updated: "2025.06.19", path: "/assistant/AST-003", domain: "IT" },
  { id: "AST-004", kind: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", dept: "메이크업연구소", status: "준비 중", tags: ["원료", "MSDS", "규제정보"], likes: 6, views: 190, updated: "2025.06.20", path: "/assistant/AST-004", domain: "연구" },
  { id: "AST-005", kind: "assistant", title: "영업 제안서 초안 봇", summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성", dept: "영업기획팀", status: "사용 가능", tags: ["제안서", "영업지원"], likes: 15, views: 340, updated: "2025.07.02", path: "/assistant/AST-005", domain: "영업" },
  // AI Agent
  { id: "AIO-001", kind: "ai-orchestration", title: "GPT-5.4 (OpenAI)", summary: "범용 업무 전반에 무난한 기본 선택지 — 코드 생성·문서 작성·분석에 활용", dept: "DX전략팀", status: "사용 가능", tags: ["범용", "문서작성"], likes: 27, views: 1420, updated: "2026.07.01", path: "/ai-orchestration/AIO-001", domain: "IT" },
  { id: "AIO-002", kind: "ai-orchestration", title: "GPT-5.4 Mini (OpenAI)", summary: "단순·반복 작업을 빠르고 저렴하게 처리하는 경량 모델", dept: "DX전략팀", status: "사용 가능", tags: ["저비용", "반복작업"], likes: 14, views: 820, updated: "2026.07.01", path: "/ai-orchestration/AIO-002", domain: "IT" },
  { id: "AIO-003", kind: "ai-orchestration", title: "Claude Opus 4.8 (Anthropic)", summary: "가장 어려운 문제를 끝까지 푸는 최상위 추론 모델 — 다단계 분석에 최적", dept: "DX전략팀", status: "사용 가능", tags: ["복잡한추론", "다단계분석"], likes: 20, views: 1180, updated: "2026.07.01", path: "/ai-orchestration/AIO-003", domain: "연구" },
  { id: "AIO-004", kind: "ai-orchestration", title: "Claude Sonnet 4.6 (Anthropic)", summary: "일상 업무에 가장 균형 잡힌 모델 — 문서 분석·요약·작성 전반에 적합", dept: "DX전략팀", status: "사용 가능", tags: ["문서분석", "균형"], likes: 28, views: 1350, updated: "2026.07.01", path: "/ai-orchestration/AIO-004", domain: "IT" },
  // ML 모델
  { id: "ML-001", kind: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", dept: "메이크업연구소", status: "준비 중", tags: ["회귀모델", "색상예측"], likes: 21, views: 460, updated: "2025.06.01", path: "/ml/ML-001", domain: "연구" },
  { id: "ML-002", kind: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측하는 시계열 모델", dept: "구매팀", status: "준비 중", tags: ["수요예측", "시계열"], likes: 9, views: 280, updated: "2025.06.20", path: "/ml/ML-002", domain: "생산" },
  { id: "ML-003", kind: "ml", title: "불량품 이미지 분류 모델", summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델", dept: "품질관리팀", status: "일부 제한", tags: ["이미지분류", "불량검출", "CNN"], likes: 16, views: 320, updated: "2025.07.06", path: "/ml/ML-003", domain: "생산" },
  // Vibe Coding
  { id: "VIBE-001", kind: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", dept: "영업기획팀", status: "사용 가능", tags: ["ERP", "Slack"], likes: 10, views: 220, updated: "2025.07.05", path: "/vibe/VIBE-001", domain: "영업" },
  { id: "VIBE-002", kind: "vibe", title: "원가 분석 자동화 스크립트", summary: "ERP 원가 데이터를 읽어 제품별 원가 분석 리포트를 자동 생성하는 Python 스크립트", dept: "재무팀", status: "준비 중", tags: ["Python", "원가분석"], likes: 7, views: 180, updated: "2025.06.21", path: "/vibe/VIBE-002", domain: "영업" },
  { id: "VIBE-003", kind: "vibe", title: "부서별 KPI 현황판 자동화", summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱", dept: "경영기획팀", status: "사용 가능", tags: ["KPI", "대시보드", "Python"], likes: 13, views: 260, updated: "2025.07.06", path: "/vibe/VIBE-003", domain: "재무" },
];

// TODO: 실제 연동 시 GET /api/v1/stats/by-platform 응답으로 교체
const PLATFORM_COUNTS: Record<PlatformId, number> = {
  n8n: 62, pa: 31, assistant: 48, "ai-orchestration": 12, ml: 23, vibe: 32,
};

const top5 = [...ALL_ITEMS].sort((a, b) => b.views - a.views).slice(0, 5);
const itemsByDomain = (d: Domain) => ALL_ITEMS.filter(i => i.domain === d).slice(0, 3);

// ===== 모듈 레벨 서브컴포넌트 =====

const EyeIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.01em" }}>
    {children}
  </span>
);

/** 헤더 우측 실시간 인기 바 — 접힌 한 줄(세로 슬라이드 전환), 호버 시 TOP 5 패널 확장 */
function TopViewedBar({
  items, activeIdx, onNavigate,
}: {
  items: FeedItem[];
  activeIdx: number;
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const idx = activeIdx % items.length;
  const current = items[idx];

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: "relative", flexShrink: 0 }}
    >
      {/* 접힌 바 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        width: 300, boxSizing: "border-box", height: 40, padding: "0 14px",
        background: "#fff", borderRadius: 20, cursor: "default",
        borderTop: `1.5px solid ${open ? "#C5D8FB" : "#EBEEF3"}`,
        borderRight: `1.5px solid ${open ? "#C5D8FB" : "#EBEEF3"}`,
        borderBottom: `1.5px solid ${open ? "#C5D8FB" : "#EBEEF3"}`,
        borderLeft: `1.5px solid ${open ? "#C5D8FB" : "#EBEEF3"}`,
        transition: "border-color 0.2s",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", flexShrink: 0 }}>실시간 인기</span>
        {/* 세로 슬라이드 티커: 고정 높이 + overflow hidden 창 안에서 아래→위로 밀려 올라옴 */}
        <div style={{ flex: 1, minWidth: 0, height: 18, overflow: "hidden", position: "relative" }}>
          <div key={idx} style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center",
            fontSize: 12, fontWeight: 600, color: "#1A1F27",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            animation: "axTickerUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
          }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {idx + 1}위 · {current.title}
            </span>
          </div>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#94A3B8", flexShrink: 0 }}>
          <EyeIcon size={10} /> {current.views.toLocaleString()}
        </span>
      </div>

      {/* 호버 확장 패널 */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, width: 320,
          background: "#fff", borderRadius: 12, padding: "10px 12px", zIndex: 50,
          boxShadow: "0 12px 32px rgba(26,31,39,0.14)",
          animation: "axPanelIn 0.25s ease-out",
        }}>
          {items.map((item, i) => {
            const s = SOURCE_STYLE[item.kind];
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F4F6F9")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{
                  width: 18, fontSize: 13, fontWeight: 800, flexShrink: 0, textAlign: "center",
                  color: i < 3 ? "#1C6BFF" : "#AEB6C2",
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.label} · {item.dept}
                  </div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#94A3B8", flexShrink: 0 }}>
                  <EyeIcon size={10} /> {item.views.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // 실시간 인기 바 순환 (2.5초)
  const [rankIdx, setRankIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRankIdx(v => (v + 1) % top5.length), 2500);
    return () => clearInterval(t);
  }, []);

  // 업무별 추천 도메인 순환 (5초, 수동 클릭 시 10초 정지)
  const [domainIdx, setDomainIdx] = useState(0);
  const domainPauseRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() < domainPauseRef.current) return;
      setDomainIdx(v => (v + 1) % DOMAINS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);
  const selectDomain = (i: number) => {
    setDomainIdx(i);
    domainPauseRef.current = Date.now() + 10000;
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(search.trim() ? `/projects?q=${encodeURIComponent(search.trim())}` : "/projects");
  };

  const spotlightDomain = DOMAINS[domainIdx];
  const spotlightItems = itemsByDomain(spotlightDomain);

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27" }}>
      <Navbar />

      {/* [1단] 헤더: 인사 + 검색 + 실시간 인기 바 (v2 스타일) */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "18px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {user ? `${user.name}님, 반갑습니다` : "반갑습니다"}
            </div>
            <div style={{ fontSize: 12, color: "#697386", marginTop: 2 }}>
              그룹의 자동화·AI 자산 {STAT_CARDS[0].value}건이 기다리고 있습니다
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 260, maxWidth: 520, position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="워크플로우, AI 에이전트, ML 모델 검색..."
              style={{
                width: "100%", boxSizing: "border-box", padding: "11px 88px 11px 16px",
                fontSize: 13, color: "#1A1F27", background: "#F4F6F9",
                border: "1.5px solid #EBEEF3", borderRadius: 24, outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
              onBlur={e => (e.target.style.borderColor = "#EBEEF3")}
            />
            <button type="submit" style={{
              position: "absolute", right: 5, top: 5, bottom: 5,
              background: "#1C6BFF", color: "#fff", border: "none",
              borderRadius: 20, padding: "0 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>검색</button>
          </form>

          <div style={{ marginLeft: "auto" }}>
            <TopViewedBar items={top5} activeIdx={rankIdx} onNavigate={navigate} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 32px 48px" }}>

        {/* [2단] 지표 그라디언트 4카드 (v2 스타일) */}
        <div className="ax-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {STAT_CARDS.map((s, i) => (
            <div key={s.label} onClick={() => navigate(i === 1 ? "/projects?status=available" : "/projects")} style={{
              background: s.grad, borderRadius: 14, padding: "18px 20px",
              color: "#fff", cursor: "pointer",
              boxShadow: "0 6px 16px rgba(26,31,39,0.10)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>{s.label}</span>
              <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* [3단] 통합 패널: 유형별 둘러보기 + 업무별 추천 */}
        <div style={{
          background: "#fff", borderRadius: 16, overflow: "hidden",
          boxShadow: "0 1px 3px rgba(26,31,39,0.04), 0 8px 24px rgba(26,31,39,0.04)",
        }}>

          {/* 3-1. 유형별 둘러보기 */}
          <div style={{ padding: "18px 26px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionLabel>유형별 둘러보기</SectionLabel>
              <span onClick={() => navigate("/projects")} style={{ fontSize: 12, color: "#1C6BFF", fontWeight: 600, cursor: "pointer" }}>
                전체 보기 →
              </span>
            </div>
            <div className="ax-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {PLATFORMS.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects?platform=${p.id}`)}
                  style={{
                    borderRadius: 12, padding: "12px 13px", cursor: "pointer", background: p.bg,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 14px rgba(26,31,39,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: p.color, letterSpacing: "-0.02em" }}>
                      {PLATFORM_COUNTS[p.id]}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27" }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#697386", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.shortDesc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#F0F2F6", margin: "0 26px" }} />

          {/* 3-2. 업무별 추천 (가로형) */}
          <div style={{ padding: "16px 26px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <SectionLabel>업무별 추천</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {DOMAINS.map((d, i) => {
                  const active = i === domainIdx;
                  const c = DOMAIN_CHIP[d];
                  return (
                    <button key={d} onClick={() => selectDomain(i)} style={{
                      padding: "5px 13px", borderRadius: 16, border: "none", cursor: "pointer",
                      fontSize: 11.5, fontWeight: 700,
                      background: active ? c.bg : "#F4F6F9",
                      color: active ? c.fg : "#8A93A2",
                      boxShadow: active ? `inset 0 0 0 1.5px ${c.fg}33` : "none",
                      transition: "background 0.3s, color 0.3s, box-shadow 0.3s",
                    }}>{d}</button>
                  );
                })}
                <span onClick={() => navigate("/projects")} style={{ fontSize: 12, color: "#1C6BFF", fontWeight: 600, cursor: "pointer", marginLeft: 6 }}>
                  전체 →
                </span>
              </div>
            </div>

            {/* 세로 슬라이드 전환: 새 콘텐츠가 아래에서 위로 부드럽게 올라옴 */}
            <div style={{ overflow: "hidden" }}>
              <div key={spotlightDomain} className="ax-domain-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
                animation: "axSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
              }}>
                {spotlightItems.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#AEB6C2", padding: "14px 0", textAlign: "center" }}>
                    아직 등록된 항목이 없습니다. 첫 등록의 주인공이 되어보세요.
                  </div>
                ) : spotlightItems.map(item => {
                  const s = SOURCE_STYLE[item.kind];
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      style={{
                        borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                        background: "#F9FAFC",
                        transition: "background 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.boxShadow = `inset 0 0 0 1.5px ${s.color}55, 0 4px 12px rgba(26,31,39,0.06)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#F9FAFC";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#697386", lineHeight: 1.5, height: "3em", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.summary}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#AEB6C2" }}>{s.label} · {item.dept}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        /* 티커: 아래에서 위로 올라오며 자리 잡음 (투명도 변화 최소화로 번쩍임 제거) */
        @keyframes axTickerUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        /* 콘텐츠 전환: 살짝 아래에서 부드럽게 올라옴 */
        @keyframes axSlideUp {
          from { transform: translateY(14px); opacity: 0.4; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        /* 호버 패널 등장 */
        @keyframes axPanelIn {
          from { transform: translateY(-4px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (max-width: 1200px) {
          .ax-stat-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .ax-type-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .ax-domain-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .ax-type-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}