/* ============================================================
   파일: src/pages/PlatformItemDetailPage.tsx
   경로: /n8n/:itemId, /assistant/:itemId, /ai-orchestration/:itemId

   ★ 이번 변경 사항 ★
   1. PlatformItem.company(소속/대상 관계사) 표시 추가
      - 헤더 메타정보 줄: "· 대상 관계사: 한국콜마 외 2곳" 형태로 요약
      - 개요 탭 "출처" 카드 옆에 "대상 관계사" 카드 신설 — 전체
        관계사 리스트를 칩 형태로 펼쳐 보여줌(전사 공용이면 안내문)
   2. MOCK_ITEMS 전체 항목에 company 필드 채움 (타입에 필수 필드로
      추가되어 있었으나 목업 데이터에는 누락되어 있었음)
   ============================================================ */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformItem } from "../types/platformTypes";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

const COST_TIER_COLOR: Record<string, { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#FEF3C7", color: "#92400E" },
  "높음": { bg: "#FEE2E2", color: "#991B1B" },
};

const POST_TAGS = ["공지", "Q&A", "이슈제보", "건의"] as const;
type PostTag = typeof POST_TAGS[number];

const POST_TAG_COLOR: Record<PostTag, { bg: string; color: string }> = {
  "공지": { bg: "#DBEAFE", color: "#1E40AF" },
  "Q&A": { bg: "#FEF3C7", color: "#92400E" },
  "이슈제보": { bg: "#FEE2E2", color: "#991B1B" },
  "건의": { bg: "#F5F3FF", color: "#6D28D9" },
};

type Post = {
  id: number;
  author: string;
  dept: string;
  date: string;
  tag: PostTag;
  text: string;
  likes: number;
  likedByMe: boolean;
};

// ★ 신규 — company 표시용 29개 전체 관계사 (AdminOrg.tsx/ProjectRegisterPage.tsx와 동일 소스)
// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체
const FULL_COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HKN", name: "에이치케이이노엔" },
  { code: "YWK", name: "연우" }, { code: "KAF", name: "근오농림" },
  { code: "NAB", name: "넥스트앤바이오" }, { code: "HC", name: "콜마생활건강" },
  { code: "HNG", name: "에치엔지" }, { code: "MOD", name: "엠오디머티리얼즈" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" },
  { code: "KUX", name: "콜마유엑스" }, { code: "KMW", name: "무석콜마" },
  { code: "KMB", name: "북경콜마" }, { code: "KBJ", name: "강소콜마" },
  { code: "KAY", name: "연태콜마" }, { code: "HKV", name: "한국헬스케어베너" },
  { code: "PLT", name: "플래닛147" }, { code: "LSL", name: "레스리" },
  { code: "LOD", name: "라우드랩스" }, { code: "KMP", name: "콜마헬스케어필리핀" },
  { code: "KMS", name: "에이치케이콜마싱가포르" }, { code: "KML", name: "콜마랩스" },
  { code: "KUS", name: "미국콜마" }, { code: "KCA", name: "캐나다콜마" },
  { code: "HKJ", name: "에이치케이글로벌퍼팩" }, { code: "KMM", name: "에이치케이콜마말레이시아" },
  { code: "KBT", name: "콜마바이오텍" },
];

// 헤더 메타정보 줄용 — 짧은 요약
const companyShortDisplay = (codes: string[]): string => {
  if (codes.length === 0) return "전사 공용";
  const names = codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);
  if (names.length <= 2) return names.join(", ");
  return `${names[0]} 외 ${names.length - 1}곳`;
};

// "대상 관계사" 카드용 — 전체 이름 배열
const companyFullNames = (codes: string[]): string[] =>
  codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);

// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 응답으로 교체
const MOCK_ITEMS: PlatformItem[] = [
  { id: "N8N-001", platformId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", description: "HR 시스템에 신규 입사자가 등록되면 Active Directory 계정, Teams 채널 초대, 사내 이메일 계정을 자동으로 생성하고 담당 부서에 알림을 발송합니다.", status: "운영 중", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["HR", "계정자동화", "온보딩"], specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05", likes: 19, company: ["KKM"] },
  { id: "N8N-002", platformId: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림", description: "구매 시스템에서 발주 요청이 생성되면 승인자에게 Teams 메시지로 즉시 알림을 보내고, 승인/반려 결과를 발주 시스템에 자동 반영합니다.", status: "운영 중", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7, company: ["KKM"] },
  { id: "N8N-003", platformId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", description: "ERP 매출 데이터를 집계하여 매일 오전 경영진 메일링 리스트에 전일 매출 요약 리포트를 자동으로 발송합니다.", status: "운영 중", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12, company: ["KKM", "KMG"] },
  { id: "N8N-004", platformId: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", description: "생산 품질관리 시스템에서 기준치 이탈이 감지되면 품질관리팀, 생산본부, 관련 연구소에 동시에 Teams 알림을 발송합니다.", status: "파일럿", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3, company: ["KMW"] },
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "업로드된 계약서 초안에서 표준 계약서와 다른 조항, 위험 요소가 있는 조항을 자동으로 식별하고 검토 포인트를 제시합니다.", status: "운영 중", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25, company: [] },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "Teams 회의 녹음 파일 또는 자막을 업로드하면 핵심 논의 내용, 결정 사항, 액션 아이템을 구조화하여 정리해줍니다.", status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18, company: [] },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "Pull Request가 생성되면 코드 스타일, 잠재적 버그, 보안 이슈를 자동으로 분석하여 리뷰 코멘트를 남깁니다.", status: "개발 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10, company: [] },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "원료명을 입력하면 MSDS 정보, 국가별 사용 제한 규제, 과거 클레임 이력을 통합 조회하여 답변합니다.", status: "파일럿", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5, company: ["KKM"] },
  {
    id: "AIO-001", platformId: "ai-orchestration", title: "GPT-4 (범용)", summary: "범용 작업에 적합한 OpenAI GPT-4 모델",
    description: "다양한 업무 전반에 활용 가능한 범용 모델입니다. 코드 생성, 문서 작성, 데이터 분석 보조 등에 적합합니다.\n\n권장 활용처: 사내 보고서 초안 작성, 코드 스니펫 생성, 일반 문의 응대",
    status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["범용", "코드생성", "문서작성"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4", updatedAt: "2025.06.10", likes: 31, company: [],
    modelMeta: { provider: "OpenAI", contextWindow: "128K", strengths: ["범용성", "코드 생성", "빠른 응답"], costTier: "보통" },
  },
  {
    id: "AIO-002", platformId: "ai-orchestration", title: "Claude (문서 분석 특화)", summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다.\n\n권장 활용처: 장문 계약서·보고서 분석, 다단계 추론이 필요한 의사결정 보조",
    status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["문서분석", "긴컨텍스트", "법무"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude", updatedAt: "2025.06.12", likes: 27, company: [],
    modelMeta: { provider: "Anthropic", contextWindow: "200K", strengths: ["긴 컨텍스트", "정밀 추론", "안전성"], costTier: "보통" },
  },
  {
    id: "AIO-003", platformId: "ai-orchestration", title: "콜마 파인튜닝 모델 (사내 전용 용어 특화)", summary: "콜마 사내 용어와 제품 데이터로 파인튜닝된 전용 모델",
    description: "화장품 원료명, 사내 제품 코드, 콜마 그룹 조직 용어 등을 정확히 이해하는 사내 전용 모델입니다.\n\n권장 활용처: 원료/제품 코드가 포함된 업무 문의, 사내 용어가 많은 문서 처리",
    status: "파일럿", dept: "IT개발팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["사내전용", "화장품용어", "원료데이터"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/kolmar-ft", updatedAt: "2025.06.18", likes: 8, company: ["KKM", "KBH", "KMG"],
    modelMeta: { provider: "사내 파인튜닝", contextWindow: "32K", strengths: ["콜마 전용 용어", "원료 데이터 이해"], costTier: "낮음" },
  },
  {
    id: "AIO-004", platformId: "ai-orchestration", title: "Gemini (멀티모달)", summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델",
    description: "용기 디자인 이미지 분석, 도면 검토 등 이미지와 텍스트를 함께 다루는 작업에 적합합니다.\n\n권장 활용처: 용기 디자인 시안 검토, 도면·이미지가 포함된 자료 분석",
    status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["멀티모달", "이미지분석", "도면검토"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gemini", updatedAt: "2025.06.15", likes: 14, company: [],
    modelMeta: { provider: "Google", contextWindow: "1M", strengths: ["멀티모달", "이미지 분석"], costTier: "보통" },
  },
];

// 항목별 mock 게시글 (실 연동 시 GET /api/v1/platform-items/:id/posts)
const MOCK_POSTS_BY_ITEM: Record<string, Post[]> = {
  "N8N-001": [
    { id: 1, author: "이서현", dept: "IT인프라팀", date: "2025.06.05", tag: "공지", text: "워크플로우 운영 시작했습니다. 계정 생성 누락 시 IT인프라팀으로 바로 알려주세요.", likes: 4, likedByMe: false },
  ],
  "AST-001": [
    { id: 1, author: "강현우", dept: "법무팀", date: "2025.06.11", tag: "Q&A", text: "영문 계약서도 검토가 가능한가요?", likes: 2, likedByMe: false },
  ],
  "AIO-002": [
    { id: 1, author: "정태영", dept: "IT개발팀", date: "2025.06.13", tag: "공지", text: "Claude 컨텍스트 윈도우가 200K로 확장되었습니다. 장문 계약서 분석 시 분할 업로드 없이 한 번에 처리 가능합니다.", likes: 9, likedByMe: false },
  ],
};

export default function PlatformItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const item = MOCK_ITEMS.find(i => i.id === itemId);
  const platform = item ? PLATFORMS.find(p => p.id === item.platformId)! : null;

  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "contact" | "posts">("overview");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes ?? 0);
  const [posts, setPosts] = useState<Post[]>(item ? (MOCK_POSTS_BY_ITEM[item.id] ?? []) : []);
  const [postText, setPostText] = useState("");
  const [postTag, setPostTag] = useState<PostTag>("Q&A");

  if (!item || !platform) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>
        항목을 찾을 수 없습니다. (id: {itemId})
      </div>
    );
  }

  const isModel = !!item.modelMeta;
  const detailTabLabel = isModel ? "모델 사양" : "상세 동작";
  const isCompanyWide = (item.company ?? []).length === 0;

  const TABS = [
    { id: "overview" as const, label: "개요" },
    { id: "detail" as const, label: detailTabLabel },
    { id: "contact" as const, label: "담당자" },
    { id: "posts" as const, label: `업데이트 & 논의 ${posts.length}` },
  ];

  const toggleLike = () => {
    setLiked(v => !v);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const togglePostLike = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
      : p
    ));
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    setPosts(prev => [{
      id: Date.now(), author: "김철수", dept: "IT개발팀", date: "2025.06.29",
      tag: postTag, text: postText, likes: 0, likedByMe: false,
    }, ...prev]);
    setPostText("");
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#2563EB", fontWeight: 500 }}>Tech Hub</span>
          <span>/</span>
          <span onClick={() => navigate(`/projects?q=${encodeURIComponent(platform.name)}`)} style={{ cursor: "pointer", color: "#64748B" }}>{platform.name}</span>
          <span>/</span>
          <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.title}</span>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "28px 32px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: STATUS_COLOR[item.status].bg, color: STATUS_COLOR[item.status].color, padding: "3px 10px", borderRadius: 20 }}>
                  {item.status}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, background: platform.bg, color: platform.color, padding: "3px 10px", borderRadius: 20 }}>
                  {platform.name}
                </span>
                {isModel && (
                  <>
                    <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>{item.modelMeta!.provider}</span>
                  </>
                )}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
                {item.title}
              </h1>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, maxWidth: 640 }}>
                {item.summary}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button onClick={toggleLike} style={{
                background: liked ? "#FEF2F2" : "#fff",
                border: `1.5px solid ${liked ? "#FCA5A5" : "#E2E8F0"}`,
                borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: liked ? "#DC2626" : "#475569", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "#DC2626" : "none"} stroke={liked ? "#DC2626" : "#64748B"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {likeCount}
              </button>
              <button onClick={() => setActiveTab("contact")} style={{
                background: "#fff", color: "#475569",
                border: "1.5px solid #E2E8F0", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                담당자 연락
              </button>
              <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                background: platform.color, color: "#fff",
                border: "none", borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {platform.id === "n8n" ? "워크플로우 실행" : platform.id === "assistant" ? "에이전트 실행" : "모델 사용"} →
              </button>
            </div>
          </div>

          {/* ★ 변경 — 메타정보 줄에 대상 관계사 요약 추가 */}
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#94A3B8", paddingBottom: 16, flexWrap: "wrap" }}>
            <span>등록 부서 {item.dept}</span>
            <span>·</span>
            <span>최종 수정 {item.updatedAt}</span>
            <span>·</span>
            <span>플랫폼 {platform.name}</span>
            <span>·</span>
            <span>대상 관계사 {companyShortDisplay(item.company ?? [])}</span>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 4 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none", cursor: "pointer",
                color: activeTab === tab.id ? "#2563EB" : "#64748B",
                borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px" }}>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
            <div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>설명</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>출처</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, background: platform.bg, color: platform.color, padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
                    {platform.name}
                  </span>
                  <span style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "4px 12px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    {platform.shortDesc}
                  </span>
                </div>
              </div>

              {/* ★ 신규 — 대상 관계사 카드 (전체 리스트) */}
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>대상 관계사</div>
                {isCompanyWide ? (
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                    특정 관계사로 한정되지 않은 <strong>전사 공용</strong> 항목입니다.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {companyFullNames(item.company ?? []).map((name, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 12px", borderRadius: 6, border: "1px solid #BFDBFE" }}>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>문서 및 링크</div>
                <a href={item.specificUrl} target="_blank" rel="noreferrer" style={{
                  fontSize: 12, color: "#2563EB", fontWeight: 500,
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {platform.id === "n8n" ? "n8n 워크플로우 바로가기" : platform.id === "assistant" ? "에이전트 바로가기" : "모델 게이트웨이 바로가기"}
                </a>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>태그</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {item.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#F8FAFC", color: "#64748B", padding: "3px 8px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "detail" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {isModel ? (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>모델 사양</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>제공사</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.modelMeta!.provider}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>컨텍스트 윈도우</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.modelMeta!.contextWindow}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>비용 등급</div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    background: COST_TIER_COLOR[item.modelMeta!.costTier].bg,
                    color: COST_TIER_COLOR[item.modelMeta!.costTier].color,
                    padding: "5px 14px", borderRadius: 20,
                  }}>
                    {item.modelMeta!.costTier}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>강점</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.modelMeta!.strengths.map((s, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#F5F3FF", color: "#6D28D9", padding: "5px 12px", borderRadius: 20 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                  <span onClick={() => navigate(`/projects?q=${encodeURIComponent(platform.name)}`)} style={{ fontSize: 12, color: "#2563EB", fontWeight: 600, cursor: "pointer" }}>
                    다른 AI 모델과 비교해보기 →
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>상세 동작</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#0F172A", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.owner[0]}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{item.owner}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>
                        담당자
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{item.dept}</div>
                  </div>
                </div>
                <a href={`mailto:${item.ownerEmail}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
                    padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#475569",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    이메일
                  </button>
                </a>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                {item.ownerEmail}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#64748B" }}>
              공지·질문·이슈제보·건의를 자유롭게 남길 수 있는 공간입니다. 담당자 직접 문의는 담당자 탭을 이용하세요.
            </div>

            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
                아직 등록된 글이 없습니다.
              </div>
            )}

            {posts.map(p => (
              <div key={p.id} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "#E2E8F0", color: "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.author[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{p.author}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.dept}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: POST_TAG_COLOR[p.tag].bg, color: POST_TAG_COLOR[p.tag].color,
                          padding: "1px 8px", borderRadius: 20,
                        }}>
                          {p.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#CBD5E1", flexShrink: 0 }}>{p.date}</span>
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, paddingLeft: 38, marginBottom: 10 }}>
                  {p.text}
                </div>
                <div style={{ paddingLeft: 38 }}>
                  <button onClick={() => togglePostLike(p.id)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, padding: "3px 8px",
                    borderRadius: 6, color: p.likedByMe ? "#DC2626" : "#94A3B8",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={p.likedByMe ? "#DC2626" : "none"} stroke={p.likedByMe ? "#DC2626" : "#94A3B8"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.likes}</span>
                  </button>
                </div>
              </div>
            ))}

            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>글 작성</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {POST_TAGS.map(tag => (
                  <button key={tag} onClick={() => setPostTag(tag)} style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${postTag === tag ? POST_TAG_COLOR[tag].color : "#E2E8F0"}`,
                    background: postTag === tag ? POST_TAG_COLOR[tag].bg : "#fff",
                    color: postTag === tag ? POST_TAG_COLOR[tag].color : "#94A3B8",
                  }}>
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="공지, 질문, 이슈, 건의 등 자유롭게 남겨주세요."
                style={{
                  width: "100%", boxSizing: "border-box", minHeight: 80,
                  padding: "12px 14px", fontSize: 13, color: "#0F172A",
                  border: "1.5px solid #E2E8F0", borderRadius: 8, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={handlePost} style={{
                  background: "#2563EB", color: "#fff", border: "none", borderRadius: 7,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}