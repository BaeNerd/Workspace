// ===== pages/admin/AdminReview.tsx =====
import { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { PLATFORMS, STATUS_ORDER } from "../../types/platformTypes";
import type { PlatformId, ApprovalStage, ApprovalRecord } from "../../types/platformTypes";
import type { WorkflowInput } from "../../components/WorkflowDiagram";
import { useAuth } from "../../context/useAuth";


const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"];
const COST_TIERS = ["낮음", "보통", "높음"];

const NODE_SUGGESTIONS = [
  "Manual Trigger", "Schedule Trigger", "Form Trigger", "Chat Trigger", "Webhook",
  "Set (Edit Fields)", "Code", "IF", "Switch", "Filter", "Merge", "Aggregate", "Sort",
  "AI Agent", "Basic LLM Chain",
];
const APP_SUGGESTIONS = [
  "Microsoft Outlook", "Microsoft Teams", "Microsoft One Drive", "Google Sheets",
  "HTTP Request", "Spreadsheet File", "Respond To Webhook",
];
const PA_CONNECTOR_SUGGESTIONS = [
  "SharePoint", "Microsoft Teams", "Outlook", "Excel Online", "Power BI",
  "Dataverse", "Forms", "Approvals", "Planner", "OneDrive", "SQL Server",
];
const PA_FLOW_TYPES = [
  "이벤트 발생 시 자동 실행", "버튼 클릭으로 즉시 실행", "정해진 시간에 예약 실행",
  "데스크톱 자동화 (RPA)", "업무 절차 안내형",
];
const PA_RUN_MODES = ["사람이 지켜보며 실행", "무인으로 자동 실행"];
const PA_CONNECTOR_TIERS = ["기본 커넥터만 사용", "유료(프리미엄) 커넥터 포함"];
const ASSISTANT_SHARE_SCOPES = ["회사 공통 비서", "팀 공유 비서", "개인 비서 (비공개)"];
const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "xAI", "LG AI", "Upstage", "Perplexity",
];
const PROVIDER_OPTIONS = ["웍스 대표 모델", "Anthropic", "Google", "OpenAI", "xAI", "LG AI", "Upstage", "Perplexity"];
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];
const USE_CASE_SUGGESTIONS = ["문서 요약", "코드 생성", "법무 검토", "번역", "데이터 분석", "이미지 분석", "회의록 정리", "제안서 초안"];
const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링",
  "NLP / 텍스트", "이미지 인식", "시계열 예측", "추천 시스템", "이상 탐지", "강화학습", "멀티모달",
];
const VIBE_TOOL_SUGGESTIONS = [
  "GitHub Copilot", "Cursor", "Claude Code", "Codeium", "Tabnine", "Replit AI", "v0", "Bolt",
];

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
  "1차대기": { bg: "#FBF3E4", fg: "#B4802E", label: "1차 대기" },
  "2차대기": { bg: "#E8F0FE", fg: "#2563C9", label: "2차 대기" },
  "게시됨":  { bg: "#E6F5EC", fg: "#1F7A46", label: "게시됨" },
  "반려":    { bg: "#EDF0F4", fg: "#4B5768", label: "반려" },
  "중지":    { bg: "#EDF0F4", fg: "#4B5768", label: "중지" },
};

const FULL_COMPANIES = [
  { code: "KMH", name: "콜마홀딩스", visible: true },
  { code: "KKM", name: "한국콜마", visible: true },
  { code: "KBH", name: "콜마비앤에이치", visible: true },
  { code: "HKN", name: "에이치케이이노엔", visible: true },
  { code: "YWK", name: "연우", visible: true },
  { code: "KAF", name: "근오농림", visible: false },
  { code: "NAB", name: "넥스트앤바이오", visible: false },
  { code: "HC", name: "콜마생활건강", visible: true },
  { code: "HNG", name: "에치엔지", visible: false },
  { code: "MOD", name: "엠오디머티리얼즈", visible: false },
  { code: "KMG", name: "콜마글로벌", visible: true },
  { code: "KMSK", name: "콜마스크", visible: true },
  { code: "KUX", name: "콜마유엑스", visible: false },
  { code: "KMW", name: "무석콜마", visible: true },
  { code: "KMB", name: "북경콜마", visible: true },
  { code: "KBJ", name: "강소콜마", visible: false },
  { code: "KAY", name: "연태콜마", visible: false },
  { code: "HKV", name: "한국헬스케어베너", visible: false },
  { code: "PLT", name: "플래닛147", visible: false },
  { code: "LSL", name: "레스리", visible: false },
  { code: "LOD", name: "라우드랩스", visible: false },
  { code: "KMP", name: "콜마헬스케어필리핀", visible: false },
  { code: "KMS", name: "에이치케이콜마싱가포르", visible: false },
  { code: "KML", name: "콜마랩스", visible: false },
  { code: "KUS", name: "미국콜마", visible: true },
  { code: "KCA", name: "캐나다콜마", visible: false },
  { code: "HKJ", name: "에이치케이글로벌퍼팩", visible: false },
  { code: "KMM", name: "에이치케이콜마말레이시아", visible: false },
  { code: "KBT", name: "콜마바이오텍", visible: true },
];
const SELECTABLE_COMPANIES = FULL_COMPANIES.filter(c => c.visible);

const platformCompanyDisplay = (codes: string[]): string => {
  if (codes.length === 0) return "전사 공용";
  const names = codes.map(c => FULL_COMPANIES.find(co => co.code === c)?.name ?? c);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} 외 ${names.length - 2}곳`;
};

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };

type ReviewPlatformItem = {
  kind: PlatformId;
  id: string; title: string; summary: string; description: string;
  dept: string; submittedBy: string; submittedAt: string;
  status: string;
  triggerAction?: string; nodes?: string[]; connectedApps?: string[];
  expectedTimeSaved?: string; difficulty?: string; specificUrl?: string; itemTags?: string;
  workflowInput?: WorkflowInput;
  workflowJson?: string;
  flowType?: string; runMode?: string; connectorTier?: string;
  shareScope?: string; sharedPrompt?: string; basedModel?: string; roleDefinition?: string;
  connectedData?: string; sampleQuestions?: string[];
  provider?: string; modelName?: string; contextWindow?: string;
  strengths?: string; strengthsDetail?: string; tokenUsageNote?: string;
  costTier?: string; useCases?: string[];
  mlType?: string; trainingDataDesc?: string; performanceSummary?: string;
  devTool?: string; sourceRepo?: string; outputType?: string;
  company: string[];
  platformScope: "unset" | "company-wide" | "specific";
  contacts: Contact[]; links: LinkItem[];
  approvalStage: ApprovalStage;
  approvalHistory: ApprovalRecord[];
  rejectionReason?: string;
};

type ReviewItem = ReviewPlatformItem;

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
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

const ChipEditor = ({ items, onAdd, onRemove, suggestions, placeholder, disabled }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void;
  suggestions: string[]; placeholder: string; disabled?: boolean;
}) => {
  const [draft, setDraft] = useState("");
  const commit = () => { const v = draft.trim(); if (!v) return; onAdd(v); setDraft(""); };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: items.length > 0 ? 8 : 0 }}>
        {items.map(item => (
          <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 6px 4px 10px", borderRadius: 6, border: "1px solid #BFDBFE" }}>
            {item}
            {!disabled && <button onClick={() => onRemove(item)} style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>}
          </span>
        ))}
      </div>
      {!disabled && (
        <>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} placeholder={placeholder} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px" }} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
            {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
              <span key={s} onClick={() => onAdd(s)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function CompanyMultiSelect({ selected, onChange, disabled }: {
  selected: string[]; onChange: (codes: string[]) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isCompanyWide = selected.length === 0;
  const filteredCompanies = SELECTABLE_COMPANIES.filter(c =>
    search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase())
  );
  const toggleCompany = (code: string) =>
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        type="button"
        disabled={disabled}
        style={{ ...inputStyle, textAlign: "left", width: "100%", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#0F172A", fontWeight: 600 }}
      >
        <span>{platformCompanyDisplay(selected)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px", maxHeight: 340, display: "flex", flexDirection: "column" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 6, cursor: "pointer", background: isCompanyWide ? "#EFF6FF" : "transparent", marginBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
            <input type="checkbox" checked={isCompanyWide} onChange={() => onChange([])} style={{ cursor: "pointer" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isCompanyWide ? "#2563EB" : "#334155" }}>전사 공용 (특정 관계사 한정 없음)</span>
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="관계사명 또는 코드로 검색" style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredCompanies.map(c => (
              <label key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", background: selected.includes(c.code) ? "#EFF6FF" : "transparent" }}>
                <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleCompany(c.code)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{c.code}</span>
              </label>
            ))}
            {filteredCompanies.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>}
          </div>
          <button onClick={() => setOpen(false)} type="button" style={{ marginTop: 8, background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>완료</button>
        </div>
      )}
    </div>
  );
}

// TODO: 실제 연동 시 GET /api/v1/admin/review-queue 응답으로 교체
const INITIAL_ITEMS: ReviewItem[] = [
  {
    kind: "n8n",
    id: "N8N-014", title: "협력사 정산서 자동 검증",
    summary: "협력사가 제출한 정산서를 ERP 데이터와 자동 대조",
    description: "매월 말 협력사로부터 수신되는 정산서를 ERP 발주 데이터와 자동으로 대조하여 불일치 항목을 표시합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2025.06.20",
    status: "준비 중",
    triggerAction: "Schedule Trigger(매월 말일) → ERP API 조회 → 정산서 파싱 → 대조 → 불일치 시 Teams 알림",
    nodes: ["Schedule Trigger", "HTTP Request", "Code", "IF"], connectedApps: ["Microsoft Teams"],
    expectedTimeSaved: "월 4시간", difficulty: "보통", specificUrl: "https://n8n.kolmar.co.kr/workflow/014",
    itemTags: "정산, 구매자동화",
    workflowInput: { status: "Active", nodes: [
      { label: "Schedule Trigger", type: "trigger" },
      { label: "ERP API 조회", type: "action" },
      { label: "정산서 파싱", type: "action" },
      { label: "불일치 항목 확인", type: "condition" },
      { label: "Teams 알림 발송", type: "output" },
    ]},
    company: [], platformScope: "unset",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    links: [], approvalStage: "1차대기", approvalHistory: [],
  },
  {
    kind: "pa",
    id: "PA-003", title: "구매 결재 자동 승인 플로우",
    summary: "SharePoint 양식 기반 구매 결재 자동 처리",
    description: "구매팀이 SharePoint에 제출한 결재 요청을 Power Automate가 ERP 데이터와 대조 후 자동 승인·반려합니다.",
    dept: "구매팀", submittedBy: "최유진", submittedAt: "2025.06.25",
    status: "준비 중",
    flowType: "이벤트 발생 시 자동 실행", connectorTier: "기본 커넥터만 사용",
    triggerAction: "Form 제출 → Dataverse 조회 → 조건 분기 → 결재 처리",
    connectedApps: ["SharePoint", "Dataverse", "Approvals"],
    specificUrl: "", itemTags: "결재, 구매자동화",
    company: ["KKM"], platformScope: "specific",
    contacts: [{ name: "최유진", dept: "구매팀", role: "주담당자", email: "yujin.choi@kolmar.co.kr" }],
    links: [], approvalStage: "1차대기", approvalHistory: [],
  },
  {
    kind: "assistant",
    id: "AST-011", title: "해외법인 계약서 1차 검토 비서",
    summary: "해외법인向 영문 계약서의 주요 리스크 조항을 1차 스크리닝",
    description: "미국콜마·북경콜마 등 해외법인에서 체결하는 영문 계약서의 주요 조항을 1차로 스크리닝하여 법무팀 검토 시간을 단축합니다.",
    dept: "법무팀", submittedBy: "강현우", submittedAt: "2025.06.22",
    status: "준비 중",
    shareScope: "팀 공유 비서",
    sharedPrompt: "당신은 해외법인 계약서를 검토하는 법무 담당자입니다. 업로드된 영문 계약서에서 위험 조항을 찾아 한국어로 요약해 주세요.",
    basedModel: "Claude Opus 4.8",
    roleDefinition: "해외법인 영문 계약서의 위험 조항을 빠르게 찾아주는 법무 검토 도우미",
    connectedData: "표준 계약서 템플릿 및 과거 검토 사례 150건",
    sampleQuestions: ["이 계약서에서 손해배상 조항을 알려줘", "표준 계약서와 다른 부분이 있는지 확인해줘"],
    specificUrl: "https://assistant.kolmar.co.kr/agents/global-contract-review",
    itemTags: "계약서, 법무, 해외법인",
    company: ["KUS", "KMB"], platformScope: "specific",
    contacts: [{ name: "강현우", dept: "법무팀", role: "주담당자", email: "hyunwoo.kang@kolmar.co.kr" }],
    links: [], approvalStage: "2차대기", approvalHistory: [
      { stage: "2차대기", at: "2025.06.24", by: "최관리 (관계사관리자)" },
    ],
  },
  {
    kind: "ai-orchestration",
    id: "AIO-006", title: "GPT-4o (범용 업무 보조)",
    summary: "전사 직원 누구나 사용할 수 있는 범용 업무 보조 모델",
    description: "이메일 작성, 보고서 초안, 데이터 요약 등 범용 업무에 적합합니다.",
    dept: "IT개발팀", submittedBy: "정태영", submittedAt: "2025.06.24",
    status: "일부 제한",
    provider: "OpenAI", modelName: "GPT-4o", contextWindow: "문서 여러 장 (수십 페이지)",
    strengths: "범용성, 빠른 응답속도",
    strengthsDetail: "다양한 업무를 무난하게 처리합니다. 이메일 초안, 보고서 요약, 간단한 데이터 정리에 활용해보세요.",
    tokenUsageNote: "짧은 대화 1회당 약 1,000토큰 내외 사용",
    costTier: "보통", useCases: ["이메일 작성", "제안서 초안"],
    specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4o",
    itemTags: "범용, 업무보조",
    company: [], platformScope: "company-wide",
    contacts: [{ name: "정태영", dept: "IT개발팀", role: "주담당자", email: "taeyoung.jung@kolmar.co.kr" }],
    links: [], approvalStage: "1차대기", approvalHistory: [],
  },
  {
    kind: "ml",
    id: "ML-002", title: "성분 이미지 품질 분류 모델",
    summary: "원료 이미지 기반 품질 합격/불합격 자동 판정",
    description: "YOLOv8 기반 이미지 분류 모델로 생산 라인에서 촬영한 원료 이미지를 실시간 분석합니다.",
    dept: "IT개발팀", submittedBy: "오승현", submittedAt: "2025.06.26",
    status: "준비 중",
    mlType: "이미지 인식", trainingDataDesc: "내부 품질 검사 이미지 1만장",
    performanceSummary: "정확도 92.3%, 재현율 89.7%",
    devTool: "PyTorch", sourceRepo: "gitlab.kolmar.co.kr/ml/ingredient-classifier",
    outputType: "합격/불합격 바이너리 분류",
    specificUrl: "", itemTags: "품질관리, 이미지분류",
    company: ["KKM"], platformScope: "specific",
    contacts: [{ name: "오승현", dept: "IT개발팀", role: "주담당자", email: "seunghyun.oh@kolmar.co.kr" }],
    links: [], approvalStage: "1차대기", approvalHistory: [],
  },
];

export default function AdminReview() {
  const { isAdmin, isCompanyAdmin, user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<string>(INITIAL_ITEMS[0]?.id ?? "");
  const [done, setDone] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<ReviewItem>>>({});
  const [filter, setFilter] = useState<"전체" | "대기" | "처리완료">("대기");
  const [sourceFilter, setSourceFilter] = useState<"전체" | PlatformId>("전체");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const activeItem = items.find(i => i.id === selected) ?? null;
  const edit = edits[selected] ?? {};
  const merged = activeItem ? ({ ...activeItem, ...edit } as ReviewItem) : null;

  const isDisabled = done.includes(selected);

  const setEdit = <K extends keyof ReviewItem>(k: K, v: ReviewItem[K]) =>
    setEdits(p => ({ ...p, [selected]: { ...(p[selected] || {}), [k]: v } }));

  const setPlatformCompanies = (codes: string[]) => {
    setEdit("company", codes);
    setEdit("platformScope", codes.length === 0 ? "company-wide" : "specific");
  };

  const baseTimeSaved = merged ? deserializeTimeSaved((merged as ReviewPlatformItem).expectedTimeSaved) : { value: "" as number | "", period: "주" as SavedPeriod };
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

  const currentNodes = (((edit as any).nodes ?? (merged as any)?.nodes) ?? []) as string[];
  const currentApps = (((edit as any).connectedApps ?? (merged as any)?.connectedApps) ?? []) as string[];
  const addNode = (v: string) => { if (!currentNodes.includes(v)) (setEdit as any)("nodes", [...currentNodes, v]); };
  const removeNode = (v: string) => (setEdit as any)("nodes", currentNodes.filter((n: string) => n !== v));
  const addApp = (v: string) => { if (!currentApps.includes(v)) (setEdit as any)("connectedApps", [...currentApps, v]); };
  const removeApp = (v: string) => (setEdit as any)("connectedApps", currentApps.filter((a: string) => a !== v));

  const currentSampleQuestions = (((edit as any).sampleQuestions ?? (merged as any)?.sampleQuestions) ?? []) as string[];
  const addSampleQuestion = (v: string) => { if (!currentSampleQuestions.includes(v)) (setEdit as any)("sampleQuestions", [...currentSampleQuestions, v]); };
  const removeSampleQuestion = (v: string) => (setEdit as any)("sampleQuestions", currentSampleQuestions.filter((q: string) => q !== v));

  const currentUseCases = (((edit as any).useCases ?? (merged as any)?.useCases) ?? []) as string[];
  const addUseCase = (v: string) => { if (!currentUseCases.includes(v)) (setEdit as any)("useCases", [...currentUseCases, v]); };
  const removeUseCase = (v: string) => (setEdit as any)("useCases", currentUseCases.filter((u: string) => u !== v));

  // 역할별 승인 처리
  const handleApprove = () => {
    if (!activeItem || !merged) return;
    const scope = (edit as any).platformScope ?? merged.platformScope;
    if (scope === "unset") return;

    const newStage: ApprovalStage = isAdmin ? "게시됨" : "2차대기";
    const record: ApprovalRecord = {
      stage: newStage,
      at: "2026.07.10",
      by: user?.name ?? "관리자",
    };

    setItems(p => p.map(i => {
      if (i.id !== selected) return i;
      const { timeSavedValue, timeSavedPeriod, ...cleanEdit } = edit as any;
      void timeSavedValue; void timeSavedPeriod;
      return {
        ...i, ...cleanEdit,
        approvalStage: newStage,
        approvalHistory: [...(i.approvalHistory ?? []), record],
      } as ReviewItem;
    }));
    setDone(p => [...p, selected]);
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const handleReject = () => {
    if (!activeItem) return;
    if (!rejectReason.trim()) return;
    const record: ApprovalRecord = {
      stage: "반려",
      at: "2026.07.10",
      by: user?.name ?? "관리자",
      note: rejectReason,
    };
    setItems(p => p.map(i => i.id === selected ? ({
      ...i,
      approvalStage: "반려" as ApprovalStage,
      approvalHistory: [...(i.approvalHistory ?? []), record],
      rejectionReason: rejectReason,
    } as ReviewItem) : i));
    setDone(p => [...p, selected]);
    setRejectOpen(false);
    setRejectReason("");
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  // 역할별 보이는 항목 필터링
  const isRelevantToRole = (item: ReviewItem): boolean => {
    if (isAdmin) return item.approvalStage === "2차대기";
    if (isCompanyAdmin) {
      const managed = user?.managedCompany;
      const companyMatch = !managed || item.company.length === 0 || item.company.includes(managed);
      return item.approvalStage === "1차대기" && companyMatch;
    }
    return false;
  };

  const pendingItems = items.filter(i => !done.includes(i.id) && isRelevantToRole(i));

  const filteredList = items
    .filter(i => {
      if (filter === "대기") return !done.includes(i.id) && isRelevantToRole(i);
      if (filter === "처리완료") return done.includes(i.id);
      return true;
    })
    .filter(i => sourceFilter === "전체" ? true : i.kind === sourceFilter);

  const SOURCE_OPTIONS: { key: "전체" | PlatformId; label: string }[] = [
    { key: "전체", label: "전체" },
    ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
  ];

  const unsetScope = !!(merged && (((edit as any).platformScope ?? merged.platformScope) === "unset"));
  const approveBlocked = unsetScope;

  // CompanyAdmin은 1차대기 항목만, Admin은 2차대기 항목만 처리 가능
  const canActOnCurrent = !isDisabled && merged && (
    (isAdmin && merged.approvalStage === "2차대기") ||
    (isCompanyAdmin && merged.approvalStage === "1차대기")
  );

  const approveLabel = isAdmin ? "최종 승인 (게시)" : "1차 승인 → 관리자 검토 요청";

  const stageStyle = merged ? APPROVAL_STAGE_STYLE[merged.approvalStage] : null;

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar pendingCount={pendingItems.length} />

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          {/* ===== 좌측: 통합 대기 목록 ===== */}
          <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                등록 신청 목록
              </div>
              {isCompanyAdmin && (
                <div style={{ fontSize: 11, color: "#B4802E", background: "#FBF3E4", padding: "3px 8px", borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  1차 검토 담당 · {user?.managedCompany ?? "–"}
                </div>
              )}
              {isAdmin && (
                <div style={{ fontSize: 11, color: "#2563C9", background: "#E8F0FE", padding: "3px 8px", borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  최종 승인 담당 (2차)
                </div>
              )}

              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["전체", "대기", "처리완료"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, border: "none",
                    background: filter === f ? "#0F172A" : "#F1F5F9",
                    color: filter === f ? "#fff" : "#64748B",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>{f}</button>
                ))}
              </div>

              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as "전체" | PlatformId)} style={{ ...selectStyle, fontSize: 11, padding: "6px 28px 6px 10px" }}>
                {SOURCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredList.map(item => {
                const isDone = done.includes(item.id);
                const isSelected = selected === item.id;
                const sourceStyle = SOURCE_STYLE[item.kind];
                const needsAttention = item.platformScope === "unset" && !isDone;
                const stage = APPROVAL_STAGE_STYLE[item.approvalStage];
                return (
                  <div key={item.id} onClick={() => setSelected(item.id)} style={{
                    padding: "12px 14px", cursor: "pointer",
                    background: isSelected ? "#EFF6FF" : "transparent",
                    borderBottom: "1px solid #F8FAFC",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: sourceStyle.bg, color: sourceStyle.color, padding: "1px 7px", borderRadius: 20 }}>{sourceStyle.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, background: stage.bg, color: stage.fg, padding: "1px 7px", borderRadius: 20 }}>{stage.label}</span>
                      {!isDone && needsAttention && <span style={{ fontSize: 9, fontWeight: 700, color: "#DC2626" }}>관계사 미지정</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2, opacity: isDone ? 0.5 : 1 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.dept} · {item.submittedBy}</div>
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
                  <span style={{ fontSize: 11, fontWeight: 700, background: SOURCE_STYLE[merged.kind].bg, color: SOURCE_STYLE[merged.kind].color, padding: "3px 10px", borderRadius: 20 }}>{SOURCE_STYLE[merged.kind].label}</span>
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
                      const hs = APPROVAL_STAGE_STYLE[h.stage];
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: i < merged.approvalHistory.length - 1 ? 6 : 0 }}>
                          <span style={{ background: hs.bg, color: hs.fg, fontWeight: 700, padding: "1px 8px", borderRadius: 12, fontSize: 11 }}>{hs.label}</span>
                          <span style={{ color: "#475569" }}>{h.by}</span>
                          <span style={{ color: "#CBD5E1" }}>·</span>
                          <span style={{ color: "#94A3B8" }}>{h.at}</span>
                          {h.note && <span style={{ color: "#EF4444" }}>— {h.note}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(merged.approvalStage === "게시됨" || merged.approvalStage === "반려") && (
                  <div style={{ background: merged.approvalStage === "게시됨" ? "#D1FAE5" : "#FEE2E2", border: `1px solid ${merged.approvalStage === "게시됨" ? "#6EE7B7" : "#FECACA"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 600, color: merged.approvalStage === "게시됨" ? "#065F46" : "#991B1B" }}>
                    이 항목은 {APPROVAL_STAGE_STYLE[merged.approvalStage].label} 처리되었습니다.
                    {merged.approvalStage === "반려" && merged.rejectionReason && ` (사유: ${merged.rejectionReason})`}
                  </div>
                )}

                {canActOnCurrent && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
                    내용을 직접 수정한 후 승인할 수 있습니다. 수정된 내용이 최종 게시됩니다.
                  </div>
                )}

                {/* ===== 공통: 기본 정보 ===== */}
                <SectionBlock title="기본 정보">
                  <FieldRow label="제목">
                    <input value={(edit as any).title ?? merged.title} onChange={e => (setEdit as any)("title", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="한 줄 요약">
                    <input value={(edit as any).summary ?? merged.summary} onChange={e => (setEdit as any)("summary", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="상세 설명">
                    <textarea value={(edit as any).description ?? merged.description} onChange={e => (setEdit as any)("description", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                  </FieldRow>
                </SectionBlock>

                {/* ===== 소속/대상 관계사 · 상태 (공통) ===== */}
                <SectionBlock title="소속 / 대상 관계사">
                  <CompanyMultiSelect
                    selected={(edit as any).company ?? merged.company}
                    onChange={setPlatformCompanies}
                    disabled={!canActOnCurrent}
                  />
                  {canActOnCurrent && unsetScope && (
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>
                      신청자가 관계사 범위를 선택하지 않았습니다. 승인 전 직접 확인하여 선택해주세요.
                    </div>
                  )}
                  <FieldRow label="항목 상태">
                    <div style={{ marginTop: 8 }}>
                      <SingleSelectTag options={STATUS_ORDER} value={(edit as any).status ?? merged.status} onChange={v => (setEdit as any)("status", v)} disabled={!canActOnCurrent} />
                    </div>
                  </FieldRow>
                </SectionBlock>

                {/* ===== 분기: n8n / Power Automate — 워크플로우형 ===== */}
                {(merged.kind === "n8n" || merged.kind === "pa") && (
                  <>
                    <SectionBlock title={`${SOURCE_STYLE[merged.kind].label} 동작 정보`}>
                      {merged.kind === "pa" && (
                        <>
                          <FieldRow label="흐름 유형">
                            <SingleSelectTag options={PA_FLOW_TYPES} value={(edit as any).flowType ?? (merged as ReviewPlatformItem).flowType ?? ""} onChange={v => (setEdit as any)("flowType", v)} disabled={!canActOnCurrent} />
                          </FieldRow>
                          {((edit as any).flowType ?? (merged as ReviewPlatformItem).flowType) === "데스크톱 자동화 (RPA)" && (
                            <FieldRow label="실행 방식">
                              <SingleSelectTag options={PA_RUN_MODES} value={(edit as any).runMode ?? (merged as ReviewPlatformItem).runMode ?? ""} onChange={v => (setEdit as any)("runMode", v)} disabled={!canActOnCurrent} />
                            </FieldRow>
                          )}
                        </>
                      )}
                      <FieldRow label="트리거 · 동작 설명">
                        <textarea value={(edit as any).triggerAction ?? (merged as ReviewPlatformItem).triggerAction ?? ""} onChange={e => (setEdit as any)("triggerAction", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label={merged.kind === "pa" ? "실행 위치" : "실행 URL"}>
                        <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="태그">
                        <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                    </SectionBlock>

                    <SectionBlock title={merged.kind === "pa" ? "커넥터 구성" : "노드 구성"}>
                      <FieldRow label={merged.kind === "pa" ? "사용된 커넥터" : "사용된 노드"}>
                        <ChipEditor
                          items={merged.kind === "pa" ? currentApps : currentNodes}
                          onAdd={merged.kind === "pa" ? addApp : addNode}
                          onRemove={merged.kind === "pa" ? removeApp : removeNode}
                          suggestions={merged.kind === "pa" ? PA_CONNECTOR_SUGGESTIONS : NODE_SUGGESTIONS}
                          placeholder={merged.kind === "pa" ? "커넥터명 입력 후 Enter" : "노드명 입력 후 Enter"}
                          disabled={!canActOnCurrent}
                        />
                      </FieldRow>
                      {merged.kind === "pa" && (
                        <FieldRow label="커넥터 등급">
                          <SingleSelectTag options={PA_CONNECTOR_TIERS} value={(edit as any).connectorTier ?? (merged as ReviewPlatformItem).connectorTier ?? ""} onChange={v => (setEdit as any)("connectorTier", v)} disabled={!canActOnCurrent} />
                        </FieldRow>
                      )}
                      {merged.kind === "n8n" && (
                        <>
                          <FieldRow label="연동 앱·서비스">
                            <ChipEditor items={currentApps} onAdd={addApp} onRemove={removeApp} suggestions={APP_SUGGESTIONS} placeholder="연동 앱명 입력 후 Enter" disabled={!canActOnCurrent} />
                          </FieldRow>
                          {(merged as ReviewPlatformItem).workflowJson && (
                            <FieldRow label="워크플로우 JSON">
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>✓ JSON 첨부됨</span>
                                <button onClick={() => {
                                  const content = (merged as ReviewPlatformItem).workflowJson!;
                                  const blob = new Blob([content], { type: "application/json" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url; a.download = `${merged.id.toLowerCase()}-workflow.json`; a.click();
                                  URL.revokeObjectURL(url);
                                }} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                                  JSON 다운로드
                                </button>
                              </div>
                            </FieldRow>
                          )}
                        </>
                      )}
                    </SectionBlock>

                    <SectionBlock title="예상 효과">
                      <FieldRow label="예상 절감 시간">
                        <TimeSavedInput value={currentTimeSavedValue} period={currentTimeSavedPeriod} onValueChange={setTimeSavedValue} onPeriodChange={setTimeSavedPeriod} disabled={!canActOnCurrent} />
                      </FieldRow>
                      <FieldRow label="구성 난이도">
                        <SingleSelectTag options={DIFFICULTY_LEVELS} value={(edit as any).difficulty ?? (merged as ReviewPlatformItem).difficulty ?? "보통"} onChange={v => (setEdit as any)("difficulty", v)} disabled={!canActOnCurrent} />
                      </FieldRow>
                    </SectionBlock>
                  </>
                )}

                {/* ===== 분기: 나만의 비서 ===== */}
                {merged.kind === "assistant" && (
                  <SectionBlock title="비서 구성">
                    <FieldRow label="공유 범위">
                      <SingleSelectTag options={ASSISTANT_SHARE_SCOPES} value={(edit as any).shareScope ?? (merged as ReviewPlatformItem).shareScope ?? ""} onChange={v => (setEdit as any)("shareScope", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="공유 프롬프트">
                      <textarea value={(edit as any).sharedPrompt ?? (merged as ReviewPlatformItem).sharedPrompt ?? ""} onChange={e => (setEdit as any)("sharedPrompt", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-mono)", opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="기반 모델">
                      <input value={(edit as any).basedModel ?? (merged as ReviewPlatformItem).basedModel ?? ""} onChange={e => (setEdit as any)("basedModel", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      {canActOnCurrent && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                          {ASSISTANT_MODEL_HINTS.map(m => <span key={m} onClick={() => (setEdit as any)("basedModel", m)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {m}</span>)}
                        </div>
                      )}
                    </FieldRow>
                    <FieldRow label="비서 소개">
                      <input value={(edit as any).roleDefinition ?? (merged as ReviewPlatformItem).roleDefinition ?? ""} onChange={e => (setEdit as any)("roleDefinition", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="연결된 데이터·문서">
                      <textarea value={(edit as any).connectedData ?? (merged as ReviewPlatformItem).connectedData ?? ""} onChange={e => (setEdit as any)("connectedData", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="예시 질문">
                      <ChipEditor items={currentSampleQuestions} onAdd={addSampleQuestion} onRemove={removeSampleQuestion} suggestions={[]} placeholder="예시 질문 입력 후 Enter" disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="태그">
                      <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: AI Agent — 모델 사양 ===== */}
                {merged.kind === "ai-orchestration" && (
                  <SectionBlock title="모델 사양">
                    <FieldRow label="제공사">
                      <SingleSelectTag options={PROVIDER_OPTIONS} value={(edit as any).provider ?? (merged as ReviewPlatformItem).provider ?? ""} onChange={v => (setEdit as any)("provider", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="강점 및 활용 방법">
                      <textarea value={(edit as any).strengthsDetail ?? (merged as ReviewPlatformItem).strengthsDetail ?? ""} onChange={e => (setEdit as any)("strengthsDetail", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="세부 모델명">
                        <input value={(edit as any).modelName ?? (merged as ReviewPlatformItem).modelName ?? ""} onChange={e => (setEdit as any)("modelName", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="1회 사용량">
                        <input value={(edit as any).tokenUsageNote ?? (merged as ReviewPlatformItem).tokenUsageNote ?? ""} onChange={e => (setEdit as any)("tokenUsageNote", e.target.value)} disabled={!canActOnCurrent} placeholder="예: 문서 1페이지당 약 500토큰" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                    </div>
                    <FieldRow label="처리 가능한 글 분량">
                      <SingleSelectTag options={CONTEXT_SIZE_OPTIONS} value={(edit as any).contextWindow ?? (merged as ReviewPlatformItem).contextWindow ?? ""} onChange={v => (setEdit as any)("contextWindow", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="비용 등급">
                      <SingleSelectTag options={COST_TIERS} value={(edit as any).costTier ?? (merged as ReviewPlatformItem).costTier ?? "보통"} onChange={v => (setEdit as any)("costTier", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="핵심 키워드">
                      <input value={(edit as any).strengths ?? (merged as ReviewPlatformItem).strengths ?? ""} onChange={e => (setEdit as any)("strengths", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="권장 사용 시나리오">
                      <ChipEditor items={currentUseCases} onAdd={addUseCase} onRemove={removeUseCase} suggestions={USE_CASE_SUGGESTIONS} placeholder="예: 문서 요약" disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="태그">
                      <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: ML 모델 ===== */}
                {merged.kind === "ml" && (
                  <SectionBlock title="ML 모델 정보">
                    <FieldRow label="모델 유형">
                      <SingleSelectTag options={ML_TYPES} value={(edit as any).mlType ?? (merged as ReviewPlatformItem).mlType ?? ""} onChange={v => (setEdit as any)("mlType", v)} disabled={!canActOnCurrent} />
                    </FieldRow>
                    <FieldRow label="핵심 성능">
                      <input value={(edit as any).performanceSummary ?? (merged as ReviewPlatformItem).performanceSummary ?? ""} onChange={e => (setEdit as any)("performanceSummary", e.target.value)} disabled={!canActOnCurrent} placeholder="예: 정확도 92%, 또는 평균 오차 5% 이내" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="학습 데이터 개요">
                      <input value={(edit as any).trainingDataDesc ?? (merged as ReviewPlatformItem).trainingDataDesc ?? ""} onChange={e => (setEdit as any)("trainingDataDesc", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FieldRow label="개발 도구">
                        <input value={(edit as any).devTool ?? (merged as ReviewPlatformItem).devTool ?? ""} onChange={e => (setEdit as any)("devTool", e.target.value)} disabled={!canActOnCurrent} placeholder="예: PyTorch, TensorFlow" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                      <FieldRow label="출력 형태">
                        <input value={(edit as any).outputType ?? (merged as ReviewPlatformItem).outputType ?? ""} onChange={e => (setEdit as any)("outputType", e.target.value)} disabled={!canActOnCurrent} placeholder="예: 합격/불합격 분류" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      </FieldRow>
                    </div>
                    <FieldRow label="소스 저장소">
                      <input value={(edit as any).sourceRepo ?? (merged as ReviewPlatformItem).sourceRepo ?? ""} onChange={e => (setEdit as any)("sourceRepo", e.target.value)} disabled={!canActOnCurrent} placeholder="예: gitlab.kolmar.co.kr/ml/…" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="모델 접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="태그">
                      <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

                {/* ===== 분기: Vibe Coding ===== */}
                {merged.kind === "vibe" && (
                  <SectionBlock title="Vibe Coding 정보">
                    <FieldRow label="사용한 AI 도구">
                      <input value={(edit as any).devTool ?? (merged as ReviewPlatformItem).devTool ?? ""} onChange={e => (setEdit as any)("devTool", e.target.value)} disabled={!canActOnCurrent} placeholder="예: Cursor, GitHub Copilot" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                      {canActOnCurrent && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                          {VIBE_TOOL_SUGGESTIONS.map(s => (
                            <span key={s} onClick={() => (setEdit as any)("devTool", s)} style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 14, cursor: "pointer" }}>+ {s}</span>
                          ))}
                        </div>
                      )}
                    </FieldRow>
                    <FieldRow label="결과물 형태">
                      <input value={(edit as any).outputType ?? (merged as ReviewPlatformItem).outputType ?? ""} onChange={e => (setEdit as any)("outputType", e.target.value)} disabled={!canActOnCurrent} placeholder="예: React 웹앱, Python 스크립트" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="소스 저장소">
                      <input value={(edit as any).sourceRepo ?? (merged as ReviewPlatformItem).sourceRepo ?? ""} onChange={e => (setEdit as any)("sourceRepo", e.target.value)} disabled={!canActOnCurrent} placeholder="예: gitlab.kolmar.co.kr/vibe/…" style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="접속 URL">
                      <input value={(edit as any).specificUrl ?? (merged as ReviewPlatformItem).specificUrl ?? ""} onChange={e => (setEdit as any)("specificUrl", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                    <FieldRow label="태그">
                      <input value={(edit as any).itemTags ?? (merged as ReviewPlatformItem).itemTags ?? ""} onChange={e => (setEdit as any)("itemTags", e.target.value)} disabled={!canActOnCurrent} style={{ ...inputStyle, opacity: !canActOnCurrent ? 0.6 : 1 }} />
                    </FieldRow>
                  </SectionBlock>
                )}

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

                {/* ===== 승인 / 반려 액션 ===== */}
                {canActOnCurrent && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {approveBlocked && (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 14px", fontSize: 12, color: "#991B1B" }}>
                        관계사 범위가 선택되지 않아 승인할 수 없습니다. "소속 / 대상 관계사"에서 해당 관계사를 선택해주세요.
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={handleApprove}
                        disabled={approveBlocked}
                        style={{ flex: 1, background: approveBlocked ? "#CBD5E1" : (isAdmin ? "#059669" : "#2563EB"), color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: approveBlocked ? "not-allowed" : "pointer" }}
                      >
                        {approveLabel}
                      </button>
                      <button onClick={() => setRejectOpen(v => !v)} style={{ flex: 1, background: "#fff", border: "1.5px solid #FECACA", color: "#EF4444", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        반려
                      </button>
                    </div>
                    {rejectOpen && (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "14px 16px" }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 8 }}>반려 사유 (필수)</label>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="반려 사유를 입력하세요. 신청자에게 그대로 전달됩니다." style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }} />
                        <button onClick={handleReject} disabled={!rejectReason.trim()} style={{ background: rejectReason.trim() ? "#EF4444" : "#CBD5E1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}>
                          반려 확정
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!canActOnCurrent && !isDisabled && merged && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#64748B" }}>
                    {isCompanyAdmin && merged.approvalStage !== "1차대기" && "이 항목은 현재 단계에서 1차 검토 권한이 없습니다."}
                    {isAdmin && merged.approvalStage !== "2차대기" && "이 항목은 아직 1차 승인이 완료되지 않았습니다."}
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
