import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { CATEGORIES, CATEGORY_ICON_PATH } from "../types/categoryTypes";
import type { CategoryId, PlatformItemStatus, Category } from "../types/categoryTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { TEAMS_CHANNEL_URL } from "../config/operations";
import { IS_SHARE_MODE } from "../config/shareMode";
import { useShareNotice } from "../context/ShareNoticeContext";

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string; icon: Category["icon"] }> =
  Object.fromEntries(CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name, icon: p.icon }]));

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

// 지표 4카드
// TODO: 실제 연동 시 GET /api/v1/stats/summary 응답으로 교체
const STAT_CARDS = [
  { value: 208, label: "전체 AX 항목", grad: "linear-gradient(135deg, #FF9F43, #FF7E5F)" },
  { value: 84,  label: "바로 쓸 수 있는 도구", grad: "linear-gradient(135deg, #1C6BFF, #4E9BFF)" },
  { value: 14,  label: "최근 30일 신규", grad: "linear-gradient(135deg, #12B8C8, #4ED6E0)" },
  { value: 47,  label: "우리 회사 등록", grad: "linear-gradient(135deg, #22C060, #6FDD97)" },
];

type FeedItem = {
  id: string; kind: CategoryId; title: string; summary: string;
  dept: string; status: PlatformItemStatus; tags: string[]; likes: number; views: number;
  updated: string; path: string; domain: Domain;
};

// TODO: 실제 연동 시 GET /api/v1/platform-items?sort=recent 응답으로 교체
const ALL_ITEMS: FeedItem[] = [
  // n8n
  { id: "N8N-001", kind: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 메일 수신 시 제목 키워드를 확인하여 팀장님께 즉시 자동 전달", dept: "IT인프라팀", status: "사용 가능", tags: ["Outlook", "긴급메일"], likes: 22, views: 420, updated: "2026.07.03", path: "/n8n/N8N-001", domain: "IT" },
  { id: "N8N-002", kind: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림 발송", dept: "구매팀", status: "사용 가능", tags: ["구매", "승인알림", "ERP"], likes: 11, views: 210, updated: "2026.06.08", path: "/n8n/N8N-002", domain: "생산" },
  { id: "N8N-003", kind: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", dept: "재무팀", status: "사용 가능", tags: ["매출리포트", "ERP"], likes: 17, views: 380, updated: "2026.06.12", path: "/n8n/N8N-003", domain: "재무" },
  { id: "N8N-004", kind: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", dept: "품질관리팀", status: "준비 중", tags: ["품질관리", "생산"], likes: 5, views: 180, updated: "2026.06.18", path: "/n8n/N8N-004", domain: "생산" },
  { id: "N8N-005", kind: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD·Teams·이메일 계정을 자동 생성하고 환영 메시지 발송", dept: "IT인프라팀", status: "사용 가능", tags: ["HR", "온보딩", "계정자동화"], likes: 13, views: 290, updated: "2026.07.09", path: "/n8n/N8N-005", domain: "HR" },
  // Power Automate
  { id: "PA-001", kind: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동 보관", dept: "경영지원팀", status: "사용 가능", tags: ["SharePoint", "전자결재"], likes: 18, views: 350, updated: "2026.07.01", path: "/pa/PA-001", domain: "재무" },
  { id: "PA-002", kind: "pa", title: "양식 제출 → Teams 알림 플로우", summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송", dept: "인사팀", status: "사용 가능", tags: ["Forms", "Teams", "알림"], likes: 9, views: 240, updated: "2026.06.15", path: "/pa/PA-002", domain: "HR" },
  { id: "PA-003", kind: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동으로 게시", dept: "기획팀", status: "사용 가능", tags: ["Teams", "SharePoint"], likes: 14, views: 310, updated: "2026.07.04", path: "/pa/PA-003", domain: "HR" },
  { id: "PA-004", kind: "pa", title: "재고 부족 알림 자동화", summary: "ERP 재고 수준이 기준치 이하로 내려가면 구매 담당자에게 즉시 Teams 알림 발송", dept: "구매팀", status: "준비 중", tags: ["재고관리", "ERP", "알림"], likes: 7, views: 190, updated: "2026.06.22", path: "/pa/PA-004", domain: "생산" },
  // 나만의 비서
  { id: "AST-001", kind: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", dept: "법무팀", status: "사용 가능", tags: ["법무", "계약서검토"], likes: 32, views: 890, updated: "2026.06.10", path: "/assistant/AST-001", domain: "재무" },
  { id: "AST-002", kind: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", dept: "IT개발팀", status: "사용 가능", tags: ["회의록", "요약"], likes: 23, views: 620, updated: "2026.06.14", path: "/assistant/AST-002", domain: "HR" },
  { id: "AST-003", kind: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", dept: "IT개발팀", status: "준비 중", tags: ["코드리뷰", "GitHub"], likes: 12, views: 280, updated: "2026.06.19", path: "/assistant/AST-003", domain: "IT" },
  { id: "AST-004", kind: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", dept: "메이크업연구소", status: "준비 중", tags: ["원료", "MSDS", "규제정보"], likes: 6, views: 190, updated: "2026.06.20", path: "/assistant/AST-004", domain: "연구" },
  { id: "AST-005", kind: "assistant", title: "영업 제안서 초안 봇", summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성", dept: "영업기획팀", status: "사용 가능", tags: ["제안서", "영업지원"], likes: 15, views: 340, updated: "2026.07.08", path: "/assistant/AST-005", domain: "영업" },
  // AI Agent
  { id: "AIO-001", kind: "ai-orchestration", title: "GPT-5.4", summary: "범용 업무 전반에 무난한 기본 선택지 — 코드 생성·문서 작성·분석에 활용", dept: "DX전략팀", status: "사용 가능", tags: ["범용", "문서작성"], likes: 27, views: 1420, updated: "2026.07.01", path: "/ai-orchestration/AIO-001", domain: "IT" },
  { id: "AIO-002", kind: "ai-orchestration", title: "GPT-5.4 Mini", summary: "단순·반복 작업을 빠르고 저렴하게 처리하는 경량 모델", dept: "DX전략팀", status: "사용 가능", tags: ["저비용", "반복작업"], likes: 14, views: 820, updated: "2026.07.01", path: "/ai-orchestration/AIO-002", domain: "IT" },
  { id: "AIO-003", kind: "ai-orchestration", title: "Claude Opus 4.8", summary: "가장 어려운 문제를 끝까지 푸는 최상위 추론 모델 — 다단계 분석에 최적", dept: "DX전략팀", status: "사용 가능", tags: ["복잡한추론", "다단계분석"], likes: 20, views: 1180, updated: "2026.07.01", path: "/ai-orchestration/AIO-003", domain: "연구" },
  { id: "AIO-004", kind: "ai-orchestration", title: "Claude Sonnet 4.6", summary: "일상 업무에 가장 균형 잡힌 모델 — 문서 분석·요약·작성 전반에 적합", dept: "DX전략팀", status: "사용 가능", tags: ["문서분석", "균형"], likes: 28, views: 1350, updated: "2026.07.01", path: "/ai-orchestration/AIO-004", domain: "IT" },
  // ML 모델
  { id: "ML-001", kind: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", dept: "메이크업연구소", status: "준비 중", tags: ["회귀모델", "색상예측"], likes: 21, views: 460, updated: "2026.06.01", path: "/ml/ML-001", domain: "연구" },
  { id: "ML-002", kind: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측하는 시계열 모델", dept: "구매팀", status: "준비 중", tags: ["수요예측", "시계열"], likes: 9, views: 280, updated: "2026.06.20", path: "/ml/ML-002", domain: "생산" },
  { id: "ML-003", kind: "ml", title: "불량품 이미지 분류 모델", summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델", dept: "품질관리팀", status: "일부 제한", tags: ["이미지분류", "불량검출", "CNN"], likes: 16, views: 320, updated: "2026.07.06", path: "/ml/ML-003", domain: "생산" },
  // Vibe Coding
  { id: "VIBE-001", kind: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", dept: "영업기획팀", status: "사용 가능", tags: ["ERP", "Slack"], likes: 10, views: 220, updated: "2026.07.05", path: "/vibe/VIBE-001", domain: "영업" },
  { id: "VIBE-002", kind: "vibe", title: "원가 분석 자동화 스크립트", summary: "ERP 원가 데이터를 읽어 제품별 원가 분석 리포트를 자동 생성하는 Python 스크립트", dept: "재무팀", status: "준비 중", tags: ["Python", "원가분석"], likes: 7, views: 180, updated: "2026.06.21", path: "/vibe/VIBE-002", domain: "영업" },
  { id: "VIBE-003", kind: "vibe", title: "부서별 KPI 현황판 자동화", summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱", dept: "경영기획팀", status: "사용 가능", tags: ["KPI", "대시보드", "Python"], likes: 13, views: 260, updated: "2026.07.09", path: "/vibe/VIBE-003", domain: "재무" },
];

// TODO: 실제 연동 시 GET /api/v1/stats/by-platform 응답으로 교체
const CATEGORY_COUNTS: Record<CategoryId, number> = {
  n8n: 62, pa: 31, assistant: 48, "ai-orchestration": 12, ml: 23, vibe: 32, etc: 0,
};

const VISIBLE_ITEMS = ALL_ITEMS.filter(i => i.status !== "준비 중");
const top5 = [...VISIBLE_ITEMS].sort((a, b) => b.views - a.views).slice(0, 5);
const itemsByDomain = (d: Domain) => VISIBLE_ITEMS.filter(i => i.domain === d).slice(0, 3);

// ===== 날짜 유틸 (모듈 레벨) =====

const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split(".").map(Number);
  return new Date(y, m - 1, d);
};

/** "오늘" / "N일 전" / "N주 전" / "N개월 전" 상대 시각 */
const relativeTime = (ymd: string): string => {
  const diffMs = Date.now() - parseYmd(ymd).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
};

/** 등록 후 3일 이내 → NEW 표시 */
const isNewItem = (ymd: string): boolean =>
  Date.now() - parseYmd(ymd).getTime() < 3 * 86400000;

// ===== [존 B] 최신 등록 피드 데이터 =====
const LATEST_FEED = [...VISIBLE_ITEMS]
  .sort((a, b) => parseYmd(b.updated).getTime() - parseYmd(a.updated).getTime())
  .slice(0, 12);

// ===== [존 A] 개인화 데이터 =====

// 최근 본 항목 localStorage 키 — 상세 페이지(AssetItemDetailPage 등)에서 조회 시 id 배열을 push하도록 후속 반영 필요
// TODO: AssetItemDetailPage.tsx / ProjectDetailPage.tsx에 기록 로직 추가
const RECENT_VIEWED_KEY = "ax_recent_viewed";

const readRecentViewed = (): FeedItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_VIEWED_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return ids
      .map(id => ALL_ITEMS.find(i => i.id === id))
      .filter((i): i is FeedItem => Boolean(i))
      .slice(0, 4);
  } catch {
    return [];
  }
};

const fillWithRecommended = (viewed: FeedItem[]): { item: FeedItem; recommended: boolean }[] => {
  const viewedIds = new Set(viewed.map(i => i.id));
  const recs = [...VISIBLE_ITEMS]
    .sort((a, b) => b.views - a.views)
    .filter(i => !viewedIds.has(i.id))
    .slice(0, 4 - viewed.length);
  return [
    ...viewed.map(item => ({ item, recommended: false })),
    ...recs.map(item => ({ item, recommended: true })),
  ];
};

// 우리 회사 신규 등록 (관계사 기반)
// TODO: 실제 연동 시 SSO 사용자의 관계사 코드로 GET /api/v1/platform-items?company={code}&sort=recent 호출
const MY_COMPANY_NAME = "콜마홀딩스";
// 콜마홀딩스 소속 mock — 실연동 시 company 필드 필터
const MY_COMPANY_ITEMS: FeedItem[] = [
  ALL_ITEMS.find(i => i.id === "N8N-005")!,
  ALL_ITEMS.find(i => i.id === "VIBE-003")!,
  ALL_ITEMS.find(i => i.id === "AST-005")!,
];
const MY_COMPANY_WEEKLY = MY_COMPANY_ITEMS.filter(i =>
  Date.now() - parseYmd(i.updated).getTime() < 7 * 86400000
).slice(0, 3);

// ===== [존 C] 에디터스 픽 + 활용 후기 + 문의 채널 데이터 =====

// TODO: 실제 연동 시 GET /api/v1/editors-pick 응답으로 교체 (AssetItem에 editorNote 필드 추가 검토)
// null 이면 EmptyHint 표시 (운영자가 아직 선정하지 않은 경우)
const EDITORS_PICK: { item: FeedItem; note: string; editor: string } | null = {
  item: ALL_ITEMS.find(i => i.id === "N8N-005")!,
  note: "입사자 한 명당 30분씩 걸리던 계정 세팅이 이제 0분입니다. 온보딩 자동화의 교과서 같은 사례라 이번 주의 발견으로 선정했습니다.",
  editor: "AX 플랫폼 운영팀",
};

type Review = { text: string; author: string; itemTitle: string; itemPath: string; itemKind: CategoryId };

// TODO: 실제 연동 시 GET /api/v1/reviews/highlights 응답으로 교체
const REVIEWS: Review[] = [
  { text: "회의 끝나고 정리에 쓰던 1시간이 사라졌습니다. 녹취록만 올리면 결정사항이 바로 나옵니다.", author: "IT개발팀", itemTitle: "회의록 요약 봇", itemPath: "/assistant/AST-002", itemKind: "assistant" },
  { text: "계약서 초안 검토 전에 한 번 돌려보는 게 습관이 됐습니다. 위험 조항을 먼저 짚어주니 검토 시간이 절반으로 줄었어요.", author: "법무팀", itemTitle: "법무 검토 보조 봇", itemPath: "/assistant/AST-001", itemKind: "assistant" },
  { text: "매일 아침 Slack에 판매 실적이 도착해 있습니다. 출근하자마자 ERP 열던 루틴이 없어졌습니다.", author: "영업기획팀", itemTitle: "일일 판매 리포트 자동 생성기", itemPath: "/vibe/VIBE-001", itemKind: "vibe" },
  { text: "긴급 메일을 놓쳐서 곤란했던 적이 많았는데, 이제 팀장님께 자동으로 전달되니 마음이 놓입니다.", author: "IT인프라팀", itemTitle: "Outlook 긴급 메일 자동 전달", itemPath: "/n8n/N8N-001", itemKind: "n8n" },
];

// TEAMS_CHANNEL_URL — config/operations.ts 에서 관리 (단일 참조점)

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

const EmptyHint = ({ message, style }: { message: string; style?: React.CSSProperties }) => (
  <div style={{ textAlign: "center", padding: "14px 0", fontSize: 12, color: "#AEB6C2", ...style }}>
    {message}
  </div>
);

/** 공통 흰색 패널 스타일 */
const panelStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 16,
  boxShadow: "0 1px 3px rgba(26,31,39,0.04), 0 8px 24px rgba(26,31,39,0.04)",
};

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

  // 닫힘 유예 — 바~패널 이동 중 커서가 잠깐 벗어나도 즉시 닫히지 않도록 200ms 지연
  const closeTimerRef = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 200);
  };
  // 언마운트 시 타이머 정리 (메모리 누수·언마운트 후 setState 방지)
  useEffect(() => cancelClose, []);

  return (
    <div
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
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

      {/* 호버 확장 패널 — 외부 컨테이너는 바에 바로 붙이고(top:100%) paddingTop 6px로
          바~패널 사이 틈을 투명 호버 브리지로 채운다. 카드 스타일은 내부 div로 이동. */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, width: 320,
          paddingTop: 6, zIndex: 50,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "10px 12px",
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
        </div>
      )}
    </div>
  );
}

/** [존 A] 개인화 스트립 — 이어서 살펴보기 (4칸 고정) + 우리 회사 신규 */
function PersonalStrip({
  recentViewed, onNavigate,
}: {
  recentViewed: FeedItem[];
  onNavigate: (path: string) => void;
}) {
  const slots = fillWithRecommended(recentViewed);
  const companyItems = MY_COMPANY_WEEKLY.length > 0
    ? MY_COMPANY_WEEKLY
    : [...MY_COMPANY_ITEMS]
        .sort((a, b) => parseYmd(b.updated).getTime() - parseYmd(a.updated).getTime())
        .slice(0, 2);
  return (
    <div style={{
      ...panelStyle,
      display: "flex", alignItems: "stretch", flexWrap: "wrap",
      padding: "14px 22px", gap: 0, marginBottom: 16,
    }}>
      {/* 이어서 살펴보기 */}
      <div style={{ flex: "1 1 340px", minWidth: 280, paddingRight: 22 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8A93A2", marginBottom: 8, letterSpacing: "0.02em" }}>
          이어서 살펴보기
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {slots.length === 0
            ? <EmptyHint message="최근 본 항목이 없습니다. 새로운 AI 도구를 둘러보세요." />
            : slots.map(({ item, recommended }) => {
            const s = SOURCE_STYLE[item.kind];
            if (recommended) {
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 13px", borderRadius: 18, cursor: "pointer",
                    background: "#fff", maxWidth: 220,
                    borderTop: "1px dashed #D9DEE6",
                    borderRight: "1px dashed #D9DEE6",
                    borderBottom: "1px dashed #D9DEE6",
                    borderLeft: "1px dashed #D9DEE6",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = s.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", flexShrink: 0 }}>추천</span>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 13px", borderRadius: 18, cursor: "pointer",
                  background: s.bg, maxWidth: 220,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 10px rgba(26,31,39,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 구분선 */}
      <div className="ax-strip-divider" style={{ width: 1, background: "#F0F2F6", margin: "2px 0" }} />

      {/* 우리 회사 신규 */}
      <div style={{ flex: "1 1 340px", minWidth: 280, paddingLeft: 22 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8A93A2", marginBottom: 8, letterSpacing: "0.02em" }}>
          {MY_COMPANY_WEEKLY.length > 0
            ? `${MY_COMPANY_NAME}에 이번 주 ${MY_COMPANY_WEEKLY.length}건이 새로 등록됐습니다`
            : `${MY_COMPANY_NAME}의 최근 등록`}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {companyItems.length === 0
            ? <EmptyHint message={`${MY_COMPANY_NAME}의 최근 등록 항목이 없습니다.`} />
            : companyItems.map(item => {
            const s = SOURCE_STYLE[item.kind];
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 13px", borderRadius: 18, cursor: "pointer",
                  background: "#F4F6F9", maxWidth: 240,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = s.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = "#F4F6F9")}
              >
                <span style={{
                  fontSize: 9.5, fontWeight: 800, color: s.color, background: "#fff",
                  padding: "2px 7px", borderRadius: 8, flexShrink: 0,
                }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1F27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 유형 파스텔 메달리온 — 피드 셀 좌측에 배치 */
function TypeMedallion({
  color, bg, icon, label,
}: {
  color: string; bg: string; icon: Category["icon"]; label: string;
}) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <title>{label}</title>
      <circle cx="22" cy="22" r="22" fill={bg} />
      <path
        d={CATEGORY_ICON_PATH[icon]}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(11 11) scale(0.83)"
      />
    </svg>
  );
}

/** [존 B] 최신 등록 피드 — 유형 메달리온 + 2열 셀 그리드, NEW 맥동 도트 */
function LatestFeed({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div style={{ ...panelStyle, padding: "18px 22px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel>최신 등록</SectionLabel>
      </div>
      <div className="ax-feed-cells" style={{
        display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8,
      }}>
        {LATEST_FEED.map(item => {
          const s = SOURCE_STYLE[item.kind];
          const fresh = isNewItem(item.updated);
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                borderTop: "1px solid #F0F2F6",
                borderRight: "1px solid #F0F2F6",
                borderBottom: "1px solid #F0F2F6",
                borderLeft: "1px solid #F0F2F6",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#F9FAFC";
                e.currentTarget.style.borderTopColor = `${s.color}55`;
                e.currentTarget.style.borderRightColor = `${s.color}55`;
                e.currentTarget.style.borderBottomColor = `${s.color}55`;
                e.currentTarget.style.borderLeftColor = `${s.color}55`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderTopColor = "#F0F2F6";
                e.currentTarget.style.borderRightColor = "#F0F2F6";
                e.currentTarget.style.borderBottomColor = "#F0F2F6";
                e.currentTarget.style.borderLeftColor = "#F0F2F6";
              }}
            >
              <TypeMedallion
                color={s.color}
                bg={s.bg}
                icon={s.icon}
                label={s.label}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: "#1A1F27",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {item.title}
                  </span>
                  {fresh && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#1C6BFF",
                        animation: "axPulse 1.8s ease-in-out infinite",
                      }} />
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: "#1C6BFF" }}>NEW</span>
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 11.5, color: "#697386", marginTop: 2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {item.summary}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                  {item.dept} · {relativeTime(item.updated)} · {item.views.toLocaleString()}회
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** [존 C-1] 금주의 발견 (에디터스 픽) */
function EditorsPickCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  if (!EDITORS_PICK) {
    return (
      <div style={{ ...panelStyle, padding: "20px 22px" }}>
        <SectionLabel>금주의 발견</SectionLabel>
        <EmptyHint message="이번 주의 발견 항목이 아직 선정되지 않았습니다." style={{ paddingTop: 16 }} />
      </div>
    );
  }
  const item = EDITORS_PICK.item;
  const s = SOURCE_STYLE[item.kind];
  return (
    <div
      onClick={() => onNavigate(item.path)}
      style={{
        ...panelStyle,
        background: `linear-gradient(150deg, ${s.bg} 0%, #ffffff 68%)`,
        padding: "20px 22px", cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 26px rgba(26,31,39,0.10)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = panelStyle.boxShadow as string;
      }}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 10.5, fontWeight: 800, color: s.color,
        background: "#fff", padding: "4px 12px", borderRadius: 12,
        boxShadow: "0 1px 4px rgba(26,31,39,0.08)", marginBottom: 12,
        letterSpacing: "0.04em",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill={s.color}>
          <path d="M12 2l2.9 6.26L21 9.27l-4.5 4.38L17.8 20 12 16.77 6.2 20l1.3-6.35L3 9.27l6.1-1.01L12 2z" />
        </svg>
        금주의 발견
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.01em", marginBottom: 8 }}>
        {item.title}
      </div>
      <div style={{ fontSize: 12.5, color: "#4B5768", lineHeight: 1.7, marginBottom: 12 }}>
        {EDITORS_PICK.note}
      </div>
      <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
        {s.label} · {item.dept} · 추천 {EDITORS_PICK.editor}
      </div>
    </div>
  );
}

/** 활용 후기 단일 인용구 블록 — ReviewRotator에서 2건씩 렌더 */
function ReviewQuote({ review, onNavigate }: { review: Review; onNavigate: (path: string) => void }) {
  const s = SOURCE_STYLE[review.itemKind];
  return (
    <div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#D6E4FD" style={{ marginBottom: 6, display: "block" }}>
        <path d="M9.6 5C6 6.8 3.8 9.9 3.8 13.9c0 3 1.9 5.1 4.4 5.1 2.2 0 3.9-1.7 3.9-3.9 0-2.1-1.5-3.6-3.5-3.6-.4 0-.8.1-1 .1.4-2 1.9-3.8 4-4.9L9.6 5zm10 0c-3.6 1.8-5.8 4.9-5.8 8.9 0 3 1.9 5.1 4.4 5.1 2.2 0 3.9-1.7 3.9-3.9 0-2.1-1.5-3.6-3.5-3.6-.4 0-.8.1-1 .1.4-2 1.9-3.8 4-4.9L19.6 5z" />
      </svg>
      <div style={{ fontSize: 13, color: "#1A1F27", lineHeight: 1.75, fontWeight: 500, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
        {review.text}
      </div>
      <div
        onClick={() => onNavigate(review.itemPath)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 10, cursor: "pointer",
          background: "#F9FAFC", transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = s.bg)}
        onMouseLeave={e => (e.currentTarget.style.background = "#F9FAFC")}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1F27", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {review.itemTitle}
        </span>
        <span style={{ fontSize: 10.5, color: "#94A3B8", flexShrink: 0 }}>{review.author}</span>
      </div>
    </div>
  );
}

/** [존 C-2] 활용 후기 로테이션 카드 — 2건 동시 표시, 우측 스택의 남는 높이를 흡수 (flex: 1) */
function ReviewRotator({
  reviews, activeIdx, onNavigate,
}: {
  reviews: Review[];
  activeIdx: number;
  onNavigate: (path: string) => void;
}) {
  if (reviews.length === 0) {
    return (
      <div style={{ ...panelStyle, padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <SectionLabel>활용 후기</SectionLabel>
        <EmptyHint message="등록된 활용 후기가 없습니다." style={{ paddingTop: 16 }} />
      </div>
    );
  }
  const idx = activeIdx % reviews.length;
  const nextIdx = (idx + 1) % reviews.length;
  return (
    <div style={{
      ...panelStyle, padding: "20px 22px", overflow: "hidden",
      flex: 1, display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionLabel>활용 후기</SectionLabel>
        <div style={{ display: "flex", gap: 4 }}>
          {reviews.map((_, i) => (
            <span key={i} style={{
              width: i === idx ? 14 : 5, height: 5, borderRadius: 3,
              background: i === idx ? "#1C6BFF" : "#E2E7EE",
              transition: "width 0.3s, background 0.3s",
            }} />
          ))}
        </div>
      </div>
      <div key={idx} style={{
        animation: "axSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        flex: 1, display: "flex", flexDirection: "column",
      }}>
        <ReviewQuote review={reviews[idx]} onNavigate={onNavigate} />
        <div style={{ height: 1, background: "#F0F2F6", margin: "14px 0" }} />
        <ReviewQuote review={reviews[nextIdx]} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/** [존 C-3] 문의 채널 카드 — Teams 채널 문의 진입 */
function AskChannelCard() {
  const { showNotice } = useShareNotice();
  return (
    <div style={{
      ...panelStyle,
      background: "linear-gradient(150deg, #EDF3FE 0%, #ffffff 72%)",
      padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      {/* Teams 채팅 아이콘 */}
      <div style={{
        width: 44, height: 44, borderRadius: 13, background: "#fff", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(28,107,255,0.12)",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C6BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1A1F27", marginBottom: 3 }}>
          궁금한 점이 있으신가요?
        </div>
        <div style={{ fontSize: 11.5, color: "#697386", lineHeight: 1.55 }}>
          사용 방법, 등록 문의, 아이디어 제안까지 — AX 플랫폼 Teams 채널에서 편하게 대화로 나눠요.
        </div>
      </div>
      {IS_SHARE_MODE ? (
        // 공유 모드: 사내 전용 Teams 링크 비활성 — href 제거, 클릭 시 안내, 톤을 회색으로 낮춤
        <button
          type="button"
          onClick={() => showNotice()}
          style={{
            flexShrink: 0, border: "none", cursor: "pointer",
            background: "#E2E8F0", color: "#697386",
            fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 20,
          }}
        >
          채널 열기
        </button>
      ) : (
        <a
          href={TEAMS_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0, textDecoration: "none",
            background: "#1C6BFF", color: "#fff",
            fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 20,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1558D6")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1C6BFF")}
        >
          채널 열기
        </a>
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

  // 활용 후기 로테이션 (7초)
  const [reviewIdx, setReviewIdx] = useState(0);
  useEffect(() => {
    if (REVIEWS.length === 0) return;
    const t = setInterval(() => setReviewIdx(v => (v + 1) % REVIEWS.length), 7000);
    return () => clearInterval(t);
  }, []);

  // 이어서 살펴보기 (localStorage, 마운트 시 1회 로드)
  const [recentViewed, setRecentViewed] = useState<FeedItem[]>([]);
  useEffect(() => {
    setRecentViewed(readRecentViewed());
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(search.trim() ? `/projects?q=${encodeURIComponent(search.trim())}` : "/projects");
  };

  const spotlightDomain = DOMAINS[domainIdx];
  const spotlightItems = itemsByDomain(spotlightDomain);

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* [1단] 헤더: 인사 + 검색 + 실시간 인기 바 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "18px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {user ? `${user.name}님, 반갑습니다` : "반갑습니다"}
            </div>
            <div style={{ fontSize: 12, color: "#697386", marginTop: 2 }}>
              그룹의 자동화·AI 자산 {STAT_CARDS[0].value}건이 기다리고 있습니다
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 260, maxWidth: 560, position: "relative" }}>
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

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "20px 32px 48px", width: "100%", boxSizing: "border-box" }}>

        {/* [2단] 지표 그라디언트 4카드 */}
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
        <div style={{ ...panelStyle, overflow: "hidden", marginBottom: 16 }}>

          {/* 3-1. 유형별 둘러보기 */}
          <div style={{ padding: "18px 26px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionLabel>유형별 둘러보기</SectionLabel>
            </div>
            <div className="ax-type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {CATEGORIES.map(p => (
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
                      {CATEGORY_COUNTS[p.id]}
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
              </div>
            </div>

            {/* 세로 슬라이드 전환: 새 콘텐츠가 아래에서 위로 부드럽게 올라옴 */}
            <div style={{ overflow: "hidden" }}>
              <div key={spotlightDomain} className="ax-domain-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
                animation: "axSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
              }}>
                {spotlightItems.length === 0 ? (
                  <EmptyHint message="아직 등록된 항목이 없습니다. 첫 등록의 주인공이 되어보세요." style={{ gridColumn: "1 / -1" }} />
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

        {/* ========== 하단 60% ========== */}

        {/* [존 A] 개인화 스트립 */}
        <PersonalStrip recentViewed={recentViewed} onNavigate={navigate} />

        {/* [존 B + C] 좌: 최신 등록 피드 / 우: 금주의 발견 + 활용 후기 + 문의 채널 */}
        <div className="ax-bottom-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "stretch" }}>
          <LatestFeed onNavigate={navigate} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <EditorsPickCard onNavigate={navigate} />
            <ReviewRotator reviews={REVIEWS} activeIdx={reviewIdx} onNavigate={navigate} />
            <AskChannelCard />
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
        /* NEW 도트 맥동 */
        @keyframes axPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(28,107,255,0.35); }
          50%      { box-shadow: 0 0 0 4px rgba(28,107,255,0); }
        }
        @media (max-width: 1200px) {
          .ax-stat-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .ax-type-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .ax-domain-grid { grid-template-columns: 1fr !important; }
          .ax-bottom-grid { grid-template-columns: 1fr !important; }
          .ax-feed-cells  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .ax-strip-divider { display: none !important; }
        }
        @media (max-width: 760px) {
          .ax-type-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}