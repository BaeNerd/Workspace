import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { CATEGORIES, BUSINESS_DOMAINS, ML_TYPES } from "../types/categoryTypes";
import type { BusinessDomain } from "../types/categoryTypes";
import { toWorkflowDef, parseN8nJson } from "../components/WorkflowDiagram";
import type { WorkflowInput } from "../components/WorkflowDiagram";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { ImageCarouselInput, MAX_IMAGES } from "../components/ImageCarouselInput";
import { ChipInput } from "../components/ChipInput";
import { TimeSavedInput, serializeTimeSaved, parseTimeSaved } from "../components/TimeSavedInput";
import type { SavedPeriod } from "../components/TimeSavedInput";
import CardIdTag from "../components/CardIdTag";
import { getAssetItem } from "../lib/dataSource";
import { FORM_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";

// 등록 폼(ProjectRegisterPage) Step 1과 동일한 필드 체계로 수정 요청을 받는다.
// 대상 카드는 :id 파라미터로 자산 SSOT(getAssetItem)에서 프리필한다(별도 목업 사본 없음).
// 상태·관계사·실행 URL·삭제된 유형별 필드의 수정 UI는 포함하지 않는다.

const COST_TIERS = ["낮음", "보통", "높음"] as const;
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"] as const;
// AI Model 이용 가능 상태 (운영 상태 체계와 별개 축)
const AGENT_AVAILABILITY = ["사용 가능", "사용 불가"] as const;

const ASSISTANT_MODEL_HINTS = [
  "웍스 대표 모델", "GPT-5.4", "GPT-5.4 Mini", "Claude Opus 4.8", "Claude Sonnet 5",
  "Gemini", "LG AI", "Upstage",
];
const CONTEXT_SIZE_OPTIONS = ["일반 대화 수준", "문서 여러 장 (수십 페이지)", "매우 긴 문서 (책 한 권 분량)"];

type Contact = { name: string; dept: string; role: string; email: string };

// ===== 공용 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: COLOR.text, border: `1.5px solid ${COLOR.border}`,
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const };
const rowActionWidth = 24;

// ===== 공용 스타일 컴포넌트 (모듈 레벨 — 리렌더 시 재생성 방지) =====
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
  const { isAdmin } = useAuth();

  // 대상 카드 — 자산 SSOT 단건 조회. 없으면 상세와 동일한 빈 상태로 안내.
  const item = id ? getAssetItem(id) : undefined;
  const kindMeta = item ? CATEGORIES.find(p => p.id === item.categoryId) : undefined;
  const kindLabel = item ? (item.categoryId === "ai-orchestration" ? "AI Model" : (kindMeta?.name ?? item.categoryId)) : "";

  // 프리필 — 예상 절감 시간은 저장 문자열을 수치+주기로 역파싱, 담당자는 owner/dept/ownerEmail에서 구성.
  const ts = parseTimeSaved(item?.expectedTimeSaved);
  const [form, setForm] = useState<FormState>(() => ({
    images: item?.images ?? [],
    title: item?.title ?? "", summary: item?.summary ?? "", description: item?.description ?? "",
    domain: item?.domain ?? "", tags: item?.tags ?? [],
    contacts: item
      ? [{ name: item.owner, dept: item.dept, role: "주담당자", email: item.ownerEmail }]
      : [{ name: "", dept: "", role: "주담당자", email: "" }],
    timeSavedValue: ts.value, timeSavedPeriod: ts.period,
    difficulty: item?.difficulty ?? "보통",
    workflowInput: { status: "Stable", nodes: [] }, workflowJson: item?.workflowJson ?? "",
    sharedPrompt: item?.sharedPrompt ?? "", basedModel: item?.basedModel ?? "",
    agentAvailability: item?.agentAvailability ?? "",
    strengthsDetail: item?.modelMeta?.strengthsDetail ?? "",
    specificUrl: item?.specificUrl ?? "", modelName: item?.modelMeta?.modelName ?? "",
    contextWindow: item?.modelMeta?.contextWindow ?? "", costTier: item?.modelMeta?.costTier ?? "보통",
    mlType: item?.mlType ?? "", trainingDataDesc: item?.trainingDataDesc ?? "", devTool: item?.devTool ?? "",
  }));
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

  // 없는 ID — 상세(AssetItemDetailPage)와 동일 문구의 빈 상태.
  if (!item || !kindMeta) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: COLOR.text3 }}>
        카드를 찾을 수 없습니다. (id: {id})
      </div>
    );
  }

  // AI Model(ai-orchestration) 카드 수정은 관리자 전용 — 등록 폼 가드와 동일 원칙.
  if (item.categoryId === "ai-orchestration" && !isAdmin) {
    return (
      <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 32px" }}>
          <div style={{
            maxWidth: 520, width: "100%", background: "#fff", border: `1.5px solid ${COLOR.border}`,
            borderRadius: 10, padding: "32px 28px", textAlign: "center",
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: COLOR.text, marginBottom: 8 }}>AI Model 카드 수정은 관리자 전용입니다</div>
            <p style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7, marginBottom: 20 }}>
              AI Model(모델 카탈로그) 카드는 관리자만 수정할 수 있습니다. 변경이 필요하면 전사 관리자에게 문의하세요.
            </p>
            <button onClick={() => navigate("/projects")} style={{
              background: COLOR.primary, border: "none", borderRadius: 7,
              padding: "10px 24px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            }}>AX 플랫폼으로 이동</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const kind = item.categoryId;

  const baseOk = Boolean(form.title.trim() && form.summary.trim() && form.description.trim());
  const c0 = form.contacts[0];
  const contactOk = Boolean(c0?.name.trim() && c0?.dept.trim() && c0?.email.trim());
  let typeOk = true;
  if (kind === "ai-orchestration") typeOk = Boolean(form.agentAvailability && form.strengthsDetail.trim() && form.specificUrl.trim());
  else if (kind === "ml") typeOk = Boolean(form.mlType.trim());
  else if (kind === "assistant") typeOk = Boolean(form.sharedPrompt.trim());
  const canSubmit = baseOk && contactOk && typeOk && reason.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    // TODO: 실제 연동 시 POST /api/v1/assets/:id/edit-requests
    const _payload = {
      id: item.id,
      categoryId: kind,
      images: form.images,
      title: form.title, summary: form.summary, description: form.description,
      domain: form.domain || undefined,
      tags: form.tags,
      contacts: form.contacts,
      agentAvailability: kind === "ai-orchestration" ? (form.agentAvailability || undefined) : undefined,
      specificUrl: kind === "ai-orchestration" ? form.specificUrl : undefined,
      modelName: kind === "ai-orchestration" ? form.modelName : undefined,
      contextWindow: kind === "ai-orchestration" ? form.contextWindow : undefined,
      costTier: kind === "ai-orchestration" ? form.costTier : undefined,
      strengthsDetail: kind === "ai-orchestration" ? form.strengthsDetail : undefined,
      sharedPrompt: kind === "assistant" ? form.sharedPrompt : undefined,
      basedModel: kind === "assistant" ? form.basedModel : undefined,
      mlType: kind === "ml" ? form.mlType : undefined,
      trainingDataDesc: kind === "ml" ? form.trainingDataDesc : undefined,
      devTool: kind === "ml" ? form.devTool : undefined,
      difficulty: kind === "n8n" ? form.difficulty : undefined,
      expectedTimeSaved: (kind === "n8n" || kind === "pa") ? serializeTimeSaved(form.timeSavedValue, form.timeSavedPeriod) : undefined,
      workflowDef: kind === "n8n" ? toWorkflowDef(form.workflowInput) : undefined,
      workflowJson: kind === "n8n" && form.workflowJson ? form.workflowJson : undefined,
      reason,
    };
    void _payload;
    // TODO: 백엔드 연동 시 알림 발송(kind: "수정요청처리") — 관리자 검토 후 수정 요청이 반영/보류되면 신청자에게 통지.
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate("/my-status"), 1400);
  };

  const imageHint = kind === "pa"
    ? "플로우 디자이너 화면 캡처를 첨부하면 이해에 도움이 됩니다. (최대 10장)"
    : "워크플로우·설명 스크린샷을 첨부하면 이해에 도움이 됩니다. (최대 10장)";

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>

      <Navbar />

      {/* BREADCRUMB */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "10px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLOR.text3 }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: COLOR.primary, fontWeight: 500 }}>AX 플랫폼</span>
          <span>/</span>
          <span style={{ color: COLOR.text2 }}>{item.title}</span>
          <span>/</span>
          <span style={{ color: COLOR.text, fontWeight: 600 }}>수정 요청</span>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: FORM_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>수정 요청</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>게시된 AX 카드 수정 요청</h1>
          <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>변경할 내용을 반영해 제출하면 관리자 검토 후 게시본에 적용됩니다.</p>
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
              background: kindMeta.bg ?? COLOR.bgSubtle, border: `1px solid ${kindMeta.color ?? COLOR.border}`,
              borderRadius: 8, padding: "10px 16px", marginBottom: 16,
            }}>
              <CardIdTag id={item.id} />
              <span style={{ fontSize: 12, fontWeight: 700, color: kindMeta.color ?? COLOR.text2 }}>{kindLabel}</span>
              <span style={{ fontSize: 12, color: COLOR.text2 }}>카드를 수정합니다</span>
            </div>

            {/* --- 공통 기본 정보 --- */}
            <Section title="기본 정보">
              <Field label="사진" hint={imageHint}>
                <ImageCarouselInput images={form.images} onFiles={handleImageFiles} onRemoveAt={removeImageAt} overCapacity={imageOver} />
              </Field>
              <Field label="제목" required>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="카드 제목" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                  onBlur={e => (e.target.style.borderColor = COLOR.border)} />
              </Field>
              <Field label="한 줄 요약" required>
                <input value={form.summary} onChange={e => set("summary", e.target.value)}
                  placeholder="이 카드가 무엇을 하는지 한 문장으로 설명하세요"
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

              <Field label="업무 도메인" hint="이 카드가 주로 활용되는 업무 영역을 선택하세요.">
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
                    placeholder={'예: "당신은 계약서를 검토하는 법무 담당자입니다..."'}
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

            {/* --- 유형별 세부 (ai-orchestration, 관리자 관리 항목) --- */}
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

            {/* --- 수정 사유 --- */}
            <Section title="수정 사유">
              <Field label="변경 사유" required hint="무엇을 왜 바꾸는지 간략히 작성해 주세요. 관리자 검토에 참고됩니다.">
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="예: 담당자 변경에 따른 정보 갱신, 워크플로우 개선 반영 등"
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = COLOR.primary)}
                  onBlur={e => (e.target.style.borderColor = COLOR.border)} />
              </Field>
            </Section>

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
              제출된 수정 요청은 관리자 검토 후 반영됩니다. 처리 결과는 Teams 및 이메일로 안내됩니다.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => navigate("/projects")} style={{
                background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 7,
                padding: "10px 22px", fontSize: 13, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
              }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
                background: canSubmit && !submitting ? COLOR.primary : "#CBD5E1",
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
