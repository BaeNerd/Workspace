/* ============================================================
   파일: src/pages/admin/AdminReview.tsx
   경로: /admin/review
   ============================================================ */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_NAV = [
  { label: "대시보드", path: "/admin" },
  { label: "등록 신청 검토", path: "/admin/review" },
  { label: "프로젝트 관리", path: "/admin/projects" },
  { label: "분류체계 관리", path: "/admin/taxonomy" },
  { label: "부서/조직 관리", path: "/admin/org" },
  { label: "사용자 관리", path: "/admin/users" },
  { label: "통계", path: "/admin/statistics" },
];

const STATUSES = ["개발 중", "운영 중", "파일럿", "보류", "종료"];
const SYSTEM_TYPES = ["웹 애플리케이션", "모바일 앱", "API/서비스", "데이터 파이프라인", "ML/AI 모델", "배치/스케줄러", "인프라/DevOps 도구", "라이브러리/SDK", "내부 플랫폼", "내부 도구", "기타"];
const DOMAINS = ["마케팅", "영업/CRM", "HR/인사", "재무/회계", "고객 서비스", "제조/생산", "IT 인프라", "데이터/분석", "보안", "내부 도구", "기타"];
const DEPARTMENTS = ["메이크업연구소", "스킨케어연구소", "재무팀", "인사팀", "마케팅팀", "영업팀", "IT인프라팀", "IT개발팀", "품질관리팀", "제조기술팀", "고객서비스팀", "디자인팀", "구매팀", "법무팀"];
const AUDIENCES = ["내부 직원 전체", "특정 부서", "외부 고객", "파트너사", "시스템 간 (내부 API)"];
const STACK_GROUPS: Record<string, string[]> = {
  "언어": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "C#", "Rust"],
  "프레임워크": ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Django", "NestJS", "Flutter", "Three.js"],
  "인프라/클라우드": ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "On-premise"],
  "데이터": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Airflow", "Spark"],
};

type Contact = { name: string; dept: string; role: string; email: string };
type LinkItem = { label: string; url: string };
type ReviewItem = {
  id: string; title: string; summary: string; description: string;
  dept: string; submittedBy: string; submittedAt: string;
  status: string; domain: string[]; domainOther: string; type: string; typeOther: string;
  stack: string[]; audience: string[]; departments: string[];
  integrations: string; freeTags: string;
  contacts: Contact[]; links: LinkItem[];
  approval: "대기" | "승인" | "반려"; rejectionReason?: string;
};

// TODO: 실제 연동 시 GET /api/v1/admin/review-queue 응답으로 교체
const INITIAL_ITEMS: ReviewItem[] = [
  {
    id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼",
    summary: "메이크업연구소 실험 기록을 통합 관리하는 내부 플랫폼",
    description: "현재 메이크업연구소의 실험 데이터는 개인 PC 엑셀 파일에 분산 저장되어 있어 데이터 유실 위험과 협업 어려움이 있습니다.",
    dept: "메이크업연구소", submittedBy: "이수연", submittedAt: "2025.06.01",
    status: "개발 중", domain: ["데이터/분석"], domainOther: "", type: "내부 플랫폼", typeOther: "",
    stack: ["React", "FastAPI", "PostgreSQL", "AWS"],
    audience: ["특정 부서"], departments: ["메이크업연구소", "IT개발팀"],
    integrations: "LIMS", freeTags: "실험데이터, 버전관리, 연구자동화",
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [{ label: "노션 문서", url: "https://notion.so/kolmar/exp-platform" }],
    approval: "대기",
  },
  {
    id: "PRJ-2025-072", title: "구매 발주 자동화 시스템",
    summary: "ERP 연동 기반 구매 발주 프로세스 자동화",
    description: "기존 수기 발주 프로세스를 ERP 데이터 기반으로 자동화하여 발주 오류를 줄이고 처리 시간을 단축합니다.",
    dept: "구매팀", submittedBy: "박성훈", submittedAt: "2025.06.02",
    status: "개발 중", domain: ["재무/회계"], domainOther: "", type: "웹 애플리케이션", typeOther: "",
    stack: ["TypeScript", "NestJS", "PostgreSQL"],
    audience: ["내부 직원 전체"], departments: ["구매팀", "재무팀", "IT개발팀"],
    integrations: "ERP (SAP)", freeTags: "발주, 구매자동화",
    contacts: [{ name: "박성훈", dept: "구매팀", role: "주담당자", email: "sunghoon.park@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
  {
    id: "PRJ-2025-075", title: "현장 안전 점검 체크리스트 앱",
    summary: "생산 현장 안전 점검을 위한 모바일 체크리스트 도구",
    description: "기존 종이 점검표를 대체하여 사진 첨부, 즉시 보고가 가능한 점검 도구를 개발합니다. 시스템 유형과 도메인 모두 표준 분류 외 항목으로 신청됨.",
    dept: "제조기술팀", submittedBy: "윤성민", submittedAt: "2025.06.05",
    status: "개발 중", domain: ["제조/생산", "기타"], domainOther: "현장 안전관리", type: "기타", typeOther: "PWA(프로그레시브 웹 앱)",
    stack: ["React", "Node.js"],
    audience: ["특정 부서"], departments: ["제조기술팀"],
    integrations: "", freeTags: "안전점검, 모바일체크리스트",
    contacts: [{ name: "윤성민", dept: "제조기술팀", role: "주담당자", email: "seongmin.yoon@kolmar.co.kr" }],
    links: [], approval: "대기",
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  paddingRight: 32, cursor: "pointer",
};

const TagSelect = ({ options, selected, onChange, disabled }: { options: string[]; selected: string[]; onChange: (v: string) => void; disabled?: boolean }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map(opt => {
      const isSel = selected.includes(opt);
      return (
        <span key={opt} onClick={() => !disabled && onChange(opt)} style={{
          fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 6,
          border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
          background: isSel ? "#EFF6FF" : "#fff",
          color: isSel ? "#2563EB" : "#475569",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1, userSelect: "none",
        }}>{opt}</span>
      );
    })}
  </div>
);

const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>{title}</div>
    {children}
  </div>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

export default function AdminReview() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState(INITIAL_ITEMS[0]?.id ?? "");
  const [edits, setEdits] = useState<Record<string, Partial<ReviewItem>>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [filter, setFilter] = useState<"전체" | "대기" | "처리완료">("전체");
  const [done, setDone] = useState<string[]>([]);

  const activeItem = items.find(i => i.id === selected);
  const edit = edits[selected] || {};
  const merged = activeItem ? { ...activeItem, ...edit } as ReviewItem : null;
  const isDisabled = done.includes(selected);

  const setEdit = <K extends keyof ReviewItem>(k: K, v: ReviewItem[K]) =>
    setEdits(p => ({ ...p, [selected]: { ...(p[selected] || {}), [k]: v } }));

  const toggleMulti = (k: "domain" | "departments" | "audience" | "stack", v: string) => {
    const cur = (edit[k] ?? merged?.[k] ?? []) as string[];
    setEdit(k, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };

  const handleApprove = () => {
    // TODO: 실제 연동 시 PATCH /api/v1/admin/projects/:id/approve (body: edit)
    setItems(p => p.map(i => i.id === selected ? { ...i, ...edit, approval: "승인" } : i));
    setDone(p => [...p, selected]);
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    // TODO: 실제 연동 시 PATCH /api/v1/admin/projects/:id/reject (body: { reason: rejectReason })
    setItems(p => p.map(i => i.id === selected ? { ...i, approval: "반려", rejectionReason: rejectReason } : i));
    setDone(p => [...p, selected]);
    setRejectOpen(false);
    setRejectReason("");
    const remaining = items.filter(i => !done.includes(i.id) && i.id !== selected);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  const pendingItems = items.filter(i => !done.includes(i.id));
  const filteredList = filter === "전체" ? items
    : filter === "처리완료" ? items.filter(i => done.includes(i.id))
    : items.filter(i => !done.includes(i.id));

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>KOLMAR</span>
          <span style={{ fontWeight: 500, fontSize: 12, color: "#94A3B8" }}>Tech Hub</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: 20 }}>관리자</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>김</div>
        </div>
      </nav>

      <div style={{ display: "flex" }}>

        <aside style={{ width: 200, flexShrink: 0, background: "#fff", borderRight: "1px solid #E2E8F0", padding: "20px 12px", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, padding: "0 8px" }}>관리자 메뉴</div>
          {ADMIN_NAV.map(n => (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: "8px 10px", borderRadius: 7, cursor: "pointer",
              fontSize: 13, fontWeight: n.path === "/admin/review" ? 700 : 500,
              color: n.path === "/admin/review" ? "#2563EB" : "#475569",
              background: n.path === "/admin/review" ? "#EFF6FF" : "transparent",
              marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              {n.label}
              {n.path === "/admin/review" && pendingItems.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: "#EF4444", color: "#fff", padding: "1px 6px", borderRadius: 20 }}>{pendingItems.length}</span>
              )}
            </div>
          ))}
        </aside>

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>등록 신청 목록</div>
              <div style={{ display: "flex", gap: 4 }}>
                {(["전체", "대기", "처리완료"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, border: "none",
                    background: filter === f ? "#0F172A" : "#F1F5F9",
                    color: filter === f ? "#fff" : "#64748B",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredList.map(item => {
                const isDone = done.includes(item.id);
                const isSelected = selected === item.id;
                return (
                  <div key={item.id} onClick={() => setSelected(item.id)} style={{
                    padding: "12px 14px", cursor: "pointer",
                    background: isSelected ? "#EFF6FF" : "transparent",
                    borderBottom: "1px solid #F8FAFC",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.dept} · {item.submittedAt}</div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, flexShrink: 0, alignSelf: "flex-start",
                        padding: "2px 7px", borderRadius: 20,
                        background: isDone ? (item.approval === "승인" ? "#D1FAE5" : "#FEE2E2") : "#FEF3C7",
                        color: isDone ? (item.approval === "승인" ? "#065F46" : "#991B1B") : "#92400E",
                      }}>
                        {isDone ? item.approval : "대기"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {merged && (
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: "monospace", marginBottom: 4 }}>{merged.id}</div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{merged.title}</h2>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                    신청자: <strong>{merged.submittedBy}</strong> · {merged.dept} · {merged.submittedAt}
                  </div>
                </div>
                {!isDisabled ? (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setRejectOpen(v => !v)} style={{
                      background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7,
                      padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#EF4444", cursor: "pointer",
                    }}>반려</button>
                    <button onClick={handleApprove} style={{
                      background: "#059669", border: "none", borderRadius: 7,
                      padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
                    }}>승인</button>
                  </div>
                ) : (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 20,
                    background: merged.approval === "승인" ? "#D1FAE5" : "#FEE2E2",
                    color: merged.approval === "승인" ? "#065F46" : "#991B1B",
                  }}>
                    {merged.approval === "승인" ? "승인 완료" : "반려 완료"}
                  </span>
                )}
              </div>

              {rejectOpen && !isDisabled && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>반려 사유 입력</div>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="신청자에게 전달될 반려 사유를 구체적으로 작성해 주세요."
                    style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.6, background: "#fff", border: "1.5px solid #FECACA" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => { setRejectOpen(false); setRejectReason(""); }} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                    <button onClick={handleReject} style={{
                      background: "#EF4444", border: "none", borderRadius: 6,
                      padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff",
                      cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                      opacity: rejectReason.trim() ? 1 : 0.4,
                    }}>반려 확정</button>
                  </div>
                </div>
              )}

              {!isDisabled && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#92400E" }}>
                  내용을 직접 수정한 후 승인할 수 있습니다. 수정된 내용이 최종 게시됩니다.
                </div>
              )}

              <SectionBlock title="기본 정보">
                <FieldRow label="프로젝트명">
                  <input value={edit.title ?? merged.title} onChange={e => setEdit("title", e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                </FieldRow>
                <FieldRow label="한 줄 요약">
                  <input value={edit.summary ?? merged.summary} onChange={e => setEdit("summary", e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                </FieldRow>
                <FieldRow label="상세 설명">
                  <textarea value={edit.description ?? merged.description} onChange={e => setEdit("description", e.target.value)} disabled={isDisabled} style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.7, opacity: isDisabled ? 0.6 : 1 }} />
                </FieldRow>
              </SectionBlock>

              <SectionBlock title="분류 정보">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <FieldRow label="프로젝트 상태">
                    <select value={edit.status ?? merged.status} onChange={e => setEdit("status", e.target.value)} disabled={isDisabled} style={{ ...selectStyle, opacity: isDisabled ? 0.6 : 1 }}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </FieldRow>
                  <FieldRow label="시스템 유형">
                    <select value={edit.type ?? merged.type} onChange={e => setEdit("type", e.target.value)} disabled={isDisabled} style={{ ...selectStyle, opacity: isDisabled ? 0.6 : 1 }}>
                      {SYSTEM_TYPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {(edit.type ?? merged.type) === "기타" && (
                      <input
                        value={edit.typeOther ?? merged.typeOther}
                        onChange={e => setEdit("typeOther", e.target.value)}
                        disabled={isDisabled}
                        placeholder="신청자가 입력한 기타 시스템 유형"
                        style={{ ...inputStyle, marginTop: 8, opacity: isDisabled ? 0.6 : 1, borderColor: "#BFDBFE", background: "#EFF6FF" }}
                      />
                    )}
                  </FieldRow>
                </div>

                <FieldRow label="비즈니스 도메인">
                  <TagSelect options={DOMAINS} selected={(edit.domain ?? merged.domain) as string[]} onChange={v => toggleMulti("domain", v)} disabled={isDisabled} />
                  {(edit.domain ?? merged.domain).includes("기타") && (
                    <input
                      value={edit.domainOther ?? merged.domainOther}
                      onChange={e => setEdit("domainOther", e.target.value)}
                      disabled={isDisabled}
                      placeholder="신청자가 입력한 기타 도메인"
                      style={{ ...inputStyle, marginTop: 8, opacity: isDisabled ? 0.6 : 1, borderColor: "#BFDBFE", background: "#EFF6FF" }}
                    />
                  )}
                </FieldRow>
                <FieldRow label="참여 부서">
                  <TagSelect options={DEPARTMENTS} selected={(edit.departments ?? merged.departments) as string[]} onChange={v => toggleMulti("departments", v)} disabled={isDisabled} />
                </FieldRow>
                <FieldRow label="사용 대상">
                  <TagSelect options={AUDIENCES} selected={(edit.audience ?? merged.audience) as string[]} onChange={v => toggleMulti("audience", v)} disabled={isDisabled} />
                </FieldRow>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                  <FieldRow label="연동 시스템">
                    <input value={edit.integrations ?? merged.integrations} onChange={e => setEdit("integrations", e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                  </FieldRow>
                  <FieldRow label="자유 태그">
                    <input value={edit.freeTags ?? merged.freeTags} onChange={e => setEdit("freeTags", e.target.value)} disabled={isDisabled} style={{ ...inputStyle, opacity: isDisabled ? 0.6 : 1 }} />
                  </FieldRow>
                </div>
              </SectionBlock>

              <SectionBlock title="기술 스택">
                {Object.entries(STACK_GROUPS).map(([group, stackItems]) => (
                  <FieldRow key={group} label={group}>
                    <TagSelect options={stackItems} selected={(edit.stack ?? merged.stack) as string[]} onChange={v => toggleMulti("stack", v)} disabled={isDisabled} />
                  </FieldRow>
                ))}
              </SectionBlock>

              <SectionBlock title="담당자">
                {merged.contacts.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>· {c.dept}</span></div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.email}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>{c.role}</span>
                  </div>
                ))}
              </SectionBlock>

              {merged.links.length > 0 && (
                <SectionBlock title="문서 및 링크">
                  {merged.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB", display: "block", marginBottom: 6, textDecoration: "none" }}>
                      {l.label}
                    </a>
                  ))}
                </SectionBlock>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}