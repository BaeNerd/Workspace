import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CATEGORIES, BUSINESS_DOMAINS } from "../types/categoryTypes";
import type { CategoryId, BusinessDomain } from "../types/categoryTypes";
import { toWorkflowDef, parseN8nJson } from "../components/WorkflowDiagram";
import type { WorkflowInput } from "../components/WorkflowDiagram";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { FORM_MAX_WIDTH } from "../styles/layout";

// 등록 폼(ProjectRegisterPage) Step 1과 동일한 필드 체계로 수정 요청을 받는다.
// 상태·관계사·실행 URL·삭제된 유형별 필드의 수정 UI는 포함하지 않는다.

const COST_TIERS = ["낮음", "보통", "높음"] as const;
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"] as const;
// AI Agent 이용 가능 상태 (운영 상태 체계와 별개 축)
const AGENT_AVAILABILITY = ["사용 가능", "사용 불가"] as const;

const MAX_IMAGES = 10;

// 예상 절감 시간 — 수치 + 주기 조합
type SavedPeriod = "일" | "주" | "월" | "년";
const SAVED_PERIODS: SavedPeriod[] = ["일", "주", "월", "년"];
const PERIOD_ANNUAL_FACTOR: Record<SavedPeriod, number> = { "일": 365, "주": 52, "월": 12, "년": 1 };
const PERIOD_FULL_LABEL: Record<SavedPeriod, string> = { "일": "매일", "주": "주당", "월": "월당", "년": "연간" };
const serializeTimeSaved = (value: number | "", period: SavedPeriod): string =>
  value === "" || value <= 0 ? "" : `${period} ${value}시간`;
const annualHours = (value: number | "", period: SavedPeriod): number =>
  value === "" || value <= 0 ? 0 : Number(value) * PERIOD_ANNUAL_FACTOR[period];

const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "LG AI", "Upstage",
];
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];
const ML_TYPES = [
  "분류 (Classification)", "회귀 (Regression)", "클러스터링", "추천 시스템",
  "NLP", "컴퓨터 비전", "시계열 예측", "기타",
];

type Contact = { name: string; dept: string; role: string; email: string };

// 인라인 SVG 플레이스홀더 (네트워크 비의존)
const placeholderImage = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='640' height='360' fill='#F1F5F9'/><rect x='1' y='1' width='638' height='358' fill='none' stroke='${color}' stroke-width='2'/><text x='320' y='188' font-family='sans-serif' font-size='24' fill='${color}' text-anchor='middle'>${label}</text></svg>`
  )}`;

// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 응답으로 교체
type CurrentItem = {
  id: string;
  kind: CategoryId;
  images: string[];
  title: string; summary: string; description: string;
  domain: BusinessDomain | "";
  tags: string[];
  contacts: Contact[];
  // n8n / pa — 예상 효과
  timeSavedValue: number | ""; timeSavedPeriod: SavedPeriod;
  difficulty: typeof DIFFICULTY_LEVELS[number]; // n8n
  workflowJson: string; // n8n
  // assistant
  sharedPrompt: string; basedModel: string;
  // ai-orchestration
  agentAvailability: "" | typeof AGENT_AVAILABILITY[number];
  strengthsDetail: string; specificUrl: string; modelName: string;
  contextWindow: string; costTier: typeof COST_TIERS[number];
  // ml
  mlType: string; trainingDataDesc: string; devTool: string;
};

const MOCK_CURRENT: CurrentItem = {
  id: "N8N-2026-012",
  kind: "n8n",
  images: [placeholderImage("워크플로우 개요", "#1C6BFF"), placeholderImage("실행 로그", "#059669")],
  title: "신규 입사자 계정 자동 생성",
  summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성하는 n8n 워크플로우",
  description: "신규 입사자가 HR 시스템에 등록되면 Schedule Trigger가 발동하여 AD 계정 생성 → Teams 초대 → 이메일 계정 활성화까지 자동으로 처리합니다.",
  domain: "HR",
  tags: ["자동화", "온보딩", "계정관리"],
  contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
  timeSavedValue: 3, timeSavedPeriod: "주", difficulty: "보통",
  workflowJson: "",
  sharedPrompt: "", basedModel: "",
  agentAvailability: "", strengthsDetail: "", specificUrl: "", modelName: "",
  contextWindow: "", costTier: "보통",
  mlType: "", trainingDataDesc: "", devTool: "",
};

// ===== 공용 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: "#1A1F27", border: "1.5px solid #EBEEF3",
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const };
const rowActionWidth = 24;

// ===== 공용 컴포넌트 (모듈 레벨 — 리렌더 시 재생성 방지) =====
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
  if (first) return <span aria-hidden style={{ width: rowActionWidth, display: "inline-block", flexShrink: 0 }} />;
  return (
    <button onClick={onClick} style={{
      width: rowActionWidth, background: "none", border: "none", color: "#94A3B8",
      cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0,
    }}>×</button>
  );
}

// 사진 업로드 + 좌우 캐러셀 미리보기 (모듈 레벨 — 포커스 손실 방지)
function ImageCarouselInput({ images, onFiles, onRemoveAt, overCapacity }: {
  images: string[]; onFiles: (files: FileList) => void; onRemoveAt: (i: number) => void; overCapacity: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const safeIdx = images.length === 0 ? 0 : Math.min(idx, images.length - 1);
  const go = (delta: number) => setIdx(() => (safeIdx + delta + images.length) % images.length);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: overCapacity ? 8 : 0 }}>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#1A1F27", color: "#fff", borderRadius: 7,
          padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: images.length >= MAX_IMAGES ? "not-allowed" : "pointer",
          opacity: images.length >= MAX_IMAGES ? 0.5 : 1, flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          사진 추가
          <input type="file" accept="image/*" multiple disabled={images.length >= MAX_IMAGES}
            onChange={e => { if (e.target.files && e.target.files.length > 0) onFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }} />
        </label>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>
          {images.length > 0 ? `${images.length} / ${MAX_IMAGES}장` : "선택된 사진 없음"}
        </span>
      </div>

      {overCapacity && (
        <div style={{ fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 7, padding: "8px 12px" }}>
          사진은 최대 {MAX_IMAGES}장까지 첨부할 수 있어 앞 {MAX_IMAGES}장만 반영되었습니다.
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            position: "relative", background: "#F4F6F9", border: "1.5px solid #EBEEF3", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 180,
          }}>
            {images.length > 1 && (
              <button type="button" onClick={() => go(-1)} aria-label="이전 사진" style={{
                position: "absolute", left: 10, width: 32, height: 32, borderRadius: "50%",
                background: "#fff", border: "1.5px solid #EBEEF3", cursor: "pointer",
                fontSize: 16, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
            )}
            <img src={images[safeIdx]} alt={`첨부 사진 ${safeIdx + 1}`} style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }} />
            {images.length > 1 && (
              <button type="button" onClick={() => go(1)} aria-label="다음 사진" style={{
                position: "absolute", right: 10, width: 32, height: 32, borderRadius: "50%",
                background: "#fff", border: "1.5px solid #EBEEF3", cursor: "pointer",
                fontSize: 16, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#697386" }}>{safeIdx + 1} / {images.length}</span>
            <button type="button" onClick={() => onRemoveAt(safeIdx)} style={{
              background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: "pointer",
            }}>이 사진 삭제</button>
          </div>
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
      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
            <span key={s} onClick={() => onAdd(s)} style={{
              fontSize: 11, color: "#94A3B8", background: "#F4F6F9", border: "1px solid #EBEEF3",
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

type FormState = {
  images: string[];
  title: string; summary: string; description: string;
  domain: BusinessDomain | "";
  tags: string[];
  contacts: Contact[];
  timeSavedValue: number | ""; timeSavedPeriod: SavedPeriod;
  difficulty: typeof DIFFICULTY_LEVELS[number];
  workflowInput: WorkflowInput; workflowJson: string;
  sharedPrompt: string; basedModel: string;
  agentAvailability: "" | typeof AGENT_AVAILABILITY[number];
  strengthsDetail: string; specificUrl: string; modelName: string;
  contextWindow: string; costTier: typeof COST_TIERS[number];
  mlType: string; trainingDataDesc: string; devTool: string;
};

export default function EditRequestPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const current = MOCK_CURRENT; // TODO: id로 실제 조회 결과 사용
  void id;

  const kindMeta = CATEGORIES.find(p => p.id === current.kind);
  const kindLabel = current.kind === "ai-orchestration" ? "AI Agent" : (kindMeta?.name ?? current.kind);

  const [form, setForm] = useState<FormState>({
    images: current.images,
    title: current.title, summary: current.summary, description: current.description,
    domain: current.domain, tags: current.tags,
    contacts: current.contacts,
    timeSavedValue: current.timeSavedValue, timeSavedPeriod: current.timeSavedPeriod,
    difficulty: current.difficulty,
    workflowInput: { status: "Stable", nodes: [] }, workflowJson: current.workflowJson,
    sharedPrompt: current.sharedPrompt, basedModel: current.basedModel,
    agentAvailability: current.agentAvailability, strengthsDetail: current.strengthsDetail,
    specificUrl: current.specificUrl, modelName: current.modelName,
    contextWindow: current.contextWindow, costTier: current.costTier,
    mlType: current.mlType, trainingDataDesc: current.trainingDataDesc, devTool: current.devTool,
  });
  const [reason, setReason] = useState("");
  const [draftTag, setDraftTag] = useState("");
  const [imageOver, setImageOver] = useState(false);
  const [n8nUploadedFile, setN8nUploadedFile] = useState<string | null>(null);
  const [n8nJsonError, setN8nJsonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

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

  const baseOk = Boolean(form.title.trim() && form.summary.trim() && form.description.trim());
  const c0 = form.contacts[0];
  const contactOk = Boolean(c0?.name.trim() && c0?.dept.trim() && c0?.email.trim());
  let typeOk = true;
  if (current.kind === "ai-orchestration") typeOk = Boolean(form.agentAvailability && form.strengthsDetail.trim() && form.specificUrl.trim());
  else if (current.kind === "ml") typeOk = Boolean(form.mlType.trim());
  else if (current.kind === "assistant") typeOk = Boolean(form.sharedPrompt.trim());
  const canSubmit = baseOk && contactOk && typeOk && reason.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    // TODO: 실제 연동 시 POST /api/v1/platform-items/:id/edit-requests
    const _payload = {
      id: current.id,
      categoryId: current.kind,
      images: form.images,
      title: form.title, summary: form.summary, description: form.description,
      domain: form.domain || undefined,
      tags: form.tags,
      contacts: form.contacts,
      agentAvailability: current.kind === "ai-orchestration" ? (form.agentAvailability || undefined) : undefined,
      specificUrl: current.kind === "ai-orchestration" ? form.specificUrl : undefined,
      modelName: current.kind === "ai-orchestration" ? form.modelName : undefined,
      contextWindow: current.kind === "ai-orchestration" ? form.contextWindow : undefined,
      costTier: current.kind === "ai-orchestration" ? form.costTier : undefined,
      strengthsDetail: current.kind === "ai-orchestration" ? form.strengthsDetail : undefined,
      sharedPrompt: current.kind === "assistant" ? form.sharedPrompt : undefined,
      basedModel: current.kind === "assistant" ? form.basedModel : undefined,
      mlType: current.kind === "ml" ? form.mlType : undefined,
      trainingDataDesc: current.kind === "ml" ? form.trainingDataDesc : undefined,
      devTool: current.kind === "ml" ? form.devTool : undefined,
      difficulty: current.kind === "n8n" ? form.difficulty : undefined,
      expectedTimeSaved: (current.kind === "n8n" || current.kind === "pa") ? serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod) : undefined,
      workflowDef: current.kind === "n8n" ? toWorkflowDef(form.workflowInput) : undefined,
      workflowJson: current.kind === "n8n" && form.workflowJson ? form.workflowJson : undefined,
      reason,
    };
    void _payload;
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate("/my-status"), 1400);
  };

  const imageHint = current.kind === "pa"
    ? "플로우 디자이너 화면 캡처를 첨부하면 이해에 도움이 됩니다. (최대 10장)"
    : "워크플로우·설명 스크린샷을 첨부하면 이해에 도움이 됩니다. (최대 10장)";

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>

      <Navbar />

      {/* BREADCRUMB */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "10px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#1C6BFF", fontWeight: 500 }}>AX 플랫폼</span>
          <span>/</span>
          <span style={{ color: "#697386" }}>{current.title}</span>
          <span>/</span>
          <span style={{ color: "#1A1F27", fontWeight: 600 }}>수정 요청</span>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "20px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>수정 요청</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em" }}>게시된 AX 항목 수정 요청</h1>
          <p style={{ fontSize: 13, color: "#697386", marginTop: 4 }}>변경할 내용을 반영해 제출하면 관리자 검토 후 게시본에 적용됩니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box" }}>

        {submitted ? (
          <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 10, padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46", marginBottom: 4 }}>수정 요청이 제출되었습니다</div>
            <div style={{ fontSize: 12, color: "#059669" }}>내 현황 페이지로 이동합니다...</div>
          </div>
        ) : (
          <>
            {/* 대상 항목 안내 */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: kindMeta?.bg ?? "#F4F6F9", border: `1px solid ${kindMeta?.color ?? "#EBEEF3"}`,
              borderRadius: 8, padding: "10px 16px", marginBottom: 16,
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#475569" }}>{current.id}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: kindMeta?.color ?? "#475569" }}>{kindLabel}</span>
              <span style={{ fontSize: 12, color: "#697386" }}>항목을 수정합니다</span>
            </div>

            {/* --- 공통 기본 정보 --- */}
            <Section title="기본 정보">
              <Field label="사진" hint={imageHint}>
                <ImageCarouselInput images={form.images} onFiles={handleImageFiles} onRemoveAt={removeImageAt} overCapacity={imageOver} />
              </Field>
              <Field label="제목" required>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="항목 제목" style={inputStyle}
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
                  placeholder="언제 실행되고, 어떤 순서로 동작하는지 설명하세요. (트리거·동작 설명 포함)"
                  style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                  onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
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
            {current.kind === "n8n" && (
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
                      : <span style={{ fontSize: 12, color: "#94A3B8" }}>선택된 파일 없음</span>}
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
            {current.kind === "pa" && (
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
            {current.kind === "assistant" && (
              <Section title="비서 구성">
                <Field label="공유 프롬프트" required hint="동료가 그대로 복사해서 쓸 수 있도록, 실제로 사용한 프롬프트 내용을 입력하세요.">
                  <textarea value={form.sharedPrompt} onChange={e => set("sharedPrompt", e.target.value)}
                    placeholder={'예: "당신은 계약서를 검토하는 법무 담당자입니다..."'}
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
              </Section>
            )}

            {/* --- 유형별 세부 (ai-orchestration, 관리자 관리 항목) --- */}
            {current.kind === "ai-orchestration" && (
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

                <Field label="세부 모델명" hint="구체적인 모델명을 입력하세요.">
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
                <Field label="비용 (토큰 비용)" hint="출력 단가 기준 — 낮음 ≤ $5/M, 보통 $10~15/M, 높음 ≥ $25/M">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {COST_TIERS.map(c => <Tag key={c} label={c} selected={form.costTier === c} onClick={() => set("costTier", c)} />)}
                  </div>
                </Field>
              </Section>
            )}

            {/* --- 유형별 세부 (ml) --- */}
            {current.kind === "ml" && (
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
                    onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                    onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
                </Field>
                <Field label="개발 도구">
                  <input value={form.devTool} onChange={e => set("devTool", e.target.value)}
                    placeholder="예: PyTorch, scikit-learn, TensorFlow" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                    onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
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
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>+ 담당자 추가</button>
            </Section>

            {/* --- 수정 사유 --- */}
            <Section title="수정 사유">
              <Field label="변경 사유" required hint="무엇을 왜 바꾸는지 간략히 작성해 주세요. 관리자 검토에 참고됩니다.">
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="예: 담당자 변경에 따른 정보 갱신, 워크플로우 개선 반영 등"
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                  onBlur={e => (e.target.style.borderColor = "#EBEEF3")} />
              </Field>
            </Section>

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
              제출된 수정 요청은 관리자 검토 후 반영됩니다. 처리 결과는 Teams 및 이메일로 안내됩니다.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => navigate("/projects")} style={{
                background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 7,
                padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
                background: canSubmit && !submitting ? "#1C6BFF" : "#CBD5E1",
                border: "none", borderRadius: 7,
                padding: "10px 28px", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              }}>
                {submitting ? "제출 중..." : "수정 요청 제출"}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}
