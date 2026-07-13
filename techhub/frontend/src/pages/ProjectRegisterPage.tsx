import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS, STATUS_ORDER, BUSINESS_DOMAINS } from "../types/platformTypes";
import type { PlatformId, BusinessDomain } from "../types/platformTypes";
import { toWorkflowDef, parseN8nJson } from "../components/WorkflowDiagram";
import type { WorkflowInput } from "../components/WorkflowDiagram";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { FORM_MAX_WIDTH } from "../styles/layout";


const COST_TIERS = ["낮음", "보통", "높음"] as const;
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"] as const;

// 예상 절감 시간 — 수치 + 주기 조합으로 입력받아 표준 문자열로 직렬화
type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };
const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;
const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

// n8n 노드 자동완성 힌트
const NODE_SUGGESTIONS = [
  "Manual Trigger", "Schedule Trigger", "Form Trigger", "Chat Trigger", "Webhook",
  "Set (Edit Fields)", "Code", "IF", "Switch", "Filter", "Merge", "Aggregate", "Sort",
  "AI Agent", "Basic LLM Chain",
];
const APP_SUGGESTIONS = [
  "Microsoft Outlook", "Microsoft Teams", "Microsoft One Drive", "Google Sheets",
  "HTTP Request", "Spreadsheet File", "Respond To Webhook",
];

// Power Automate 커넥터 힌트
const PA_CONNECTOR_SUGGESTIONS = [
  "SharePoint", "Microsoft Teams", "Outlook", "Dataverse",
  "Excel Online", "Microsoft Forms", "OneDrive", "Planner", "Approvals", "HTTP",
];

// Power Automate 흐름 유형 — 쉬운 말로 풀어씀 (기술 용어는 참고용으로만 괄호 표기)
const PA_FLOW_TYPES = [
  "이벤트 발생 시 자동 실행", "버튼 클릭으로 즉시 실행", "정해진 시간에 예약 실행",
  "데스크톱 자동화 (RPA)", "업무 절차 안내형",
] as const;
// 데스크톱 자동화(RPA)에만 해당하는 실행 방식 — 선택 항목
const PA_RUN_MODES = ["사람이 지켜보며 실행", "무인으로 자동 실행"] as const;
// 유료 커넥터가 포함되면 다른 관계사 재사용 시 라이선스 확인이 필요
const PA_CONNECTOR_TIERS = ["기본 커넥터만 사용", "유료(프리미엄) 커넥터 포함"] as const;

// 나만의 비서 — 공유 범위
const ASSISTANT_SHARE_SCOPES = ["회사 공통 비서", "팀 공유 비서", "개인 비서 (비공개)"] as const;
// HK GPT 제공 모델 힌트
const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "LG AI", "Upstage",
];

// AI Agent(HK GPT 게이트웨이) — 제공사 선택형 (6종 확정)
const PROVIDER_OPTIONS = ["웍스 대표 모델", "OpenAI", "Anthropic", "Google", "LG AI", "Upstage"];
// "컨텍스트 윈도우"라는 어려운 말 대신 처리 가능한 글 분량을 쉬운 말로 선택
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];
// 권장 사용 시나리오 힌트
const USE_CASE_SUGGESTIONS = ["문서 요약", "코드 생성", "법무 검토", "번역", "데이터 분석", "이미지 분석", "회의록 정리", "제안서 초안"];

// ML 모델 유형
const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링", "추천 시스템",
  "NLP", "컴퓨터 비전", "시계열 예측", "기타",
];

// Vibe Coding 도구 힌트
const VIBE_TOOL_SUGGESTIONS = [
  "Cursor", "GitHub Copilot", "Claude", "ChatGPT", "Codeium", "Windsurf", "Bolt.new", "v0",
];

// TODO: 실제 연동 시 GET /api/v1/admin/companies?visible=true 응답으로 교체
const COMPANIES = [
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

const SELECTABLE_COMPANIES = COMPANIES.filter(c => c.visible);

const platformCompanyDisplay = (codes: string[]): string => {
  if (codes.length === 0) return "전사 공용";
  const names = codes.map(c => COMPANIES.find(co => co.code === c)?.name ?? c);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} 외 ${names.length - 2}곳`;
};

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };

const KIND_OPTIONS: { key: PlatformId; label: string; desc: string; color: string; bg: string }[] = PLATFORMS.map(p => {
  if (p.id === "assistant") {
    return { key: p.id, label: p.name, desc: "HK GPT를 프롬프트·역할로 커스터마이징해 동료와 공유하는 개인/팀 에이전트", color: p.color, bg: p.bg };
  }
  if (p.id === "ai-orchestration") {
    return { key: p.id, label: "AI Agent", desc: p.shortDesc, color: p.color, bg: p.bg };
  }
  return { key: p.id, label: p.name, desc: p.shortDesc, color: p.color, bg: p.bg };
});

// 실행 환경이 n8n/PA인 워크플로우형만 노드·커넥터 UI 대상. 나만의 비서는 별도 구성 화면으로 분리.
const isWorkflowKind = (k: PlatformId) => k === "n8n" || k === "pa";
const isAssistantKind = (k: PlatformId) => k === "assistant";
const isModelKind = (k: PlatformId) => k === "ai-orchestration";
const isMLKind = (k: PlatformId) => k === "ml";
const isVibeKind = (k: PlatformId) => k === "vibe";

type FormState = {
  title: string; summary: string; description: string; status: string;
  // 워크플로우 전용 (n8n, pa)
  triggerAction: string; itemTags: string; specificUrl: string;
  nodes: string[]; connectedApps: string[];
  timeSavedValue: number | ""; timeSavedPeriod: SavedPeriod;
  difficulty: typeof DIFFICULTY_LEVELS[number];
  // n8n 전용
  workflowInput: WorkflowInput; workflowJson: string;
  // pa 전용
  flowType: string; runMode: string; connectorTier: string;
  // assistant 전용
  shareScope: string; sharedPrompt: string; basedModel: string; roleDefinition: string;
  connectedData: string; sampleQuestions: string[];
  // ai-orchestration 전용
  provider: string; modelName: string; contextWindow: string;
  strengths: string; strengthsDetail: string; tokenUsageNote: string;
  costTier: typeof COST_TIERS[number]; useCases: string[];
  // ml 전용
  mlType: string; trainingDataDesc: string; performanceSummary: string;
  // ml/vibe 공용
  devTool: string; sourceRepo: string; outputType: string;
  // 플랫폼 공용
  platformCompanies: string[];
  contacts: Contact[];
  links: LinkItem[];
  domain: BusinessDomain | "";
};

const STEPS_BY_KIND = (kind: PlatformId): string[] => {
  if (kind === "ai-orchestration") return ["유형 선택", "기본정보", "모델 사양", "담당자·링크", "최종확인"];
  if (kind === "ml") return ["유형 선택", "기본정보", "ML 모델 정보", "담당자·링크", "최종확인"];
  if (kind === "vibe") return ["유형 선택", "기본정보", "Vibe Coding 정보", "담당자·링크", "최종확인"];
  if (kind === "pa") return ["유형 선택", "기본정보", "플로우 구성·효과", "담당자·링크", "최종확인"];
  if (kind === "assistant") return ["유형 선택", "기본정보", "비서 구성", "담당자·링크", "최종확인"];
  return ["유형 선택", "기본정보", "구성·효과", "담당자·링크", "최종확인"]; // n8n
};

// ===== 공용 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: "#1A1F27", border: "1.5px solid #EBEEF3",
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const };
const rowActionWidth = 24;

// ===== 공용 컴포넌트 (모듈 레벨) =====
function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
        {title}
        {optional && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", background: "#F1F5F9", padding: "2px 8px", borderRadius: 20 }}>선택</span>
        )}
      </div>
      {children}
    </div>
  );
}

// 필수 항목 클러스터와 선택 항목 클러스터를 시각적으로 구분하는 구분선
function SubHeading({ label = "선택 정보 (지금 몰라도 됩니다)" }: { label?: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em",
      margin: "4px 0 16px", paddingTop: 16, borderTop: "1px dashed #EBEEF3",
    }}>{label}</div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 8 }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Tag({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{
      fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
      border: `1.5px solid ${selected ? "#1C6BFF" : "#EBEEF3"}`,
      background: selected ? "#E8F0FE" : "#fff",
      color: selected ? "#1C6BFF" : "#475569",
      cursor: "pointer", userSelect: "none",
    }}>{label}</span>
  );
}

function RowRemoveButton({ first, onClick }: { first: boolean; onClick: () => void }) {
  if (first) {
    return <span aria-hidden style={{ width: rowActionWidth, display: "inline-block", flexShrink: 0 }} />;
  }
  return (
    <button onClick={onClick} style={{
      width: rowActionWidth, background: "none", border: "none", color: "#94A3B8",
      cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0,
    }}>×</button>
  );
}

function TimeSavedInput({
  value, period, onValueChange, onPeriodChange,
}: {
  value: number | ""; period: SavedPeriod;
  onValueChange: (v: number | "") => void; onPeriodChange: (p: SavedPeriod) => void;
}) {
  const annual = annualHours(value, period);
  const hasValue = value !== "" && Number(value) > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {SAVED_PERIODS.map(p => (
            <span key={p} onClick={() => onPeriodChange(p)} style={{
              fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
              border: `1.5px solid ${period === p ? "#1C6BFF" : "#EBEEF3"}`,
              background: period === p ? "#E8F0FE" : "#fff",
              color: period === p ? "#1C6BFF" : "#475569",
              cursor: "pointer", userSelect: "none",
            }}>{p}</span>
          ))}
        </div>
        <input
          type="number" min={0} step={0.5} inputMode="decimal" value={value}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") { onValueChange(""); return; }
            const n = Number(raw);
            if (Number.isNaN(n) || n < 0) return;
            onValueChange(n);
          }}
          placeholder="예: 3"
          style={{ ...inputStyle, maxWidth: 120 }}
          onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
          onBlur={e => (e.target.style.borderColor = "#EBEEF3")}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>시간</span>
      </div>
      {hasValue && (
        <div style={{
          marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
          padding: "10px 14px", fontSize: 12, color: "#065F46", lineHeight: 1.6,
        }}>
          <strong style={{ fontWeight: 700 }}>{PERIOD_FULL_LABEL[period]} {value}시간</strong> 절감
          {" → "}
          연간 약 <strong style={{ fontWeight: 700 }}>{annual.toLocaleString()}시간</strong>
          <span style={{ color: "#059669", marginLeft: 4 }}>
            ({value}시간 × {PERIOD_ANNUAL_FACTOR[period].toLocaleString()}{period === "년" ? "" : period})
          </span>
        </div>
      )}
    </div>
  );
}

function CompanyMultiSelect({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isCompanyWide = selected.length === 0;
  const filteredCompanies = SELECTABLE_COMPANIES.filter(c =>
    search === "" || c.name.includes(search) || c.code.includes(search.toUpperCase())
  );
  const toggleCompany = (code: string) =>
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code]);
  const selectCompanyWide = () => onChange([]);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} type="button" style={{
        ...inputStyle, textAlign: "left", width: "100%", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        color: "#1A1F27", fontWeight: 600,
      }}>
        <span>{platformCompanyDisplay(selected)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
          background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "10px 10px 6px",
          maxHeight: 340, display: "flex", flexDirection: "column",
        }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 8px",
            borderRadius: 6, cursor: "pointer", background: isCompanyWide ? "#E8F0FE" : "transparent",
            marginBottom: 6, borderBottom: "1px solid #F1F5F9",
          }}>
            <input type="checkbox" checked={isCompanyWide} onChange={selectCompanyWide} style={{ cursor: "pointer" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isCompanyWide ? "#1C6BFF" : "#334155" }}>전사 공용 (특정 관계사 한정 없음)</span>
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="관계사명 또는 코드로 검색"
            style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", marginBottom: 6 }} />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredCompanies.map(c => (
              <label key={c.code} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                borderRadius: 6, cursor: "pointer",
                background: selected.includes(c.code) ? "#E8F0FE" : "transparent",
              }}>
                <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleCompany(c.code)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>{c.name}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{c.code}</span>
              </label>
            ))}
            {filteredCompanies.length === 0 && (
              <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>검색 결과가 없습니다.</div>
            )}
          </div>
          <button onClick={() => setOpen(false)} type="button" style={{
            marginTop: 8, background: "#1A1F27", color: "#fff", border: "none", borderRadius: 6,
            padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>완료</button>
        </div>
      )}
    </div>
  );
}

function ChipInput({
  items, onAdd, onRemove, draft, onDraftChange, suggestions, placeholder,
}: {
  items: string[]; onAdd: (value?: string) => void; onRemove: (v: string) => void;
  draft: string; onDraftChange: (v: string) => void; suggestions: string[]; placeholder: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: items.length > 0 ? 10 : 0 }}>
        {items.map(item => (
          <span key={item} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, background: "#E8F0FE", color: "#1E40AF",
            padding: "4px 6px 4px 10px", borderRadius: 6, border: "1px solid #BFDBFE",
          }}>
            {item}
            <button onClick={() => onRemove(item)} style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={e => onDraftChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder} style={{ ...inputStyle, flex: 1 }}
          onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
          onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
        <button onClick={() => onAdd()} style={{
          background: "#1C6BFF", color: "#fff", border: "none", borderRadius: 7,
          padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}>추가</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
        {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
          <span key={s} onClick={() => onAdd(s)} style={{
            fontSize: 11, color: "#94A3B8", background: "#F4F6F9", border: "1px solid #EBEEF3",
            padding: "3px 9px", borderRadius: 20, cursor: "pointer",
          }}>+ {s}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProjectRegisterPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<PlatformId | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "", summary: "", description: "", status: "",
    triggerAction: "", itemTags: "", specificUrl: "",
    nodes: [], connectedApps: [],
    timeSavedValue: "", timeSavedPeriod: "주", difficulty: "보통",
    workflowInput: { status: "Stable", nodes: [] }, workflowJson: "",
    flowType: "", runMode: "", connectorTier: "",
    shareScope: "", sharedPrompt: "", basedModel: "", roleDefinition: "", connectedData: "", sampleQuestions: [],
    provider: "", modelName: "", contextWindow: "",
    strengths: "", strengthsDetail: "", tokenUsageNote: "", costTier: "보통", useCases: [],
    mlType: "", trainingDataDesc: "", performanceSummary: "",
    devTool: "", sourceRepo: "", outputType: "",
    // 등록자 소속 관계사를 기본 선택값으로 사용 — 전사 공용/다른 관계사로는 드롭다운에서 변경 가능
    platformCompanies: user?.company ? [user.company] : [],
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [{ label: "", url: "" }],
    domain: "",
  });

  const [platformScope, setPlatformScope] = useState<"unset" | "company-wide" | "specific">(
    user?.company ? "specific" : "unset"
  );
  const [n8nUploadedFile, setN8nUploadedFile] = useState<string | null>(null);
  const [n8nJsonError, setN8nJsonError] = useState<string | null>(null);
  const [draftNode, setDraftNode] = useState("");
  const [draftApp, setDraftApp] = useState("");
  const [draftSampleQuestion, setDraftSampleQuestion] = useState("");
  const [draftUseCase, setDraftUseCase] = useState("");

  const handleN8nJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const obj = JSON.parse(text) as Record<string, unknown>;
        if (!obj || typeof obj !== "object" || !Array.isArray(obj.nodes)) {
          setN8nJsonError("n8n 워크플로우 JSON 형식이 아닙니다. nodes 배열이 없습니다.");
          setN8nUploadedFile(null);
          return;
        }
      } catch {
        setN8nJsonError("JSON 파싱에 실패했습니다. 파일이 올바른 JSON 형식인지 확인하세요.");
        setN8nUploadedFile(null);
        return;
      }
      const parsed = parseN8nJson(text);
      if (parsed) {
        setForm(p => ({ ...p, workflowInput: parsed.workflowInput, workflowJson: parsed.rawJson }));
        setN8nUploadedFile(file.name);
        setN8nJsonError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

  const handlePlatformCompaniesChange = (codes: string[]) => {
    setForm(p => ({ ...p, platformCompanies: codes }));
    setPlatformScope(codes.length === 0 ? "company-wide" : "specific");
  };

  const addNode = (value?: string) => {
    const v = (value ?? draftNode).trim();
    if (!v || form.nodes.includes(v)) return;
    setForm(p => ({ ...p, nodes: [...p.nodes, v] }));
    setDraftNode("");
  };
  const removeNode = (v: string) => setForm(p => ({ ...p, nodes: p.nodes.filter(n => n !== v) }));

  const addApp = (value?: string) => {
    const v = (value ?? draftApp).trim();
    if (!v || form.connectedApps.includes(v)) return;
    setForm(p => ({ ...p, connectedApps: [...p.connectedApps, v] }));
    setDraftApp("");
  };
  const removeApp = (v: string) => setForm(p => ({ ...p, connectedApps: p.connectedApps.filter(a => a !== v) }));

  const addSampleQuestion = (value?: string) => {
    const v = (value ?? draftSampleQuestion).trim();
    if (!v || form.sampleQuestions.includes(v)) return;
    setForm(p => ({ ...p, sampleQuestions: [...p.sampleQuestions, v] }));
    setDraftSampleQuestion("");
  };
  const removeSampleQuestion = (v: string) => setForm(p => ({ ...p, sampleQuestions: p.sampleQuestions.filter(q => q !== v) }));

  const addUseCase = (value?: string) => {
    const v = (value ?? draftUseCase).trim();
    if (!v || form.useCases.includes(v)) return;
    setForm(p => ({ ...p, useCases: [...p.useCases, v] }));
    setDraftUseCase("");
  };
  const removeUseCase = (v: string) => setForm(p => ({ ...p, useCases: p.useCases.filter(u => u !== v) }));

  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, { name: "", dept: "", role: "공동담당자", email: "" }] }));
  const removeContact = (i: number) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, ci) => ci !== i) }));
  const setContact = (i: number, k: keyof Contact, v: string) =>
    setForm(p => ({ ...p, contacts: p.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c) }));

  const addLink = () => setForm(p => ({ ...p, links: [...p.links, { label: "", url: "" }] }));
  const removeLink = (i: number) => setForm(p => ({ ...p, links: p.links.filter((_, li) => li !== i) }));
  const setLink = (i: number, k: keyof LinkItem, v: string) =>
    setForm(p => ({ ...p, links: p.links.map((l, li) => li === i ? { ...l, [k]: v } : l) }));

  const STEPS = kind ? STEPS_BY_KIND(kind) : ["유형 선택"];

  const canNext = () => {
    if (step === 0) return kind !== null;
    if (step === 1) return Boolean(form.title.trim() && form.summary.trim() && form.description.trim());
    if (step === 2) {
      if (!kind) return false;
      if (isModelKind(kind)) {
        return Boolean(
          form.status && platformScope !== "unset" &&
          form.provider.trim() && form.strengthsDetail.trim() && form.specificUrl.trim()
        );
      }
      if (isMLKind(kind)) {
        return Boolean(form.status && platformScope !== "unset" && form.mlType.trim());
      }
      if (isVibeKind(kind)) {
        return Boolean(form.status && platformScope !== "unset");
      }
      if (isAssistantKind(kind)) {
        return Boolean(form.status && platformScope !== "unset" && form.shareScope.trim() && form.sharedPrompt.trim());
      }
      if (kind === "pa") {
        return Boolean(form.status && platformScope !== "unset" && form.flowType.trim() && form.nodes.length > 0);
      }
      // n8n
      return Boolean(form.status && platformScope !== "unset" && form.nodes.length > 0 && form.specificUrl.trim());
    }
    if (step === 3) return Boolean(form.contacts[0]?.name && form.contacts[0]?.email);
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    // TODO: 실제 연동 시 POST /api/v1/platform-items 로 전송
    const _payload = {
      platformId: kind,
      ...form,
      domain: form.domain || undefined,
      expectedTimeSaved: serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod),
      workflowDef: kind === "n8n" ? toWorkflowDef(form.workflowInput) : undefined,
      workflowJson: kind === "n8n" && form.workflowJson ? form.workflowJson : undefined,
    };
    void _payload;
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      navigate("/my-status");
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 1200);
  };

  // 비관리자에게는 ai-orchestration 유형 미노출
  const visibleKindOptions = isAdmin ? KIND_OPTIONS : KIND_OPTIONS.filter(o => o.key !== "ai-orchestration");

  // 방어 로직: 비관리자가 어떤 경로로든 ai-orchestration을 선택한 경우 리셋
  if (!isAdmin && kind === "ai-orchestration") {
    setKind(visibleKindOptions[0]?.key ?? null);
  }

  const selectedKindMeta = kind ? KIND_OPTIONS.find(k => k.key === kind)! : null;
  const timeSavedDisplay = serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod) || "—";
  const companyHint = "기본적으로 소속 관계사가 선택되어 있습니다. 전사 공용이나 다른 관계사로 바꾸려면 드롭다운에서 변경하세요.";

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>

      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "20px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em" }}>신규 항목 등록 신청</h1>
          <p style={{ fontSize: 13, color: "#697386", marginTop: 4 }}>작성 완료 후 관리자 검토를 거쳐 AX Platform에 게시됩니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box" }}>

        {/* STEP INDICATOR */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i < step ? "#059669" : i === step ? "#1C6BFF" : "#EBEEF3",
                  color: i <= step ? "#fff" : "#94A3B8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? "#1A1F27" : "#94A3B8", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < step ? "#059669" : "#EBEEF3", margin: "0 10px" }} />}
            </div>
          ))}
        </div>

        {/* ===== STEP 0 — 유형 선택 ===== */}
        {step === 0 && (
          <Section title="등록할 항목의 유형을 선택하세요">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {visibleKindOptions.map(opt => (
                <div key={opt.key} onClick={() => setKind(opt.key)} style={{
                  border: `1.5px solid ${kind === opt.key ? opt.color : "#EBEEF3"}`,
                  borderTop: `3px solid ${opt.color}`,
                  background: kind === opt.key ? opt.bg : "#fff",
                  borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: opt.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1F27" }}>{opt.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#697386", lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, fontSize: 11, color: "#6D28D9" }}>
                AI Agent 유형은 관리자 전용 등록입니다. 카탈로그 표준(모델명 + 제공사 표기)에 맞춰 등록해 주세요.
              </div>
            )}
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#F4F6F9", border: "1px solid #EBEEF3", borderRadius: 8, fontSize: 11, color: "#697386" }}>
              어떤 유형을 선택해도 등록 신청 → 관리자 검토 → 승인 절차는 동일하게 적용됩니다.
            </div>
          </Section>
        )}

        {/* ===== STEP 1 — 공통 기본정보 ===== */}
        {step === 1 && (
          <Section title={`기본정보${selectedKindMeta ? ` (${selectedKindMeta.label})` : ""}`}>
            <Field label="제목" required hint={kind === "ai-orchestration" ? "표기 규칙: 모델명 (제공사) — 예: Claude Sonnet 4.6 (Anthropic)" : undefined}>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder={
                  kind === "ai-orchestration" ? "예: Claude Sonnet 4.6 (Anthropic)" :
                  kind === "n8n" ? "예: 신규 입사자 계정 자동 생성" :
                  kind === "pa" ? "예: 결재 완료 시 SharePoint 업데이트" :
                  kind === "assistant" ? "예: 특허 문서 검토 도우미" :
                  kind === "ml" ? "예: 불량품 이미지 분류 모델" :
                  kind === "vibe" ? "예: 재고 현황 대시보드" :
                  "제목을 입력하세요"
                }
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="한 줄 요약" required>
              <input value={form.summary} onChange={e => set("summary", e.target.value)}
                placeholder="이 항목이 무엇을 하는지 한 문장으로 설명하세요"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="상세 설명" required>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder={
                  kind === "ai-orchestration" ? "어떤 업무에 적합한 모델인지, 어떤 상황에서 선택하면 좋은지 설명하세요." :
                  kind === "assistant" ? "HK GPT를 어떤 업무에 맞게 커스터마이징했는지, 주요 활용 시나리오를 설명하세요." :
                  kind === "ml" ? "모델의 목적, 학습 데이터 출처, 현재 운영 상태 등을 포함하세요." :
                  kind === "vibe" ? "어떤 문제를 해결하기 위해 만들었는지, 주요 기능을 설명하세요." :
                  kind === "pa" ? "어떤 업무를 자동화하는지, 어떤 상황에서 실행되는지 설명하세요." :
                  "트리거 조건, 동작 순서, 연동되는 시스템을 포함하면 좋습니다."
                }
                style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            {kind !== "ai-orchestration" && (
              <Field label="업무 도메인" hint="이 항목이 주로 활용되는 업무 영역을 선택하세요.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BUSINESS_DOMAINS.map(d => (
                    <Tag key={d} label={d} selected={form.domain === d} onClick={() => set("domain", form.domain === d ? "" : d as BusinessDomain)} />
                  ))}
                </div>
              </Field>
            )}
          </Section>
        )}

        {/* ===== STEP 2 — 워크플로우형 (n8n, pa) ===== */}
        {step === 2 && kind && isWorkflowKind(kind) && (
          <>
            <Section title={`${selectedKindMeta?.label} 동작 정보`}>
              <Field label="상태" required>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STATUS_ORDER.map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
                </div>
              </Field>
              <Field label="소속 / 대상 관계사" required hint={companyHint}>
                <CompanyMultiSelect selected={form.platformCompanies} onChange={handlePlatformCompaniesChange} />
                {platformScope === "unset" && (
                  <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>드롭다운을 열어 선택을 완료해주세요.</div>
                )}
              </Field>

              {kind === "pa" && (
                <Field label="흐름 유형" required hint="자동으로 실행되는 방식과 데스크톱 자동화(RPA)는 성격이 다릅니다.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PA_FLOW_TYPES.map(f => <Tag key={f} label={f} selected={form.flowType === f} onClick={() => set("flowType", f)} />)}
                  </div>
                </Field>
              )}

              {kind === "n8n" && (
                <Field label="실행 URL" required>
                  <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                    placeholder="https://" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                    onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
                </Field>
              )}

              <SubHeading />

              {kind === "pa" && form.flowType === "데스크톱 자동화 (RPA)" && (
                <Field label="실행 방식" hint="데스크톱 자동화(RPA)에만 해당합니다.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PA_RUN_MODES.map(r => <Tag key={r} label={r} selected={form.runMode === r} onClick={() => set("runMode", r)} />)}
                  </div>
                </Field>
              )}

              <Field label="트리거 · 동작 설명" hint="언제 실행되고, 어떤 순서로 동작하는지 설명하세요.">
                <textarea value={form.triggerAction} onChange={e => set("triggerAction", e.target.value)}
                  placeholder={kind === "pa"
                    ? "예: 양식 제출 시 승인 요청 → 승인 완료 후 SharePoint 항목 업데이트 → Teams 알림"
                    : "예: Schedule Trigger(매일 오전 8시) → 재고 API 조회 → IF(임계치 이하) → Teams 알림"}
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                  onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
              </Field>

              {kind === "pa" && (
                <Field label="실행 위치" hint="Power Automate 포털 링크 또는 이 흐름이 연결된 Teams·SharePoint 위치를 입력하세요.">
                  <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                    placeholder="예: Teams > 구매팀 채널 승인 카드, 또는 포털 링크" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                    onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
                </Field>
              )}

              <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
                <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                  placeholder="예: HR, 계정자동화" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                  onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
              </Field>
            </Section>

            <Section title={kind === "pa" ? "커넥터 구성" : "노드 구성"}>
              <Field label={kind === "pa" ? "사용된 커넥터" : "사용된 노드"} required>
                <ChipInput
                  items={form.nodes}
                  onAdd={addNode} onRemove={removeNode}
                  draft={draftNode} onDraftChange={setDraftNode}
                  suggestions={kind === "pa" ? PA_CONNECTOR_SUGGESTIONS : NODE_SUGGESTIONS}
                  placeholder={kind === "pa" ? "커넥터명 입력 후 Enter" : "노드명 입력 후 Enter"}
                />
              </Field>

              <SubHeading />

              {kind === "pa" && (
                <Field label="커넥터 등급" hint="유료 커넥터가 포함되면 다른 관계사에서 재사용할 때 라이선스 확인이 필요할 수 있습니다.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PA_CONNECTOR_TIERS.map(c => <Tag key={c} label={c} selected={form.connectorTier === c} onClick={() => set("connectorTier", c)} />)}
                  </div>
                </Field>
              )}
              <Field label="연동 앱·서비스">
                <ChipInput
                  items={form.connectedApps}
                  onAdd={addApp} onRemove={removeApp}
                  draft={draftApp} onDraftChange={setDraftApp}
                  suggestions={APP_SUGGESTIONS}
                  placeholder="연동 앱명 입력 후 Enter"
                />
              </Field>
              {kind === "n8n" && (
                <>
                  <Field label="워크플로우 JSON 업로드" hint="n8n에서 내보낸 .json 파일을 업로드하면 다이어그램이 자동으로 표시됩니다.">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: n8nJsonError ? 8 : 0 }}>
                      <label style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#1A1F27", color: "#fff", borderRadius: 7,
                        padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        JSON 파일 선택
                        <input type="file" accept=".json" onChange={handleN8nJsonUpload} style={{ display: "none" }} />
                      </label>
                      {n8nUploadedFile ? (
                        <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>✓ {n8nUploadedFile}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>선택된 파일 없음</span>
                      )}
                    </div>
                    {n8nJsonError && (
                      <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7, padding: "8px 12px" }}>
                        {n8nJsonError}
                      </div>
                    )}
                    {form.workflowJson && !n8nJsonError && (
                      <div style={{ marginTop: 12 }}>
                        <N8nFlowPreview json={form.workflowJson} compact />
                      </div>
                    )}
                  </Field>
                </>
              )}
            </Section>

            <Section title="예상 효과" optional>
              <Field label="예상 절감 시간" hint="절감되는 업무 시간을 입력하면 통계용 연간 환산값이 자동으로 계산됩니다.">
                <TimeSavedInput
                  value={form.timeSavedValue} period={form.timeSavedPeriod}
                  onValueChange={v => set("timeSavedValue", v)}
                  onPeriodChange={p => set("timeSavedPeriod", p)}
                />
              </Field>
              <Field label="구성 난이도">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {DIFFICULTY_LEVELS.map(d => <Tag key={d} label={d} selected={form.difficulty === d} onClick={() => set("difficulty", d)} />)}
                </div>
              </Field>
            </Section>
          </>
        )}

        {/* ===== STEP 2 — 나만의 비서 (assistant) ===== */}
        {step === 2 && kind && isAssistantKind(kind) && (
          <Section title="비서 구성">
            <Field label="상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUS_OPTIONS_BY_KIND(kind).map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="소속 / 대상 관계사" required hint={companyHint}>
              <CompanyMultiSelect selected={form.platformCompanies} onChange={handlePlatformCompaniesChange} />
              {platformScope === "unset" && (
                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>드롭다운을 열어 선택을 완료해주세요.</div>
              )}
            </Field>
            <Field label="공유 범위" required hint="이 비서를 누구와 공유하는지 선택하세요.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ASSISTANT_SHARE_SCOPES.map(s => <Tag key={s} label={s} selected={form.shareScope === s} onClick={() => set("shareScope", s)} />)}
              </div>
            </Field>
            <Field label="공유 프롬프트" required hint="동료가 그대로 복사해서 쓸 수 있도록, 실제로 사용한 프롬프트 내용을 입력하세요.">
              <textarea value={form.sharedPrompt} onChange={e => set("sharedPrompt", e.target.value)}
                placeholder={'예: "당신은 계약서를 검토하는 법무 담당자입니다. 업로드된 계약서에서 위험 조항을 찾아 표로 정리해 주세요..."'}
                style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-mono)" }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>

            <SubHeading />

            <Field label="기반 모델" hint="HK GPT에서 선택한 대표 모델을 입력하세요.">
              <input value={form.basedModel} onChange={e => set("basedModel", e.target.value)}
                placeholder="예: Claude Opus 4.8, GPT-5.4" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {ASSISTANT_MODEL_HINTS.map(m => (
                  <span key={m} onClick={() => set("basedModel", m)} style={{
                    fontSize: 11, color: "#94A3B8", background: "#F4F6F9", border: "1px solid #EBEEF3",
                    padding: "3px 9px", borderRadius: 20, cursor: "pointer",
                  }}>+ {m}</span>
                ))}
              </div>
            </Field>
            <Field label="비서 소개" hint="이 비서를 한 문장으로 소개하면 어떻게 될까요?">
              <input value={form.roleDefinition} onChange={e => set("roleDefinition", e.target.value)}
                placeholder="예: 계약서 위험 조항을 빠르게 찾아주는 법무 검토 도우미" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="연결된 데이터·문서" hint="업로드된 참고 문서나 연결된 사내 데이터가 있다면 설명하세요.">
              <textarea value={form.connectedData} onChange={e => set("connectedData", e.target.value)}
                placeholder="예: 최근 3년 특허 출원 문서 PDF 220건"
                style={{ ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="예시 질문" hint="이 비서에게 할 수 있는 대표 질문을 입력하세요.">
              <ChipInput
                items={form.sampleQuestions}
                onAdd={addSampleQuestion} onRemove={removeSampleQuestion}
                draft={draftSampleQuestion} onDraftChange={setDraftSampleQuestion}
                suggestions={[]}
                placeholder="예: 이 계약서의 위험 조항을 알려줘"
              />
            </Field>
            <Field label="접속 URL">
              <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                placeholder="HK GPT 내 비서 링크 (선택)" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                placeholder="예: 법무, 계약검토" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 2 — AI Agent (ai-orchestration) 모델 사양 ===== */}
        {step === 2 && kind && isModelKind(kind) && (
          <Section title="모델 사양">
            <Field label="상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUS_OPTIONS_BY_KIND(kind).map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="소속 / 대상 관계사" required hint={companyHint}>
              <CompanyMultiSelect selected={form.platformCompanies} onChange={handlePlatformCompaniesChange} />
              {platformScope === "unset" && (
                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>드롭다운을 열어 선택을 완료해주세요.</div>
              )}
            </Field>
            <Field label="제공사" required hint="HK GPT에서 선택 가능한 제공사 기준입니다.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PROVIDER_OPTIONS.map(p => <Tag key={p} label={p} selected={form.provider === p} onClick={() => set("provider", p)} />)}
              </div>
            </Field>
            <Field label="강점 및 활용 방법" required hint="상세 페이지 최상단에 노출됩니다. 이 모델이 무엇을 잘하고 어떤 업무에 적합한지 답변하듯 적어주세요.">
              <textarea value={form.strengthsDetail} onChange={e => set("strengthsDetail", e.target.value)}
                placeholder="이 모델이 무엇을 잘하는지, 어떤 업무에 쓰면 좋은지 답변하듯 적어주세요. 상세 페이지 최상단에 노출됩니다."
                style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="모델 접속 URL" required>
              <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                placeholder="https://" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>

            <SubHeading />

            <Field label="세부 모델명" hint="선택한 제공사 내 구체적인 모델명을 입력하세요.">
              <input value={form.modelName} onChange={e => set("modelName", e.target.value)}
                placeholder="예: Claude Opus 4.8, GPT-5.4 Mini" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="처리 가능한 글 분량" hint="한 번에 얼마나 긴 내용을 이해할 수 있는지 쉬운 말로 표시합니다.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CONTEXT_SIZE_OPTIONS.map(c => <Tag key={c} label={c} selected={form.contextWindow === c} onClick={() => set("contextWindow", c)} />)}
              </div>
            </Field>
            <Field label="비용 등급" hint="출력 단가 기준 — 낮음 ≤ $5/M, 보통 $10~15/M, 높음 ≥ $25/M">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COST_TIERS.map(c => <Tag key={c} label={c} selected={form.costTier === c} onClick={() => set("costTier", c)} />)}
              </div>
            </Field>
            <Field label="1회 사용량" hint="A4 10페이지 문서(약 1만 토큰) 요약 1회 기준으로 환산해 적어주세요.">
              <input value={form.tokenUsageNote} onChange={e => set("tokenUsageNote", e.target.value)}
                placeholder="A4 10페이지 문서(약 1만 토큰) 요약 1회 기준으로 환산해 적어주세요. 예: 문서 10페이지 요약 시 약 1.2만 토큰" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="핵심 키워드" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.strengths} onChange={e => set("strengths", e.target.value)}
                placeholder="예: 긴 컨텍스트, 정밀 추론" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="권장 사용 시나리오" hint="이 모델을 어떤 업무에 쓰면 좋은지 예시를 추가하세요.">
              <ChipInput
                items={form.useCases}
                onAdd={addUseCase} onRemove={removeUseCase}
                draft={draftUseCase} onDraftChange={setDraftUseCase}
                suggestions={USE_CASE_SUGGESTIONS}
                placeholder="예: 문서 요약"
              />
            </Field>
            <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                placeholder="예: 문서분석, 법무" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 2 — ML 모델 정보 ===== */}
        {step === 2 && kind && isMLKind(kind) && (
          <Section title="ML 모델 정보">
            <Field label="상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUS_OPTIONS_BY_KIND(kind).map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="소속 / 대상 관계사" required hint={companyHint}>
              <CompanyMultiSelect selected={form.platformCompanies} onChange={handlePlatformCompaniesChange} />
              {platformScope === "unset" && (
                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>드롭다운을 열어 선택을 완료해주세요.</div>
              )}
            </Field>
            <Field label="모델 유형" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ML_TYPES.map(t => <Tag key={t} label={t} selected={form.mlType === t} onClick={() => set("mlType", t)} />)}
              </div>
            </Field>

            <SubHeading />

            <Field label="핵심 성능" hint="회귀·분류 모델 모두 알아보기 쉬운 한 줄로 적어주세요.">
              <input value={form.performanceSummary} onChange={e => set("performanceSummary", e.target.value)}
                placeholder="예: 정확도 92%, 또는 평균 오차 5% 이내" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="학습 데이터 개요" hint="어떤 데이터로 학습했는지 간단히 적어주세요.">
              <input value={form.trainingDataDesc} onChange={e => set("trainingDataDesc", e.target.value)}
                placeholder="예: 생산 라인 불량 이미지 12만 장" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="개발 도구">
              <input value={form.devTool} onChange={e => set("devTool", e.target.value)}
                placeholder="예: PyTorch, scikit-learn, TensorFlow" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="출력 형태" hint="모델이 반환하는 결과물의 형태를 설명하세요.">
              <input value={form.outputType} onChange={e => set("outputType", e.target.value)}
                placeholder="예: 불량 여부 (0/1), 불량 확률 (0–1)" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="소스 저장소">
              <input value={form.sourceRepo} onChange={e => set("sourceRepo", e.target.value)}
                placeholder="예: https://github.com/kolmar/ml-defect-detection" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                placeholder="예: 비전, 품질관리" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 2 — Vibe Coding 정보 ===== */}
        {step === 2 && kind && isVibeKind(kind) && (
          <Section title="Vibe Coding 정보">
            <Field label="상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUS_OPTIONS_BY_KIND(kind).map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="소속 / 대상 관계사" required hint={companyHint}>
              <CompanyMultiSelect selected={form.platformCompanies} onChange={handlePlatformCompaniesChange} />
              {platformScope === "unset" && (
                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>드롭다운을 열어 선택을 완료해주세요.</div>
              )}
            </Field>

            <SubHeading />

            <Field label="사용한 AI 도구">
              <input value={form.devTool} onChange={e => set("devTool", e.target.value)}
                placeholder="예: Cursor, GitHub Copilot" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {VIBE_TOOL_SUGGESTIONS.map(t => (
                  <span key={t} onClick={() => set("devTool", form.devTool ? `${form.devTool}, ${t}` : t)} style={{
                    fontSize: 11, color: "#94A3B8", background: "#F4F6F9", border: "1px solid #EBEEF3",
                    padding: "3px 9px", borderRadius: 20, cursor: "pointer",
                  }}>+ {t}</span>
                ))}
              </div>
            </Field>
            <Field label="결과물 형태" hint="웹앱, 스크립트, 대시보드 등 만들어진 산출물을 설명하세요.">
              <input value={form.outputType} onChange={e => set("outputType", e.target.value)}
                placeholder="예: React 웹앱, Python 스크립트, Streamlit 대시보드" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="접속 URL" hint="사내에서 실제로 접근 가능한 배포 주소가 있다면 입력하세요.">
              <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                placeholder="https:// (선택)" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="소스 저장소">
              <input value={form.sourceRepo} onChange={e => set("sourceRepo", e.target.value)}
                placeholder="예: https://github.com/kolmar/vibe-project" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
            <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                placeholder="예: 대시보드, 재고관리" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 3 — 담당자 / 링크 (공통) ===== */}
        {step === 3 && (
          <>
            <Section title="담당자">
              {form.contacts.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 1fr 1fr 1fr ${rowActionWidth}px`, gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input value={c.name} onChange={e => setContact(i, "name", e.target.value)} placeholder="이름" style={inputStyle} />
                  <input value={c.dept} onChange={e => setContact(i, "dept", e.target.value)} placeholder="부서" style={inputStyle} />
                  <input value={c.email} onChange={e => setContact(i, "email", e.target.value)} placeholder="이메일" style={inputStyle} />
                  <select value={c.role} onChange={e => setContact(i, "role", e.target.value)} style={selectStyle}>
                    <option value="주담당자">주담당자</option>
                    <option value="공동담당자">공동담당자</option>
                  </select>
                  <RowRemoveButton first={i === 0} onClick={() => removeContact(i)} />
                </div>
              ))}
              <button onClick={addContact} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 6,
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>+ 담당자 추가</button>
            </Section>

            <Section title="문서 및 외부 링크" optional>
              {form.links.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 2fr ${rowActionWidth}px`, gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input value={l.label} onChange={e => setLink(i, "label", e.target.value)} placeholder="라벨 (예: GitHub)" style={inputStyle} />
                  <input value={l.url} onChange={e => setLink(i, "url", e.target.value)} placeholder="URL" style={inputStyle} />
                  <RowRemoveButton first={i === 0} onClick={() => removeLink(i)} />
                </div>
              ))}
              <button onClick={addLink} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 6,
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>+ 링크 추가</button>
            </Section>
          </>
        )}

        {/* ===== STEP 4 — 최종확인 ===== */}
        {step === 4 && (
          <Section title="최종 확인">
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: selectedKindMeta?.bg, border: `1px solid ${selectedKindMeta?.color}`,
              borderRadius: 8, padding: "8px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedKindMeta?.color }}>{selectedKindMeta?.label}</span>
              <span style={{ fontSize: 12, color: "#697386" }}>으로 등록합니다</span>
            </div>

            {[
              { label: "제목", value: form.title || "—" },
              { label: "한 줄 요약", value: form.summary || "—" },
              { label: "상태", value: form.status || "—" },
              { label: "소속/대상 관계사", value: platformCompanyDisplay(form.platformCompanies) },
              ...(kind !== "ai-orchestration" ? [{ label: "업무 도메인", value: form.domain || "—" }] : []),
              ...(kind && isWorkflowKind(kind) ? [
                ...(kind === "pa" ? [
                  { label: "흐름 유형", value: form.flowType || "—" },
                  ...(form.flowType === "데스크톱 자동화 (RPA)" ? [{ label: "실행 방식", value: form.runMode || "—" }] : []),
                ] : []),
                { label: "트리거·동작 설명", value: form.triggerAction || "—" },
                { label: kind === "pa" ? "사용된 커넥터" : "사용된 노드", value: form.nodes.join(" → ") || "—" },
                ...(kind === "pa" ? [{ label: "커넥터 등급", value: form.connectorTier || "—" }] : []),
                { label: "연동 앱·서비스", value: form.connectedApps.join(", ") || "—" },
                { label: "예상 절감 시간", value: timeSavedDisplay },
                { label: "구성 난이도", value: form.difficulty },
                { label: kind === "pa" ? "실행 위치" : "실행 URL", value: form.specificUrl || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              ...(kind && isAssistantKind(kind) ? [
                { label: "공유 범위", value: form.shareScope || "—" },
                { label: "공유 프롬프트", value: form.sharedPrompt || "—" },
                { label: "기반 모델", value: form.basedModel || "—" },
                { label: "비서 소개", value: form.roleDefinition || "—" },
                { label: "연결된 데이터·문서", value: form.connectedData || "—" },
                { label: "예시 질문", value: form.sampleQuestions.join(" / ") || "—" },
                { label: "접속 URL", value: form.specificUrl || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              ...(kind && isModelKind(kind) ? [
                { label: "제공사", value: form.provider || "—" },
                { label: "강점 및 활용 방법", value: form.strengthsDetail || "—" },
                { label: "세부 모델명", value: form.modelName || "—" },
                { label: "처리 가능한 글 분량", value: form.contextWindow || "—" },
                { label: "비용 등급", value: form.costTier },
                { label: "1회 사용량", value: form.tokenUsageNote || "—" },
                { label: "핵심 키워드", value: form.strengths || "—" },
                { label: "권장 사용 시나리오", value: form.useCases.join(", ") || "—" },
                { label: "모델 접속 URL", value: form.specificUrl || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              ...(kind && isMLKind(kind) ? [
                { label: "모델 유형", value: form.mlType || "—" },
                { label: "핵심 성능", value: form.performanceSummary || "—" },
                { label: "학습 데이터 개요", value: form.trainingDataDesc || "—" },
                { label: "개발 도구", value: form.devTool || "—" },
                { label: "출력 형태", value: form.outputType || "—" },
                { label: "소스 저장소", value: form.sourceRepo || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              ...(kind && isVibeKind(kind) ? [
                { label: "사용한 AI 도구", value: form.devTool || "—" },
                { label: "결과물 형태", value: form.outputType || "—" },
                { label: "접속 URL", value: form.specificUrl || "—" },
                { label: "소스 저장소", value: form.sourceRepo || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              { label: "주담당자", value: form.contacts[0] ? `${form.contacts[0].name} (${form.contacts[0].dept})` : "—" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "160px 1fr",
                padding: "10px 0", borderBottom: "1px solid #F4F6F9", gap: 16,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#697386" }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "#1A1F27" }}>{row.value}</span>
              </div>
            ))}

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginTop: 20, fontSize: 12, color: "#92400E" }}>
              제출 후 관리자 검토를 거쳐 AX Platform에 게시됩니다. 검토 결과는 이메일 및 Teams로 알림이 발송됩니다.
            </div>

            {saved && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 13, fontWeight: 600, color: "#065F46" }}>
                제출이 완료되었습니다. 내 등록 현황 페이지로 이동합니다.
              </div>
            )}
          </Section>
        )}

        {/* ===== 하단 네비게이션 버튼 ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0 || saving || saved}
            style={{
              background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 8,
              padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#475569",
              cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.5 : 1,
            }}
          >이전</button>

          {step < 4 ? (
            <button onClick={() => setStep(s => Math.min(4, s + 1))} disabled={!canNext()} style={{
              background: canNext() ? "#1C6BFF" : "#CBD5E1", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed",
            }}>다음</button>
          ) : (
            <button onClick={handleSubmit} disabled={saving || saved} style={{
              background: saved ? "#059669" : "#1C6BFF", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontSize: 13, fontWeight: 700,
              cursor: saving || saved ? "not-allowed" : "pointer",
            }}>
              {saving ? "제출 중..." : saved ? "제출 완료" : "제출하기"}
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}