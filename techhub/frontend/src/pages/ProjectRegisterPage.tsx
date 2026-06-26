import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";

// ===== 공통 상수 =====
const STATUSES = ["운영 중", "개발 중", "파일럿", "보류"];
const SYSTEM_TYPES = ["웹 애플리케이션", "API/서비스", "ML/AI 모델", "데이터 파이프라인", "내부 도구", "기타"];
const DOMAINS = ["재무/회계", "고객 서비스", "제조/생산", "HR/인사", "IT 인프라", "영업/CRM", "마케팅", "기타"];
const AUDIENCES = ["전사", "특정 부서", "특정 관계사", "관리자만"];
const STACK_OPTIONS = ["Python", "TypeScript", "React", "FastAPI", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes"];
const COST_TIERS = ["낮음", "보통", "높음"] as const;
const DIFFICULTY_LEVELS = ["쉬움", "보통", "어려움"] as const;

// n8n 실제 노드 카테고리 참고 — 자유 입력 시 자동완성 힌트로 제공
const NODE_SUGGESTIONS = [
  "Manual Trigger", "Schedule Trigger", "Form Trigger", "Chat Trigger", "Webhook",
  "Set (Edit Fields)", "Code", "IF", "Switch", "Filter", "Merge", "Aggregate", "Sort",
  "AI Agent", "Basic LLM Chain",
];
const APP_SUGGESTIONS = [
  "Microsoft Outlook", "Microsoft Teams", "Microsoft One Drive", "Google Sheets",
  "HTTP Request", "Spreadsheet File", "Respond To Webhook",
];

const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HC", name: "콜마생활건강" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMSK", name: "콜마스크" },
  { code: "KMW", name: "무석콜마" }, { code: "KMB", name: "북경콜마" },
  { code: "KUS", name: "미국콜마" }, { code: "KBT", name: "콜마바이오텍" },
];
const NO_PARENT = "본부 없음 (관계사 직속)";
const PARENTS_BY_COMPANY: Record<string, string[]> = {
  KKM: ["경영지원본부", "영업마케팅본부", "연구개발본부", "생산본부", "IT본부"],
  KMG: ["영업마케팅본부", "생산본부"],
};
const DEPTS_BY_PARENT: Record<string, string[]> = {
  "경영지원본부": ["재무팀", "인사팀", "법무팀", "구매팀"],
  "영업마케팅본부": ["영업팀", "마케팅팀", "고객서비스팀"],
  "연구개발본부": ["메이크업연구소", "디자인팀"],
  "생산본부": ["제조기술팀", "품질관리팀"],
  "IT본부": ["IT인프라팀", "IT개발팀"],
};

type OrgEntry = { id: number; company: string; parent: string | null; dept: string | null };
const orgEntryDisplay = (e: OrgEntry) => {
  const companyName = COMPANIES.find(c => c.code === e.company)?.name ?? e.company;
  if (!e.parent) return companyName;
  if (!e.dept) return `${companyName} > ${e.parent}`;
  return `${companyName} > ${e.parent} > ${e.dept}`;
};

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };

type RegisterKind = "project" | PlatformId;

// ★ 라벨/설명 변경: AI Orchestration → AI Agent, 나만의 비서 → HK GPT 개인화 설명
const KIND_OPTIONS: { key: RegisterKind; label: string; desc: string; color: string; bg: string }[] = [
  { key: "project", label: "일반 프로젝트", desc: "관계사·부서 단위로 개발·운영되는 사내 IT 프로젝트", color: "#475569", bg: "#F1F5F9" },
  ...PLATFORMS.map(p => {
    if (p.id === "assistant") {
      return { key: p.id, label: p.name, desc: "HK GPT를 업무·개인 맞춤으로 커스터마이징한 에이전트", color: p.color, bg: p.bg };
    }
    if (p.id === "ai-orchestration") {
      return { key: p.id, label: "AI Agent", desc: p.shortDesc, color: p.color, bg: p.bg };
    }
    return { key: p.id, label: p.name, desc: p.shortDesc, color: p.color, bg: p.bg };
  }),
];

const isModelKind = (k: RegisterKind) => k === "ai-orchestration";

type FormState = {
  title: string; summary: string; description: string;
  status: string; systemType: string; systemTypeOther: string;
  domains: string[]; domainOther: string; audiences: string[];
  orgEntries: OrgEntry[]; stack: string[]; freeTags: string;
  integrations: string;
  // 워크플로우/에이전트 전용
  triggerAction: string;
  itemTags: string;
  specificUrl: string;
  nodes: string[];            // ★ 추가 — 노드명 칩
  connectedApps: string[];    // ★ 추가 — 연동 앱 칩
  expectedTimeSaved: string;  // ★ 추가 — 예상 절감 시간
  difficulty: typeof DIFFICULTY_LEVELS[number]; // ★ 추가 — 난이도
  // AI 모델 전용
  provider: string; contextWindow: string; strengths: string;
  costTier: typeof COST_TIERS[number];
  contacts: Contact[];
  links: LinkItem[];
};

let orgEntryIdSeq = 1;

const STEPS_BY_KIND = (kind: RegisterKind) => isModelKind(kind)
  ? ["유형 선택", "기본정보", "모델 사양", "담당자·링크", "최종확인"]
  : kind === "project"
    ? ["유형 선택", "기본정보", "분류·태그", "담당자·링크", "최종확인"]
    : ["유형 선택", "기본정보", "구성·효과", "담당자·링크", "최종확인"];

// ===== 공용 스타일 (모듈 레벨) =====
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  fontSize: 13, color: "#0F172A", border: "1.5px solid #E2E8F0",
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none" as const };

// ===== 공용 컴포넌트 (모듈 레벨) =====
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function Tag({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{
      fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
      border: `1.5px solid ${selected ? "#2563EB" : "#E2E8F0"}`,
      background: selected ? "#EFF6FF" : "#fff",
      color: selected ? "#2563EB" : "#475569",
    }}>
      {label}
    </span>
  );
}

function ChipInput({
  items, draft, setDraft, onAdd, onRemove, suggestions, placeholder, chipColor,
}: {
  items: string[]; draft: string; setDraft: (v: string) => void;
  onAdd: (v?: string) => void; onRemove: (v: string) => void;
  suggestions: string[]; placeholder: string; chipColor: { bg: string; color: string };
}) {
  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {items.map((v, i) => (
            <span key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 600, background: chipColor.bg, color: chipColor.color,
              padding: "5px 6px 5px 12px", borderRadius: 20,
            }}>
              {v}
              <button onClick={() => onRemove(v)} style={{
                background: "none", border: "none", color: chipColor.color, cursor: "pointer",
                fontSize: 14, lineHeight: 1, padding: "0 4px", opacity: 0.7,
              }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => (e.target.style.borderColor = "#2563EB")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />
        <button onClick={() => onAdd()} style={{
          background: "#2563EB", color: "#fff", border: "none", borderRadius: 7,
          padding: "0 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}>
          추가
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
        {suggestions.filter(s => !items.includes(s)).slice(0, 8).map(s => (
          <span key={s} onClick={() => onAdd(s)} style={{
            fontSize: 11, color: "#94A3B8", background: "#F8FAFC", border: "1px solid #E2E8F0",
            padding: "3px 9px", borderRadius: 20, cursor: "pointer",
          }}>
            + {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProjectRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<RegisterKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "", summary: "", description: "",
    status: "", systemType: "", systemTypeOther: "", domains: [], domainOther: "", audiences: [],
    orgEntries: [], stack: [], freeTags: "",
    integrations: "",
    triggerAction: "", itemTags: "", specificUrl: "",
    nodes: [], connectedApps: [], expectedTimeSaved: "", difficulty: "보통",
    provider: "", contextWindow: "", strengths: "", costTier: "보통",
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [{ label: "", url: "" }],
  });

  const [draftCompany, setDraftCompany] = useState(COMPANIES[1].code);
  const [draftParent, setDraftParent] = useState(NO_PARENT);
  const [draftDept, setDraftDept] = useState("");
  const [draftNode, setDraftNode] = useState("");
  const [draftApp, setDraftApp] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (k: "domains" | "audiences" | "stack", v: string) =>
    setForm(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));

  const addOrgEntry = () => {
    const newEntry: OrgEntry = {
      id: orgEntryIdSeq++,
      company: draftCompany,
      parent: draftParent === NO_PARENT ? null : draftParent,
      dept: draftDept || null,
    };
    const isDuplicate = form.orgEntries.some(e => e.company === newEntry.company && e.parent === newEntry.parent && e.dept === newEntry.dept);
    if (isDuplicate) return;
    setForm(p => ({ ...p, orgEntries: [...p.orgEntries, newEntry] }));
    setDraftParent(NO_PARENT);
    setDraftDept("");
  };
  const removeOrgEntry = (id: number) => setForm(p => ({ ...p, orgEntries: p.orgEntries.filter(e => e.id !== id) }));
  const availableParents = PARENTS_BY_COMPANY[draftCompany] ?? [];
  const availableDepts = draftParent !== NO_PARENT ? (DEPTS_BY_PARENT[draftParent] ?? []) : [];

  // ★ 노드 칩 추가/삭제
  const addNode = (value?: string) => {
    const v = (value ?? draftNode).trim();
    if (!v || form.nodes.includes(v)) return;
    setForm(p => ({ ...p, nodes: [...p.nodes, v] }));
    setDraftNode("");
  };
  const removeNode = (v: string) => setForm(p => ({ ...p, nodes: p.nodes.filter(n => n !== v) }));

  // ★ 연동 앱 칩 추가/삭제
  const addApp = (value?: string) => {
    const v = (value ?? draftApp).trim();
    if (!v || form.connectedApps.includes(v)) return;
    setForm(p => ({ ...p, connectedApps: [...p.connectedApps, v] }));
    setDraftApp("");
  };
  const removeApp = (v: string) => setForm(p => ({ ...p, connectedApps: p.connectedApps.filter(a => a !== v) }));

  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, { name: "", dept: "", role: "공동담당자", email: "" }] }));
  const removeContact = (i: number) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, ci) => ci !== i) }));
  const setContact = (i: number, k: keyof Contact, v: string) => setForm(p => ({ ...p, contacts: p.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c) }));

  const addLink = () => setForm(p => ({ ...p, links: [...p.links, { label: "", url: "" }] }));
  const removeLink = (i: number) => setForm(p => ({ ...p, links: p.links.filter((_, li) => li !== i) }));
  const setLink = (i: number, k: keyof LinkItem, v: string) => setForm(p => ({ ...p, links: p.links.map((l, li) => li === i ? { ...l, [k]: v } : l) }));

  const STEPS = kind ? STEPS_BY_KIND(kind) : ["유형 선택"];

  const canNext = () => {
    if (step === 0) return kind !== null;
    if (step === 1) return form.title.trim() && form.summary.trim() && form.description.trim();
    if (step === 2) {
      if (kind === "project") {
        return Boolean(form.status && form.systemType && form.domains.length > 0 && form.orgEntries.length > 0 && form.audiences.length > 0);
      }
      if (kind && isModelKind(kind)) {
        return Boolean(form.status && form.provider.trim() && form.contextWindow.trim() && form.specificUrl.trim());
      }
      // n8n / 나만의 비서(HK GPT 커스텀) — 구성·효과 단계
      return Boolean(form.status && form.nodes.length > 0 && form.specificUrl.trim());
    }
    if (step === 3) return Boolean(form.contacts[0]?.name && form.contacts[0]?.email);
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    // TODO: 실제 연동 시 kind === "project" → POST /api/v1/projects
    //       그 외 → POST /api/v1/platform-items (body에 platformId: kind, nodes, connectedApps,
    //       expectedTimeSaved, difficulty 포함)
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      navigate("/my-status");
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 1200);
  };

  const selectedKindMeta = kind ? KIND_OPTIONS.find(k => k.key === kind)! : null;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>신규 항목 등록 신청</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>작성 완료 후 관리자 검토를 거쳐 Tech Hub에 게시됩니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 32px" }}>

        {/* STEP INDICATOR */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i < step ? "#059669" : i === step ? "#2563EB" : "#E2E8F0",
                  color: i <= step ? "#fff" : "#94A3B8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? "#0F172A" : "#94A3B8", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < step ? "#059669" : "#E2E8F0", margin: "0 10px" }} />}
            </div>
          ))}
        </div>

        {/* ===== STEP 0 — 유형 선택 ===== */}
        {step === 0 && (
          <Section title="등록할 항목의 유형을 선택하세요">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {KIND_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => setKind(opt.key)}
                  style={{
                    border: `1.5px solid ${kind === opt.key ? opt.color : "#E2E8F0"}`,
                    borderTop: `3px solid ${opt.color}`,
                    background: kind === opt.key ? opt.bg : "#fff",
                    borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: opt.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{opt.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 11, color: "#64748B" }}>
              어떤 유형을 선택해도 등록 신청 → 관리자 검토 → 승인 절차는 동일하게 적용됩니다.
            </div>
          </Section>
        )}

        {/* ===== STEP 1 — 공통 기본정보 ===== */}
        {step === 1 && (
          <Section title={`기본정보 ${selectedKindMeta ? `(${selectedKindMeta.label})` : ""}`}>
            <Field label="제목" required>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder={kind === "ai-orchestration" ? "예: 긴급 메일 자동 전달" : kind === "project" ? "프로젝트명을 입력하세요" : kind === "n8n" ? "워크플로우 이름을 입력하세요" : "에이전트(HK GPT 커스텀) 이름을 입력하세요"}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="한 줄 요약" required hint="목록 카드에 표시되는 짧은 설명입니다.">
              <input value={form.summary} onChange={e => set("summary", e.target.value)}
                placeholder="핵심 기능이나 목적을 한 줄로 설명하세요"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="상세 설명" required>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder={kind === "project"
                  ? "개발 배경, 해결하려는 문제, 주요 기능, 현재 단계 등을 포함하면 좋습니다."
                  : kind === "ai-orchestration"
                    ? "어떤 반복 업무를 자동화하는지, 트리거 조건은 무엇인지 설명하세요."
                    : kind === "assistant"
                      ? "HK GPT를 어떤 업무에 맞게 커스터마이징했는지, 주요 활용 시나리오를 설명하세요."
                      : "트리거 조건, 동작 순서, 연동되는 시스템을 포함하면 좋습니다."}
                style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 2 — 일반 프로젝트 분류 ===== */}
        {step === 2 && kind === "project" && (
          <Section title="프로젝트 분류">
            <Field label="프로젝트 상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUSES.map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="시스템 유형" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SYSTEM_TYPES.map(s => <Tag key={s} label={s} selected={form.systemType === s} onClick={() => set("systemType", s)} />)}
              </div>
              {form.systemType === "기타" && (
                <input value={form.systemTypeOther} onChange={e => set("systemTypeOther", e.target.value)}
                  placeholder="시스템 유형을 직접 입력하세요"
                  style={{ ...inputStyle, marginTop: 8 }}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              )}
            </Field>
            <Field label="비즈니스 도메인" required hint="복수 선택 가능합니다.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DOMAINS.map(d => <Tag key={d} label={d} selected={form.domains.includes(d)} onClick={() => toggle("domains", d)} />)}
              </div>
              {form.domains.includes("기타") && (
                <input value={form.domainOther} onChange={e => set("domainOther", e.target.value)}
                  placeholder="비즈니스 도메인을 직접 입력하세요"
                  style={{ ...inputStyle, marginTop: 8 }}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              )}
            </Field>

            <Field label="참여 관계사 / 본부 / 부서" required hint="관계사는 필수이며, 본부와 부서는 선택사항입니다.">
              {form.orgEntries.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {form.orgEntries.map(e => (
                    <div key={e.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 7, padding: "8px 12px",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1E40AF" }}>{orgEntryDisplay(e)}</span>
                      <button onClick={() => removeOrgEntry(e.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>관계사 <span style={{ color: "#EF4444" }}>*</span></div>
                    <select value={draftCompany} onChange={e => { setDraftCompany(e.target.value); setDraftParent(NO_PARENT); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 12, padding: "8px 28px 8px 10px" }}>
                      {COMPANIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>본부 (선택)</div>
                    <select value={draftParent} onChange={e => { setDraftParent(e.target.value); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 12, padding: "8px 28px 8px 10px" }}>
                      <option value={NO_PARENT}>{NO_PARENT}</option>
                      {availableParents.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>부서 (선택)</div>
                    <select value={draftDept} onChange={e => setDraftDept(e.target.value)} disabled={draftParent === NO_PARENT} style={{ ...selectStyle, fontSize: 12, padding: "8px 28px 8px 10px", opacity: draftParent === NO_PARENT ? 0.5 : 1 }}>
                      <option value="">부서 없음</option>
                      {availableDepts.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addOrgEntry} style={{
                  background: "#2563EB", color: "#fff", border: "none", borderRadius: 6,
                  padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  + 추가
                </button>
              </div>
            </Field>

            <Field label="사용 대상" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {AUDIENCES.map(a => <Tag key={a} label={a} selected={form.audiences.includes(a)} onClick={() => toggle("audiences", a)} />)}
              </div>
            </Field>
            <Field label="기술 스택">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STACK_OPTIONS.map(s => <Tag key={s} label={s} selected={form.stack.includes(s)} onClick={() => toggle("stack", s)} />)}
              </div>
            </Field>
            <Field label="연동 시스템" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.integrations} onChange={e => set("integrations", e.target.value)}
                placeholder="예: ERP, LIMS" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="자유 태그" hint="콤마(,)로 구분하여 입력하세요. 관리자 검토 후 공식 분류로 편입될 수 있습니다.">
              <input value={form.freeTags} onChange={e => set("freeTags", e.target.value)}
                placeholder="예: Lab색공간, 조색" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 2 — 워크플로우/에이전트형(n8n, 나만의 비서) "구성·효과" ===== */}
        {step === 2 && kind && !isModelKind(kind) && kind !== "project" && (
          <>
            <Section title={`${selectedKindMeta?.label} 동작 정보`}>
              <Field label="상태" required>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STATUSES.map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
                </div>
              </Field>
              <Field label="트리거 · 동작 설명" required hint="언제 실행되고, 어떤 순서로 동작하는지 설명하세요.">
                <textarea value={form.triggerAction} onChange={e => set("triggerAction", e.target.value)}
                  placeholder="예: Outlook에 새 이메일이 도착하면 → 제목/본문에 '긴급' 포함 여부 확인 → 팀장님께 이메일 전달"
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <Field label="실행 URL" required hint="이 워크플로우/에이전트에 직접 접근할 수 있는 주소입니다.">
                <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                  placeholder={`예: https://${kind}.kolmar.co.kr/...`} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
                <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                  placeholder="예: HR, 계정자동화, 온보딩" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
            </Section>

            {/* ★ 노드 구성 — n8n 화면의 [Outlook Trigger]→[IF]→[Teams] 같은 노드 체인을 칩으로 입력 */}
            <Section title="노드 구성">
              <Field label="사용된 노드" required hint="워크플로우/에이전트를 구성하는 노드명을 순서대로 추가하세요. (예: Outlook Trigger, IF, Microsoft Teams)">
                <ChipInput
                  items={form.nodes}
                  draft={draftNode}
                  setDraft={setDraftNode}
                  onAdd={addNode}
                  onRemove={removeNode}
                  suggestions={NODE_SUGGESTIONS}
                  placeholder="노드명을 입력 후 Enter 또는 추가"
                  chipColor={{ bg: "#EEF2FF", color: "#4338CA" }}
                />
              </Field>
              <Field label="연동 앱·서비스" hint="이 워크플로우/에이전트가 연결하는 외부 앱·서비스를 추가하세요. (예: Microsoft Outlook, Microsoft Teams)">
                <ChipInput
                  items={form.connectedApps}
                  draft={draftApp}
                  setDraft={setDraftApp}
                  onAdd={addApp}
                  onRemove={removeApp}
                  suggestions={APP_SUGGESTIONS}
                  placeholder="연동 앱명을 입력 후 Enter 또는 추가"
                  chipColor={{ bg: "#ECFDF5", color: "#047857" }}
                />
              </Field>
            </Section>

            {/* ★ 예상 효과 — n8n 화면의 "예상 절감 시간 / 난이도"와 동일한 정보 구조 */}
            <Section title="예상 효과">
              <Field label="예상 절감 시간" hint="이 자동화를 적용하면 절감되는 시간을 입력하세요. (예: 주 1시간, 월 4시간)">
                <input value={form.expectedTimeSaved} onChange={e => set("expectedTimeSaved", e.target.value)}
                  placeholder="예: 주 1시간" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <Field label="구성 난이도">
                <div style={{ display: "flex", gap: 8 }}>
                  {DIFFICULTY_LEVELS.map(d => <Tag key={d} label={d} selected={form.difficulty === d} onClick={() => set("difficulty", d)} />)}
                </div>
              </Field>
            </Section>
          </>
        )}

        {/* ===== STEP 2 — AI Agent(구 AI Orchestration) 모델 사양 ===== */}
        {step === 2 && kind && isModelKind(kind) && (
          <Section title="모델 사양">
            <Field label="상태" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUSES.map(s => <Tag key={s} label={s} selected={form.status === s} onClick={() => set("status", s)} />)}
              </div>
            </Field>
            <Field label="제공사" required>
              <input value={form.provider} onChange={e => set("provider", e.target.value)}
                placeholder="예: OpenAI, Anthropic, 사내 파인튜닝" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="컨텍스트 윈도우" required>
              <input value={form.contextWindow} onChange={e => set("contextWindow", e.target.value)}
                placeholder="예: 128K, 200K, 1M" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="비용 등급" required>
              <div style={{ display: "flex", gap: 8 }}>
                {COST_TIERS.map(c => <Tag key={c} label={c} selected={form.costTier === c} onClick={() => set("costTier", c)} />)}
              </div>
            </Field>
            <Field label="강점" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.strengths} onChange={e => set("strengths", e.target.value)}
                placeholder="예: 긴 컨텍스트, 정밀 추론, 안전성" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="모델 접속 URL" required>
              <input value={form.specificUrl} onChange={e => set("specificUrl", e.target.value)}
                placeholder="예: https://ai-gateway.kolmar.co.kr/models/..." style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="태그" hint="콤마(,)로 구분하여 입력하세요.">
              <input value={form.itemTags} onChange={e => set("itemTags", e.target.value)}
                placeholder="예: 범용, 코드생성, 문서작성" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </Section>
        )}

        {/* ===== STEP 3 — 공통 담당자·링크 ===== */}
        {step === 3 && (
          <>
            <Section title="담당자">
              {form.contacts.map((c, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8,
                  marginBottom: 10, alignItems: "center",
                }}>
                  <input value={c.name} onChange={e => setContact(i, "name", e.target.value)} placeholder="이름" style={inputStyle} />
                  <input value={c.dept} onChange={e => setContact(i, "dept", e.target.value)} placeholder="부서" style={inputStyle} />
                  <input value={c.role} onChange={e => setContact(i, "role", e.target.value)} placeholder="역할" style={inputStyle} />
                  <input value={c.email} onChange={e => setContact(i, "email", e.target.value)} placeholder="이메일" style={inputStyle} />
                  {i > 0 && (
                    <button onClick={() => removeContact(i)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addContact} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 6,
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>
                + 담당자 추가
              </button>
            </Section>

            <Section title="문서 및 외부 링크">
              {form.links.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 10 }}>
                  <input value={l.label} onChange={e => setLink(i, "label", e.target.value)} placeholder="라벨 (예: GitHub)" style={inputStyle} />
                  <input value={l.url} onChange={e => setLink(i, "url", e.target.value)} placeholder="URL" style={inputStyle} />
                  {i > 0 && (
                    <button onClick={() => removeLink(i)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addLink} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 6,
                padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>
                + 링크 추가
              </button>
            </Section>
          </>
        )}

        {/* ===== STEP 4 — 최종확인 (유형별 분기) ===== */}
        {step === 4 && (
          <Section title="최종 확인">
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: selectedKindMeta?.bg, border: `1px solid ${selectedKindMeta?.color}`,
              borderRadius: 8, padding: "8px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedKindMeta?.color }}>{selectedKindMeta?.label}</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>으로 등록합니다</span>
            </div>

            {[
              { label: "제목", value: form.title || "—" },
              { label: "한 줄 요약", value: form.summary || "—" },
              { label: "상태", value: form.status || "—" },
              ...(kind === "project" ? [
                { label: "시스템 유형", value: form.systemType === "기타" ? form.systemTypeOther : form.systemType || "—" },
                { label: "비즈니스 도메인", value: form.domains.map(d => d === "기타" ? form.domainOther : d).join(", ") || "—" },
                { label: "참여 관계사/본부/부서", value: form.orgEntries.length > 0 ? form.orgEntries.map(orgEntryDisplay).join(" / ") : "—" },
                { label: "사용 대상", value: form.audiences.join(", ") || "—" },
                { label: "기술 스택", value: form.stack.join(", ") || "—" },
                { label: "연동 시스템", value: form.integrations || "—" },
                { label: "자유 태그", value: form.freeTags || "—" },
              ] : []),
              ...(kind && !isModelKind(kind) && kind !== "project" ? [
                { label: "트리거·동작 설명", value: form.triggerAction || "—" },
                { label: "사용된 노드", value: form.nodes.join(" → ") || "—" },
                { label: "연동 앱·서비스", value: form.connectedApps.join(", ") || "—" },
                { label: "예상 절감 시간", value: form.expectedTimeSaved || "—" },
                { label: "구성 난이도", value: form.difficulty },
                { label: "실행 URL", value: form.specificUrl || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              ...(kind && isModelKind(kind) ? [
                { label: "제공사", value: form.provider || "—" },
                { label: "컨텍스트 윈도우", value: form.contextWindow || "—" },
                { label: "비용 등급", value: form.costTier },
                { label: "강점", value: form.strengths || "—" },
                { label: "모델 접속 URL", value: form.specificUrl || "—" },
                { label: "태그", value: form.itemTags || "—" },
              ] : []),
              { label: "주담당자", value: form.contacts[0] ? `${form.contacts[0].name} (${form.contacts[0].dept})` : "—" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "160px 1fr",
                padding: "10px 0", borderBottom: "1px solid #F8FAFC", gap: 16,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "#0F172A" }}>{row.value}</span>
              </div>
            ))}

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginTop: 20, fontSize: 12, color: "#92400E" }}>
              제출 후 관리자 검토를 거쳐 Tech Hub에 게시됩니다. 검토 결과는 이메일 및 Teams로 알림이 발송됩니다.
            </div>

            {saved && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 13, fontWeight: 600, color: "#065F46" }}>
                제출이 완료되었습니다. 내 등록 현황 페이지로 이동합니다.
              </div>
            )}
          </Section>
        )}

        {/* BOTTOM ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{
            background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7,
            padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#475569",
            cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.4 : 1,
          }} disabled={step === 0}>
            이전
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7,
              padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
            }}>
              임시저장
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext() && setStep(s => s + 1)} style={{
                background: canNext() ? "#2563EB" : "#CBD5E1",
                border: "none", borderRadius: 7,
                padding: "10px 28px", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: canNext() ? "pointer" : "not-allowed",
              }}>
                다음
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving || saved} style={{
                background: saving || saved ? "#94A3B8" : "#059669",
                border: "none", borderRadius: 7,
                padding: "10px 28px", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: saving || saved ? "not-allowed" : "pointer",
              }}>
                {saving ? "제출 중..." : saved ? "제출 완료" : "등록 신청"}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}