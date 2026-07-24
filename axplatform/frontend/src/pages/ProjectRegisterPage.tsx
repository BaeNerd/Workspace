import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { CATEGORIES, BUSINESS_DOMAINS, ID_PREFIX, makeItemId, ML_TYPES } from "../types/categoryTypes";
import type { CategoryId, BusinessDomain } from "../types/categoryTypes";
import { toWorkflowDef, parseN8nJson } from "../components/WorkflowDiagram";
import type { WorkflowInput } from "../components/WorkflowDiagram";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { ImageCarouselInput, MAX_IMAGES } from "../components/ImageCarouselInput";
import { FORM_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";

const COST_TIERS = ["낮음", "보통", "높음"] as const;
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"] as const;
// AI Model 이용 가능 상태 (기존 4종 상태 체계와 별개 축)
const AGENT_AVAILABILITY = ["사용 가능", "사용 불가"] as const;

// 예상 절감 시간 — 수치 + 주기 조합으로 입력받아 표준 문자열로 직렬화
type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };
const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;
const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

// HK GPT 제공 모델 힌트 (나만의 비서 기반 모델 입력용)
const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "LG AI", "Upstage",
];

// "컨텍스트 윈도우"라는 어려운 말 대신 처리 가능한 글 분량을 쉬운 말로 선택
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];

// ML 모델 유형 — 공유 상수(types/categoryTypes ML_TYPES) 단일 소스 참조.

type Contact = { name: string; dept: string; role: string; email: string };

// Step 0 유형 카드 — CATEGORIES 기반 + 일부 유형은 설명 문구를 등록 맥락에 맞게 보정
const KIND_OPTIONS: { key: CategoryId; label: string; desc: string; color: string; bg: string }[] = CATEGORIES.map(p => {
  if (p.id === "assistant") return { key: p.id, label: p.name, desc: "HK GPT를 프롬프트·역할로 커스터마이징해 동료와 공유하는 개인/팀 에이전트", color: p.color, bg: p.bg };
  if (p.id === "ai-orchestration") return { key: p.id, label: "AI Model", desc: p.shortDesc, color: p.color, bg: p.bg };
  if (p.id === "etc") return { key: p.id, label: p.name, desc: "팀에서 구축한 AI 시스템·서비스 사례를 블로그 형식으로 소개합니다. (일반 IT 시스템 구축 과제는 제외)", color: p.color, bg: p.bg };
  return { key: p.id, label: p.name, desc: p.shortDesc, color: p.color, bg: p.bg };
});

// 3단계 고정: 유형 선택 → 정보 입력(공통·유형별·담당자 통합) → 최종 확인
const STEPS = ["유형 선택", "정보 입력", "최종 확인"];

type FormState = {
  images: string[]; // 워크플로우/설명 스크린샷 (data URL, 최대 10장)
  title: string; summary: string; description: string;
  domain: BusinessDomain | "";
  tags: string[];
  contacts: Contact[];
  // n8n / pa 공용 — 예상 효과
  timeSavedValue: number | ""; timeSavedPeriod: SavedPeriod;
  difficulty: typeof DIFFICULTY_LEVELS[number]; // n8n 전용
  // n8n 전용 — 워크플로우 시각화
  workflowInput: WorkflowInput; workflowJson: string;
  // assistant 전용
  sharedPrompt: string; basedModel: string;
  // ai-orchestration 전용
  agentAvailability: "" | typeof AGENT_AVAILABILITY[number];
  strengthsDetail: string; specificUrl: string; modelName: string;
  contextWindow: string; costTier: typeof COST_TIERS[number];
  // ml 전용
  mlType: string; trainingDataDesc: string; devTool: string;
  // 관계사 범위 — 입력 UI 제거, 전사 공용([])으로 고정 (타입 필드만 유지)
  assetCompanies: string[];
};

// ===== 공용 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: COLOR.text, border: `1.5px solid ${COLOR.border}`,
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const };
const rowActionWidth = 24;

// ===== 공용 컴포넌트 (모듈 레벨 — 리렌더 시 재생성 방지) =====
function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
        {title}
        {optional && (
          <span style={{ fontSize: 10, fontWeight: 700, color: COLOR.text3, background: COLOR.bgSubtle, padding: "2px 8px", borderRadius: 20 }}>선택</span>
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
      fontSize: 11, fontWeight: 700, color: COLOR.text3, textTransform: "uppercase", letterSpacing: "0.05em",
      margin: "4px 0 16px", paddingTop: 16, borderTop: `1px dashed ${COLOR.border}`,
    }}>{label}</div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: COLOR.text2, display: "block", marginBottom: 8 }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Tag({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{
      fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
      border: `1.5px solid ${selected ? COLOR.primary : COLOR.border}`,
      background: selected ? "#E8F0FE" : "#fff",
      color: selected ? COLOR.primary : COLOR.text2,
      cursor: "pointer", userSelect: "none",
    }}>{label}</span>
  );
}

function RowRemoveButton({ first, onClick }: { first: boolean; onClick: () => void }) {
  if (first) return <span aria-hidden style={{ width: rowActionWidth, display: "inline-block", flexShrink: 0 }} />;
  return (
    <button onClick={onClick} style={{
      width: rowActionWidth, background: "none", border: "none", color: COLOR.text3,
      cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0,
    }}>×</button>
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
          onFocus={e => (e.target.style.borderColor = COLOR.primary)}
          onBlur={e => (e.target.style.borderColor = COLOR.border)} />
        <button onClick={() => onAdd()} style={{
          background: COLOR.primary, color: "#fff", border: "none", borderRadius: 7,
          padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}>추가</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
            <span key={s} onClick={() => onAdd(s)} style={{
              fontSize: 11, color: COLOR.text3, background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`,
              padding: "3px 9px", borderRadius: 20, cursor: "pointer",
            }}>+ {s}</span>
          ))}
        </div>
      )}
    </div>
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
              border: `1.5px solid ${period === p ? COLOR.primary : COLOR.border}`,
              background: period === p ? "#E8F0FE" : "#fff",
              color: period === p ? COLOR.primary : COLOR.text2,
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
          onFocus={e => (e.target.style.borderColor = COLOR.primary)}
          onBlur={e => (e.target.style.borderColor = COLOR.border)}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.text2, whiteSpace: "nowrap" }}>시간</span>
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

export default function ProjectRegisterPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<CategoryId | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [imageOver, setImageOver] = useState(false);
  const [draftTag, setDraftTag] = useState("");
  const [n8nUploadedFile, setN8nUploadedFile] = useState<string | null>(null);
  const [n8nJsonError, setN8nJsonError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    images: [],
    title: "", summary: "", description: "",
    domain: "", tags: [],
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    timeSavedValue: "", timeSavedPeriod: "주", difficulty: "보통",
    workflowInput: { status: "Stable", nodes: [] }, workflowJson: "",
    sharedPrompt: "", basedModel: "",
    agentAvailability: "", strengthsDetail: "", specificUrl: "", modelName: "",
    contextWindow: "", costTier: "보통",
    mlType: "", trainingDataDesc: "", devTool: "",
    // 사용 부서 파악은 담당자 소속 부서 + 업무 도메인으로 대체 — 관계사 범위는 전사 공용
    assetCompanies: [],
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

  // 사진: FileReader로 data URL 변환. 10장 초과 선택 시 앞 10장만 반영.
  const handleImageFiles = (files: FileList) => {
    const room = MAX_IMAGES - form.images.length;
    const picked = Array.from(files);
    setImageOver(picked.length > room);
    picked.slice(0, Math.max(0, room)).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        setForm(p => p.images.length >= MAX_IMAGES ? p : ({ ...p, images: [...p.images, url] }));
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImageAt = (i: number) => {
    setImageOver(false);
    setForm(p => ({ ...p, images: p.images.filter((_, ii) => ii !== i) }));
  };

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

  const addTag = (value?: string) => {
    const v = (value ?? draftTag).trim();
    if (!v || form.tags.includes(v)) return;
    setForm(p => ({ ...p, tags: [...p.tags, v] }));
    setDraftTag("");
  };
  const removeTag = (v: string) => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== v) }));

  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, { name: "", dept: "", role: "공동담당자", email: "" }] }));
  const removeContact = (i: number) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, ci) => ci !== i) }));
  const setContact = (i: number, k: keyof Contact, v: string) =>
    setForm(p => ({ ...p, contacts: p.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c) }));

  const canNext = () => {
    if (step === 0) return kind !== null;
    if (step === 1) {
      if (!kind) return false;
      const base = Boolean(form.title.trim() && form.summary.trim() && form.description.trim());
      const c = form.contacts[0];
      const contactOk = Boolean(c?.name.trim() && c?.dept.trim() && c?.email.trim());
      let typeOk = true;
      if (kind === "ai-orchestration") typeOk = Boolean(form.agentAvailability && form.strengthsDetail.trim() && form.specificUrl.trim());
      else if (kind === "ml") typeOk = Boolean(form.mlType.trim());
      else if (kind === "assistant") typeOk = Boolean(form.sharedPrompt.trim());
      return base && contactOk && typeOk;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!kind) return;
    setSaving(true);
    // 데모 순번 (백엔드 발급 전 임시). TODO: 실제 연동 시 서버 발급 ID 사용.
    const seq = Math.floor(Math.random() * 900) + 100;
    const newId = makeItemId(kind, seq);
    // TODO: 실제 연동 시 POST /api/v1/platform-items 로 전송
    const _payload = {
      id: newId,
      platformId: kind,
      images: form.images,
      title: form.title, summary: form.summary, description: form.description,
      domain: form.domain || undefined,
      tags: form.tags,
      company: form.assetCompanies, // 전사 공용([])
      contacts: form.contacts,
      agentAvailability: kind === "ai-orchestration" ? (form.agentAvailability || undefined) : undefined,
      specificUrl: kind === "ai-orchestration" ? form.specificUrl : undefined,
      expectedTimeSaved: (kind === "n8n" || kind === "pa") ? serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod) : undefined,
      workflowDef: kind === "n8n" ? toWorkflowDef(form.workflowInput) : undefined,
      workflowJson: kind === "n8n" && form.workflowJson ? form.workflowJson : undefined,
    };
    void _payload;
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setIssuedId(newId);
    setSaved(true);
    setTimeout(() => {
      navigate("/my-status");
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 1400);
  };

  // 비관리자에게는 ai-orchestration(AI Model) 유형 미노출
  const visibleKindOptions = isAdmin ? KIND_OPTIONS : KIND_OPTIONS.filter(o => o.key !== "ai-orchestration");
  // 방어 로직: 비관리자가 어떤 경로로든 ai-orchestration을 선택한 경우 리셋
  if (!isAdmin && kind === "ai-orchestration") setKind(visibleKindOptions[0]?.key ?? null);

  const selectedKindMeta = kind ? KIND_OPTIONS.find(k => k.key === kind)! : null;
  const timeSavedDisplay = serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod) || "—";
  const year = new Date().getFullYear();
  const imageHint = kind === "pa"
    ? "플로우 디자이너 화면 캡처를 첨부하면 이해에 도움이 됩니다. (최대 10장)"
    : "워크플로우·설명 스크린샷을 첨부하면 이해에 도움이 됩니다. (최대 10장)";

  // 최종 확인용 요약 행 구성
  const summaryRows: { label: string; value: string }[] = kind ? [
    { label: "제목", value: form.title || "—" },
    { label: "한 줄 요약", value: form.summary || "—" },
    { label: "사진", value: form.images.length > 0 ? `${form.images.length}장 첨부` : "없음" },
    { label: "업무 도메인", value: form.domain || "—" },
    { label: "태그", value: form.tags.join(", ") || "—" },
    ...(kind === "n8n" ? [
      { label: "워크플로우 JSON", value: n8nUploadedFile ? `첨부됨 (${n8nUploadedFile})` : "없음" },
      { label: "예상 절감 시간", value: timeSavedDisplay },
      { label: "구성 난이도", value: form.difficulty },
    ] : []),
    ...(kind === "pa" ? [
      { label: "예상 절감 시간", value: timeSavedDisplay },
    ] : []),
    ...(kind === "assistant" ? [
      { label: "공유 프롬프트", value: form.sharedPrompt || "—" },
      { label: "기반 모델", value: form.basedModel || "—" },
    ] : []),
    ...(kind === "ai-orchestration" ? [
      { label: "이용 가능 여부", value: form.agentAvailability || "—" },
      { label: "강점 및 활용 방법", value: form.strengthsDetail || "—" },
      { label: "모델 접속 URL", value: form.specificUrl || "—" },
      { label: "세부 모델명", value: form.modelName || "—" },
      { label: "처리 가능한 글 분량", value: form.contextWindow || "—" },
      { label: "비용 (토큰 비용)", value: form.costTier },
    ] : []),
    ...(kind === "ml" ? [
      { label: "모델 유형", value: form.mlType || "—" },
      { label: "학습 데이터 개요", value: form.trainingDataDesc || "—" },
      { label: "개발 도구", value: form.devTool || "—" },
    ] : []),
    { label: "주담당자", value: form.contacts[0]?.name ? `${form.contacts[0].name} (${form.contacts[0].dept})` : "—" },
  ] : [];

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>

      <Navbar />

      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>신규 항목 등록 신청</h1>
          <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>작성 완료 후 관리자 검토를 거쳐 AX Platform에 게시됩니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box" }}>

        {/* STEP INDICATOR (3단계) */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i < step ? "#059669" : i === step ? COLOR.primary : COLOR.border,
                  color: i <= step ? "#fff" : COLOR.text3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? COLOR.text : COLOR.text3, whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < step ? "#059669" : COLOR.border, margin: "0 10px" }} />}
            </div>
          ))}
        </div>

        {/* ===== STEP 0 — 유형 선택 ===== */}
        {step === 0 && (
          <Section title="등록할 항목의 유형을 선택하세요">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {visibleKindOptions.map(opt => (
                <div key={opt.key} onClick={() => setKind(opt.key)} style={{
                  border: `1.5px solid ${kind === opt.key ? opt.color : COLOR.border}`,
                  borderTop: `3px solid ${opt.color}`,
                  background: kind === opt.key ? opt.bg : "#fff",
                  borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: opt.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>{opt.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLOR.text2, lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 8, fontSize: 11, color: "#6D28D9" }}>
                AI Model 유형은 관리자 전용 등록입니다. 카탈로그 표준(모델명 + 이용 가능 여부 표기)에 맞춰 등록해 주세요.
              </div>
            )}
            <div style={{ marginTop: 10, padding: "10px 14px", background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, fontSize: 11, color: COLOR.text2 }}>
              어떤 유형을 선택해도 등록 신청 → 관리자 검토 → 승인 절차는 동일하게 적용됩니다.
            </div>
          </Section>
        )}

        {/* ===== STEP 1 — 정보 입력 (공통 상단 + 유형별 중단 + 담당자 하단) ===== */}
        {step === 1 && kind && (
          <>
            {/* --- 공통 기본 정보 --- */}
            <Section title={`기본 정보${selectedKindMeta ? ` (${selectedKindMeta.label})` : ""}`}>
              <Field label="사진" hint={imageHint}>
                <ImageCarouselInput images={form.images} onFiles={handleImageFiles} onRemoveAt={removeImageAt} overCapacity={imageOver} />
              </Field>
              <Field label="제목" required>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder={
                    kind === "ai-orchestration" ? "예: Claude Sonnet 4.6" :
                    kind === "n8n" ? "예: 신규 입사자 계정 자동 생성" :
                    kind === "pa" ? "예: 결재 완료 시 SharePoint 업데이트" :
                    kind === "assistant" ? "예: 특허 문서 검토 도우미" :
                    kind === "ml" ? "예: 불량품 이미지 분류 모델" :
                    kind === "vibe" ? "예: 재고 현황 대시보드" :
                    "예: 사내 뉴스 요약 미니 프로젝트"
                  }
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                  onBlur={e => (e.target.style.borderColor = COLOR.border)} />
              </Field>
              <Field label="한 줄 요약" required>
                <input value={form.summary} onChange={e => set("summary", e.target.value)}
                  placeholder="이 항목이 무엇을 하는지 한 문장으로 설명하세요"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                  onBlur={e => (e.target.style.borderColor = COLOR.border)} />
              </Field>
              <Field label="상세 설명" required>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="언제 실행되고, 어떤 순서로 동작하는지 설명하세요. (트리거·동작 설명 포함)"
                  style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                  onBlur={e => (e.target.style.borderColor = COLOR.border)} />
              </Field>

              <SubHeading />

              <Field label="업무 도메인" hint="이 항목이 주로 활용되는 업무 영역을 선택하세요.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BUSINESS_DOMAINS.map(d => (
                    <Tag key={d} label={d} selected={form.domain === d} onClick={() => set("domain", form.domain === d ? "" : d as BusinessDomain)} />
                  ))}
                </div>
              </Field>
              <Field label="태그" hint="Enter 또는 추가 버튼으로 태그를 등록하세요.">
                <ChipInput
                  items={form.tags} onAdd={addTag} onRemove={removeTag}
                  draft={draftTag} onDraftChange={setDraftTag}
                  suggestions={[]} placeholder="예: 자동화, 재무"
                />
              </Field>
            </Section>

            {/* --- 유형별 세부 (n8n) --- */}
            {kind === "n8n" && (
              <Section title="n8n 구성 · 효과">
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
                    {n8nUploadedFile
                      ? <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>✓ {n8nUploadedFile}</span>
                      : <span style={{ fontSize: 12, color: COLOR.text3 }}>선택된 파일 없음</span>}
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
                <Field label="예상 절감 시간" hint="절감되는 업무 시간을 입력하면 통계용 연간 환산값이 자동으로 계산됩니다.">
                  <TimeSavedInput
                    value={form.timeSavedValue} period={form.timeSavedPeriod}
                    onValueChange={v => set("timeSavedValue", v)} onPeriodChange={p => set("timeSavedPeriod", p)}
                  />
                </Field>
                <Field label="구성 난이도">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {DIFFICULTY_LEVELS.map(d => <Tag key={d} label={d} selected={form.difficulty === d} onClick={() => set("difficulty", d)} />)}
                  </div>
                </Field>
              </Section>
            )}

            {/* --- 유형별 세부 (pa) --- */}
            {kind === "pa" && (
              <Section title="예상 효과" optional>
                <Field label="예상 절감 시간" hint="절감되는 업무 시간을 입력하면 통계용 연간 환산값이 자동으로 계산됩니다.">
                  <TimeSavedInput
                    value={form.timeSavedValue} period={form.timeSavedPeriod}
                    onValueChange={v => set("timeSavedValue", v)} onPeriodChange={p => set("timeSavedPeriod", p)}
                  />
                </Field>
              </Section>
            )}

            {/* --- 유형별 세부 (assistant) --- */}
            {kind === "assistant" && (
              <Section title="비서 구성">
                <Field label="공유 프롬프트" required hint="동료가 그대로 복사해서 쓸 수 있도록, 실제로 사용한 프롬프트 내용을 입력하세요.">
                  <textarea value={form.sharedPrompt} onChange={e => set("sharedPrompt", e.target.value)}
                    placeholder={'예: "당신은 계약서를 검토하는 법무 담당자입니다. 업로드된 계약서에서 위험 조항을 찾아 표로 정리해 주세요..."'}
                    style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7, fontFamily: "var(--font-mono)" }}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>

                <SubHeading />

                <Field label="기반 모델" hint="HK GPT에서 선택한 대표 모델을 입력하세요.">
                  <input value={form.basedModel} onChange={e => set("basedModel", e.target.value)}
                    placeholder="예: Claude Opus 4.8, GPT-5.4" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    {ASSISTANT_MODEL_HINTS.map(m => (
                      <span key={m} onClick={() => set("basedModel", m)} style={{
                        fontSize: 11, color: COLOR.text3, background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`,
                        padding: "3px 9px", borderRadius: 20, cursor: "pointer",
                      }}>+ {m}</span>
                    ))}
                  </div>
                </Field>
              </Section>
            )}

            {/* --- 유형별 세부 (ai-orchestration, 관리자 전용) --- */}
            {kind === "ai-orchestration" && (
              <Section title="모델 정보">
                <Field label="이용 가능 여부" required>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {AGENT_AVAILABILITY.map(a => <Tag key={a} label={a} selected={form.agentAvailability === a} onClick={() => set("agentAvailability", a)} />)}
                  </div>
                </Field>
                <Field label="강점 및 활용 방법" required hint="상세 페이지 최상단에 노출됩니다. 이 모델이 무엇을 잘하고 어떤 업무에 적합한지 답변하듯 적어주세요.">
                  <textarea value={form.strengthsDetail} onChange={e => set("strengthsDetail", e.target.value)}
                    placeholder="이 모델이 무엇을 잘하는지, 어떤 업무에 쓰면 좋은지 답변하듯 적어주세요."
                    style={{ ...inputStyle, minHeight: 110, resize: "vertical", lineHeight: 1.7 }}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>
                <Field label="모델 접속 URL" required>
                  <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                    placeholder="https://" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>

                <SubHeading />

                <Field label="세부 모델명" hint="구체적인 모델명을 입력하세요.">
                  <input value={form.modelName} onChange={e => set("modelName", e.target.value)}
                    placeholder="예: Claude Opus 4.8, GPT-5.4 Mini" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>
                <Field label="처리 가능한 글 분량" hint="한 번에 얼마나 긴 내용을 이해할 수 있는지 쉬운 말로 표시합니다.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {CONTEXT_SIZE_OPTIONS.map(c => <Tag key={c} label={c} selected={form.contextWindow === c} onClick={() => set("contextWindow", c)} />)}
                  </div>
                </Field>
                <Field label="비용 (토큰 비용)" hint="출력 단가 기준 — 낮음 ≤ $5/M, 보통 $10~15/M, 높음 ≥ $25/M">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {COST_TIERS.map(c => <Tag key={c} label={c} selected={form.costTier === c} onClick={() => set("costTier", c)} />)}
                  </div>
                </Field>
              </Section>
            )}

            {/* --- 유형별 세부 (ml) --- */}
            {kind === "ml" && (
              <Section title="ML 모델 정보">
                <Field label="모델 유형" required>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ML_TYPES.map(t => <Tag key={t} label={t} selected={form.mlType === t} onClick={() => set("mlType", t)} />)}
                  </div>
                </Field>

                <SubHeading />

                <Field label="학습 데이터 개요" hint="어떤 데이터로 학습했는지 간단히 적어주세요.">
                  <input value={form.trainingDataDesc} onChange={e => set("trainingDataDesc", e.target.value)}
                    placeholder="예: 생산 라인 불량 이미지 12만 장" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>
                <Field label="개발 도구">
                  <input value={form.devTool} onChange={e => set("devTool", e.target.value)}
                    placeholder="예: PyTorch, scikit-learn, TensorFlow" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                    onBlur={e => (e.target.style.borderColor = COLOR.border)} />
                </Field>
              </Section>
            )}

            {/* --- 담당자 (공통 하단) --- */}
            <Section title="담당자">
              {form.contacts.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 1fr 1fr 1fr ${rowActionWidth}px`, gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input value={c.name} onChange={e => setContact(i, "name", e.target.value)} placeholder="이름" style={inputStyle} />
                  <input value={c.dept} onChange={e => setContact(i, "dept", e.target.value)} placeholder="소속 부서" style={inputStyle} />
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
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
              }}>+ 담당자 추가</button>
            </Section>
          </>
        )}

        {/* ===== STEP 2 — 최종 확인 ===== */}
        {step === 2 && (
          <Section title="최종 확인">
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: selectedKindMeta?.bg, border: `1px solid ${selectedKindMeta?.color}`,
              borderRadius: 8, padding: "8px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedKindMeta?.color }}>{selectedKindMeta?.label}</span>
              <span style={{ fontSize: 12, color: COLOR.text2 }}>으로 등록합니다</span>
            </div>

            {summaryRows.map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "160px 1fr",
                padding: "10px 0", borderBottom: `1px solid ${COLOR.bgSubtle}`, gap: 16,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLOR.text2 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: COLOR.text, whiteSpace: "pre-wrap" }}>{row.value}</span>
              </div>
            ))}

            {kind && (
              <div style={{ background: COLOR.primaryWeak, border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px 16px", marginTop: 16, fontSize: 12, color: "#1E40AF" }}>
                신청이 접수되면 <strong style={{ fontFamily: "var(--font-mono)" }}>{ID_PREFIX[kind]}-{year}-순번</strong> 형식의 고유 ID가 발급됩니다.
              </div>
            )}

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 12, color: "#92400E" }}>
              제출 후 등록 신청 → 관리자 검토 → 승인 절차를 거쳐 AX Platform에 게시됩니다. 검토 결과는 이메일 및 Teams로 알림이 발송됩니다.
            </div>

            {saved && issuedId && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 13, fontWeight: 600, color: "#065F46" }}>
                제출이 완료되었습니다. 발급 ID: <span style={{ fontFamily: "var(--font-mono)" }}>{issuedId}</span> — 내 등록 현황 페이지로 이동합니다.
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
              background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 8,
              padding: "10px 22px", fontSize: 13, fontWeight: 600, color: COLOR.text2,
              cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.5 : 1,
            }}
          >이전</button>

          {step < 2 ? (
            <button onClick={() => setStep(s => Math.min(2, s + 1))} disabled={!canNext()} style={{
              background: canNext() ? COLOR.primary : "#CBD5E1", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed",
            }}>다음</button>
          ) : (
            <button onClick={handleSubmit} disabled={saving || saved} style={{
              background: saved ? "#059669" : COLOR.primary, color: "#fff", border: "none", borderRadius: 8,
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
