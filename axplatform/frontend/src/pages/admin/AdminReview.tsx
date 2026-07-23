// ===== pages/admin/AdminReview.tsx =====
import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { CATEGORIES, BUSINESS_DOMAINS, APPROVAL_SLOT_LABEL, deriveStage, LEGACY_APPROVAL_MAP } from "../../types/categoryTypes";
import type { CategoryId, ApprovalStage, ApprovalSlot, ApprovalSlots, ApprovalSlotKey, ApprovalRecord, BusinessDomain } from "../../types/categoryTypes";
import { WorkflowDiagram, toWorkflowDef } from "../../components/WorkflowDiagram";
import type { WorkflowInput } from "../../components/WorkflowDiagram";
import { useAuth } from "../../context/useAuth";


const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"];
const COST_TIERS = ["낮음", "보통", "높음"];
// AI Model 이용 가능 상태 — 운영 상태(폐기)와 별개 축
const AGENT_AVAILABILITY = ["사용 가능", "사용 불가"];
const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "xAI", "LG AI", "Upstage", "Perplexity",
];
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];
const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링",
  "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달",
];

// 인라인 SVG 플레이스홀더 (네트워크 비의존)
const placeholderImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='#F1F5F9'/><rect x='1' y='1' width='638' height='358' fill='none' stroke='${color}' stroke-width='2'/><text x='320' y='188' font-family='sans-serif' font-size='24' fill='${color}' text-anchor='middle'>${label}</text></svg>`
  )}`;

type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };

const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;

const deserializeTimeSaved = (raw: string | undefined | null): { value: number | ""; period: SavedPeriod } => {
  if (!raw) return { value: "", period: "주" };
  const text = raw.trim();
  if (!text) return { value: "", period: "주" };
  const periodMatch = text.match(/(일|하루|주일|주|개월|월|년|연)/);
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*분/);
  let period: SavedPeriod = "주";
  if (periodMatch) {
    const token = periodMatch[1];
    if (token === "일" || token === "하루") period = "일";
    else if (token === "주" || token === "주일") period = "주";
    else if (token === "월" || token === "개월") period = "월";
    else if (token === "년" || token === "연") period = "년";
  }
  if (hourMatch) {
    const n = parseFloat(hourMatch[1]);
    if (!Number.isNaN(n)) return { value: n, period };
  }
  if (minMatch) {
    const n = parseFloat(minMatch[1]);
    if (!Number.isNaN(n)) return { value: Math.round((n / 60) * 100) / 100, period };
  }
  return { value: "", period };
};

const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

// 승인 단계 배지 색상
const APPROVAL_STAGE_STYLE: Record<ApprovalStage, { bg: string; fg: string; label: string }> = {
  "승인 대기": { bg: "#FBF3E4", fg: "#B4802E", label: "승인 대기" },
  "부분 승인": { bg: "#E8F0FE", fg: "#2563C9", label: "부분 승인" },
  "게시됨":   { bg: "#E6F5EC", fg: "#1F7A46", label: "게시됨" },
  "반려":     { bg: "#EDF0F4", fg: "#4B5768", label: "반려" },
  "중지":     { bg: "#EDF0F4", fg: "#4B5768", label: "중지" },
};

// 승인 슬롯 시각 스타일 — 대기 회색 / 승인 파스텔 그린
const SLOT_PENDING = { bg: "#EDF0F4", fg: "#94A3B8" };
const SLOT_APPROVED = { bg: "#E6F5EC", fg: "#1F7A46" };
const SLOT_SHORT: Record<ApprovalSlotKey, string> = { company: "관계사", global: "전사" };

// 목록 행 2분할 진행 필 (좌 관계사 / 우 전사)
function SlotPill({ slots }: { slots: ApprovalSlots }) {
  const cell = (key: ApprovalSlotKey) => {
    const on = slots[key].approved;
    const s = on ? SLOT_APPROVED : SLOT_PENDING;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: s.bg, color: s.fg, fontSize: 9, fontWeight: 700, padding: "0 8px", height: 18, lineHeight: "18px" }}>
        {on && <span aria-hidden style={{ fontSize: 9 }}>✓</span>}{SLOT_SHORT[key]}
      </span>
    );
  };
  return (
    <span style={{ display: "inline-flex", borderRadius: 20, overflow: "hidden", border: "1px solid #E2E8F0" }}>
      {cell("company")}
      <span style={{ width: 1, background: "#E2E8F0" }} />
      {cell("global")}
    </span>
  );
}

// 상세 패널 슬롯 카드 — 명칭 / 상태 / 처리자·일시 / 승인 버튼
function SlotCard({ slotKey, slot, canApprove, disabledReason, onApprove }: {
  slotKey: ApprovalSlotKey; slot: ApprovalSlot; canApprove: boolean; disabledReason: string; onApprove: () => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: "#fff", border: `1.5px solid ${slot.approved ? "#BBE5CB" : "#E2E8F0"}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>{APPROVAL_SLOT_LABEL[slotKey]}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: slot.approved ? SLOT_APPROVED.bg : SLOT_PENDING.bg, color: slot.approved ? SLOT_APPROVED.fg : SLOT_PENDING.fg }}>
          {slot.approved ? "승인 완료" : "대기"}
        </span>
      </div>
      {slot.approved ? (
        <div style={{ fontSize: 11, color: "#64748B" }}>{slot.by ?? "관리자"} · {slot.at ?? ""}</div>
      ) : canApprove ? (
        <button onClick={onApprove} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 7, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          이 슬롯 승인
        </button>
      ) : (
        <div style={{ fontSize: 11, color: "#94A3B8", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 7, padding: "8px 10px", lineHeight: 1.5 }}>{disabledReason}</div>
      )}
    </div>
  );
}

// 상단 현황 요약 스트립 (필터 겸용 칩)
type ReviewFilterKey = "전체" | "승인 대기" | "부분 승인" | "처리완료";
function SummaryStrip({ counts, partialCompanyOnly, partialGlobalOnly, active, onSelect }: {
  counts: Record<ReviewFilterKey, number>; partialCompanyOnly: number; partialGlobalOnly: number;
  active: ReviewFilterKey; onSelect: (k: ReviewFilterKey) => void;
}) {
  const chips: { key: ReviewFilterKey; label: string }[] = [
    { key: "전체", label: "전체" },
    { key: "승인 대기", label: "승인 대기" },
    { key: "부분 승인", label: "부분 승인" },
    { key: "처리완료", label: "처리완료" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
      {chips.map(c => {
        const on = active === c.key;
        return (
          <button key={c.key} onClick={() => onSelect(c.key)} style={{
            textAlign: "left", padding: "7px 10px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${on ? "#2563EB" : "#E2E8F0"}`, background: on ? "#EFF6FF" : "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: on ? "#2563EB" : "#0F172A" }}>{counts[c.key]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: on ? "#2563EB" : "#64748B" }}>{c.label}</span>
            </div>
            {c.key === "부분 승인" && counts["부분 승인"] > 0 && (
              <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 1 }}>관계사만 {partialCompanyOnly} · 전사만 {partialGlobalOnly}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

type Contact = { name: string; dept: string; role: string; email: string };

// 간소화된 7유형 필드 체계 — 삭제된 유형별 필드(flowType·runMode·connectorTier·shareScope·
// roleDefinition·connectedData·sampleQuestions·nodes·connectedApps·핵심성능·소스저장소 등)는 미보유.
// company/companyScope는 승인 권한 가드(관계사 슬롯) 판정용 데이터로만 존치 — 편집 UI 없음(전 항목 전사 공용).
type ReviewAssetItem = {
  kind: CategoryId;
  id: string; title: string; summary: string; description: string;
  dept: string; submittedBy: string; submittedAt: string;
  images?: string[];
  itemTags?: string;
  domain?: BusinessDomain;
  // n8n 워크플로우 시각화 + 예상 효과·난이도
  workflowInput?: WorkflowInput;
  workflowJson?: string;
  expectedTimeSaved?: string; difficulty?: string;
  // assistant
  sharedPrompt?: string; basedModel?: string;
  // ai-orchestration
  agentAvailability?: string; strengthsDetail?: string; specificUrl?: string;
  modelName?: string; contextWindow?: string; costTier?: string;
  // ml
  mlType?: string; trainingDataDesc?: string; devTool?: string;
  // 승인 축 (권한 가드용 — 유지)
  company: string[];
  companyScope: "unset" | "company-wide" | "specific";
  contacts: Contact[];
  approvalSlots: ApprovalSlots;
  rejected: boolean;
  suspended: boolean;
  approvalHistory: ApprovalRecord[];
  rejectionReason?: string;
};

type ReviewItem = ReviewAssetItem;

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13, color: "#0F172A",
  background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "inherit",
};
const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", backgroundImage: selectArrow, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer" };

// ===== 재사용 서브컴포넌트 (모듈 레벨) =====
const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
    {children}
  </div>
);

const SingleSelectTag = ({ options, value, onChange, disabled }: { options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(opt => {
      const isSel = value === opt;
      return (
        <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
          fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
          border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
          background: isSel ? "#EFF6FF" : "#fff",
          color: isSel ? "#2563EB" : "#475569",
          cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
          opacity: disabled ? 0.6 : 1,
        }}>{opt}</span>
      );
    })}
  </div>
);

// 이미지 캐러셀 (표시 전용)
const ImageStripView = ({ images }: { images: string[] }) => {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const safe = Math.min(idx, images.length - 1);
  const go = (d: number) => setIdx(() => (safe + d + images.length) % images.length);
  return (
    <div>
      <div style={{ position: "relative", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 160 }}>
        {images.length > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="이전 사진" style={{ position: "absolute", left: 10, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 15, color: "#475569" }}>‹</button>
        )}
        <img src={images[safe]} alt={`첨부 사진 ${safe + 1}`} style={{ maxWidth: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 6 }} />
        {images.length > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="다음 사진" style={{ position: "absolute", right: 10, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1.5px solid #E2E8F0", cursor: "pointer", fontSize: 15, color: "#475569" }}>›</button>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, textAlign: "right" }}>{safe + 1} / {images.length}</div>
    </div>
  );
};

const TimeSavedInput = ({
  value, period, onValueChange, onPeriodChange, disabled,
}: {
  value: number | ""; period: SavedPeriod;
  onValueChange: (v: number | "") => void; onPeriodChange: (p: SavedPeriod) => void;
  disabled?: boolean;
}) => {
  const annual = annualHours(value, period);
  const hasValue = value !== "" && Number(value) > 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {SAVED_PERIODS.map(p => (
            <span key={p} onClick={() => !disabled && onPeriodChange(p)} style={{
              fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 7,
              border: `1.5px solid ${period === p ? "#2563EB" : "#E2E8F0"}`,
              background: period === p ? "#EFF6FF" : "#fff",
              color: period === p ? "#2563EB" : "#475569",
              cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
              opacity: disabled ? 0.6 : 1,
            }}>{p}</span>
          ))}
        </div>
        <input type="number" min={0} step={0.5} inputMode="decimal" value={value} disabled={disabled}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") { onValueChange(""); return; }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0) return;
            onValueChange(n);
          }}
          placeholder="예: 3" style={{ ...inputStyle, maxWidth: 110, opacity: disabled ? 0.6 : 1 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>시간</span>
      </div>
      {hasValue && (
        <div style={{ marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "9px 13px", fontSize: 12, color: "#065F46", lineHeight: 1.6 }}>
          <strong>{PERIOD_FULL_LABEL[period]} {value}시간</strong> 절감
          {" → "}연간 약 <strong>{annual.toLocaleString()}시간</strong>
          <span style={{ color: "#059669", marginLeft: 4 }}>({value}시간 × {PERIOD_ANNUAL_FACTOR[period].toLocaleString()}{period === "년" ? "" : period})</span>
        </div>
      )}
    </div>
  );
};

// 레거시 stage → 슬롯 초기값(항목별 독립 객체) 구성
const legacy = (stage: string): { approvalSlots: ApprovalSlots; rejected: boolean; suspended: boolean } => {
  const m = LEGACY_APPROVAL_MAP[stage];
  return {
    approvalSlots: { company: { ...m.slots.company }, global: { ...m.slots.global } },
    rejected: m.rejected, suspended: m.suspended,
  };
};

// TODO: 실제 연동 시 GET /api/v1/admin/review-queue 응답으로 교체
const INITIAL_ITEMS: ReviewItem[] = [
  {
    kind: "n8n",
    id: "N8N-2026-014", title: "협력사 정산서 자동 검증",
    summary: "협력사가 제출한 정산서를 ERP 데이터와 자동 대조",
    description: "매월 말 협력사로부터 수신되는 정산서를 ERP 발주 데이터와 자동으로 대조하여 불일치 항목을 표시합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2026.06.20",
    images: [placeholderImage("워크플로우 개요", "#EA580C"), placeholderImage("실행 로그", "#059669")],
    expectedTimeSaved: "월 4시간", difficulty: "보통",
    itemTags: "정산, 구매자동화", domain: "재무",
    workflowInput: { status: "Active", nodes: [
      { label: "Schedule Trigger", type: "trigger" },
      { label: "ERP API 조회", type: "action" },
      { label: "정산서 파싱", type: "action" },
      { label: "불일치 항목 확인", type: "condition" },
      { label: "Teams 알림 발송", type: "output" },
    ]},
    company: [], companyScope: "company-wide",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "pa",
    id: "PA-2026-014", title: "구매 결재 자동 승인 플로우",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    dept: "구매팀", submittedBy: "최유진", submittedAt: "2026.06.25",
    expectedTimeSaved: "주 3시간",
    itemTags: "결재, 구매자동화", domain: "재무",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "assistant",
    id: "AST-2026-011", title: "해외법인 계약서 1차 검토 비서",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    dept: "법무팀", submittedBy: "강현우", submittedAt: "2026.06.22",
    sharedPrompt: "당신은 해외법인 계약서를 검토하는 법무 담당자입니다. 업로드된 영문 계약서에서 위험 조항을 찾아 한국어로 요약해 주세요.",
    basedModel: "Claude Opus 4.8",
    itemTags: "계약서, 법무, 해외법인", domain: "IT",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    ...legacy("2차대기"), approvalHistory: [
      { slot: "company", action: "승인", at: "2026.06.24", by: "최관리 (관계사관리자)" },
    ],
  },
  {
    kind: "ai-orchestration",
    id: "AIO-2026-015", title: "GPT-4o",
    summary: "전사 직원 누구나 사용할 수 있는 범용 업무 보조 모델",
    description: "이메일 작성, 보고서 초안, 데이터 요약 등 범용 업무에 적합합니다. 제공사는 OpenAI입니다.",
    dept: "IT개발팀", submittedBy: "정태영", submittedAt: "2026.06.24",
    agentAvailability: "사용 가능",
    strengthsDetail: "다양한 업무를 무난하게 처리합니다. 이메일 초안, 보고서 요약, 간단한 데이터 정리에 활용해보세요.",
    modelName: "GPT-4o", contextWindow: "문서 여러 장 (수십 페이지)", costTier: "보통",
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4o",
    itemTags: "범용, 업무보조",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "ml",
    id: "ML-2026-008", title: "성분 이미지 품질 분류 모델",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    dept: "IT개발팀", submittedBy: "오승현", submittedAt: "2026.06.26",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장", devTool: "PyTorch",
    itemTags: "품질관리, 이미지분류", domain: "생산",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
  {
    kind: "etc",
    id: "ETC-2026-002", title: "사내 AI 뉴스 주간 요약 미니 프로젝트",
    summary: "매주 사내에 공유되는 AI 트렌드 뉴스레터를 블로그 형식으로 소개",
    description: "사내 구성원이 AI 동향을 쉽게 접할 수 있도록 매주 주요 뉴스와 활용 사례를 정리해 공유하는 소규모 프로젝트입니다.",
    dept: "DX추진팀", submittedBy: "한지민", submittedAt: "2026.06.28",
    itemTags: "뉴스레터, AI트렌드", domain: "IT",
    company: [], companyScope: "company-wide",
    contacts: [{ name: "한지민", dept: "DX추진팀", role: "주담당자", email: "jimin.han@kolmar.co.kr" }],
    ...legacy("1차대기"), approvalHistory: [],
  },
];

export default function AdminReview() {
  const { isAdmin, isCompanyAdmin, user, managedCompanies } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<string>(INITIAL_ITEMS[0]?.id ?? "");
  const [edits, setEdits] = useState<Record<string, Partial<ReviewItem>>>({});
  const [filter, setFilter] = useState<ReviewFilterKey>("전체");
  const [sourceFilter, setSourceFilter] = useState<"전체" | CategoryId>("전체");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const activeItem = items.find(i => i.id === selected) ?? null;
  const edit = edits[selected] ?? {};
  const merged = activeItem ? ({ ...activeItem, ...edit } as ReviewItem) : null;

  const setEdit = <K extends keyof ReviewItem>(k: K, v: ReviewItem[K]) =>
    setEdits(p => ({ ...p, [selected]: { ...(p[selected] || {}), [k]: v } }));

  const baseTimeSaved = merged ? deserializeTimeSaved((merged as ReviewAssetItem).expectedTimeSaved) : { value: "" as number | "", period: "주" as SavedPeriod };
  const currentTimeSavedValue = ((edit as any).timeSavedValue !== undefined ? (edit as any).timeSavedValue : baseTimeSaved.value) as number | "";
  const currentTimeSavedPeriod = ((edit as any).timeSavedPeriod !== undefined ? (edit as any).timeSavedPeriod : baseTimeSaved.period) as SavedPeriod;

  const setTimeSavedValue = (v: number | "") => {
    (setEdit as any)("timeSavedValue", v);
    (setEdit as any)("expectedTimeSaved", serializeTimeSaved(v, currentTimeSavedPeriod));
  };
  const setTimeSavedPeriod = (p: SavedPeriod) => {
    (setEdit as any)("timeSavedPeriod", p);
    (setEdit as any)("expectedTimeSaved", serializeTimeSaved(currentTimeSavedValue, p));
  };

  // ===== 병렬 슬롯 승인 헬퍼 (승인 모델·권한 가드 — 변경 금지) =====
  const stageOf = (i: ReviewItem) => deriveStage(i.approvalSlots, i.rejected, i.suspended);
  const isTerminalStage = (s: ApprovalStage) => s === "게시됨" || s === "반려" || s === "중지";
  // 담당 범위 일치 (전사 공용(company 비어있음)은 관계사 관리자 권한 대상이 아님)
  const companyScopeMatch = (i: ReviewItem) => i.company.length > 0 && i.company.some(c => managedCompanies.includes(c));
  const canActCompanySlot = (i: ReviewItem) => isAdmin || (isCompanyAdmin && companyScopeMatch(i));
  const canActGlobalSlot = (_i: ReviewItem) => isAdmin;

  // 현재 사용자에게 보이는 항목 집합 (companyAdmin은 담당 범위 + 전사 공용)
  const visibleToUser = (i: ReviewItem): boolean => {
    if (isAdmin) return true;
    if (isCompanyAdmin) return i.company.length === 0 || companyScopeMatch(i);
    return false;
  };
  const baseItems = items.filter(visibleToUser);

  const nextSelectableAfter = (excludeId: string) => {
    const remaining = baseItems.filter(i => i.id !== excludeId && !isTerminalStage(stageOf(i)));
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  // 슬롯 단위 승인 (순서 무관). 관계사 미지정(unset) 항목은 승인 불가.
  const approveSlot = (slotKey: ApprovalSlotKey) => {
    if (!activeItem || !merged) return;
    if (merged.companyScope === "unset") return;
    const at = "2026.07.10";
    const by = user?.name ?? "관리자";
    const willComplete = merged.approvalSlots[slotKey === "company" ? "global" : "company"].approved;

    // TODO: 백엔드 연동 시 알림 발송(kind: slotKey === "company" ? "관계사승인" : "전사승인").
    //       두 슬롯이 모두 승인되어 게시되는 경우(willComplete) 전사승인 2/2(게시) 문구로 발송.
    setItems(p => p.map(i => {
      if (i.id !== selected) return i;
      const { timeSavedValue, timeSavedPeriod, ...cleanEdit } = edit as any;
      void timeSavedValue; void timeSavedPeriod;
      const nextSlots: ApprovalSlots = { ...i.approvalSlots, [slotKey]: { approved: true, by, at } };
      return {
        ...i, ...cleanEdit,
        approvalSlots: nextSlots,
        approvalHistory: [...(i.approvalHistory ?? []), { slot: slotKey, action: "승인", at, by } as ApprovalRecord],
      } as ReviewItem;
    }));
    // 두 번째 슬롯까지 승인되어 게시되면 다음 미처리 항목으로 이동
    if (willComplete) nextSelectableAfter(selected);
  };

  const handleReject = () => {
    if (!activeItem) return;
    if (!rejectReason.trim()) return;
    // TODO: 백엔드 연동 시 알림 발송(kind: "반려", 사유 rejectReason 포함).
    const record: ApprovalRecord = {
      action: "반려",
      at: "2026.07.10",
      by: user?.name ?? "관리자",
      note: rejectReason,
    };
    setItems(p => p.map(i => i.id === selected ? ({
      ...i,
      rejected: true,
      approvalHistory: [...(i.approvalHistory ?? []), record],
      rejectionReason: rejectReason,
    } as ReviewItem) : i));
    setRejectOpen(false);
    setRejectReason("");
    nextSelectableAfter(selected);
  };

  // 요약 스트립 카운트 (사용자 가시 집합 기준)
  const partialItems = baseItems.filter(i => stageOf(i) === "부분 승인");
  const partialCompanyOnly = partialItems.filter(i => i.approvalSlots.company.approved && !i.approvalSlots.global.approved).length;
  const partialGlobalOnly = partialItems.filter(i => i.approvalSlots.global.approved && !i.approvalSlots.company.approved).length;
  const summaryCounts: Record<ReviewFilterKey, number> = {
    "전체": baseItems.length,
    "승인 대기": baseItems.filter(i => stageOf(i) === "승인 대기").length,
    "부분 승인": partialItems.length,
    "처리완료": baseItems.filter(i => isTerminalStage(stageOf(i))).length,
  };

  // 사이드바 pendingCount — admin: 미종결 항목 전체 / companyAdmin: 담당 범위 내 company 슬롯 미승인
  const userPendingCount = items.filter(i => {
    if (isTerminalStage(stageOf(i))) return false;
    if (isAdmin) return true;
    if (isCompanyAdmin) return companyScopeMatch(i) && !i.approvalSlots.company.approved;
    return false;
  }).length;

  const filteredList = baseItems
    .filter(i => {
      const st = stageOf(i);
      if (filter === "전체") return true;
      if (filter === "처리완료") return isTerminalStage(st);
      return st === filter; // "승인 대기" | "부분 승인"
    })
    .filter(i => sourceFilter === "전체" ? true : i.kind === sourceFilter);

  const SOURCE_OPTIONS: { key: "전체" | CategoryId; label: string }[] = [
    { key: "전체", label: "전체" },
    ...CATEGORIES.map(p => ({ key: p.id, label: p.name })),
  ];

  const stage: ApprovalStage | null = merged ? stageOf(merged) : null;
  const isTerminal = stage ? isTerminalStage(stage) : false;

  // 편집·반려 가능: 종결 전이고 사용자가 어느 한 슬롯이라도 권한 보유
  const hasAnySlotAuthority = !!merged && (canActCompanySlot(merged) || canActGlobalSlot(merged));
  const canActOnCurrent = !!merged && !isTerminal && hasAnySlotAuthority;

  const stageStyle = stage ? APPROVAL_STAGE_STYLE[stage] : null;
  const mergedImages = merged ? ((edit as any).images ?? (merged as ReviewAssetItem).images ?? []) as string[] : [];
  const isModelKind = merged?.kind === "ai-orchestration";
  const kindLabel = merged ? (isModelKind ? "AI Model" : SOURCE_STYLE[merged.kind].label) : "";

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar pendingCount={userPendingCount} />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 통합 대기 목록 ===== */}
          <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                등록 신청 목록
              </div>
              {isCompanyAdmin && (
                <div style={{ fontSize: 11, color: "#B4602E", background: "#FBEEE4", padding: "3px 8px", borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  관계사 관리자 승인 담당 · {managedCompanies.length > 0 ? managedCompanies.join("·") : "–"}
                </div>
              )}
              {isAdmin && (
                <div style={{ fontSize: 11, color: "#2563C9", background: "#E8F0FE", padding: "3px 8px", borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  전사 관리자 승인 담당
                </div>
              )}

              <SummaryStrip
                counts={summaryCounts}
                partialCompanyOnly={partialCompanyOnly}
                partialGlobalOnly={partialGlobalOnly}
                active={filter}
                onSelect={setFilter}
              />

              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as "전체" | CategoryId)} style={{ ...selectStyle, fontSize: 11, padding: "6px 28px 6px 10px" }}>
                {SOURCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredList.map(item => {
                const st = stageOf(item);
                const isDone = isTerminalStage(st);
                const isSelected = selected === item.id;
                const sourceStyle = SOURCE_STYLE[item.kind];
                const stBadge = APPROVAL_STAGE_STYLE[st];
                return (
                  <div key={item.id} onClick={() => setSelected(item.id)} style={{
                    padding: "12px 14px", cursor: "pointer",
                    background: isSelected ? "#EFF6FF" : "transparent",
                    borderBottom: "1px solid #F8FAFC",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: sourceStyle.bg, color: sourceStyle.color, padding: "1px 7px", borderRadius: 20 }}>{sourceStyle.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, background: stBadge.bg, color: stBadge.fg, padding: "1px 7px", borderRadius: 20 }}>{stBadge.label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4, opacity: isDone ? 0.5 : 1 }}>{item.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.dept} · {item.submittedBy}</span>
                      <SlotPill slots={item.approvalSlots} />
                    </div>
                  </div>
                );
              })}
              {filteredList.length === 0 && (
                <div style={{ padding: "30px 14px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>해당하는 신청 건이 없습니다.</div>
              )}
            </div>
          </div>

          {/* ===== 우측: 상세 검토 패널 ===== */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {!merged ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>검토할 항목을 선택하세요.</div>
            ) : (
              <div style={{ maxWidth: 720 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: SOURCE_STYLE[merged.kind].bg, color: SOURCE_STYLE[merged.kind].color, padding: "3px 10px", borderRadius: 20 }}>{kindLabel}</span>
                  {stageStyle && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: stageStyle.bg, color: stageStyle.fg, padding: "3px 10px", borderRadius: 20 }}>{stageStyle.label}</span>
                  )}
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{merged.id} · 신청 {merged.submittedAt} · {merged.submittedBy}</span>
                </div>

                {/* 승인 이력 */}
                {merged.approvalHistory.length > 0 && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>승인 이력</div>
                    {merged.approvalHistory.map((h, i) => {
                      const isReject = h.action === "반려";
                      const hs = isReject ? { bg: "#FEE2E2", fg: "#991B1B" } : { bg: SLOT_APPROVED.bg, fg: SLOT_APPROVED.fg };
                      const label = `${h.slot ? APPROVAL_SLOT_LABEL[h.slot] + " " : ""}${h.action}`;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: i < merged.approvalHistory.length - 1 ? 6 : 0 }}>
                          <span style={{ background: hs.bg, color: hs.fg, fontWeight: 700, padding: "1px 8px", borderRadius: 12, fontSize: 11 }}>{label}</span>
                          <span style={{ color: "#475569" }}>{h.by}</span>
                          <span style={{ color: "#CBD5E1" }}>·</span>
                          <span style={{ color: "#94A3B8" }}>{h.at}</span>
                          {h.note && <span style={{ color: "#EF4444" }}>— {h.note}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isTerminal && stage && (
                  <div style={{ background: stage === "게시됨" ? "#D1FAE5" : "#FEE2E2", border: `1px solid ${stage === "게시됨" ? "#6EE7B7" : "#FECACA"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 600, color: stage === "게시됨" ? "#065F46" : "#991B1B" }}>
                    이 항목은 {APPROVAL_STAGE_STYLE[stage].label} 처리되었습니다.
                    {stage === "반려" && merged.rejectionReason && ` (사유: ${merged.rejectionReason})`}
                  </div>
                )}

                {canActOnCurrent && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
                    내용을 직접 수정한 후 승인할 수 있습니다. 두 승인이 모두 완료되면 게시됩니다.
                  </div>
                )}

                {/* ===== 공통: 기본 정보 ===== */}
                <SectionBlock title="기본 정보">
                  {mergedImages.length > 0 && (
                    <FieldRow label="첨부 사진">
                      <ImageStripView images={mergedImages} />
                    </FieldRow>
                  )}
                  <FieldRow label="제목">
                    <input value={(edit as any).title ?? merged.title} onChange={e => (setEdit as any)("title", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="한 줄 요약">
                    <input value={(edit as any).summary ?? merged.summary} onChange={e => (setEdit as any)("summary", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="상세 설명">
                    <textarea value={(edit as any).description ?? merged.description} onChange={e => (setEdit as any)("description", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="업무 도메인">
                    <div style={{ marginTop: 4 }}>
                      <SingleSelectTag options={[...BUSINESS_DOMAINS]} value={(edit as any).domain ?? merged.domain ?? ""} onChange={v => (setEdit as any)("domain", v)} disabled={!canActOnCurrent} />
                    </div>
                  </FieldRow>
                  <FieldRow label="태그">
                    <input value={(edit as any).itemTags ?? (merged as ReviewAssetItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} placeholder="쉼표로 구분" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                </SectionBlock>

                {/* ===== 분기: n8n / Power Automate ===== */}
                {(merged.kind === "n8n" || merged.kind === "pa") && (
                  <SectionBlock title={`${SOURCE_STYLE[merged.kind].label} 구성 · 효과`}>
                    {merged.kind === "n8n" && (() => {
                      const wfInput = (edit as any).workflowInput ?? (merged as ReviewAssetItem).workflowInput;
                      const wf = wfInput ? toWorkflowDef(wfInput) : undefined;
                      return wf ? (
                        <FieldRow label="워크플로우 다이어그램">
                          <WorkflowDiagram wf={wf} />
                        </FieldRow>
                      ) : null;
                    })()}
                    <FieldRow label="예상 절감 시간">
                      <TimeSavedInput value={currentTimeSavedValue} period={currentTimeSavedPeriod} onValueChange={setTimeSavedValue} onPeriodChange={setTimeSavedPeriod} disabled={!canActOnCurrent} />
                    </FieldRow>
                    {merged.kind === "n8n" && (
                      <FieldRow label="구성 난이도">
                        <SingleSelectTag options={DIFFICULTY_LEVELS} value={(edit as any).difficulty ?? (merged as ReviewAssetItem).difficulty ?? "보통"} onChange={v => (setEdit as any)("difficulty", v)} disabled={!canActOnCurrent} />
                      </FieldRow>
                    )}
                  </SectionBlock>
                )}

                {/* ===== 분기: 나만의 비서 ===== */}
                {merged.kind === "assistant" && (
                  <SectionBlock title="비서 구성">
                    <FieldRow label="공유 프롬프트">
                      <textarea value={(edit as any).sharedPrompt ?? (merged as ReviewAssetItem).sharedPrompt ?? ""} onChange={e => (setEdit as any)("sharedPrompt", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-mono)", opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="기반 모델">
                      <input value={(edit as any).basedModel ?? (merged as ReviewAssetItem).basedModel ?? ""} onChange={e => (setEdit as any)("basedModel", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      {canActOnCurrent && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                          {ASSISTANT_MODEL_HINTS.map(m => <span key={m} onClick={() => (setEdit as any)("basedModel", m)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {m}</span>)}
                        </div>
                      )}
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: AI Model — 모델 사양 ===== */}
                {merged.kind === "ai-orchestration" && (
                  <SectionBlock title="모델 정보">
                    <FieldRow label="이용 가능 여부">
                      <SingleSelectTag options={AGENT_AVAILABILITY} value={(edit as any).agentAvailability ?? (merged as ReviewAssetItem).agentAvailability ?? ""} onChange={v => (setEdit as any)("agentAvailability", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="강점 및 활용 방법">
                      <textarea value={(edit as any).strengthsDetail ?? (merged as ReviewAssetItem).strengthsDetail ?? ""} onChange={e => (setEdit as any)("strengthsDetail", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewAssetItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} placeholder="https://" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="세부 모델명">
                      <input value={(edit as any).modelName ?? (merged as ReviewAssetItem).modelName ?? ""} onChange={e => (setEdit as any)("modelName", e.target.value)} disabled={!canActOnCurrent} placeholder="예: Claude Opus 4.8, GPT-5.4 Mini" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="처리 가능한 글 분량">
                      <SingleSelectTag options={CONTEXT_SIZE_OPTIONS} value={(edit as any).contextWindow ?? (merged as ReviewAssetItem).contextWindow ?? ""} onChange={v => (setEdit as any)("contextWindow", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="비용 등급">
                      <SingleSelectTag options={COST_TIERS} value={(edit as any).costTier ?? (merged as ReviewAssetItem).costTier ?? "보통"} onChange={v => (setEdit as any)("costTier", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: ML 모델 ===== */}
                {merged.kind === "ml" && (
                  <SectionBlock title="ML 모델 정보">
                    <FieldRow label="모델 유형">
                      <SingleSelectTag options={ML_TYPES} value={(edit as any).mlType ?? (merged as ReviewAssetItem).mlType ?? ""} onChange={v => (setEdit as any)("mlType", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="학습 데이터 개요">
                      <input value={(edit as any).trainingDataDesc ?? (merged as ReviewAssetItem).trainingDataDesc ?? ""} onChange={e => (setEdit as any)("trainingDataDesc", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="개발 도구">
                      <input value={(edit as any).devTool ?? (merged as ReviewAssetItem).devTool ?? ""} onChange={e => (setEdit as any)("devTool", e.target.value)} disabled={!canActOnCurrent} placeholder="예: PyTorch, TensorFlow" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* vibe · etc: 공통 정보만 (별도 유형 섹션 없음) */}

                {/* ===== 공통: 담당자 ===== */}
                <SectionBlock title="담당자">
                  {canActOnCurrent && (
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 11, color: "#64748B" }}>
                      퇴사·인사이동 등으로 담당자 정보가 바뀐 경우 여기서 직접 수정하세요.
                    </div>
                  )}
                  {((edit as any).contacts ?? merged.contacts).map((c: Contact, i: number) => {
                    const contacts = (edit as any).contacts ?? merged.contacts;
                    const setContact = (k: keyof Contact, v: string) => {
                      const next = contacts.map((cc: Contact, ci: number) => ci === i ? { ...cc, [k]: v } : cc);
                      (setEdit as any)("contacts", next);
                    };
                    const removeContact = () => (setEdit as any)("contacts", contacts.filter((_: Contact, ci: number) => ci !== i));
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                        {!canActOnCurrent ? (
                          <>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {c.name ? c.name[0] : "?"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>· {c.dept}</span></div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.email}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{c.role}</span>
                          </>
                        ) : (
                          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                            <input value={c.name} onChange={e => setContact("name", e.target.value)} placeholder="이름" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <input value={c.dept} onChange={e => setContact("dept", e.target.value)} placeholder="부서" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <input value={c.email} onChange={e => setContact("email", e.target.value)} placeholder="이메일" style={{ ...inputStyle, fontSize: 12, padding: "6px 9px" }} />
                            <select value={c.role} onChange={e => setContact("role", e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: "6px 22px 6px 9px" }}>
                              <option value="주담당자">주담당자</option>
                              <option value="공동담당자">공동담당자</option>
                            </select>
                            {contacts.length > 1 && (
                              <button onClick={removeContact} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {canActOnCurrent && (
                    <button onClick={() => (setEdit as any)("contacts", [...((edit as any).contacts ?? merged.contacts), { name: "", dept: "", role: "공동담당자", email: "" }])} style={{ background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "8px 0", width: "100%", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                      + 담당자 추가
                    </button>
                  )}
                </SectionBlock>

                {/* ===== 승인 슬롯 (순서 없는 병렬 2슬롯) / 반려 ===== */}
                {!isTerminal && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <SlotCard
                        slotKey="company"
                        slot={merged.approvalSlots.company}
                        canApprove={canActCompanySlot(merged)}
                        disabledReason={merged.company.length === 0 ? "전사 공용 항목은 전사 관리자만 승인할 수 있습니다." : "담당 관계사 범위가 아닙니다."}
                        onApprove={() => approveSlot("company")}
                      />
                      <SlotCard
                        slotKey="global"
                        slot={merged.approvalSlots.global}
                        canApprove={canActGlobalSlot(merged)}
                        disabledReason="전사 관리자만 승인할 수 있습니다."
                        onApprove={() => approveSlot("global")}
                      />
                    </div>

                    {hasAnySlotAuthority ? (
                      !rejectOpen ? (
                        <button onClick={() => setRejectOpen(true)} style={{ alignSelf: "flex-start", background: "#fff", border: "1.5px solid #FECACA", color: "#EF4444", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          반려
                        </button>
                      ) : (
                        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "14px 16px" }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 8 }}>반려 사유 (필수) — 어느 슬롯이든 반려 시 항목이 종결됩니다.</label>
                          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요. 신청자에게 그대로 전달됩니다." style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handleReject} disabled={!rejectReason.trim()} style={{ background: rejectReason.trim() ? "#EF4444" : "#CBD5E1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}>
                              반려 확정
                            </button>
                            <button onClick={() => { setRejectOpen(false); setRejectReason(""); }} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                              취소
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#64748B" }}>
                        이 항목에 대한 승인 권한이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
