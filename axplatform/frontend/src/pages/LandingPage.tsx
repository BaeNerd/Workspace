import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { CATEGORIES, CATEGORY_ICON_PATH, BUSINESS_DOMAINS } from "../types/categoryTypes";
import type { CategoryId, Category, BusinessDomain } from "../types/categoryTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { TEAMS_CHANNEL_URL } from "../config/operations";
import { IS_SHARE_MODE } from "../config/shareMode";
import { useShareNotice } from "../context/ShareNoticeContext";

// ============================================================================
// LandingPage — Next.js 원본(_incoming-landing/app/page.tsx) 포팅 + 신 체계 정합화
// ----------------------------------------------------------------------------
// 포팅 규약:
//  - "use client"/next/link/next/image/next/font 제거 → Vite SPA + 인라인 스타일
//  - useRouter → useNavigate, next/image → <img>, lucide/tabler 아이콘 → 인라인 SVG
//  - motion/react 애니메이션 → CSS 키프레임 + rAF/IntersectionObserver 재현(외부 의존 0)
// 정합화 규약(신 체계):
//  - 카테고리 = CATEGORIES(7종), 심볼 = CategoryId, 항목 ID = {PREFIX}-{YYYY}-{NNN}
//  - 운영 상태 표시/필터 없음, 항목 실행 URL 없음, 관계사(그룹사) 표시 없음, 용어 "카테고리"
//  - 목업 항목 ID·제목은 ProjectListPage의 MOCK_ASSET_ITEMS와 일치
// ============================================================================

// ── 디자인 토큰(원본 globals.css의 CSS 변수를 리터럴로 옮김) ──
const C = {
  primary: "#2D73F4", primaryHover: "#1E5FD8", primaryWeak: "#E7F0FF",
  text: "#1F2937", text2: "#4B5563", text3: "#9CA3AF",
  border: "#E5E7EB", bgSubtle: "#F3F5F7", page: "#FAFBFF",
};
// 원본 .whShadow-box 그림자
const SHADOW = "2.5px 4.33px 29px 0px rgba(0,0,0,0.06)";
const card: React.CSSProperties = { background: "#fff", borderRadius: 16, boxShadow: SHADOW };
const headingFont = "var(--font-heading)";

// ── 카테고리별 미디어/씬 매핑 (구 6종 에셋 → 신 7종) ──
// 원본 배너/아이콘 에셋은 구 id(ml·hkgpt·chatbot·n8n·power-automate·vibe-coding) 기준이라
// 신 CategoryId로 다시 매핑한다. etc(AI 프로젝트)는 전용 에셋이 없어 SVG 아이콘으로 폴백.
type Scene = "beam" | "orbit" | "list" | "terminal";
const CAT_MEDIA: Record<CategoryId, { banner?: string; icon?: string; scene: Scene }> = {
  "n8n":              { banner: "/banner/banner_n8n.png",     icon: "/icons/icon_n8n.png",  scene: "beam" },
  "pa":               { banner: "/banner/banner_pad.png",     icon: "/icons/icon_pad.png",  scene: "beam" },
  "assistant":        { banner: "/banner/banner_chatbot.png",                               scene: "list" },
  "ai-orchestration": { banner: "/banner/banner_hk.png",      icon: "/icons/icon_hk.png",   scene: "orbit" },
  "ml":               { banner: "/banner/banner_ml.png",      icon: "/icons/icon_ml.png",   scene: "orbit" },
  "vibe":             { banner: "/banner/banner_vibe.png",    icon: "/icons/icon_vibe.png", scene: "terminal" },
  "etc":              {                                                                     scene: "list" },
};

// 배너 홍보 카피 — 카테고리별 소개 문구(신 체계 용어로 정합화, 브랜드/관계사 지칭 배제)
const PROMO_COPY: Partial<Record<CategoryId, { title: string; desc: string; cta: string }>> = {
  "n8n":              { title: "반복 업무, 워크플로우 하나로 끝", desc: "클릭 몇 번으로 이어지는 n8n 자동화 워크플로우를 둘러보세요", cta: "n8n 살펴보기" },
  "ai-orchestration": { title: "업무에 맞는 AI 모델, 한눈에", desc: "AI Agent 카탈로그에서 필요한 모델을 골라 바로 활용하세요", cta: "AI Agent 보기" },
  "pa":               { title: "MS 365와 찰떡, Power Automate", desc: "Outlook·Excel·Teams를 잇는 자동화 흐름을 바로 시작하세요", cta: "Power Automate 보기" },
  "assistant":        { title: "내 업무만 알아서 돕는 나만의 비서", desc: "프롬프트로 다듬은 나만의 AI 비서로 회의록 요약부터 보고서 초안까지", cta: "나만의 비서 만들기" },
  "ml":               { title: "데이터가 답을 알려드립니다", desc: "머신러닝으로 실무 문제를 예측하고 자동화한 사례를 만나보세요", cta: "ML 모델 보기" },
  "vibe":             { title: "대화하듯 코드를 짜다", desc: "AI와 대화하며 완성하는 바이브 코딩 노하우를 확인하세요", cta: "Vibe Coding 보기" },
};

// 카테고리별 등록 수 (통계/막대그래프/타일용)
// TODO: 실제 연동 시 GET /api/v1/stats/by-category 응답으로 교체
const CATEGORY_COUNTS: Record<CategoryId, number> = {
  "n8n": 62, "pa": 31, "assistant": 48, "ai-orchestration": 12, "ml": 23, "vibe": 32, "etc": 9,
};
const TOTAL_COUNT = Object.values(CATEGORY_COUNTS).reduce((a, b) => a + b, 0);
const MONTHLY_NEW = 18; // TODO: 실제 연동 시 통계 API 값으로 교체

// 카테고리 스타일 인덱스
const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string; icon: Category["icon"] }> =
  Object.fromEntries(CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name, icon: p.icon }]));

// ── 목업 항목 (ProjectListPage MOCK_ASSET_ITEMS와 ID·제목 일치) ──
// TODO: 실제 연동 시 GET /api/v1/platform-items 응답으로 교체
type LItem = {
  id: string; categoryId: CategoryId; title: string; summary: string;
  dept: string; likes: number; updated: string; domain?: BusinessDomain;
};
const LANDING_ITEMS: LItem[] = [
  { id: "N8N-2026-001", categoryId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", dept: "IT인프라팀", likes: 19, updated: "2025.06.05", domain: "IT" },
  { id: "N8N-2026-005", categoryId: "n8n", title: "Outlook 긴급 메일 자동 전달", summary: "긴급 키워드 메일 수신 시 팀장에게 즉시 자동 전달", dept: "IT인프라팀", likes: 22, updated: "2025.07.03", domain: "IT" },
  { id: "N8N-2026-003", categoryId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", dept: "재무팀", likes: 12, updated: "2025.06.12", domain: "재무" },
  { id: "N8N-2026-006", categoryId: "n8n", title: "주간 재고 현황 자동 취합", summary: "매주 월요일 각 창고의 재고 데이터를 취합해 경영진에게 요약 메일 발송", dept: "구매팀", likes: 8, updated: "2025.07.02", domain: "생산" },
  { id: "N8N-2026-008", categoryId: "n8n", title: "생산 실적 KPI 일일 집계", summary: "생산 시스템에서 라인별 실적을 자동 집계해 품질·생산팀에 공유", dept: "품질관리팀", likes: 10, updated: "2025.07.05", domain: "생산" },
  { id: "PA-2026-001", categoryId: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동으로 보관", dept: "경영지원팀", likes: 12, updated: "2025.07.01", domain: "재무" },
  { id: "PA-2026-003", categoryId: "pa", title: "팀 주간 보고서 Teams 자동 게시", summary: "SharePoint에 업로드된 주간 보고서를 매주 월요일 Teams 채널에 자동 게시", dept: "기획팀", likes: 14, updated: "2025.07.04", domain: "HR" },
  { id: "PA-2026-005", categoryId: "pa", title: "계약 만료 사전 알림 플로우", summary: "계약 만료 30일·7일 전 계약 담당자에게 자동으로 갱신 알림 이메일 발송", dept: "법무팀", likes: 11, updated: "2025.07.06", domain: "재무" },
  { id: "AST-2026-001", categoryId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", dept: "법무팀", likes: 25, updated: "2025.06.10", domain: "재무" },
  { id: "AST-2026-002", categoryId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", dept: "IT개발팀", likes: 18, updated: "2025.06.14", domain: "IT" },
  { id: "AST-2026-005", categoryId: "assistant", title: "영업 제안서 초안 봇", summary: "고객사 정보와 요구사항을 입력하면 맞춤형 제안서 초안을 자동 생성", dept: "영업기획팀", likes: 15, updated: "2025.07.02", domain: "영업" },
  { id: "AST-2026-006", categoryId: "assistant", title: "HR 정책 문답 봇", summary: "복리후생·휴가·규정 등 HR 정책 질문에 즉시 답변하는 직원용 Q&A 봇", dept: "인사팀", likes: 20, updated: "2025.07.01", domain: "HR" },
  { id: "AIO-2026-003", categoryId: "ai-orchestration", title: "Claude Opus 4.8", summary: "가장 어려운 문제를 끝까지 푸는 데 강한 최상위 모델입니다.", dept: "DX전략팀", likes: 29, updated: "2026.07.01" },
  { id: "AIO-2026-004", categoryId: "ai-orchestration", title: "Claude Sonnet 4.6", summary: "일상 업무의 기본기가 가장 균형 잡힌 모델입니다.", dept: "DX전략팀", likes: 35, updated: "2026.07.01" },
  { id: "AIO-2026-010", categoryId: "ai-orchestration", title: "웍스 대표 모델", summary: "무엇을 골라야 할지 모를 때 쓰는 사내 기본 모델입니다.", dept: "DX전략팀", likes: 44, updated: "2026.07.01" },
  { id: "ML-2026-001", categoryId: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", dept: "메이크업연구소", likes: 21, updated: "2025.06.01", domain: "연구" },
  { id: "ML-2026-004", categoryId: "ml", title: "처방 성분 상호작용 예측 모델", summary: "의약품 성분 조합의 부작용 가능성을 예측하는 분류 모델", dept: "건강기능식품연구소", likes: 12, updated: "2025.06.15", domain: "연구" },
  { id: "ML-2026-003", categoryId: "ml", title: "불량품 이미지 분류 모델", summary: "생산 라인 카메라 이미지로 불량품을 실시간 자동 판별하는 CNN 모델", dept: "품질관리팀", likes: 16, updated: "2025.07.06", domain: "생산" },
  { id: "ML-2026-005", categoryId: "ml", title: "판매 채널별 수요 예측 모델", summary: "온라인·오프라인·홈쇼핑 채널별 제품 수요를 동시에 예측하는 다변량 시계열 모델", dept: "영업기획팀", likes: 9, updated: "2025.07.07", domain: "영업" },
  { id: "VIBE-2026-001", categoryId: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", dept: "영업기획팀", likes: 8, updated: "2025.07.05", domain: "영업" },
  { id: "VIBE-2026-003", categoryId: "vibe", title: "부서별 KPI 현황판 자동화", summary: "Excel KPI 데이터를 읽어 자동으로 부서별 성과 대시보드를 그려주는 Python 앱", dept: "경영기획팀", likes: 13, updated: "2025.07.06", domain: "HR" },
  { id: "VIBE-2026-004", categoryId: "vibe", title: "커피 룰렛 웹앱", summary: "팀원 명단을 업로드하면 커피 당번을 무작위 선정하는 인트라넷 미니앱", dept: "마케팅팀", likes: 31, updated: "2025.06.20", domain: "영업" },
  { id: "VIBE-2026-005", categoryId: "vibe", title: "ECM 멀티 파일 다운로더", summary: "ECM에서 여러 파일을 한 번에 선택하고 다운로드하는 유틸리티 프로그램", dept: "IT인프라팀", likes: 24, updated: "2025.07.04", domain: "IT" },
];

// 최신소식 — 정적 목업. 공지/업데이트 관리 화면이 없어 표시만 구현.
// [후속: 관리자 기능 필요] 공지사항·업데이트 소식 등록/관리 기능 (L2에서 처리 예정)
const LATEST_NEWS = [
  { tag: "공지사항", title: "[공지] AX 플랫폼 정기 점검 안내", date: "2026.07.10" },
  { tag: "공지사항", title: "[공지] 항목 등록 가이드라인 개정 안내", date: "2026.07.03" },
  { tag: "공지사항", title: "[공지] AI Agent 카탈로그 모델 업데이트 안내", date: "2026.06.25" },
  { tag: "업데이트", title: "[업데이트] n8n 자동화 워크플로우 30종 추가", date: "2026.06.18" },
  { tag: "업데이트", title: "[업데이트] 모바일 화면 UI 개선 안내", date: "2026.06.05" },
] as const;
type NewsTag = (typeof LATEST_NEWS)[number]["tag"];

// 업무 도메인 칩 색상
const DOMAIN_CHIP: Record<BusinessDomain, { bg: string; fg: string }> = {
  "영업": { bg: "#FBEEE4", fg: "#B4602E" },
  "생산": { bg: "#E8F0FE", fg: "#2563C9" },
  "연구": { bg: "#E2F5F7", fg: "#0E7490" },
  "재무": { bg: "#E6F5EC", fg: "#1F7A46" },
  "HR":   { bg: "#F0EAFB", fg: "#6D4BC4" },
  "IT":   { bg: "#EDF0F4", fg: "#4B5768" },
};

const detailPath = (item: LItem): string => {
  const cat = CATEGORIES.find(c => c.id === item.categoryId)!;
  return `${cat.path}/${item.id}`;
};

// ===========================================================================
// 인라인 SVG 아이콘 (lucide/tabler 대체) — stroke=currentColor, 부모 color로 채색
// ===========================================================================
type IconProps = { size?: number; color?: string; fill?: string };
const Ico = ({ d, size = 16, color = "currentColor", fill = "none", sw = 2 }: IconProps & { d: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const ArrowRight = (p: IconProps) => <Ico {...p} d="M5 12h14M13 6l6 6-6 6" />;
const ChevronLeft = (p: IconProps) => <Ico {...p} d="M15 18l-6-6 6-6" />;
const ChevronRight = (p: IconProps) => <Ico {...p} d="M9 18l6-6-6-6" />;
const SearchIco = (p: IconProps) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const HeartIco = ({ size = 12, color = "#94A3B8", fill = "none" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2} style={{ flexShrink: 0 }}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const UserIco = (p: IconProps) => <Ico {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const SparklesIco = (p: IconProps) => <Ico {...p} d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />;
const DocIco = (p: IconProps) => <Ico {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h6" />;
const PlusSquareIco = (p: IconProps) => <Ico {...p} d="M4 4h16v16H4zM12 8v8M8 12h8" />;
const LogoutIco = (p: IconProps) => <Ico {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />;
const PlusIco = (p: IconProps) => <Ico {...p} d="M12 5v14M5 12h14" />;
const ChatIco = (p: IconProps) => <Ico {...p} d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const BookIco = (p: IconProps) => <Ico {...p} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5z" />;

// ===========================================================================
// 애니메이션 유틸 컴포넌트
// ===========================================================================

/** 스크롤 진입 시 0→value 카운트업 (rAF, once). motion NumberTicker 대체. */
function NumberTicker({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(value); return; }
    let raf = 0;
    let done = false;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || done) return;
        done = true;
        const dur = 1400, t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
    }, { threshold: 0 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{n.toLocaleString()}</span>;
}

/** 회전 헤드라인 — 세로 롤 + 폭 전환 (원본 RotatingHeadline 로직 그대로, next/image 제거) */
const ROTATING = ["자동화 워크플로우", "AI Agent 활용법", "업무 자동화 아이디어", "머신러닝 예측 모델", "바이브 코딩 예제", "나만의 AI 비서"];
const RN = ROTATING.length;
const ROTATING_LOOP = [...ROTATING, ROTATING[0]];
function RotatingHeadline() {
  const [step, setStep] = useState(0);
  const [instant, setInstant] = useState(false);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setStep(s => s + 1), 2800);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (step === RN) {
      const t = setTimeout(() => { setInstant(true); setStep(0); }, 500);
      return () => clearTimeout(t);
    }
    if (step === 0 && instant) {
      const t = setTimeout(() => setInstant(false), 50);
      return () => clearTimeout(t);
    }
  }, [step, instant]);
  useLayoutEffect(() => { setWidth(itemRefs.current[step]?.offsetWidth); }, [step]);

  return (
    <h1 style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 6,
      textAlign: "center", fontWeight: 300, fontSize: 34, color: "#2d2d2d", margin: 0, lineHeight: 1.3,
    }}>
      <span>나에게 맞는</span>
      <span style={{
        position: "relative", display: "inline-block", height: "1.3em", overflow: "hidden",
        verticalAlign: "middle", width,
        transition: instant ? "none" : "width 0.5s ease-out",
      }}>
        <span style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          fontWeight: 500, color: C.primary,
          transform: `translateY(-${(100 / (RN + 1)) * step}%)`,
          transition: instant ? "none" : "transform 0.5s ease-out",
        }}>
          {ROTATING_LOOP.map((term, i) => (
            <span key={i} ref={el => { itemRefs.current[i] = el; }}
              style={{ display: "flex", height: "1.3em", alignItems: "center", whiteSpace: "nowrap" }}>
              {term}
            </span>
          ))}
        </span>
      </span>
      <span>찾고 계신가요?</span>
    </h1>
  );
}

/** 배너 배경 씬 — 원본 category-backgrounds의 경량 CSS 재현(마스크 뒤 은은한 플러시). */
function BannerScene({ scene, color }: { scene: Scene; color: string }) {
  const wrap: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
    display: "flex", alignItems: "center", justifyContent: "center",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 4%, #000 24%, #000 76%, transparent 98%)",
    maskImage: "linear-gradient(to bottom, transparent 4%, #000 24%, #000 76%, transparent 98%)",
    paddingBottom: 72, paddingLeft: 24, paddingRight: 24,
  };
  if (scene === "beam") {
    // 3개 소스 노드 → 1개 중심으로 흐르는 빔 (stroke-dashoffset 애니)
    return (
      <div style={wrap}>
        <svg viewBox="0 0 220 150" width="100%" height="100%" style={{ maxWidth: 320 }}>
          {[30, 75, 120].map((y, i) => (
            <g key={i}>
              <path d={`M40 ${y} C 100 ${y}, 120 75, 170 75`} fill="none" stroke={color} strokeWidth="2"
                strokeDasharray="4 6" style={{ animation: `axDash ${2.4 + i * 0.4}s linear infinite` }} opacity={0.7} />
              <circle cx="40" cy={y} r="9" fill="#fff" stroke={color} strokeWidth="2" />
            </g>
          ))}
          <circle cx="170" cy="75" r="13" fill="#fff" stroke={color} strokeWidth="2.5" />
        </svg>
      </div>
    );
  }
  if (scene === "orbit") {
    return (
      <div style={wrap}>
        <div style={{ position: "relative", width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: color, opacity: 0.85 }} />
          {[{ s: 96, d: 16, r: false }, { s: 140, d: 26, r: true }].map((o, i) => (
            <div key={i} style={{
              position: "absolute", width: o.s, height: o.s, borderRadius: "50%",
              border: `1.5px dashed ${color}`, opacity: 0.6,
              animation: `axSpin ${o.d}s linear infinite${o.r ? " reverse" : ""}`,
            }}>
              <span style={{ position: "absolute", top: -5, left: "50%", marginLeft: -5, width: 10, height: 10, borderRadius: "50%", background: "#fff", border: `2px solid ${color}` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (scene === "list") {
    return (
      <div style={{ ...wrap, flexDirection: "column", gap: 10, alignItems: "stretch", maxWidth: 260, margin: "0 auto" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            animation: `axChip 4.5s ease-in-out ${i * 0.6}s infinite`,
          }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${color}22`, flexShrink: 0 }} />
            <span style={{ height: 6, flex: 1, borderRadius: 3, background: C.bgSubtle }} />
          </div>
        ))}
      </div>
    );
  }
  // terminal
  return (
    <div style={wrap}>
      <div style={{
        width: "100%", maxWidth: 300, background: "#0F172A", borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#EF4444", "#F59E0B", "#10B981"].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
        </div>
        <span style={{ height: 6, width: "70%", borderRadius: 3, background: "#334155", overflow: "hidden", position: "relative" }}>
          <span style={{ position: "absolute", inset: 0, background: color, transformOrigin: "left", animation: "axType 3.2s ease-in-out infinite" }} />
        </span>
        <span style={{ height: 6, width: "45%", borderRadius: 3, background: "#334155" }} />
        <span style={{ display: "inline-block", width: 8, height: 12, background: color, animation: "axBlink 1s step-end infinite" }} />
      </div>
    </div>
  );
}

// 카테고리 아이콘(에셋 PNG 또는 SVG 폴백)
function CatIcon({ id, size }: { id: CategoryId; size: number }) {
  const media = CAT_MEDIA[id];
  const cat = CATEGORIES.find(c => c.id === id)!;
  if (media.icon) return <img src={media.icon} alt="" style={{ width: size, height: size, objectFit: "contain" }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={CATEGORY_ICON_PATH[cat.icon]} />
    </svg>
  );
}

// ===========================================================================
// [섹션 1] 프로모션 배너 슬라이더 + 개인화 패널
// ===========================================================================
const PROMO_ORDER: CategoryId[] = ["n8n", "ai-orchestration", "pa", "assistant", "ml", "vibe"];
const PROMO_SLIDES = PROMO_ORDER.map(id => {
  const cat = CATEGORIES.find(c => c.id === id)!;
  return { id, color: cat.color, bg: cat.bg, banner: CAT_MEDIA[id].banner!, scene: CAT_MEDIA[id].scene, ...PROMO_COPY[id]! };
});

function PromoAndPanel({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user, logout } = useAuth();
  const [slide, setSlide] = useState(0);
  const N = PROMO_SLIDES.length;
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % N), 5000);
    return () => clearInterval(t);
  }, [N]);
  const cur = PROMO_SLIDES[slide];

  return (
    <div className="ax-promo-row" style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
      {/* 배너 슬라이더 */}
      <div
        onClick={() => onNavigate(`/projects?platform=${cur.id}`)}
        style={{
          position: "relative", flex: 1, minWidth: 0, minHeight: 220, height: 460,
          overflow: "hidden", borderRadius: 22, background: "#F3F5F4", cursor: "pointer",
          display: "flex",
        }}
      >
        {/* 배경 일러스트 (오른쪽 정렬, 왼쪽 페이드) */}
        <img src={cur.banner} alt="" style={{
          position: "absolute", right: 0, top: 0, height: "100%", width: "auto", maxWidth: "none",
          userSelect: "none", pointerEvents: "none",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
          maskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
        }} />
        {/* 왼쪽 카피 + 씬 플러시 */}
        <div key={cur.id} style={{
          position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
          width: "100%", maxWidth: 520, padding: 32, overflow: "hidden",
          animation: "axFadeUp 0.5s ease-out",
        }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ margin: 0, maxWidth: 420, fontSize: 24, fontWeight: 700, lineHeight: 1.35, color: C.text }}>{cur.title}</h2>
            <p style={{ margin: "8px 0 0", maxWidth: 420, fontSize: 14, color: C.text2, lineHeight: 1.6 }}>{cur.desc}</p>
          </div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <BannerScene scene={cur.scene} color={cur.color} />
          </div>
          <span style={{
            position: "relative", zIndex: 1, display: "inline-flex", width: "fit-content", alignItems: "center", gap: 6,
            borderRadius: 9999, background: "#fff", padding: "8px 16px", fontSize: 14, fontWeight: 600, color: cur.color,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}>
            {cur.cta}<ArrowRight size={14} color={cur.color} />
          </span>
        </div>
        {/* 슬라이더 컨트롤 */}
        <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 8 }}
          onClick={e => e.stopPropagation()}>
          <button type="button" aria-label="이전 배너" onClick={() => setSlide(s => (s - 1 + N) % N)} style={sliderBtn}>
            <ChevronLeft size={16} color={C.text} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.text2 }}>{slide + 1} / {N}</span>
          <button type="button" aria-label="다음 배너" onClick={() => setSlide(s => (s + 1) % N)} style={sliderBtn}>
            <ChevronRight size={16} color={C.text} />
          </button>
        </div>
      </div>

      {/* 개인화 패널 (관계사 표시 없음) */}
      <div className="ax-promo-panel" style={{
        display: "flex", flexDirection: "column", width: 364, flexShrink: 0, height: 460,
        borderRadius: 22, background: "#E2ECFE", padding: "35px 30px", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserIco size={20} color={C.primary} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.53, color: C.text }}>
              {user ? `${user.name}님, 환영합니다!` : "환영합니다!"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>{user ? user.dept : "AX 플랫폼"}</p>
          </div>
        </div>

        {/* 개인화 지표 — TODO: [후속] 개인화 API 연동(관심/추천). 현재는 정적 표시 */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
          <div onClick={() => onNavigate("/projects")} style={panelRow}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, color: C.text2 }}>
              <HeartIco size={16} color={C.text3} /> 관심 있는 항목
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: C.text }}>
              3개 <ArrowRight size={14} color={C.text3} />
            </span>
          </div>
          <div onClick={() => onNavigate("/projects")} style={panelRow}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, color: C.text2 }}>
              <SparklesIco size={16} color={C.text3} /> 나에게 추천하는 항목
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: C.primary }}>
              12개 <ArrowRight size={14} color={C.text3} />
            </span>
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, borderTop: "1px solid #CDD1D5", paddingTop: 16 }}>
          <QuickAction icon={<DocIco size={16} />} label="내 등록 현황" onClick={() => onNavigate("/my-status")} />
          <QuickAction icon={<PlusSquareIco size={16} />} label="항목 등록" onClick={() => onNavigate("/projects/new")} />
          <QuickAction icon={<LogoutIco size={16} />} label="로그아웃" onClick={() => { logout(); onNavigate("/"); }} />
        </div>
      </div>
    </div>
  );
}
const sliderBtn: React.CSSProperties = {
  display: "flex", height: 28, width: 28, alignItems: "center", justifyContent: "center",
  borderRadius: "50%", background: "rgba(0,0,0,0.08)", border: "none", cursor: "pointer",
};
const panelRow: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  borderBottom: "1px solid #CDD1D5", padding: "20px 0", fontSize: 15, cursor: "pointer",
};
function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 0",
      borderRadius: 8, color: C.text3, cursor: "pointer", transition: "background 0.15s, color 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = C.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.text3; }}>
      {icon}
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ===========================================================================
// [섹션 2] 아이콘 히어로 — 회전 헤드라인 + 검색 + 카테고리 타일
// ===========================================================================
function IconHero({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [query, setQuery] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(`/projects${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };
  return (
    // 원본 .section2 배경 이미지(bg_sec2.png)는 에셋 미포함 → 은은한 그라디언트로 대체
    // [확인 필요] 히어로 배경 이미지(bg_sec2.png) 원본 에셋 제공 여부
    <section style={{ position: "relative", paddingTop: 24 }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 290, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(1200px 300px at 50% -40%, #E7F0FF 0%, rgba(231,240,255,0) 70%)",
      }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, paddingBottom: 40 }}>
        <RotatingHeadline />

        <form onSubmit={submit} style={{
          position: "relative", marginTop: 32, display: "flex", width: "100%", maxWidth: 680,
          alignItems: "center", gap: 8, borderRadius: 9999, background: "#fff", padding: 4,
          border: `2px solid ${C.primary}`, boxShadow: "2.5px 4.33px 6px 0px rgba(0,0,0,0.09)",
        }}>
          <span style={{ marginLeft: 12, display: "flex" }}><SearchIco size={20} color={C.text3} /></span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="AI Agent, 업무 자동화, n8n..."
            style={{
              flex: 1, height: 54, background: "transparent", fontSize: 18, color: C.text,
              border: "none", outline: "none", padding: "0 8px", minWidth: 0,
            }}
          />
          <button type="submit" aria-label="검색" style={{
            display: "flex", height: 43, width: 43, flexShrink: 0, alignItems: "center", justifyContent: "center",
            borderRadius: "50%", background: C.primary, color: "#fff", border: "none", cursor: "pointer",
          }}>
            <ArrowRight size={16} color="#fff" />
          </button>
        </form>

        <div className="ax-cat-grid" style={{
          marginTop: 56, display: "grid", width: "100%", gridTemplateColumns: "repeat(7, 1fr)", gap: 16,
        }}>
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/projects?platform=${cat.id}`)}
              style={{
                position: "relative", display: "flex", flexDirection: "column", overflow: "hidden",
                borderRadius: 16, padding: "24px 20px 96px", background: cat.bg, cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "none")}
            >
              <span style={{ fontSize: 13, color: C.text2, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {cat.shortDesc}
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600, color: cat.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cat.name}
              </p>
              <div style={{ position: "absolute", bottom: 12, right: 12, opacity: 0.9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CatIcon id={cat.id} size={56} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// [섹션 3] 플랫폼 현황 — 총 항목 카운터 + 카테고리별 막대
// ===========================================================================
function PlatformStatus({ onNavigate }: { onNavigate: (p: string) => void }) {
  const barsRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setTimeout(() => setFilled(true), 300); });
    }, { rootMargin: "-100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const sorted = [...CATEGORIES].sort((a, b) => CATEGORY_COUNTS[b.id] - CATEGORY_COUNTS[a.id]);
  const max = CATEGORY_COUNTS[sorted[0].id] || 1;

  return (
    <div ref={barsRef} className="ax-status-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
      {/* 좌: 총 항목 수 */}
      <div style={{ ...card, position: "relative", overflow: "hidden", padding: 30, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: -32, right: 24, width: 160, height: 160, borderRadius: "50%", background: C.primaryWeak }} />
          <div style={{ position: "absolute", top: 40, right: 112, width: 112, height: 112, borderRadius: "50%", background: C.primaryWeak }} />
        </div>
        <p style={{ position: "relative", zIndex: 1, margin: "0 0 16px", fontFamily: headingFont, fontSize: 34, fontWeight: 300, color: C.text }}>
          <span style={{ fontWeight: 500 }}>플랫폼</span>에 쌓인 항목
        </p>
        <p style={{ position: "relative", zIndex: 1, margin: 0, fontSize: 60, fontWeight: 700, lineHeight: 1, color: C.text }}>
          <NumberTicker value={TOTAL_COUNT} /><span style={{ marginLeft: 4, fontSize: 24, fontWeight: 600 }}>건</span>
        </p>
        <p style={{ position: "relative", zIndex: 1, margin: "12px 0 0", fontSize: 16, fontWeight: 700, color: C.primary }}>
          이번 달 +{MONTHLY_NEW}건 · 7개 카테고리 운영
        </p>
        <button onClick={() => onNavigate("/projects")} style={{
          position: "relative", zIndex: 1, marginTop: 24, width: "fit-content", display: "inline-flex", alignItems: "center", gap: 6,
          borderRadius: 12, background: C.primary, color: "#fff", border: "none", padding: "10px 16px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          전체 항목 보기 <ArrowRight size={16} color="#fff" />
        </button>
      </div>

      {/* 우: 카테고리별 막대 */}
      <div style={{ ...card, overflow: "hidden", padding: 30, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: "0 0 16px", fontFamily: headingFont, fontSize: 34, fontWeight: 300, color: C.text }}>
          <span style={{ fontWeight: 500 }}>카테고리</span>별 항목
        </p>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
          {sorted.map((cat, i) => {
            const target = (CATEGORY_COUNTS[cat.id] / max) * 100;
            return (
              <div key={cat.id}>
                <div style={{ marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: C.text }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                    {cat.name}
                  </span>
                  <span style={{ color: C.text3 }}>{CATEGORY_COUNTS[cat.id]}</span>
                </div>
                <div style={{ height: 8, width: "100%", overflow: "hidden", borderRadius: 9999, background: C.bgSubtle }}>
                  <div style={{
                    height: "100%", borderRadius: 9999, background: cat.color,
                    width: `${filled ? target : 0}%`,
                    transition: "width 1s ease-out", transitionDelay: `${i * 100}ms`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// 항목 카드 (인기/업무별 공용)
// ===========================================================================
function ItemCard({ item, onNavigate }: { item: LItem; onNavigate: (p: string) => void }) {
  const s = SOURCE_STYLE[item.categoryId];
  return (
    <div
      onClick={() => onNavigate(detailPath(item))}
      style={{ ...card, display: "flex", flexDirection: "column", padding: 24, cursor: "pointer", transition: "transform 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "none")}
    >
      <span style={{ marginBottom: 8, width: "fit-content", display: "inline-flex", alignItems: "center", borderRadius: 9999, padding: "2px 10px", fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
        {s.label}
      </span>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {item.title}
      </h3>
      <p style={{ margin: "8px 0 0", flex: 1, fontSize: 12, color: C.text2, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {item.summary}
      </p>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text3 }}>
          <UserIco size={12} color={C.text3} /> {item.dept}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.text3 }}>
          <HeartIco size={12} /> {item.likes}
        </span>
      </div>
    </div>
  );
}

const SectionTitle = ({ emphasis, rest, after }: { emphasis: string; rest: string; after?: string }) => (
  <h2 style={{ margin: 0, fontFamily: headingFont, fontSize: 34, fontWeight: 300, color: C.text }}>
    <span style={{ fontWeight: 500 }}>{emphasis}</span>{rest}{after}
  </h2>
);

const FilterChip = ({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{
    borderRadius: 9999, padding: "8px 16px", fontSize: 16, fontWeight: 400, border: "none", cursor: "pointer",
    background: active ? (color ?? C.primary) : "#fff",
    color: active ? "#fff" : C.text2,
    transition: "background 0.15s, color 0.15s",
  }}>{label}</button>
);

const MoreLink = ({ onClick }: { onClick: () => void }) => (
  <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: C.text2 }}>
      더보기 <ArrowRight size={14} color={C.text2} />
    </button>
  </div>
);

// ===========================================================================
// [섹션 4] 인기 항목 (카테고리 필터)
// ===========================================================================
function PopularItems({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [cat, setCat] = useState<CategoryId | null>(null);
  const filtered = cat ? LANDING_ITEMS.filter(i => i.categoryId === cat) : LANDING_ITEMS;
  const top = [...filtered].sort((a, b) => b.likes - a.likes).slice(0, 6);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 8 }}>
        <SectionTitle emphasis="인기" rest=" 항목" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <FilterChip label="전체" active={cat === null} onClick={() => setCat(null)} />
          {CATEGORIES.map(c => (
            <FilterChip key={c.id} label={c.name} active={cat === c.id} color={c.color} onClick={() => setCat(c.id)} />
          ))}
        </div>
      </div>
      {top.length === 0 ? (
        <div style={{ ...card, marginTop: 16, padding: "64px 0", textAlign: "center", fontSize: 14, fontWeight: 600, color: C.text }}>
          등록된 항목이 없어요
        </div>
      ) : (
        <div key={cat ?? "all"} className="ax-card-grid" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, animation: "axFadeUp 0.4s ease-out" }}>
          {top.map(item => <ItemCard key={item.id} item={item} onNavigate={onNavigate} />)}
        </div>
      )}
      <MoreLink onClick={() => onNavigate(cat ? `/projects?platform=${cat}` : "/projects")} />
    </div>
  );
}

// ===========================================================================
// [섹션 5] 업무별 항목 (도메인 필터)
// ===========================================================================
function ItemsByDomain({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [dom, setDom] = useState<BusinessDomain | null>(null);
  const filtered = dom ? LANDING_ITEMS.filter(i => i.domain === dom) : LANDING_ITEMS;
  const top = [...filtered].sort((a, b) => b.likes - a.likes).slice(0, 6);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 8 }}>
        <SectionTitle emphasis="업무별" rest=" 항목" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <FilterChip label="전체" active={dom === null} onClick={() => setDom(null)} />
          {BUSINESS_DOMAINS.map(d => (
            <FilterChip key={d} label={d} active={dom === d} color={DOMAIN_CHIP[d].fg} onClick={() => setDom(d)} />
          ))}
        </div>
      </div>
      {top.length === 0 ? (
        <div style={{ ...card, marginTop: 16, padding: "64px 0", textAlign: "center", fontSize: 14, fontWeight: 600, color: C.text }}>
          등록된 항목이 없어요
        </div>
      ) : (
        <div key={dom ?? "all"} className="ax-card-grid" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, animation: "axFadeUp 0.4s ease-out" }}>
          {top.map(item => <ItemCard key={item.id} item={item} onNavigate={onNavigate} />)}
        </div>
      )}
      <MoreLink onClick={() => onNavigate(dom ? `/projects?domain=${dom}` : "/projects")} />
    </div>
  );
}

// ===========================================================================
// [섹션 6] 최신소식(정적) + 실시간 인기 항목
// ===========================================================================
function LatestNewsAndTrending({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [tab, setTab] = useState<NewsTag>("공지사항");
  const news = LATEST_NEWS.filter(n => n.tag === tab);
  const trending = [...LANDING_ITEMS].sort((a, b) => b.likes - a.likes).slice(0, 5);
  return (
    <div className="ax-news-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* 최신소식 */}
      <div style={{ ...card, padding: 30 }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle emphasis="최신" rest="소식" />
          {/* [후속: 관리자 기능 필요] 공지/업데이트 관리 화면 없음 — 링크 비활성 */}
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, color: C.text3 }}>
            더보기
            <span style={{ display: "flex", width: 20, height: 20, alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `1px solid ${C.text3}` }}>
              <PlusIco size={12} color={C.text3} />
            </span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", width: 112, flexShrink: 0, flexDirection: "column", gap: 8 }}>
            {(["공지사항", "업데이트"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                borderRadius: 9999, padding: "8px 16px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                background: tab === t ? C.primary : "#fff", color: tab === t ? "#fff" : C.text2,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            {news.map((n, i) => (
              <div key={n.title} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 0",
                borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 14, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
                <span style={{ flexShrink: 0, fontSize: 12, color: C.text3 }}>{n.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 실시간 인기 항목 */}
      <div style={{ ...card, padding: 30 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle emphasis="실시간 인기" rest=" 항목" />
          <button onClick={() => onNavigate("/projects")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.text3 }}>
            더보기
            <span style={{ display: "flex", width: 20, height: 20, alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `1px solid ${C.text3}` }}>
              <PlusIco size={12} color={C.text3} />
            </span>
          </button>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {trending.map((item, i) => {
            const s = SOURCE_STYLE[item.categoryId];
            return (
              <div key={item.id} onClick={() => onNavigate(detailPath(item))} style={{
                display: "flex", alignItems: "center", gap: 12, borderRadius: 9999, padding: "10px 16px",
                fontSize: 14, cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bgSubtle)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ width: 16, flexShrink: 0, fontWeight: 700, color: C.text3 }}>{i + 1}</span>
                <span style={{ flexShrink: 0, borderRadius: 9999, padding: "2px 8px", fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                <span style={{ flex: 1, minWidth: 0, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
                <span style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 4, fontSize: 12, color: C.text3 }}>
                  <HeartIco size={13} /> {item.likes}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// [섹션 7] 시작 도우미 CTA
// ===========================================================================
function CtaBoxes({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { showNotice } = useShareNotice();
  const boxes: {
    image?: string; icon?: React.ReactNode; label: string; desc: string;
    bg: string; onClick: () => void;
  }[] = [
    { image: "/cta/cta_kolling.png", label: "AX 플랫폼 둘러보기", desc: "카테고리별 자동화·AI 자산을 한눈에", bg: "#DBEAFE", onClick: () => onNavigate("/projects") },
    { icon: <SparklesIco size={24} color="#0EA5E9" />, label: "AI Agent 카탈로그", desc: "업무에 맞는 AI 모델을 골라 바로 사용", bg: "#E0F2FE", onClick: () => onNavigate("/projects?platform=ai-orchestration") },
    // [후속: 관리자 기능 필요] 이용 가이드 콘텐츠/화면 없음 — 링크 비활성
    { icon: <BookIco size={24} color="#F43F5E" />, label: "이용 가이드", desc: "AX 플랫폼 활용법 살펴보기", bg: "#FEE2E2", onClick: () => {} },
    {
      icon: <ChatIco size={24} color="#10B981" />, label: "문의 채널", desc: "궁금한 점은 Teams 채널에서 문의하세요", bg: "#DCFCE7",
      onClick: () => { if (IS_SHARE_MODE) showNotice(); else window.open(TEAMS_CHANNEL_URL, "_blank", "noopener,noreferrer"); },
    },
  ];
  return (
    <div style={{ paddingTop: 8 }}>
      <SectionTitle emphasis="무엇부터" rest=" 시작할까요?" />
      <div className="ax-cta-grid" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {boxes.map(box => (
          <div key={box.label} onClick={box.onClick} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "32px 24px", cursor: "pointer",
            borderRadius: "24px 24px 64px 24px", background: box.bg, transition: "transform 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
            <div style={{
              display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center",
              ...(box.image ? { width: 72, height: 72 } : { width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }),
            }}>
              {box.image ? <img src={box.image} alt="" style={{ width: 72, height: 72, objectFit: "contain" }} /> : box.icon}
            </div>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{box.label}</span>
              <span style={{ fontSize: 13, color: C.text2 }}>{box.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// 페이지
// ===========================================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const go = (p: string) => navigate(p);

  return (
    <div style={{ fontFamily: "var(--font-landing)", background: C.page, minHeight: "100vh", color: C.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "32px 32px 48px", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 40 }}>
        <PromoAndPanel onNavigate={go} />
        <IconHero onNavigate={go} />
        <PlatformStatus onNavigate={go} />
        {/* 원본 섹션4 배경 이미지(bg_sec4.png)는 에셋 미포함 → 생략. [확인 필요] 원본 에셋 제공 여부 */}
        <PopularItems onNavigate={go} />
        <LatestNewsAndTrending onNavigate={go} />
        <ItemsByDomain onNavigate={go} />
        <CtaBoxes onNavigate={go} />
        {/* 원본 PartnerMarquee(관계사 로고 마퀴)는 신 체계 '관계사 표시 금지'로 제거함 */}
      </div>

      <style>{`
        @keyframes axSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes axDash { to { stroke-dashoffset: -40; } }
        @keyframes axChip { 0%, 100% { opacity: 0.35; transform: translateY(6px); } 50% { opacity: 1; transform: translateY(0); } }
        @keyframes axBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes axType { 0% { transform: scaleX(0); } 60%, 100% { transform: scaleX(1); } }
        @keyframes axFadeUp { from { opacity: 0.3; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1100px) {
          .ax-promo-row   { flex-direction: column !important; }
          .ax-promo-panel { width: 100% !important; height: auto !important; }
          .ax-cat-grid    { grid-template-columns: repeat(4, 1fr) !important; }
          .ax-status-grid { grid-template-columns: 1fr !important; }
          .ax-card-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .ax-news-grid   { grid-template-columns: 1fr !important; }
          .ax-cta-grid    { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 680px) {
          .ax-cat-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .ax-card-grid { grid-template-columns: 1fr !important; }
          .ax-cta-grid  { grid-template-columns: 1fr !important; }
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
