// ===== types/categoryTypes.ts =====

export type CategoryId = "n8n" | "pa" | "assistant" | "ai-orchestration" | "ml" | "vibe" | "etc";

// ============================================================
// 아이콘 프리셋 레지스트리 (라벨 + 24x24 stroke 라인 아이콘 path)
// ------------------------------------------------------------
// 기존 6개 키(automation…vibe)는 CATEGORY_ICON_PATH와 동일한 path를 그대로 포함(데이터 호환).
// AdminCategories의 아이콘 선택지·미리보기는 이 레지스트리를 단일 소스로 참조한다.
// Record<string, …>로 두어 keyof(=IconKey)가 문자열이 되게 하며, 이로써 기존
// CATEGORY_ICON_PATH(Record<Category["icon"], string> = Record<string,string>)의
// 6개 매핑이 그대로 유효하다(추가 키 요구 없음).
// TODO: 실제 연동 시 서버 아이콘 카탈로그로 교체.
// ============================================================
export const ICON_PRESETS: Record<string, { label: string; path: string }> = {
  // ── 기존 6종 (키·path 변경 금지) ──
  automation:    { label: "자동화 (번개)",            path: "M13 2L3 14h7l-1 8 10-12h-7l1-8z" },
  assistant:     { label: "비서 (원형)",              path: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01" },
  orchestration: { label: "오케스트레이션 (그리드)",  path: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" },
  pa:            { label: "Power Automate (화살표)",  path: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4m14 6V17a4 4 0 00-4-4H3" },
  ml:            { label: "ML 모델 (큐브)",           path: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" },
  vibe:          { label: "Vibe Coding (코드)",       path: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  // ── 신규 프리셋 ──
  bot:        { label: "봇 (로봇)",       path: "M12 3v3 M7 6h10a1 1 0 011 1v9a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1z M10 11v2 M14 11v2 M3 11v3 M21 11v3" },
  document:   { label: "문서",            path: "M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M8 13h8 M8 17h6" },
  barChart:   { label: "차트 (막대)",     path: "M3 21h18 M7 21V11 M12 21V6 M17 21v-8" },
  lineChart:  { label: "차트 (선)",       path: "M4 4v16h16 M8 15l3-4 3 2 4-6" },
  branch:     { label: "흐름 (분기)",     path: "M7 4a2 2 0 100 4 2 2 0 000-4z M7 8v8 M7 16a2 2 0 100 4 2 2 0 000-4z M17 6a2 2 0 100 4 2 2 0 000-4z M17 10c0 4-10 1-10 6" },
  database:   { label: "데이터베이스",    path: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" },
  settings:   { label: "설정 (슬라이더)", path: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M2 14h4 M10 8h4 M18 16h4" },
  chat:       { label: "채팅",            path: "M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  search:     { label: "검색 (돋보기)",   path: "M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3" },
  calendar:   { label: "캘린더",          path: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  mail:       { label: "메일",            path: "M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z M22 7l-10 7L2 7" },
  cloud:      { label: "클라우드",        path: "M7 19a4 4 0 01-.8-7.9 5.5 5.5 0 0110.7-1.6A3.5 3.5 0 0117 19H7z" },
  shield:     { label: "보안 (방패)",     path: "M12 3l7 3v5c0 4-3 7-7 8.5C8 17 5 14 5 10V6z M9.5 11.5l2 2 3.5-3.5" },
  puzzle:     { label: "연동 (퍼즐)",     path: "M10 4a2 2 0 014 0v1h3a1 1 0 011 1v3h1a2 2 0 010 4h-1v3a1 1 0 01-1 1h-3v-1a2 2 0 00-4 0v1H6a1 1 0 01-1-1v-3H4a2 2 0 010-4h1V6a1 1 0 011-1h4z" },
  etc:        { label: "AI 프로젝트 (블로그/문서)", path: "M5 3h10l4 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z M15 3v4h4 M8 12h7 M8 16h7" },
};

// 아이콘 키 — ICON_PRESETS 레지스트리 기반 (Record<string,…>이므로 string)
export type IconKey = keyof typeof ICON_PRESETS;

export type Category = {
  id: CategoryId;
  name: string;
  shortDesc: string;
  path: string;
  accessUrl: string | null;
  color: string;
  bg: string;
  icon: IconKey;
};

export const CATEGORIES: Category[] = [
  { id: "n8n", name: "n8n", shortDesc: "업무 자동화 워크플로우 플랫폼", path: "/n8n", accessUrl: "https://n8n.kolmar.co.kr", color: "#EA580C", bg: "#FFF7ED", icon: "automation" },
  { id: "pa", name: "Power Automate", shortDesc: "클라우드 플로우와 데스크톱 자동화(RPA)를 아우르는 Microsoft 자동화 도구", path: "/pa", accessUrl: null, color: "#0078D4", bg: "#EFF6FF", icon: "pa" },
  { id: "assistant", name: "나만의 비서", shortDesc: "HK GPT를 프롬프트·역할로 커스터마이징해 동료와 공유하는 개인/팀 에이전트", path: "/assistant", accessUrl: "https://assistant.kolmar.co.kr", color: "#2563EB", bg: "#DBEAFE", icon: "assistant" },
  { id: "ai-orchestration", name: "AI Model", shortDesc: "업무 니즈에 맞는 AI 모델을 골라 쓰는 사내 모델 카탈로그(HK GPT)", path: "/ai-orchestration", accessUrl: "https://ai-gateway.kolmar.co.kr", color: "#7C3AED", bg: "#F5F3FF", icon: "orchestration" },
  { id: "ml", name: "ML 모델", shortDesc: "특정 플랫폼에 속하지 않는 독립 머신러닝 모델", path: "/ml", accessUrl: null, color: "#0891B2", bg: "#ECFEFF", icon: "ml" },
  { id: "vibe", name: "Vibe Coding", shortDesc: "AI 코딩 도구로 직접 개발된 독립 소프트웨어·자동화 스크립트", path: "/vibe", accessUrl: null, color: "#DB2777", bg: "#FDF2F8", icon: "vibe" },
  { id: "etc", name: "AI 프로젝트", shortDesc: "팀에서 구축한 AI 시스템·서비스 사례를 블로그 형식으로 소개", path: "/etc", accessUrl: null, color: "#475569", bg: "#F1F5F9", icon: "etc" },
];

// ===== 항목 ID 체계 =====
// 형식: {PREFIX}-{YYYY}-{NNN} (예: N8N-2026-001)
// 원칙: 카테고리별·연도별 독립 순번 / 결번 재사용 금지 / 승인 전후 ID 불변.
export const ID_PREFIX: Record<CategoryId, string> = {
  n8n: "N8N", pa: "PA", assistant: "AST",
  "ai-orchestration": "AIO", ml: "ML", vibe: "VIBE", etc: "ETC",
};

// TODO: 백엔드 연동 시 서버 발급 ID로 교체 (PostgreSQL 카테고리·연도별 시퀀스, INSERT 시 원자적 발급)
export const makeItemId = (categoryId: CategoryId, seq: number, year = new Date().getFullYear()): string =>
  `${ID_PREFIX[categoryId]}-${year}-${String(seq).padStart(3, "0")}`;

// 운영 상태(PlatformItemStatus) 체계는 제품에서 전면 폐기됨.
// 등록·검토·관리·상세·통계·랜딩 어디에도 상태 표시/편집/필터/집계 축을 두지 않는다.
// AI Model 전용 `agentAvailability`("사용 가능"/"사용 불가")만 별개 축으로 유지.
// 승인 수명주기(승인 대기/부분 승인/게시됨/반려/중지)는 상태와 무관하게 유지된다.

export const BUSINESS_DOMAINS = ["영업", "생산", "연구", "재무", "HR", "IT"] as const;
export type BusinessDomain = typeof BUSINESS_DOMAINS[number];

export type AssetItem = {
  id: string;
  categoryId: CategoryId;
  title: string;
  summary: string;
  description: string;
  dept: string;
  owner: string;
  ownerEmail: string;
  tags: string[];
  // ai-orchestration "모델 접속 URL" 용도로만 계속 사용 (다른 카테고리 등록 폼에서는 제거됨)
  specificUrl: string;
  updatedAt: string;
  likes: number;

  // 조회수 — 상세 진입 집계. TODO: 백엔드 연동 시 서버 집계값으로 교체
  // (GET /api/v1/platform-items의 viewCount, 조회 시 원자적 증가). 데모에서는 목업 정적값.
  views?: number;

  // 워크플로우/설명 스크린샷 (최대 10장). 데모 단계에서는 data URL로 저장.
  images?: string[];

  // AI Model(ai-orchestration) 전용 이용 가능 상태(운영 상태 폐기와 무관한 별개 축).
  agentAvailability?: "사용 가능" | "사용 불가";

  // 소속/대상 관계사 (복수 선택, 관계사 코드 배열). 비워두거나 생략하면 전사 공용.
  company?: string[];

  // n8n 워크플로우 시각화 정의
  workflowDef?: {
    status: "Stable" | "Active" | "Error";
    nodes: { id: string; label: string; type: "trigger" | "condition" | "action" | "output"; n8nType?: string }[];
    edges: { from: string; to: string }[];
  };
  workflowJson?: string;

  // n8n / pa 공용 — 트리거 설명·예상 효과
  triggerAction?: string;
  nodes?: string[];         // @deprecated 등록 폼 제거 — 기존 목업·상세 호환 위해 유지, 후속 정리 예정
  connectedApps?: string[]; // @deprecated 등록 폼 제거 — 기존 목업·상세 호환 위해 유지, 후속 정리 예정
  expectedTimeSaved?: string;
  difficulty?: "쉬움" | "보통" | "어려움";

  // pa 전용 — @deprecated 등록 폼 제거 (기존 목업·상세 호환 위해 유지, 후속 정리 예정)
  flowType?: string;
  runMode?: string;
  connectorTier?: string;

  // 나만의 비서(assistant) 전용
  shareScope?: string;        // @deprecated 등록 폼 제거 — 호환 위해 유지
  sharedPrompt?: string;
  basedModel?: string;
  roleDefinition?: string;    // @deprecated 등록 폼 제거 — 호환 위해 유지
  connectedData?: string;     // @deprecated 등록 폼 제거 — 호환 위해 유지
  sampleQuestions?: string[]; // @deprecated 등록 폼 제거 — 호환 위해 유지

  // AI Model(ai-orchestration) 전용
  modelMeta?: {
    provider: string;
    modelName?: string;
    contextWindow: string; // 쉬운 표현으로 저장 (예: "문서 여러 장 (수십 페이지)")
    strengths: string[];
    strengthsDetail?: string;
    tokenUsageNote?: string;
    costTier: "낮음" | "보통" | "높음";
    useCases?: string[];
  };

  // ML 전용
  mlType?: string;
  trainingDataDesc?: string;
  performanceSummary?: string; // @deprecated 등록 폼 제거 — 호환 위해 유지

  // ML / Vibe 공용
  devTool?: string;    // @deprecated 등록 폼(vibe) 제거 — 호환 위해 유지
  sourceRepo?: string; // @deprecated 등록 폼 제거 — 호환 위해 유지
  outputType?: string; // @deprecated 등록 폼(vibe) 제거 — 호환 위해 유지

  // 상태 사유 — "일부 제한" / "사용 중지" 항목에 제한·중단 이유 기재
  statusNote?: string;

  // 이용 방식 — self: 셀프서비스(바로 사용) / contact: 담당자 문의(카탈로그형)
  usageMode?: "self" | "contact";

  // 업무 도메인 — 정식 분류 축 (AdminTaxonomy에서 관리)
  domain?: BusinessDomain;
};

// ===== 활용 후기 =====
export type AssetReview = {
  id: string;
  itemId: string;
  itemTitle: string;
  itemKind: CategoryId;
  author: string;
  dept: string;
  text: string;
  createdAt: string;
  likes: number;
};

// ===== 에디터 픽 (금주의 발견) =====
export type EditorsPick = {
  itemId: string;
  reason: string;
  pickedAt: string;
  pickedBy: string;
};

// ===== 병렬 2슬롯 승인 =====
// 항목마다 독립 승인 슬롯 2개를 두고, 순서 없이 어느 쪽이 먼저 승인해도 된다.
// - company 슬롯: 담당 companyAdmin 또는 admin이 수행
// - global 슬롯: admin만 수행
// - 두 슬롯 모두 승인되면 게시. 어느 한쪽이라도 반려하면 종결.
export type ApprovalSlotKey = "company" | "global";
export type ApprovalSlot = { approved: boolean; by?: string; at?: string };
export type ApprovalSlots = Record<ApprovalSlotKey, ApprovalSlot>;
export const APPROVAL_SLOT_LABEL: Record<ApprovalSlotKey, string> = {
  company: "관계사 관리자 승인",
  global: "전사 관리자 승인",
};

export type ApprovalStage = "승인 대기" | "부분 승인" | "게시됨" | "반려" | "중지";

// 슬롯 승인 상태 + 종결 플래그로부터 stage 파생 (종결 상태가 우선)
export function deriveStage(slots: ApprovalSlots, rejected: boolean, suspended: boolean): ApprovalStage {
  if (suspended) return "중지";
  if (rejected) return "반려";
  const approvedCount = (slots.company.approved ? 1 : 0) + (slots.global.approved ? 1 : 0);
  if (approvedCount >= 2) return "게시됨";
  if (approvedCount === 1) return "부분 승인";
  return "승인 대기";
}

// 레거시 stage → 슬롯 초기값 구성 규칙
// "1차대기" → 둘 다 미승인("승인 대기") / "2차대기" → company 승인 완료("부분 승인")
// "게시됨"·"반려"·"중지" → 동일 상태 유지
export const LEGACY_APPROVAL_MAP: Record<string, { slots: ApprovalSlots; rejected: boolean; suspended: boolean }> = {
  "1차대기": { slots: { company: { approved: false }, global: { approved: false } }, rejected: false, suspended: false },
  "2차대기": { slots: { company: { approved: true }, global: { approved: false } }, rejected: false, suspended: false },
  "게시됨":  { slots: { company: { approved: true }, global: { approved: true } }, rejected: false, suspended: false },
  "반려":    { slots: { company: { approved: false }, global: { approved: false } }, rejected: true, suspended: false },
  "중지":    { slots: { company: { approved: false }, global: { approved: false } }, rejected: false, suspended: true },
};

export type ApprovalRecord = {
  slot?: ApprovalSlotKey;
  action: "승인" | "반려";
  at: string;
  by: string;
  note?: string;
};

// ===== 삭제 이력 (CompanyAdmin) =====
export type DeletionRecord = {
  id: string;
  itemId: string;
  itemTitle: string;
  deletedAt: string;
  deletedBy: string;
  reason: string;
};

export const CATEGORY_ICON_PATH: Record<Category["icon"], string> = {
  automation: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  assistant: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
  orchestration: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z",
  pa: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4m14 6V17a4 4 0 00-4-4H3",
  ml: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  vibe: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  etc: "M5 3h10l4 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z M15 3v4h4 M8 12h7 M8 16h7",
};