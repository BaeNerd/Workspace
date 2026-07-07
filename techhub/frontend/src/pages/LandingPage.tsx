// ===== pages/LandingPage.tsx =====
/* ============================================================
   AX Platform 랜딩 페이지 — MSN/뉴스 포털형 재설계 v2
   2026-07-07: 히어로 쇼케이스 3카드 신설, 레이아웃 재구성

   자동 순환 주기
   - 메인 피드 탭(최신/인기): 7초, 수동 클릭 시 12초간 정지 후 재개
   - 인기 TOP 5 하이라이트: 2.5초
   - 업무별 추천 스포트라이트: 5초, 수동 클릭 시 10초 정지
   - 히어로 카드 1 (동료 핫 아이템): 6초
   - 히어로 카드 2 (나만의 비서): 8초
   - 히어로 카드 3 (Vibe Coding): 10초
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";

// TODO: 실제 접속 주소 확정 시 교체
const HK_CALLING_URL = "http://172.17.20.203:3001/n8n";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#E8F7EE", color: "#0B7A43" },
  "사용 가능": { bg: "#E8F7EE", color: "#0B7A43" },
  "사용 중": { bg: "#E8F7EE", color: "#0B7A43" },
  "테스트 중": { bg: "#E8F1FF", color: "#1C6BFF" },
  "실험 중": { bg: "#E8F1FF", color: "#1C6BFF" },
  "프로토타입": { bg: "#E8F1FF", color: "#1C6BFF" },
  "준비 중": { bg: "#E8F1FF", color: "#1C6BFF" },
  "일시 중지": { bg: "#FFF4E5", color: "#B95C00" },
  "일부 제한": { bg: "#FFF4E5", color: "#B95C00" },
  "운영 중지": { bg: "#FDECEC", color: "#C42B2B" },
  "지원 종료 예정": { bg: "#FDECEC", color: "#C42B2B" },
};

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> =
  Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }]));

const DOMAINS = ["영업", "생산", "연구", "재무", "HR", "IT"] as const;
type Domain = typeof DOMAINS[number];

const DOMAIN_COLOR: Record<Domain, { grad: string; color: string }> = {
  "영업": { grad: "linear-gradient(135deg, #FF9F43, #FF6B6B)", color: "#B95C00" },
  "생산": { grad: "linear-gradient(135deg, #1C6BFF, #4E9BFF)", color: "#1C6BFF" },
  "연구": { grad: "linear-gradient(135deg, #12B8C8, #4ED6E0)", color: "#0891B2" },
  "재무": { grad: "linear-gradient(135deg, #22C060, #6FDD97)", color: "#0B7A43" },
  "HR": { grad: "linear-gradient(135deg, #9C5CF6, #C29BFB)", color: "#7C3AED" },
  "IT": { grad: "linear-gradient(135deg, #475569, #7A8BA3)", color: "#334155" },
};

// TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체
const STAT_CARDS = [
  { value: 208, label: "전체 AX 항목", grad: "linear-gradient(135deg, #FF9F43, #FF7E5F)" },
  { value: 84, label: "바로 쓸 수 있는 도구", grad: "linear-gradient(135deg, #1C6BFF, #4E9BFF)" },
  { value: 14, label: "이번 달 신규", grad: "linear-gradient(135deg, #12B8C8, #4ED6E0)" },
  { value: 47, label: "우리 회사 등록", grad: "linear-gradient(135deg, #22C060, #6FDD97)" },
];

type FeedItem = {
  id: string; kind: PlatformId; title: string; summary: string;
  dept: string; status: string; tags: string[]; likes: number;
  updated: string; path: string; domain: Domain;
};

// TODO: 실제 연동 시 GET /api/v1/platform-items?sort=recent 응답으로 교체
const ALL_ITEMS: FeedItem[] = [
  { id: "N8N-001", kind: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달", dept: "IT인프라팀", status: "운영 중", tags: ["Outlook", "긴급메일"], likes: 19, updated: "2025.07.03", path: "/n8n/N8N-001", domain: "IT" },
  { id: "VIBE-001", kind: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", dept: "영업기획팀", status: "사용 중", tags: ["ERP", "Slack"], likes: 8, updated: "2025.07.05", path: "/vibe/VIBE-001", domain: "영업" },
  { id: "PA-001", kind: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동 보관", dept: "경영지원팀", status: "운영 중", tags: ["SharePoint", "전자결재"], likes: 12, updated: "2025.07.01", path: "/pa/PA-001", domain: "재무" },
  { id: "AIO-002", kind: "ai-orchestration", title: "Claude (문서 분석 특화)", summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델", dept: "IT개발팀", status: "사용 가능", tags: ["문서분석", "법무"], likes: 27, updated: "2025.06.12", path: "/ai-orchestration/AIO-002", domain: "IT" },
  { id: "AST-001", kind: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", dept: "법무팀", status: "사용 가능", tags: ["법무", "계약서검토"], likes: 25, updated: "2025.06.10", path: "/assistant/AST-001", domain: "재무" },
  { id: "ML-001", kind: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", dept: "메이크업연구소", status: "실험 중", tags: ["회귀모델", "색상예측"], likes: 21, updated: "2025.06.01", path: "/ml/ML-001", domain: "연구" },
  { id: "AST-002", kind: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", dept: "IT개발팀", status: "사용 가능", tags: ["회의록", "요약"], likes: 18, updated: "2025.06.14", path: "/assistant/AST-002", domain: "HR" },
  { id: "N8N-003", kind: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", dept: "재무팀", status: "운영 중", tags: ["매출리포트", "ERP"], likes: 12, updated: "2025.06.12", path: "/n8n/N8N-003", domain: "재무" },
  { id: "N8N-004", kind: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", dept: "품질관리팀", status: "테스트 중", tags: ["품질관리", "생산"], likes: 3, updated: "2025.06.18", path: "/n8n/N8N-004", domain: "생산" },
  { id: "AIO-004", kind: "ai-orchestration", title: "Gemini (멀티모달)", summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델", dept: "IT개발팀", status: "사용 가능", tags: ["멀티모달", "이미지분석"], likes: 14, updated: "2025.06.15", path: "/ai-orchestration/AIO-004", domain: "연구" },
  { id: "AIO-001", kind: "ai-orchestration", title: "GPT-4 (범용)", summary: "범용 작업에 적합한 OpenAI GPT-4 모델 — 코드 생성, 문서 작성, 분석에 활용", dept: "IT개발팀", status: "사용 가능", tags: ["코드생성", "범용"], likes: 31, updated: "2025.07.02", path: "/ai-orchestration/AIO-001", domain: "IT" },
  { id: "PA-003", kind: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동으로 게시", dept: "기획팀", status: "운영 중", tags: ["Teams", "SharePoint"], likes: 15, updated: "2025.07.04", path: "/pa/PA-003", domain: "HR" },
  { id: "ML-002", kind: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측하는 시계열 모델", dept: "구매팀", status: "실험 중", tags: ["수요예측", "시계열"], likes: 9, updated: "2025.06.20", path: "/ml/ML-002", domain: "생산" },
  { id: "VIBE-002", kind: "vibe", title: "원가 분석 자동화 스크립트", summary: "ERP 원가 데이터를 읽어 제품별 원가 분석 리포트를 자동 생성하는 Python 스크립트", dept: "재무팀", status: "프로토타입", tags: ["Python", "원가분석"], likes: 6, updated: "2025.06.21", path: "/vibe/VIBE-002", domain: "영업" },
];

// TODO: 실제 연동 시 GET /api/v1/stats/by-platform 응답으로 교체
const PLATFORM_COUNTS: Record<PlatformId, number> = {
  n8n: 62, pa: 31, assistant: 48, "ai-orchestration": 12, ml: 23, vibe: 32,
};

const recentItems = [...ALL_ITEMS].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6);
const popularItems = [...ALL_ITEMS].sort((a, b) => b.likes - a.likes).slice(0, 6);
const top5 = [...ALL_ITEMS].sort((a, b) => b.likes - a.likes).slice(0, 5);
const itemsByDomain = (d: Domain) => ALL_ITEMS.filter(i => i.domain === d).slice(0, 3);

const FEED_TABS = [
  { id: "recent" as const, label: "최신 등록" },
  { id: "popular" as const, label: "인기 항목" },
];

// ===== 히어로 쇼케이스 데이터 =====

type PeerHotItem = {
  company: string;
  department: string;
  itemId: string;
  itemName: string;
  platformId: PlatformId;
  likes: number;
  summary: string;
};

// TODO: 실제 연동 시 GET /api/v1/stats/peer-hot 응답으로 교체
const PEER_HOT_ITEMS: PeerHotItem[] = [
  { company: "HK이노엔",    department: "IT",    itemId: "N8N-001", itemName: "긴급 메일 자동 전달",     platformId: "n8n",              likes: 34, summary: "긴급 키워드 메일 수신 시 팀장에게 즉시 자동 전달" },
  { company: "콜마비앤에이치", department: "인사",  itemId: "AST-002", itemName: "회의록 요약 봇",          platformId: "assistant",        likes: 28, summary: "Teams 녹취록 업로드하면 핵심 결정사항 자동 정리" },
  { company: "콜마생활건강", department: "재무",  itemId: "N8N-003", itemName: "일일 매출 리포트",        platformId: "n8n",              likes: 21, summary: "매일 오전 전일 매출 요약을 경영진에게 자동 발송" },
  { company: "한국콜마",    department: "영업",  itemId: "VIBE-001", itemName: "판매 리포트 자동화",      platformId: "vibe",             likes: 19, summary: "ERP 데이터로 매일 아침 판매 실적 요약 리포트 생성" },
  { company: "콜마글로벌",  department: "구매",  itemId: "ML-002",  itemName: "원료 수요 예측",          platformId: "ml",               likes: 17, summary: "과거 데이터로 월별 원료 수요를 예측하는 시계열 모델" },
  { company: "HK이노엔",    department: "법무",  itemId: "AST-001", itemName: "법무 검토 보조 봇",       platformId: "assistant",        likes: 33, summary: "계약서 위험 조항 자동 식별하고 검토 의견 제시" },
  { company: "콜마바이오텍", department: "IT",    itemId: "AIO-001", itemName: "GPT-4 (범용)",           platformId: "ai-orchestration", likes: 29, summary: "코드 생성·문서 작성·분석에 활용하는 범용 AI 모델" },
  { company: "무석콜마",    department: "생산",  itemId: "N8N-004", itemName: "품질 이슈 에스컬레이션", platformId: "n8n",              likes: 14, summary: "품질 이상 감지 시 관련 부서에 즉시 Teams 알림" },
  { company: "미국콜마",    department: "마케팅", itemId: "AIO-002", itemName: "Claude (문서 분석)",      platformId: "ai-orchestration", likes: 22, summary: "긴 문서 분석과 정밀 추론에 강한 Anthropic Claude 모델" },
];

type AssistantShowcase = {
  itemId: string;
  headline: string;
  promptTeaser: string;
  agentUsed: string;
  environment: string;
  owner: string;
  path: string;
};

const ASSISTANT_SHOWCASE: AssistantShowcase[] = [
  {
    itemId: "AST-MSG",
    headline: "메신저를 파싱해 내 스케줄을 관리하는 프롬프트를 소개합니다",
    promptTeaser: "받은 메신저 대화에서 날짜·시간·장소를 추출해 일정 초안을 만들어줘. 형식은...",
    agentUsed: "Claude Sonnet 4.6 (Anthropic)",
    environment: "메신저 대화 내보내기 파일, 주간 일정 템플릿",
    owner: "IT개발팀 정태영",
    path: "/assistant/AST-002",
  },
  {
    itemId: "AST-RPT",
    headline: "주간 보고서 초안을 5분 만에 완성하는 프롬프트입니다",
    promptTeaser: "아래 이번 주 업무 목록을 보고, 성과·진행 중·이슈로 분류해 팀장 보고용 주간 보고서 초안을...",
    agentUsed: "GPT-4 (OpenAI)",
    environment: "주간 업무 노트, 회사 보고 양식 템플릿",
    owner: "기획팀 이지원",
    path: "/assistant/AST-002",
  },
  {
    itemId: "AST-EMAIL",
    headline: "클레임 메일에 감정 소모 없이 답변하는 프롬프트를 공유합니다",
    promptTeaser: "아래 고객 클레임 내용을 읽고, 공감·원인·해결책·사과 순서로 정중하고 간결한 답변 메일을...",
    agentUsed: "Claude Sonnet 4.6 (Anthropic)",
    environment: "클레임 원문 메일, 제품 불량 처리 가이드",
    owner: "고객서비스팀 박지수",
    path: "/assistant/AST-001",
  },
];

type VibeShowcase = {
  itemId: string;
  problem: string;
  solution: string;
  tool: string;
  owner: string;
  path: string;
};

const VIBE_SHOWCASE: VibeShowcase[] = [
  {
    itemId: "VIBE-ECM",
    problem: "ECM에서 여러 파일을 한 번에 다운로드할 수 없는 고질적인 문제",
    solution: "멀티 파일 다운로드 프로그램을 바이브 코딩으로 직접 제작",
    tool: "Claude Code",
    owner: "IT인프라팀 이서현",
    path: "/vibe/VIBE-001",
  },
  {
    itemId: "VIBE-COFFEE",
    problem: "커피 내기 당번을 정할 때마다 반복되는 실랑이",
    solution: "팀원 명단으로 돌리는 커피 룰렛 웹앱을 바이브 코딩으로 제작",
    tool: "바이브 코딩 도구",
    owner: "마케팅팀 정직원",
    path: "/vibe/VIBE-002",
  },
  {
    itemId: "VIBE-KPI",
    problem: "매주 수작업으로 취합하던 팀별 KPI 현황판 작성에 2시간씩 소모",
    solution: "Excel 데이터를 읽어 자동으로 KPI 대시보드를 그려주는 Python 앱 제작",
    tool: "Cursor",
    owner: "경영기획팀 김재원",
    path: "/vibe/VIBE-002",
  },
];

// ===== 모듈 레벨 서브컴포넌트 =====

const HeartIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const SectionTitle = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.01em" }}>{title}</span>
    {action && (
      <span onClick={onAction} style={{ fontSize: 12, color: "#1C6BFF", fontWeight: 600, cursor: "pointer" }}>
        {action} →
      </span>
    )}
  </div>
);

const DotIndicator = ({ count, active }: { count: number; active: number }) => (
  <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 10 }}>
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} style={{
        width: i === active ? 14 : 5, height: 5, borderRadius: 3,
        background: i === active ? "#1C6BFF" : "#D7DDE6",
        transition: "all 0.3s",
      }} />
    ))}
  </div>
);

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const s = SOURCE_STYLE[item.kind];
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff", borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        border: `1.5px solid ${hover ? s.color : "#EBEEF3"}`,
        boxShadow: hover ? "0 8px 20px rgba(28,107,255,0.10)" : "0 1px 3px rgba(26,31,39,0.04)",
        transform: hover ? "translateY(-2px)" : "none",
        transition: "all 0.15s", display: "flex", flexDirection: "column", minHeight: 138,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 6 }}>
        <div style={{ display: "flex", gap: 5, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{s.label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_COLOR[item.status]?.bg, color: STATUS_COLOR[item.status]?.color, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{item.status}</span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#94A3B8", flexShrink: 0 }}>
          <HeartIcon /> {item.likes}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1F27", lineHeight: 1.4, marginBottom: 5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {item.title}
      </div>
      <div style={{ fontSize: 12, color: "#697386", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {item.summary}
      </div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#AEB6C2" }}>
        <span>{item.dept}</span>
        <span>{item.updated}</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const [feedTab, setFeedTab] = useState<"recent" | "popular">("recent");

  // TOP5 하이라이트 순환 (2.5초)
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

  // 히어로 카드 1: 동료 핫 아이템 (6초)
  const [peerIdx, setPeerIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPeerIdx(v => v + 1), 6000);
    return () => clearInterval(t);
  }, []);

  // 히어로 카드 2: 나만의 비서 쇼케이스 (8초)
  const [assistantIdx, setAssistantIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAssistantIdx(v => v + 1), 8000);
    return () => clearInterval(t);
  }, []);

  // 히어로 카드 3: Vibe Coding 쇼케이스 (10초)
  const [vibeIdx, setVibeIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVibeIdx(v => v + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(search.trim() ? `/projects?q=${encodeURIComponent(search.trim())}` : "/projects");
  };

  // 카드 1: 같은 부서, 다른 관계사 항목 필터 (없으면 전체 폴백)
  const filteredPeerItems = (user?.department && user.company)
    ? PEER_HOT_ITEMS.filter(p => p.department === user.department && p.company !== user.company)
    : [];
  const peerItems = filteredPeerItems.length > 0 ? filteredPeerItems : PEER_HOT_ITEMS;
  const isPeerFallback = filteredPeerItems.length === 0;
  const peerItem = peerItems[peerIdx % peerItems.length];
  const pStyle = SOURCE_STYLE[peerItem.platformId];

  const assistantItem = ASSISTANT_SHOWCASE[assistantIdx % ASSISTANT_SHOWCASE.length];
  const vibeItem = VIBE_SHOWCASE[vibeIdx % VIBE_SHOWCASE.length];
  const spotlightDomain = DOMAINS[domainIdx];
  const spotlightItems = itemsByDomain(spotlightDomain);
  const feedItems = feedTab === "recent" ? recentItems : popularItems;

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27" }}>
      <Navbar />

      {/* [A] 상단 인사 + 검색 */}
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

          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 280, position: "relative" }}>
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
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 32px 56px" }}>

        {/* [B] 지표 4카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {STAT_CARDS.map((s, i) => (
            <div key={i} onClick={() => navigate("/projects")} style={{
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

        {/* 2-컬럼 메인 그리드 (좌: C+D / 우: E) */}
        <div className="ax-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, marginBottom: 22, alignItems: "start" }}>

          {/* 좌 컬럼: C (히어로 3카드) + D (피드) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* [C] 히어로 쇼케이스 3카드 */}
            <div className="ax-hero-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>

              {/* 카드 1: 동료들의 선택 */}
              <div
                onClick={() => navigate(`/${peerItem.platformId}/${peerItem.itemId}`)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "18px 18px 14px",
                  border: "1px solid #EBEEF3", display: "flex", flexDirection: "column", minHeight: 220,
                  cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#B4CCFF")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#EBEEF3")}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  {isPeerFallback ? "그룹사에서 지금 핫한 항목" : "우리 부서 동료들의 선택"}
                </div>
                <div key={peerIdx % peerItems.length} style={{ flex: 1, animation: "axFadeIn 0.4s ease" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", marginBottom: 8 }}>
                    {peerItem.department}팀 동료들은 이걸 씁니다 — {peerItem.company}
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, background: pStyle.bg, color: pStyle.color, padding: "2px 7px", borderRadius: 20 }}>
                    {pStyle.label}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1F27", lineHeight: 1.4, marginTop: 8, marginBottom: 6 }}>
                    {peerItem.itemName}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#697386", lineHeight: 1.5 }}>
                    {peerItem.summary}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <HeartIcon size={10} />
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{peerItem.likes}</span>
                  </div>
                </div>
                <DotIndicator count={peerItems.length} active={peerIdx % peerItems.length} />
              </div>

              {/* 카드 2: 나만의 비서 쇼케이스 */}
              <div
                onClick={() => navigate(assistantItem.path)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "18px 18px 14px",
                  border: "1px solid #EBEEF3", display: "flex", flexDirection: "column", minHeight: 220,
                  cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#B4CCFF")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#EBEEF3")}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  이런 프롬프트를 쓰니 편하더라
                </div>
                <div key={assistantIdx % ASSISTANT_SHOWCASE.length} style={{ flex: 1, animation: "axFadeIn 0.4s ease" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1F27", lineHeight: 1.45, marginBottom: 10 }}>
                    {assistantItem.headline}
                  </div>
                  <div style={{
                    background: "#F8FAFC", borderRadius: 8, padding: "10px 12px",
                    fontSize: 11.5, color: "#475569", lineHeight: 1.6, marginBottom: 10,
                    borderLeft: "3px solid #CBD5E1",
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    "{assistantItem.promptTeaser}"
                  </div>
                  <div style={{ fontSize: 10.5, color: "#697386", lineHeight: 1.8 }}>
                    <div>사용한 Agent: <strong style={{ color: "#475569" }}>{assistantItem.agentUsed}</strong></div>
                    <div>필요한 환경: {assistantItem.environment}</div>
                  </div>
                </div>
                <DotIndicator count={ASSISTANT_SHOWCASE.length} active={assistantIdx % ASSISTANT_SHOWCASE.length} />
              </div>

              {/* 카드 3: Vibe Coding 쇼케이스 */}
              <div
                onClick={() => navigate(vibeItem.path)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "18px 18px 14px",
                  border: "1px solid #EBEEF3", display: "flex", flexDirection: "column", minHeight: 220,
                  cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#B4CCFF")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#EBEEF3")}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  내가 만든 프로그램 공유
                </div>
                <div key={vibeIdx % VIBE_SHOWCASE.length} style={{ flex: 1, animation: "axFadeIn 0.4s ease" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, background: "#FEE2E2", color: "#C42B2B", padding: "2px 8px", borderRadius: 20, flexShrink: 0, marginTop: 2 }}>문제</span>
                    <div style={{ fontSize: 12.5, color: "#1A1F27", lineHeight: 1.5 }}>{vibeItem.problem}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 20, flexShrink: 0, marginTop: 2 }}>해결</span>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1F27", lineHeight: 1.5 }}>{vibeItem.solution}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#697386" }}>
                    사용 도구: <strong style={{ color: "#475569" }}>{vibeItem.tool}</strong>
                  </div>
                </div>
                <DotIndicator count={VIBE_SHOWCASE.length} active={vibeIdx % VIBE_SHOWCASE.length} />
              </div>

            </div>

            {/* [D] 최신 등록 / 인기 항목 피드 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1px solid #EBEEF3" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {FEED_TABS.map(tab => (
                    <button key={tab.id} onClick={() => setFeedTab(tab.id)} style={{
                      padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 700,
                      background: feedTab === tab.id ? "#1C6BFF" : "#F4F6F9",
                      color: feedTab === tab.id ? "#fff" : "#697386",
                      transition: "all 0.2s",
                    }}>{tab.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {FEED_TABS.map(tab => (
                      <span key={tab.id} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: feedTab === tab.id ? "#1C6BFF" : "#D7DDE6",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <span onClick={() => navigate("/projects")} style={{ fontSize: 12, color: "#1C6BFF", fontWeight: 600, cursor: "pointer" }}>
                    전체 보기 →
                  </span>
                </div>
              </div>
              <div key={feedTab} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "axFadeIn 0.35s ease", alignContent: "start" }}>
                {feedItems.map(item => (
                  <FeedCard key={item.id} item={item} onClick={() => navigate(item.path)} />
                ))}
              </div>
            </div>

          </div>

          {/* [E] 우측 사이드바 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 버튼 + 바로가기 영역 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #EBEEF3" }}>
              <button onClick={() => navigate("/projects/new")} style={{
                width: "100%", background: "#1C6BFF", color: "#fff", border: "none",
                borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 700,
                cursor: "pointer", marginBottom: 8,
              }}>AX 항목 등록하기</button>
              <button onClick={() => navigate("/projects")} style={{
                width: "100%", background: "#fff", color: "#1C6BFF",
                borderTop: "1.5px solid #CFE0FF", borderRight: "1.5px solid #CFE0FF",
                borderBottom: "1.5px solid #CFE0FF", borderLeft: "1.5px solid #CFE0FF",
                borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 700,
                cursor: "pointer", marginBottom: 12,
              }}>상세 탐색</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => window.open(HK_CALLING_URL, "_blank", "noopener,noreferrer")}
                  title="대화로 n8n 자동화를 만들어주는 도우미"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#FDF2F8", color: "#DB2777",
                    borderTop: "1.5px solid #FBCFE8", borderRight: "1.5px solid #FBCFE8",
                    borderBottom: "1.5px solid #FBCFE8", borderLeft: "1.5px solid #FBCFE8",
                    borderRadius: 8, padding: "8px 0", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                  }}
                >HK콜링이</button>
                <span
                  title="AX 허브 통합 검색 AI — 2단계 오픈 예정"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    background: "#F4F6F9", color: "#AEB6C2",
                    borderTop: "1.5px solid #EBEEF3", borderRight: "1.5px solid #EBEEF3",
                    borderBottom: "1.5px solid #EBEEF3", borderLeft: "1.5px solid #EBEEF3",
                    borderRadius: 8, padding: "8px 0", fontSize: 11.5, fontWeight: 600, cursor: "default",
                  }}
                >
                  AX 검색 AI
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#EBEEF3", padding: "1px 5px", borderRadius: 8 }}>준비 중</span>
                </span>
              </div>
            </div>

            {/* 실시간 인기 TOP 5 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #EBEEF3" }}>
              <SectionTitle title="실시간 조회 TOP 5" />
              {top5.map((item, i) => {
                const active = i === rankIdx;
                const s = SOURCE_STYLE[item.kind];
                return (
                  <div key={item.id} onClick={() => navigate(item.path)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                    borderRadius: 9, cursor: "pointer", marginBottom: 2,
                    background: active ? "#F0F6FF" : "transparent",
                    transition: "background 0.3s",
                  }}>
                    <span style={{
                      width: 20, fontSize: 14, fontWeight: 800, flexShrink: 0, textAlign: "center",
                      color: i < 3 ? "#1C6BFF" : "#AEB6C2",
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5, fontWeight: active ? 700 : 600, color: "#1A1F27",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{item.title}</div>
                      <div style={{
                        fontSize: 10.5, color: "#697386", marginTop: 2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        opacity: active ? 1 : 0, transition: "opacity 0.25s",
                      }}>
                        {s.label} · {item.dept}
                      </div>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#94A3B8", flexShrink: 0 }}>
                      <HeartIcon size={10} /> {item.likes}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 업무별 추천 */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #EBEEF3" }}>
              <SectionTitle title="업무별 추천" action="전체" onAction={() => navigate("/projects")} />
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                {DOMAINS.map((d, i) => (
                  <button key={d} onClick={() => selectDomain(i)} style={{
                    padding: "5px 13px", borderRadius: 16, border: "none", cursor: "pointer",
                    fontSize: 11.5, fontWeight: 700,
                    background: i === domainIdx ? DOMAIN_COLOR[d].grad : "#F4F6F9",
                    color: i === domainIdx ? "#fff" : "#697386",
                    transition: "all 0.25s",
                  }}>{d}</button>
                ))}
              </div>
              <div style={{ height: 162, overflow: "hidden" }}>
                <div key={spotlightDomain} style={{ animation: "axFadeIn 0.35s ease" }}>
                  {spotlightItems.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#AEB6C2", padding: "12px 0", textAlign: "center" }}>
                      아직 등록된 항목이 없습니다. 첫 등록의 주인공이 되어보세요.
                    </div>
                  ) : spotlightItems.map(item => {
                    const s = SOURCE_STYLE[item.kind];
                    return (
                      <div key={item.id} onClick={() => navigate(item.path)} style={{
                        padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F4F6F9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.title}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: "#AEB6C2", paddingLeft: 13 }}>{s.label} · {item.dept}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* [F] 유형별 둘러보기 */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1px solid #EBEEF3" }}>
          <SectionTitle title="유형별 둘러보기" action="전체 보기" onAction={() => navigate("/projects")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {PLATFORMS.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects?q=${encodeURIComponent(p.name)}`)}
                style={{
                  borderRadius: 12, padding: "16px 14px", cursor: "pointer", background: p.bg,
                  borderTop: "1.5px solid transparent", borderRight: "1.5px solid transparent",
                  borderBottom: "1.5px solid transparent", borderLeft: "1.5px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderTopColor = p.color;
                  e.currentTarget.style.borderRightColor = p.color;
                  e.currentTarget.style.borderBottomColor = p.color;
                  e.currentTarget.style.borderLeftColor = p.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderTopColor = "transparent";
                  e.currentTarget.style.borderRightColor = "transparent";
                  e.currentTarget.style.borderBottomColor = "transparent";
                  e.currentTarget.style.borderLeftColor = "transparent";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: p.color, letterSpacing: "-0.02em", marginBottom: 4 }}>
                  {PLATFORM_COUNTS[p.id]}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1A1F27", marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: "#697386", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.shortDesc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes axFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (max-width: 1200px) {
          .ax-main-grid { grid-template-columns: 1fr !important; }
          .ax-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
