import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DOMAINS = ["마케팅", "영업/CRM", "HR/인사", "재무/회계", "고객 서비스", "제조/생산", "IT 인프라", "데이터/분석", "보안", "내부 도구", "기타"];
const STATUSES = ["개발 중", "운영 중", "파일럿", "보류"];
const SYSTEM_TYPES = ["웹 애플리케이션", "모바일 앱", "API/서비스", "데이터 파이프라인", "ML/AI 모델", "배치/스케줄러", "인프라/DevOps 도구", "라이브러리/SDK", "내부 플랫폼", "기타"];
const AUDIENCES = ["내부 직원 전체", "특정 부서", "외부 고객", "파트너사", "시스템 간 (내부 API)"];
// TODO: 실제 연동 시 GET /api/v1/departments 응답으로 교체
const DEPARTMENTS = ["메이크업연구소", "스킨케어연구소", "재무팀", "인사팀", "마케팅팀", "영업팀", "IT인프라팀", "IT개발팀", "품질관리팀", "제조기술팀", "고객서비스팀", "디자인팀"];

// TODO: 실제 연동 시 GET /api/v1/taxonomy/stack 응답으로 교체
const STACK_GROUPS: Record<string, string[]> = {
  "언어": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "C#", "Rust"],
  "프레임워크": ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Django", "NestJS", "Flutter"],
  "인프라/클라우드": ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "On-premise"],
  "데이터": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Airflow", "Spark"],
};

const STEPS = ["기본 정보", "분류 및 태그", "담당자 / 링크", "최종 확인"];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 18 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
    {children}
  </div>
);

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };
type FormState = {
  title: string; summary: string; description: string;
  status: string; systemType: string; systemTypeOther: string;
  domains: string[]; domainOther: string; audiences: string[];
  departments: string[]; stack: string[]; freeTags: string; integrations: string;
  contacts: Contact[]; links: LinkItem[];
};

const Tag = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <span onClick={onClick} style={{
    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
    border: `1.5px solid ${selected ? "#2563EB" : "#E2E8F0"}`,
    background: selected ? "#EFF6FF" : "#fff",
    color: selected ? "#2563EB" : "#475569",
    cursor: "pointer", transition: "all 0.12s", userSelect: "none",
  }}>
    {label}
  </span>
);

const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{label}</label>
      {required && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>필수</span>}
    </div>
    {hint && <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>{hint}</div>}
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 8, outline: "none", fontFamily: "inherit",
};

export default function ProjectRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // TODO: 실제 연동 시 로그인 사용자 정보로 주담당자 자동 채움
  const [form, setForm] = useState<FormState>({
    title: "", summary: "", description: "",
    status: "", systemType: "", systemTypeOther: "", domains: [], domainOther: "", audiences: [],
    departments: [], stack: [], freeTags: "",
    integrations: "",
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [{ label: "", url: "" }],
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (k: "domains" | "audiences" | "departments" | "stack", v: string) =>
    setForm(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));

  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, { name: "", dept: "", role: "공동담당자", email: "" }] }));
  const removeContact = (i: number) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, ci) => ci !== i) }));
  const setContact = (i: number, k: keyof Contact, v: string) => setForm(p => ({ ...p, contacts: p.contacts.map((c, ci) => ci === i ? { ...c, [k]: v } : c) }));

  const addLink = () => setForm(p => ({ ...p, links: [...p.links, { label: "", url: "" }] }));
  const removeLink = (i: number) => setForm(p => ({ ...p, links: p.links.filter((_, li) => li !== i) }));
  const setLink = (i: number, k: keyof LinkItem, v: string) => setForm(p => ({ ...p, links: p.links.map((l, li) => li === i ? { ...l, [k]: v } : l) }));

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.summary.trim() && form.description.trim();
    if (step === 1) return form.status && form.systemType && form.domains.length > 0 && form.departments.length > 0 && form.audiences.length > 0;
    if (step === 2) return Boolean(form.contacts[0]?.name && form.contacts[0]?.email);
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    // TODO: 실제 연동 시 POST /api/v1/projects 로 교체
    // const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/projects`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(form),
    // });
    await new Promise(r => setTimeout(r, 600)); // 임시 딜레이 (목업)
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/my-status"), 1200);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>프로젝트 등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>신규 프로젝트 등록 신청</h1>
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
                  {i < step ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? "#0F172A" : "#94A3B8", whiteSpace: "nowrap" }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? "#059669" : "#E2E8F0", margin: "0 12px" }} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <Section title="기본 정보">
            <Field label="프로젝트명" required>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="시스템 또는 프로젝트의 공식 명칭을 입력하세요"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="한 줄 요약" required hint="목록 카드에 표시되는 짧은 설명입니다. 50자 이내를 권장합니다.">
              <input value={form.summary} onChange={e => set("summary", e.target.value)}
                placeholder="이 프로젝트가 무엇을 하는지 한 문장으로 설명하세요"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
            <Field label="상세 설명" required hint="프로젝트의 배경, 목적, 현재 진행 상황을 자유롭게 작성하세요.">
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="개발 배경, 해결하려는 문제, 주요 기능, 현재 단계 등을 포함하면 좋습니다."
                style={{ ...inputStyle, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
            </Field>
          </Section>
        )}

        {step === 1 && (
          <>
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

              <Field label="참여 부서" required hint="주관 부서 및 협업 부서를 모두 선택하세요.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {DEPARTMENTS.map(d => <Tag key={d} label={d} selected={form.departments.includes(d)} onClick={() => toggle("departments", d)} />)}
                </div>
              </Field>
              <Field label="사용 대상" required hint="복수 선택 가능합니다.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AUDIENCES.map(a => <Tag key={a} label={a} selected={form.audiences.includes(a)} onClick={() => toggle("audiences", a)} />)}
                </div>
              </Field>
            </Section>

            <Section title="기술 스택 및 태그">
              {Object.entries(STACK_GROUPS).map(([group, items]) => (
                <Field key={group} label={group}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map(s => <Tag key={s} label={s} selected={form.stack.includes(s)} onClick={() => toggle("stack", s)} />)}
                  </div>
                </Field>
              ))}
              <Field label="연동 시스템" hint="연동된 내부/외부 시스템이 있다면 입력하세요. (예: ERP, LIMS, SAP)">
                <input value={form.integrations} onChange={e => set("integrations", e.target.value)}
                  placeholder="쉼표로 구분하여 입력 (예: ERP, LIMS)"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
              </Field>
              <Field label="자유 태그" hint="위 분류에 없는 키워드를 자유롭게 입력하세요. 자주 사용되는 태그는 관리자 검토를 거쳐 공식 분류 항목으로 추가될 수 있습니다.">
                <input value={form.freeTags} onChange={e => set("freeTags", e.target.value)}
                  placeholder="쉼표로 구분하여 입력 (예: 조색, Lab색공간, 배합예측)"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#2563EB")}
                  onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                <div style={{ marginTop: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#1E40AF", lineHeight: 1.6 }}>
                  표준 분류에 없는 기술, 도메인, 키워드가 있다면 자유 태그로 입력해 주세요. 누적된 태그는 관리자가 주기적으로 검토하여 공식 분류 항목으로 편입합니다.
                </div>
              </Field>
            </Section>
          </>
        )}

        {step === 2 && (
          <>
            <Section title="담당자 정보">
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
                로그인 계정이 주담당자로 자동 등록됩니다. 공동담당자를 추가할 수 있습니다.
              </div>
              {form.contacts.map((c, i) => (
                <div key={i} style={{
                  background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8,
                  padding: "16px 18px", marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      background: i === 0 ? "#0F172A" : "#E2E8F0",
                      color: i === 0 ? "#fff" : "#64748B",
                      padding: "2px 10px", borderRadius: 20,
                    }}>{c.role}</span>
                    {i > 0 && (
                      <button onClick={() => removeContact(i)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(["name", "dept", "email"] as const).map(k => (
                      <div key={k} style={{ gridColumn: k === "email" ? "1 / -1" : "auto" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                          {k === "name" ? "이름" : k === "dept" ? "부서" : "이메일"}
                        </div>
                        <input value={c[k]} onChange={e => setContact(i, k, e.target.value)}
                          style={{ ...inputStyle, background: "#fff" }}
                          onFocus={e => (e.target.style.borderColor = "#2563EB")}
                          onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addContact} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 8,
                padding: "10px 0", width: "100%", fontSize: 13, color: "#64748B",
                fontWeight: 600, cursor: "pointer",
              }}>
                + 공동담당자 추가
              </button>
            </Section>

            <Section title="문서 및 외부 링크">
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
                GitHub, Confluence, Notion, I/F 정의서 등 관련 문서 링크를 등록하세요.
              </div>
              {form.links.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 32px", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input value={l.label} onChange={e => setLink(i, "label", e.target.value)}
                    placeholder="링크 이름 (예: GitHub)"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#2563EB")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                  <input value={l.url} onChange={e => setLink(i, "url", e.target.value)}
                    placeholder="https://"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#2563EB")}
                    onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
                  <button onClick={() => removeLink(i)} style={{ background: "none", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
              <button onClick={addLink} style={{
                background: "#fff", border: "1.5px dashed #CBD5E1", borderRadius: 8,
                padding: "10px 0", width: "100%", fontSize: 13, color: "#64748B",
                fontWeight: 600, cursor: "pointer",
              }}>
                + 링크 추가
              </button>
            </Section>
          </>
        )}

        {step === 3 && (
          <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "28px 30px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #F1F5F9" }}>
              등록 내용 최종 확인
            </div>

            {[
              { label: "프로젝트명", value: form.title || "—" },
              { label: "한 줄 요약", value: form.summary || "—" },
              { label: "상태", value: form.status || "—" },
              { label: "시스템 유형", value: (form.systemType === "기타" ? form.systemTypeOther : form.systemType) || "—" },
              { label: "비즈니스 도메인", value: form.domains.map(d => d === "기타" && form.domainOther ? form.domainOther : d).join(", ") || "—" },
              { label: "참여 부서", value: form.departments.join(", ") || "—" },
              { label: "사용 대상", value: form.audiences.join(", ") || "—" },
              { label: "기술 스택", value: form.stack.join(", ") || "—" },
              { label: "연동 시스템", value: form.integrations || "—" },
              { label: "자유 태그", value: form.freeTags || "—" },
              { label: "주담당자", value: form.contacts[0] ? `${form.contacts[0].name} (${form.contacts[0].dept})` : "—" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "140px 1fr",
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
          </div>
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