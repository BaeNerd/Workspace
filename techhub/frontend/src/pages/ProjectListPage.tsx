import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

// TODO: 실제 연동 시 GET /api/v1/admin/companies 응답으로 교체
// visible: false인 관계사는 그룹 전체보기 권한이 없는 사용자에게는 필터 옵션 자체에서 제외
const COMPANIES = [
  { code: "KMH", name: "콜마홀딩스", visible: true },
  { code: "KKM", name: "한국콜마", visible: true },
  { code: "KBH", name: "콜마비앤에이치", visible: true },
  { code: "HC", name: "콜마생활건강", visible: true },
  { code: "KMG", name: "콜마글로벌", visible: true },
  { code: "KMSK", name: "콜마스크", visible: true },
  { code: "KMW", name: "무석콜마", visible: true },
  { code: "KMB", name: "북경콜마", visible: true },
  { code: "KUS", name: "미국콜마", visible: true },
  { code: "KBT", name: "콜마바이오텍", visible: true },
  { code: "KAF", name: "근오농림", visible: false },
  { code: "NAB", name: "넥스트앤바이오", visible: false },
  { code: "HNG", name: "에치엔지", visible: false },
];

type OrgEntry = { id: number; company: string; parent: string | null; dept: string | null };

const orgEntryDisplay = (e: OrgEntry) => {
  const companyName = COMPANIES.find(c => c.code === e.company)?.name ?? e.company;
  if (!e.parent) return companyName;
  if (!e.dept) return `${companyName} > ${e.parent}`;
  return `${companyName} > ${e.parent} > ${e.dept}`;
};

// TODO: 실제 연동 시 GET /api/v1/projects 응답으로 교체
type Project = {
  id: string;
  title: string;
  dept: string;
  stack: string[];
  status: string;
  domain: string;
  type: string;
  updated: string;
  orgEntries: OrgEntry[];
};

const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-2025-038", title: "통합 정산 자동화 시스템", dept: "재무팀", stack: ["Python", "Airflow", "PostgreSQL"], status: "운영 중", domain: "재무/회계", type: "데이터 파이프라인", updated: "2025.05.12", orgEntries: [{ id: 1, company: "KKM", parent: "경영지원본부", dept: "재무팀" }] },
  { id: "PRJ-2025-070", title: "고객 문의 분류 ML 모델", dept: "고객서비스팀", stack: ["Python", "FastAPI", "AWS"], status: "개발 중", domain: "고객 서비스", type: "ML/AI 모델", updated: "2025.05.28", orgEntries: [{ id: 2, company: "KKM", parent: "영업마케팅본부", dept: "고객서비스팀" }] },
  { id: "PRJ-2025-041", title: "조색 예측 ML 모델", dept: "메이크업연구소", stack: ["Python", "TensorFlow", "AWS"], status: "개발 중", domain: "제조/생산", type: "ML/AI 모델", updated: "2025.06.01", orgEntries: [{ id: 3, company: "KKM", parent: "연구개발본부", dept: "메이크업연구소" }] },
  { id: "PRJ-2025-045", title: "HR 온보딩 자동화 포털", dept: "인사팀", stack: ["React", "Spring Boot"], status: "파일럿", domain: "HR/인사", type: "웹 애플리케이션", updated: "2025.04.30", orgEntries: [{ id: 4, company: "KKM", parent: "경영지원본부", dept: "인사팀" }] },
  { id: "PRJ-2025-052", title: "내부 API Gateway 구축", dept: "IT인프라팀", stack: ["Go", "Kubernetes", "AWS"], status: "운영 중", domain: "IT 인프라", type: "API/서비스", updated: "2025.03.18", orgEntries: [{ id: 5, company: "KKM", parent: "IT본부", dept: "IT인프라팀" }] },
  { id: "PRJ-2025-063", title: "영업 CRM 고도화", dept: "영업팀", stack: ["TypeScript", "NestJS", "PostgreSQL"], status: "개발 중", domain: "영업/CRM", type: "웹 애플리케이션", updated: "2025.06.03", orgEntries: [{ id: 6, company: "KKM", parent: "영업마케팅본부", dept: "영업팀" }] },
  { id: "PRJ-2025-056", title: "생산 공정 이상 감지 시스템", dept: "제조기술팀", stack: ["Python", "TensorFlow", "Kafka"], status: "운영 중", domain: "제조/생산", type: "ML/AI 모델", updated: "2025.02.14", orgEntries: [{ id: 7, company: "KKM", parent: "생산본부", dept: "제조기술팀" }] },
  { id: "PRJ-2025-033", title: "전사 통합 알림 플랫폼", dept: "IT인프라팀", stack: ["Node.js", "Redis", "AWS"], status: "운영 중", domain: "IT 인프라", type: "API/서비스", updated: "2025.01.22", orgEntries: [{ id: 8, company: "KMH", parent: null, dept: null }] },
  { id: "PRJ-2025-058", title: "원료 입고 품질 검사 자동화", dept: "품질관리팀", stack: ["Python", "FastAPI", "PostgreSQL"], status: "파일럿", domain: "제조/생산", type: "웹 애플리케이션", updated: "2025.05.09", orgEntries: [{ id: 9, company: "KKM", parent: "생산본부", dept: "품질관리팀" }] },
  { id: "PRJ-2025-049", title: "마케팅 캠페인 성과 분석 대시보드", dept: "마케팅팀", stack: ["React", "Python", "BigQuery"], status: "운영 중", domain: "마케팅", type: "웹 애플리케이션", updated: "2025.04.07", orgEntries: [{ id: 10, company: "KMG", parent: "영업마케팅본부", dept: null }] },
  { id: "PRJ-2025-027", title: "용기 3D 렌더링 자동화 도구", dept: "디자인팀", stack: ["Python", "Blender API", "AWS"], status: "보류", domain: "제조/생산", type: "내부 도구", updated: "2025.03.01", orgEntries: [{ id: 11, company: "KKM", parent: "연구개발본부", dept: "디자인팀" }] },
  { id: "PRJ-2025-044", title: "원가 분석 리포팅 자동화", dept: "재무팀", stack: ["Python", "Airflow", "Tableau"], status: "운영 중", domain: "재무/회계", type: "데이터 파이프라인", updated: "2025.04.20", orgEntries: [{ id: 12, company: "KKM", parent: "경영지원본부", dept: "재무팀" }] },
  // 비노출 관계사 프로젝트 — 그룹 전체보기 권한자에게만 보여야 함
  { id: "PRJ-2025-090", title: "친환경 원료 추적 시스템", dept: "품질관리팀", stack: ["Python", "PostgreSQL"], status: "개발 중", domain: "제조/생산", type: "데이터 파이프라인", updated: "2025.06.10", orgEntries: [{ id: 13, company: "KAF", parent: null, dept: null }] },
];

const DOMAINS = ["전체", "재무/회계", "고객 서비스", "제조/생산", "HR/인사", "IT 인프라", "영업/CRM", "마케팅"];
const STATUSES = ["전체", "운영 중", "개발 중", "파일럿", "종료", "보류"];
const TYPES = ["전체", "웹 애플리케이션", "ML/AI 모델", "데이터 파이프라인", "API/서비스", "내부 도구"];
const SORT_OPTIONS = ["최신순", "이름순", "부서순"] as const;

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGroupViewer } = useAuth(); // user.company: 로그인 사용자의 소속 관계사 코드 (예: "KKM")

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [domain, setDomain] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [type, setType] = useState("전체");
  // 관계사 필터: 일반 사용자는 본인 소속 관계사로 기본 시작, 그룹 전체보기 권한자는 "전체"로 시작
  const [company, setCompany] = useState<string>(() => (isGroupViewer ? "전체" : (user?.company ?? "전체")));
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [hovered, setHovered] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // TODO: 실제 연동 시 아래를 API 호출로 교체 (서버에서도 동일한 권한 필터링을 반드시 재검증해야 함)
  // const [projects, setProjects] = useState<Project[]>([]);
  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_API_URL}/api/v1/projects`)
  //     .then(res => res.json())
  //     .then(setProjects);
  // }, []);
  const projects = MOCK_PROJECTS;

  // 필터 옵션에 노출할 관계사 목록: 그룹 전체보기 권한자는 전체, 아니면 visible=true만
  const availableCompanies = useMemo(
    () => isGroupViewer ? COMPANIES : COMPANIES.filter(c => c.visible),
    [isGroupViewer]
  );

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  const filtered = useMemo(() => {
    return projects
      .filter(p => {
        // 1) 권한 기반 노출 제어: 비노출 관계사 프로젝트는 그룹 전체보기 권한이 없으면 제외
        const projectCompanies = p.orgEntries.map(e => e.company);
        const hasNonVisible = projectCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
        if (hasNonVisible && !isGroupViewer) return false;

        // 2) 관계사 필터
        if (company !== "전체" && !projectCompanies.includes(company)) return false;

        // 3) 기존 필터
        return (search === "" ||
          p.title.includes(search) ||
          p.stack.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
          p.dept.includes(search)) &&
          (domain === "전체" || p.domain === domain) &&
          (status === "전체" || p.status === status) &&
          (type === "전체" || p.type === type);
      })
      .sort((a, b) => {
        if (sort === "최신순") return new Date(b.updated.replace(/\./g, "-")).getTime() - new Date(a.updated.replace(/\./g, "-")).getTime();
        if (sort === "이름순") return a.title.localeCompare(b.title, "ko");
        if (sort === "부서순") return a.dept.localeCompare(b.dept, "ko");
        return 0;
      });
  }, [projects, search, domain, status, type, sort, company, isGroupViewer]);

  const FilterSection = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {options.map(opt => (
          <div key={opt} onClick={() => onChange(opt)} style={{
            padding: "6px 10px", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: value === opt ? 600 : 400,
            color: value === opt ? "#2563EB" : "#475569",
            background: value === opt ? "#EFF6FF" : "transparent",
            transition: "all 0.1s",
          }}
            onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "#F8FAFC"; }}
            onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );

  // 관계사 필터는 옵션이 많아 별도 컴포넌트 (검색 가능)
  const [companySearch, setCompanySearch] = useState("");
  const filteredCompanyOptions = availableCompanies.filter(c => companySearch === "" || c.name.includes(companySearch));

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Tech Hub
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              프로젝트 탐색
            </h1>
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="프로젝트명, 기술 스택, 부서명 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 40px 9px 14px",
                  fontSize: 13, color: "#0F172A",
                  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                  borderRadius: 8, outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* 그룹 전체보기 권한자 안내 배지 */}
          {isGroupViewer && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 20, padding: "4px 12px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>그룹 전체보기 권한으로 모든 관계사 프로젝트를 조회 중입니다</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px", display: "flex", gap: 24 }}>

        {/* SIDEBAR */}
        {sidebarOpen && (
          <div style={{ width: 192, flexShrink: 0 }}>
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "18px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>필터</span>
                <span onClick={() => { setDomain("전체"); setStatus("전체"); setType("전체"); setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체")); }}
                  style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", fontWeight: 500 }}>
                  초기화
                </span>
              </div>

              {/* 관계사 필터 (검색 가능, 옵션 많음) */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  관계사
                </div>
                <input
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="관계사 검색"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: 12,
                    border: "1.5px solid #E2E8F0", borderRadius: 6, outline: "none", marginBottom: 6,
                  }}
                />
                <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  <div onClick={() => setCompany("전체")} style={{
                    padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                    fontWeight: company === "전체" ? 600 : 400,
                    color: company === "전체" ? "#2563EB" : "#475569",
                    background: company === "전체" ? "#EFF6FF" : "transparent",
                  }}>전체</div>
                  {filteredCompanyOptions.map(c => (
                    <div key={c.code} onClick={() => setCompany(c.code)} style={{
                      padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", gap: 6,
                      fontWeight: company === c.code ? 600 : 400,
                      color: company === c.code ? "#2563EB" : "#475569",
                      background: company === c.code ? "#EFF6FF" : "transparent",
                    }}>
                      {c.name}
                      {!c.visible && <span style={{ fontSize: 9, fontWeight: 700, background: "#F3E8FF", color: "#6D28D9", padding: "1px 5px", borderRadius: 20 }}>전체보기</span>}
                    </div>
                  ))}
                </div>
              </div>

              <FilterSection label="비즈니스 도메인" options={DOMAINS} value={domain} onChange={setDomain} />
              <FilterSection label="프로젝트 상태" options={STATUSES} value={status} onChange={setStatus} />
              <FilterSection label="시스템 유형" options={TYPES} value={type} onChange={setType} />
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setSidebarOpen(v => !v)} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
                padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#475569",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                {sidebarOpen ? "필터 닫기" : "필터 열기"}
              </button>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                <strong style={{ color: "#0F172A" }}>{filtered.length}</strong>개 프로젝트
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setSort(opt)} style={{
                  padding: "5px 12px", borderRadius: 6, border: "1.5px solid",
                  borderColor: sort === opt ? "#2563EB" : "#E2E8F0",
                  background: sort === opt ? "#EFF6FF" : "#fff",
                  color: sort === opt ? "#2563EB" : "#475569",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(domain !== "전체" || status !== "전체" || type !== "전체" || company !== "전체") && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                company !== "전체" && COMPANIES.find(c => c.code === company)?.name,
                domain !== "전체" && domain,
                status !== "전체" && status,
                type !== "전체" && type,
              ].filter(Boolean).map((f, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600, background: "#DBEAFE", color: "#1E40AF",
                  padding: "3px 10px", borderRadius: 20, border: "1px solid #BFDBFE",
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${hovered === i ? "#2563EB" : "#E2E8F0"}`,
                    borderRadius: 10, padding: "18px 18px 16px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hovered === i ? "0 4px 16px rgba(37,99,235,0.08)" : "none",
                    display: "flex", flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: STATUS_COLOR[p.status]?.bg,
                      color: STATUS_COLOR[p.status]?.color,
                      padding: "2px 8px", borderRadius: 20,
                    }}>
                      {p.status}
                    </span>
                    <span style={{ fontSize: 10, color: "#94A3B8" }}>{p.domain}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4, lineHeight: 1.4 }}>
                    {p.title}
                  </div>

                  {/* ===== 조직 계층 배지 (변경된 부분) — 입력 깊이만큼만 표시 ===== */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {p.orgEntries.map(e => (
                      <span key={e.id} style={{
                        fontSize: 10, fontWeight: 600,
                        background: "#EFF6FF", color: "#1E40AF",
                        padding: "2px 8px", borderRadius: 4,
                      }}>
                        {orgEntryDisplay(e)}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {p.stack.map((s, si) => (
                      <span key={si} style={{
                        fontSize: 10, fontWeight: 600,
                        background: "#F1F5F9", color: "#475569",
                        padding: "2px 7px", borderRadius: 4,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: "auto" }}>
                    업데이트 {p.updated}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}