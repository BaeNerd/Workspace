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
const AUDIENCES = ["내부 직원 전체", "특정 부서", "외부 고객", "파트너사", "시스템 간 (내부 API)"];
const STACK_GROUPS: Record<string, string[]> = {
  "언어": ["Python", "JavaScript", "TypeScript", "Java", "Go", "Kotlin", "Swift", "C#", "Rust"],
  "프레임워크": ["React", "Next.js", "Vue", "Spring Boot", "FastAPI", "Django", "NestJS", "Flutter", "Three.js"],
  "인프라/클라우드": ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "On-premise"],
  "데이터": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Airflow", "Spark"],
};

// TODO: 실제 연동 시 GET /api/v1/admin/companies?visible=true 응답으로 교체
const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스" }, { code: "KKM", name: "한국콜마" },
  { code: "KBH", name: "콜마비앤에이치" }, { code: "HC", name: "콜마생활건강" },
  { code: "KMG", name: "콜마글로벌" }, { code: "KMW", name: "무석콜마" },
  { code: "KUS", name: "미국콜마" },
];

// TODO: 실제 연동 시 GET /api/v1/admin/departments?company=:code 응답으로 교체
const PARENTS_BY_COMPANY: Record<string, string[]> = {
  KKM: ["연구개발본부", "IT본부", "경영지원본부", "영업마케팅본부", "생산본부"],
  KBH: ["연구개발본부", "경영지원본부"],
  KMG: ["영업마케팅본부", "경영지원본부"],
  KMW: ["생산본부"],
};

// TODO: 실제 연동 시 GET /api/v1/admin/departments?company=:code&parent=:parent 응답으로 교체
const DEPTS_BY_PARENT: Record<string, string[]> = {
  "연구개발본부": ["메이크업연구소", "스킨케어연구소", "헬스케어연구소"],
  "IT본부": ["IT개발팀", "IT인프라팀"],
  "경영지원본부": ["재무팀", "인사팀", "사업기획팀", "구매팀", "법무팀"],
  "영업마케팅본부": ["마케팅팀", "영업팀", "글로벌사업팀"],
  "생산본부": ["품질관리팀", "제조기술팀", "생산관리팀"],
};

const NO_PARENT = "본부 없음 (관계사 직속)";

type Contact = { name: string; dept: string; role: string; email: string };
type OrgEntry = { id: number; company: string; parent: string | null; dept: string | null };
type ProjectItem = {
  id: string; title: string; dept: string; status: string;
  domain: string[]; domainOther: string; type: string; typeOther: string;
  stack: string[]; audience: string[];
  orgEntries: OrgEntry[]; integrations: string; freeTags: string;
  summary: string; description: string; contacts: Contact[];
  links: { label: string; url: string }[]; updatedAt: string;
};

let orgEntryIdSeq = 2000;

const orgEntryDisplay = (e: OrgEntry) => {
  const companyName = COMPANIES.find(c => c.code === e.company)?.name ?? e.company;
  if (!e.parent) return companyName;
  if (!e.dept) return `${companyName} > ${e.parent}`;
  return `${companyName} > ${e.parent} > ${e.dept}`;
};

// TODO: 실제 연동 시 GET /api/v1/admin/projects 응답으로 교체
const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "PRJ-2025-041", title: "조색 예측 ML 모델", dept: "메이크업연구소", status: "개발 중",
    domain: ["제조/생산"], domainOther: "", type: "ML/AI 모델", typeOther: "",
    stack: ["Python", "TensorFlow", "AWS"], audience: ["특정 부서"],
    orgEntries: [
      { id: 1, company: "KKM", parent: "연구개발본부", dept: "메이크업연구소" },
      { id: 2, company: "KKM", parent: "IT본부", dept: "IT개발팀" },
    ],
    integrations: "ERP, LIMS", freeTags: "Lab색공간, 조색",
    summary: "원료 배합 데이터 기반 색상 사전 예측 ML 모델",
    description: "원료 구성과 배합 비율을 입력하면 예상 색상값(Lab 좌표)을 자동으로 예측합니다.",
    contacts: [{ name: "이수연", dept: "메이크업연구소", role: "주담당자", email: "suyeon.lee@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.01",
  },
  {
    id: "PRJ-2025-038", title: "통합 정산 자동화 시스템", dept: "재무팀", status: "운영 중",
    domain: ["재무/회계"], domainOther: "", type: "데이터 파이프라인", typeOther: "",
    stack: ["Python", "Airflow", "PostgreSQL"], audience: ["내부 직원 전체"],
    orgEntries: [
      { id: 3, company: "KKM", parent: "경영지원본부", dept: "재무팀" },
      { id: 4, company: "KKM", parent: "IT본부", dept: "IT개발팀" },
    ],
    integrations: "ERP (SAP)", freeTags: "정산, 자동화",
    summary: "ERP 연동 기반 월말 정산 자동화",
    description: "SAP ERP 데이터를 기반으로 월말 정산 프로세스를 자동화합니다.",
    contacts: [{ name: "김재원", dept: "재무팀", role: "주담당자", email: "jaewon.kim@kolmar.co.kr" }],
    links: [], updatedAt: "2025.05.12",
  },
  {
    id: "PRJ-2025-045", title: "HR 온보딩 자동화 포털", dept: "인사팀", status: "파일럿",
    domain: ["HR/인사"], domainOther: "", type: "웹 애플리케이션", typeOther: "",
    stack: ["React", "Spring Boot"], audience: ["내부 직원 전체"],
    orgEntries: [
      { id: 5, company: "KKM", parent: "경영지원본부", dept: "인사팀" },
      { id: 6, company: "KKM", parent: "IT본부", dept: "IT개발팀" },
    ],
    integrations: "", freeTags: "온보딩, HR",
    summary: "신규 입사자 온보딩 자동화 포털",
    description: "신규 입사자의 온보딩 절차를 디지털화합니다.",
    contacts: [{ name: "박지현", dept: "인사팀", role: "주담당자", email: "jihyun.park@kolmar.co.kr" }],
    links: [], updatedAt: "2025.04.30",
  },
  {
    id: "PRJ-2025-075", title: "현장 안전 점검 체크리스트 앱", dept: "제조기술팀", status: "개발 중",
    domain: ["제조/생산", "기타"], domainOther: "현장 안전관리", type: "기타", typeOther: "PWA(프로그레시브 웹 앱)",
    stack: ["React", "Node.js"], audience: ["특정 부서"],
    orgEntries: [
      { id: 7, company: "KKM", parent: "생산본부", dept: "제조기술팀" },
    ],
    integrations: "", freeTags: "안전점검, 모바일체크리스트",
    summary: "생산 현장 안전 점검을 위한 모바일 체크리스트 도구",
    description: "기존 종이 점검표를 대체하여 사진 첨부, 즉시 보고가 가능한 점검 도구입니다.",
    contacts: [{ name: "윤성민", dept: "제조기술팀", role: "주담당자", email: "seongmin.yoon@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.05",
  },
  {
    // 그룹/본부 단위 프로젝트 예시 — 부서까지 선택하지 않은 케이스
    id: "PRJ-2025-080", title: "그룹 통합 ERP 고도화", dept: "그룹IT전략팀", status: "운영 중",
    domain: ["IT 인프라"], domainOther: "", type: "API/서비스", typeOther: "",
    stack: ["Java", "Spring Boot", "Oracle"], audience: ["내부 직원 전체"],
    orgEntries: [
      { id: 8, company: "KMH", parent: null, dept: null }, // 관계사만 — 그룹 차원
      { id: 9, company: "KMG", parent: "경영지원본부", dept: null }, // 본부까지만
    ],
    integrations: "ERP (Oracle EBS)", freeTags: "그룹ERP, 통합",
    summary: "그룹 공통 ERP 모듈 고도화 프로젝트",
    description: "콜마홀딩스 및 콜마글로벌 경영지원본부 공동으로 ERP 시스템을 고도화합니다.",
    contacts: [{ name: "최지훈", dept: "그룹IT전략팀", role: "주담당자", email: "jihoon.choi@kolmar.co.kr" }],
    links: [], updatedAt: "2025.06.03",
  },
];

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", fontSize: 13, color: "#0F172A",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 7, outline: "none", fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, cursor: "pointer",
};

const TagSelect = ({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string) => void }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map(opt => {
      const isSel = selected.includes(opt);
      return (
        <span key={opt} onClick={() => onChange(opt)} style={{
          fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
          border: `1.5px solid ${isSel ? "#2563EB" : "#E2E8F0"}`,
          background: isSel ? "#EFF6FF" : "#fff",
          color: isSel ? "#2563EB" : "#475569",
          cursor: "pointer", userSelect: "none",
        }}>{opt}</span>
      );
    })}
  </div>
);

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

const EMPTY: ProjectItem = {
  id: "", title: "", summary: "", description: "", status: "개발 중",
  type: "웹 애플리케이션", typeOther: "", domain: [], domainOther: "",
  stack: [], audience: [], orgEntries: [], integrations: "", freeTags: "",
  contacts: [{ name: "", dept: "", role: "주담당자", email: "" }], links: [], dept: "", updatedAt: "",
};

export default function AdminProjectManage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [selected, setSelected] = useState(INITIAL_PROJECTS[0]?.id ?? "");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<ProjectItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [saved, setSaved] = useState(false);

  // 조직 항목 추가용 임시 선택 상태
  const [draftCompany, setDraftCompany] = useState(COMPANIES[1].code);
  const [draftParent, setDraftParent] = useState(NO_PARENT);
  const [draftDept, setDraftDept] = useState("");

  const filtered = projects.filter(p =>
    (filterStatus === "전체" || p.status === filterStatus) &&
    (search === "" || p.title.includes(search) || p.dept.includes(search))
  );

  const activeProject = isNew ? editData : projects.find(p => p.id === selected) ?? null;
  const displayData = editMode || isNew ? editData : activeProject;
  const isEditing = editMode || isNew;

  const startEdit = () => { if (activeProject) { setEditData({ ...activeProject }); setEditMode(true); setSaved(false); } };
  const startNew = () => { setEditData({ ...EMPTY, id: `PRJ-2025-0${Math.floor(Math.random() * 90 + 10)}` }); setIsNew(true); setEditMode(false); setSaved(false); };
  const cancelEdit = () => { setEditMode(false); setIsNew(false); setEditData(null); setSaved(false); };

  const setF = <K extends keyof ProjectItem>(k: K, v: ProjectItem[K]) => setEditData(p => p ? { ...p, [k]: v } : p);
  const toggleMulti = (k: "domain" | "stack" | "audience", v: string) =>
    setEditData(p => p ? { ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] } : p);

  // 조직 항목 추가/삭제
  const addOrgEntry = () => {
    if (!editData) return;
    const newEntry: OrgEntry = {
      id: orgEntryIdSeq++,
      company: draftCompany,
      parent: draftParent === NO_PARENT ? null : draftParent,
      dept: draftDept || null,
    };
    const isDuplicate = editData.orgEntries.some(e => e.company === newEntry.company && e.parent === newEntry.parent && e.dept === newEntry.dept);
    if (isDuplicate) return;
    setF("orgEntries", [...editData.orgEntries, newEntry]);
    setDraftParent(NO_PARENT);
    setDraftDept("");
  };

  const removeOrgEntry = (id: number) => {
    if (!editData) return;
    setF("orgEntries", editData.orgEntries.filter(e => e.id !== id));
  };

  const availableParents = PARENTS_BY_COMPANY[draftCompany] ?? [];
  const availableDepts = draftParent !== NO_PARENT ? (DEPTS_BY_PARENT[draftParent] ?? []) : [];

  const handleSave = () => {
    if (!editData) return;
    // TODO: 실제 연동 시 isNew → POST /api/v1/admin/projects, 아니면 PUT /api/v1/admin/projects/:id
    if (isNew) {
      setProjects(p => [{ ...editData, updatedAt: "2025.06.05" }, ...p]);
      setSelected(editData.id);
    } else {
      setProjects(p => p.map(proj => proj.id === editData.id ? { ...editData, updatedAt: "2025.06.05" } : proj));
    }
    setEditMode(false); setIsNew(false); setEditData(null); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id: string) => {
    // TODO: 실제 연동 시 DELETE /api/v1/admin/projects/:id
    setProjects(p => p.filter(proj => proj.id !== id));
    setDeleteConfirm(null);
    const remaining = projects.filter(p => p.id !== id);
    if (remaining.length > 0) setSelected(remaining[0].id);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
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
              padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
              fontSize: 13, fontWeight: n.path === "/admin/projects" ? 700 : 500,
              color: n.path === "/admin/projects" ? "#2563EB" : "#475569",
              background: n.path === "/admin/projects" ? "#EFF6FF" : "transparent",
            }}>{n.label}</div>
          ))}
        </aside>

        <main style={{ flex: 1, display: "flex", minWidth: 0, minHeight: "calc(100vh - 56px)" }}>

          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>전체 프로젝트 <span style={{ color: "#94A3B8", fontWeight: 500 }}>{projects.length}</span></span>
                <button onClick={startNew} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ 직접 등록</button>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="프로젝트명, 부서 검색" style={{ ...inputStyle, padding: "7px 12px", fontSize: 12, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["전체", ...STATUSES].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: "3px 9px", borderRadius: 20, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer",
                    background: filterStatus === s ? "#0F172A" : "#F1F5F9",
                    color: filterStatus === s ? "#fff" : "#64748B",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map(p => {
                const isSel = selected === p.id && !isNew;
                const sc = STATUS_COLOR[p.status];
                return (
                  <div key={p.id} onClick={() => { setSelected(p.id); setEditMode(false); setIsNew(false); setEditData(null); }} style={{
                    padding: "11px 14px", cursor: "pointer",
                    background: isSel ? "#EFF6FF" : "transparent",
                    borderBottom: "1px solid #F8FAFC",
                    borderLeft: isSel ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 5 }}>{p.dept} · {p.updatedAt}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: sc?.bg, color: sc?.color }}>{p.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {saved && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#065F46" }}>
                저장이 완료되었습니다.
              </div>
            )}

            {displayData && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: "monospace", marginBottom: 4 }}>{displayData.id}</div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                      {isEditing ? (
                        <input value={displayData.title} onChange={e => setF("title", e.target.value)} placeholder="프로젝트명 입력"
                          style={{ ...inputStyle, fontSize: 17, fontWeight: 800, padding: "6px 10px" }} />
                      ) : displayData.title}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {!isEditing ? (
                      <>
                        <button onClick={startEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>수정</button>
                        <button onClick={() => setDeleteConfirm(displayData.id)} style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer" }}>삭제</button>
                      </>
                    ) : (
                      <>
                        <button onClick={cancelEdit} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>취소</button>
                        <button onClick={handleSave} style={{ background: "#2563EB", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>저장</button>
                      </>
                    )}
                  </div>
                </div>

                {deleteConfirm === displayData.id && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>프로젝트를 삭제하시겠습니까?</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>삭제된 프로젝트는 복구할 수 없습니다.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleDelete(displayData.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}

                <SectionBlock title="기본 정보">
                  <FieldRow label="한 줄 요약">
                    {isEditing
                      ? <input value={displayData.summary} onChange={e => setF("summary", e.target.value)} style={inputStyle} />
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{displayData.summary}</div>}
                  </FieldRow>
                  <FieldRow label="상세 설명">
                    {isEditing
                      ? <textarea value={displayData.description} onChange={e => setF("description", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.7 }} />
                      : <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8 }}>{displayData.description}</div>}
                  </FieldRow>
                </SectionBlock>

                <SectionBlock title="분류 정보">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <FieldRow label="프로젝트 상태">
                      {isEditing
                        ? <select value={displayData.status} onChange={e => setF("status", e.target.value)} style={selectStyle}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                        : <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_COLOR[displayData.status]?.bg, color: STATUS_COLOR[displayData.status]?.color }}>{displayData.status}</span>}
                    </FieldRow>
                    <FieldRow label="시스템 유형">
                      {isEditing
                        ? (
                          <>
                            <select value={displayData.type} onChange={e => setF("type", e.target.value)} style={selectStyle}>{SYSTEM_TYPES.map(s => <option key={s}>{s}</option>)}</select>
                            {displayData.type === "기타" && (
                              <input value={displayData.typeOther} onChange={e => setF("typeOther", e.target.value)}
                                placeholder="기타 시스템 유형 입력" style={{ ...inputStyle, marginTop: 8, borderColor: "#BFDBFE", background: "#EFF6FF" }} />
                            )}
                          </>
                        )
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.type === "기타" && displayData.typeOther ? `기타 (${displayData.typeOther})` : displayData.type}</span>}
                    </FieldRow>
                  </div>
                  <FieldRow label="비즈니스 도메인">
                    {isEditing
                      ? (
                        <>
                          <TagSelect options={DOMAINS} selected={displayData.domain} onChange={v => toggleMulti("domain", v)} />
                          {displayData.domain.includes("기타") && (
                            <input value={displayData.domainOther} onChange={e => setF("domainOther", e.target.value)}
                              placeholder="기타 비즈니스 도메인 입력" style={{ ...inputStyle, marginTop: 8, borderColor: "#BFDBFE", background: "#EFF6FF" }} />
                          )}
                        </>
                      )
                      : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.domain.map((d, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{d === "기타" && displayData.domainOther ? `기타 (${displayData.domainOther})` : d}</span>)}</div>}
                  </FieldRow>

                  {/* ===== 참여 부서 → 관계사/본부/부서 계층 선택 (변경된 부분) ===== */}
                  <FieldRow label="참여 관계사 / 본부 / 부서">
                    {displayData.orgEntries.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: isEditing ? 10 : 0 }}>
                        {displayData.orgEntries.map(e => (
                          isEditing ? (
                            <div key={e.id} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6,
                              padding: "7px 11px",
                            }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF" }}>{orgEntryDisplay(e)}</span>
                              <button onClick={() => removeOrgEntry(e.id)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                            </div>
                          ) : (
                            <span key={e.id} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6, display: "inline-block", marginRight: 6, marginBottom: 6 }}>
                              {orgEntryDisplay(e)}
                            </span>
                          )
                        ))}
                      </div>
                    )}

                    {isEditing && (
                      <div style={{ background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 7, padding: "12px 14px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                          <select value={draftCompany} onChange={e => { setDraftCompany(e.target.value); setDraftParent(NO_PARENT); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                            {COMPANIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                          </select>
                          <select value={draftParent} onChange={e => { setDraftParent(e.target.value); setDraftDept(""); }} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px" }}>
                            <option value={NO_PARENT}>본부 없음</option>
                            {availableParents.map(p => <option key={p}>{p}</option>)}
                          </select>
                          <select value={draftDept} onChange={e => setDraftDept(e.target.value)} disabled={draftParent === NO_PARENT} style={{ ...selectStyle, fontSize: 11, padding: "7px 26px 7px 8px", opacity: draftParent === NO_PARENT ? 0.5 : 1 }}>
                            <option value="">부서 선택 안 함</option>
                            {availableDepts.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <button onClick={addOrgEntry} style={{ width: "100%", background: "#2563EB", color: "#fff", border: "none", borderRadius: 5, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          + 추가
                        </button>
                      </div>
                    )}

                    {!isEditing && displayData.orgEntries.length === 0 && (
                      <span style={{ fontSize: 13, color: "#94A3B8" }}>—</span>
                    )}
                  </FieldRow>

                  <FieldRow label="사용 대상">
                    {isEditing
                      ? <TagSelect options={AUDIENCES} selected={displayData.audience} onChange={v => toggleMulti("audience", v)} />
                      : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{displayData.audience.map((a, i) => <span key={i} style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 6 }}>{a}</span>)}</div>}
                  </FieldRow>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FieldRow label="연동 시스템">
                      {isEditing
                        ? <input value={displayData.integrations} onChange={e => setF("integrations", e.target.value)} style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.integrations || "—"}</span>}
                    </FieldRow>
                    <FieldRow label="자유 태그">
                      {isEditing
                        ? <input value={displayData.freeTags} onChange={e => setF("freeTags", e.target.value)} style={inputStyle} />
                        : <span style={{ fontSize: 13, color: "#334155" }}>{displayData.freeTags || "—"}</span>}
                    </FieldRow>
                  </div>
                </SectionBlock>

                <SectionBlock title="기술 스택">
                  {isEditing
                    ? Object.entries(STACK_GROUPS).map(([group, stackItems]) => (
                        <FieldRow key={group} label={group}>
                          <TagSelect options={stackItems} selected={displayData.stack} onChange={v => toggleMulti("stack", v)} />
                        </FieldRow>
                      ))
                    : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {displayData.stack.map((s, i) => (
                          <span key={i} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1E40AF", padding: "4px 10px", borderRadius: 6, border: "1px solid #BFDBFE" }}>{s}</span>
                        ))}
                      </div>}
                </SectionBlock>

                <SectionBlock title="담당자">
                  {displayData.contacts.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F172A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {c.name ? c.name[0] : "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.name} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>· {c.dept}</span></div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.email}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#0F172A", color: "#fff", padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{c.role}</span>
                    </div>
                  ))}
                </SectionBlock>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}