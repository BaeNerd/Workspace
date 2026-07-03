import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformItem, PlatformId } from "../types/platformTypes";

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

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
  likes: number; // ★ 추가
};

const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-2025-038", title: "통합 정산 자동화 시스템", dept: "재무팀", stack: ["Python", "Airflow", "PostgreSQL"], status: "운영 중", domain: "재무/회계", type: "데이터 파이프라인", updated: "2025.05.12", orgEntries: [{ id: 1, company: "KKM", parent: "경영지원본부", dept: "재무팀" }], likes: 14 },
  { id: "PRJ-2025-070", title: "고객 문의 분류 ML 모델", dept: "고객서비스팀", stack: ["Python", "FastAPI", "AWS"], status: "개발 중", domain: "고객 서비스", type: "ML/AI 모델", updated: "2025.05.28", orgEntries: [{ id: 2, company: "KKM", parent: "영업마케팅본부", dept: "고객서비스팀" }], likes: 9 },
  { id: "PRJ-2025-041", title: "조색 예측 ML 모델", dept: "메이크업연구소", stack: ["Python", "TensorFlow", "AWS"], status: "개발 중", domain: "제조/생산", type: "ML/AI 모델", updated: "2025.06.01", orgEntries: [{ id: 3, company: "KKM", parent: "연구개발본부", dept: "메이크업연구소" }], likes: 21 },
  { id: "PRJ-2025-045", title: "HR 온보딩 자동화 포털", dept: "인사팀", stack: ["React", "Spring Boot"], status: "파일럿", domain: "HR/인사", type: "웹 애플리케이션", updated: "2025.04.30", orgEntries: [{ id: 4, company: "KKM", parent: "경영지원본부", dept: "인사팀" }], likes: 6 },
  { id: "PRJ-2025-052", title: "내부 API Gateway 구축", dept: "IT인프라팀", stack: ["Go", "Kubernetes", "AWS"], status: "운영 중", domain: "IT 인프라", type: "API/서비스", updated: "2025.03.18", orgEntries: [{ id: 5, company: "KKM", parent: "IT본부", dept: "IT인프라팀" }], likes: 11 },
  { id: "PRJ-2025-063", title: "영업 CRM 고도화", dept: "영업팀", stack: ["TypeScript", "NestJS", "PostgreSQL"], status: "개발 중", domain: "영업/CRM", type: "웹 애플리케이션", updated: "2025.06.03", orgEntries: [{ id: 6, company: "KKM", parent: "영업마케팅본부", dept: "영업팀" }], likes: 4 },
  { id: "PRJ-2025-056", title: "생산 공정 이상 감지 시스템", dept: "제조기술팀", stack: ["Python", "TensorFlow", "Kafka"], status: "운영 중", domain: "제조/생산", type: "ML/AI 모델", updated: "2025.02.14", orgEntries: [{ id: 7, company: "KKM", parent: "생산본부", dept: "제조기술팀" }], likes: 17 },
  { id: "PRJ-2025-033", title: "전사 통합 알림 플랫폼", dept: "IT인프라팀", stack: ["Node.js", "Redis", "AWS"], status: "운영 중", domain: "IT 인프라", type: "API/서비스", updated: "2025.01.22", orgEntries: [{ id: 8, company: "KMH", parent: null, dept: null }], likes: 23 },
  { id: "PRJ-2025-058", title: "원료 입고 품질 검사 자동화", dept: "품질관리팀", stack: ["Python", "FastAPI", "PostgreSQL"], status: "파일럿", domain: "제조/생산", type: "웹 애플리케이션", updated: "2025.05.09", orgEntries: [{ id: 9, company: "KKM", parent: "생산본부", dept: "품질관리팀" }], likes: 3 },
  { id: "PRJ-2025-049", title: "마케팅 캠페인 성과 분석 대시보드", dept: "마케팅팀", stack: ["React", "Python", "BigQuery"], status: "운영 중", domain: "마케팅", type: "웹 애플리케이션", updated: "2025.04.07", orgEntries: [{ id: 10, company: "KMG", parent: "영업마케팅본부", dept: null }], likes: 8 },
  { id: "PRJ-2025-027", title: "용기 3D 렌더링 자동화 도구", dept: "디자인팀", stack: ["Python", "Blender API", "AWS"], status: "보류", domain: "제조/생산", type: "내부 도구", updated: "2025.03.01", orgEntries: [{ id: 11, company: "KKM", parent: "연구개발본부", dept: "디자인팀" }], likes: 2 },
  { id: "PRJ-2025-044", title: "원가 분석 리포팅 자동화", dept: "재무팀", stack: ["Python", "Airflow", "Tableau"], status: "운영 중", domain: "재무/회계", type: "데이터 파이프라인", updated: "2025.04.20", orgEntries: [{ id: 12, company: "KKM", parent: "경영지원본부", dept: "재무팀" }], likes: 5 },
  { id: "PRJ-2025-090", title: "친환경 원료 추적 시스템", dept: "품질관리팀", stack: ["Python", "PostgreSQL"], status: "개발 중", domain: "제조/생산", type: "데이터 파이프라인", updated: "2025.06.10", orgEntries: [{ id: 13, company: "KAF", parent: null, dept: null }], likes: 1 },
];

// ★ company 필드 채움 — AdminOrg.tsx의 PLATFORM_ITEM_REFS와 동일 매핑(빈 배열 = 전사 공용)
const MOCK_PLATFORM_ITEMS: PlatformItem[] = [
  { id: "N8N-001", platformId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", description: "", status: "운영 중", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["HR", "계정자동화", "온보딩"], specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05", likes: 19 },
  { id: "N8N-002", platformId: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림", description: "", status: "운영 중", dept: "구매팀", company: ["KKM"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7 },
  { id: "N8N-003", platformId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", description: "", status: "운영 중", dept: "재무팀", company: ["KKM", "KMG"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12 },
  { id: "N8N-004", platformId: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", description: "", status: "파일럿", dept: "품질관리팀", company: ["KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3 },
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "", status: "운영 중", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25 },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "", status: "운영 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18 },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "", status: "개발 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10 },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "", status: "파일럿", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5 },
  {
    id: "AIO-001", platformId: "ai-orchestration", title: "GPT-4 (범용)", summary: "범용 작업에 적합한 OpenAI GPT-4 모델", description: "",
    status: "운영 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["범용", "코드생성", "문서작성"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4", updatedAt: "2025.06.10", likes: 31,
    modelMeta: { provider: "OpenAI", contextWindow: "128K", strengths: ["범용성", "코드 생성", "빠른 응답"], costTier: "보통" },
  },
  {
    id: "AIO-002", platformId: "ai-orchestration", title: "Claude (문서 분석 특화)", summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델", description: "",
    status: "운영 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["문서분석", "긴컨텍스트", "법무"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude", updatedAt: "2025.06.12", likes: 27,
    modelMeta: { provider: "Anthropic", contextWindow: "200K", strengths: ["긴 컨텍스트", "정밀 추론", "안전성"], costTier: "보통" },
  },
  {
    id: "AIO-003", platformId: "ai-orchestration", title: "콜마 파인튜닝 모델 (사내 전용 용어 특화)", summary: "콜마 사내 용어와 제품 데이터로 파인튜닝된 전용 모델", description: "",
    status: "파일럿", dept: "IT개발팀", company: ["KKM", "KBH", "KMG"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["사내전용", "화장품용어", "원료데이터"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/kolmar-ft", updatedAt: "2025.06.18", likes: 8,
    modelMeta: { provider: "사내 파인튜닝", contextWindow: "32K", strengths: ["콜마 전용 용어", "원료 데이터 이해"], costTier: "낮음" },
  },
  {
    id: "AIO-004", platformId: "ai-orchestration", title: "Gemini (멀티모달)", summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델", description: "",
    status: "운영 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["멀티모달", "이미지분석", "도면검토"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gemini", updatedAt: "2025.06.15", likes: 14,
    modelMeta: { provider: "Google", contextWindow: "1M", strengths: ["멀티모달", "이미지 분석"], costTier: "보통" },
  },
];

const DOMAINS = ["전체", "재무/회계", "고객 서비스", "제조/생산", "HR/인사", "IT 인프라", "영업/CRM", "마케팅"];
const STATUSES = ["전체", "운영 중", "개발 중", "파일럿", "종료", "보류"];
const TYPES = ["전체", "웹 애플리케이션", "ML/AI 모델", "데이터 파이프라인", "API/서비스", "내부 도구"];
const SORT_OPTIONS = ["최신순", "인기순", "이름순", "부서순"] as const;

const SOURCE_OPTIONS: { key: "전체" | "project" | PlatformId; label: string }[] = [
  { key: "전체", label: "전체" },
  { key: "project", label: "프로젝트" },
  ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
];

type CombinedCard =
  | { kind: "project"; data: Project }
  | { kind: "platform"; data: PlatformItem };

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  project: { color: "#475569", bg: "#F1F5F9", label: "프로젝트" },
  ...Object.fromEntries(PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])),
};

const sourceKeyOf = (card: CombinedCard) => card.kind === "project" ? "project" : card.data.platformId;
const projectSummary = (p: Project) => `${p.domain} 영역 · ${p.dept}에서 운영하는 ${p.type}`;

// 좋아요 아이콘 (heart outline)
const HeartIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color === "#94A3B8" ? "none" : color} stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

// ★ 모듈 레벨로 이동 — 컴포넌트 내부 정의 시 매 렌더 재생성되어 포커스/스크롤 버그 유발
const FilterSection = ({ label, options, value, onChange, disabled }: { label: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <div style={{ marginBottom: 20, opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {options.map(opt => (
        <div key={opt} onClick={() => !disabled && onChange(opt)} style={{
          padding: "6px 10px", borderRadius: 6, cursor: disabled ? "default" : "pointer",
          fontSize: 13, fontWeight: value === opt ? 600 : 400,
          color: value === opt ? "#2563EB" : "#475569",
          background: value === opt ? "#EFF6FF" : "transparent",
          transition: "all 0.1s",
        }}
          onMouseEnter={e => { if (!disabled && value !== opt) e.currentTarget.style.background = "#F8FAFC"; }}
          onMouseLeave={e => { if (!disabled && value !== opt) e.currentTarget.style.background = "transparent"; }}
        >
          {opt}
        </div>
      ))}
    </div>
  </div>
);

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGroupViewer } = useAuth();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState<"전체" | "project" | PlatformId>("전체");
  const [domain, setDomain] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [type, setType] = useState("전체");
  const [company, setCompany] = useState<string>(() => (isGroupViewer ? "전체" : (user?.company ?? "전체")));
  const [companySearch, setCompanySearch] = useState("");
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [hovered, setHovered] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // ★ 기본 닫힘

  const location = useLocation();
  const resetAtRef = useRef<number | null>(null);
  useEffect(() => {
    const _resetAt = (location.state as { _resetAt?: number } | null)?._resetAt ?? null;
    if (_resetAt !== null && _resetAt !== resetAtRef.current) {
      resetAtRef.current = _resetAt;
      setSource("전체");
      setDomain("전체");
      setStatus("전체");
      setType("전체");
      setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
      setSearch("");
      setSort("최신순");
      setSidebarOpen(false);
      setSearchParams({});
    }
  }, [location.state]);

  const projects = MOCK_PROJECTS;
  const platformItems = MOCK_PLATFORM_ITEMS;

  const availableCompanies = useMemo(
    () => isGroupViewer ? COMPANIES : COMPANIES.filter(c => c.visible),
    [isGroupViewer]
  );

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  // 출처 변경 — 플랫폼 출처 선택 시 프로젝트 전용 필터(도메인·유형) 자동 초기화
  const handleSourceChange = (key: "전체" | "project" | PlatformId) => {
    setSource(key);
    if (key !== "전체" && key !== "project") {
      setDomain("전체");
      setType("전체");
    }
  };

  const resetFilters = () => {
    setSource("전체"); setDomain("전체"); setStatus("전체"); setType("전체");
    setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
  };

  // 도메인·시스템 유형은 프로젝트 전용 개념 → 출처가 전체/프로젝트일 때만 노출
  const projectFiltersVisible = source === "전체" || source === "project";
  // 도메인/유형이 적용되면 해당 개념이 없는 플랫폼 항목은 목록에서 제외
  const projectOnlyFilterActive = projectFiltersVisible && (domain !== "전체" || type !== "전체");

  const activeFilterCount = [
    source !== "전체",
    company !== "전체",
    status !== "전체",
    domain !== "전체",
    type !== "전체",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const includeProjects = source === "전체" || source === "project";
    const includePlatform = (pid: PlatformId) => source === "전체" || source === pid;

    const filteredProjects = !includeProjects ? [] : projects.filter(p => {
      const projectCompanies = p.orgEntries.map(e => e.company);
      const hasNonVisible = projectCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (hasNonVisible && !isGroupViewer) return false;
      if (company !== "전체" && !projectCompanies.includes(company)) return false;

      return (search === "" ||
        p.title.includes(search) ||
        p.stack.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        p.dept.includes(search)) &&
        (domain === "전체" || p.domain === domain) &&
        (status === "전체" || p.status === status) &&
        (type === "전체" || p.type === type);
    });

    const filteredPlatformItems = projectOnlyFilterActive ? [] : platformItems.filter(item => {
      if (!includePlatform(item.platformId)) return false;

      const itemCompanies = item.company ?? [];
      const isCompanyWide = itemCompanies.length === 0; // 빈 배열 = 전사 공용

      // 접근 제어 — 전사 공용은 항상 노출, 특정 관계사 지정 항목은 비노출 관계사 포함 시 그룹 전체보기 권한자만
      const hasNonVisible = itemCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (!isCompanyWide && hasNonVisible && !isGroupViewer) return false;

      // 관계사 필터 — 전사 공용 항목은 특정 관계사 선택 시에도 노출(모든 관계사에 해당)
      if (company !== "전체" && !isCompanyWide && !itemCompanies.includes(company)) return false;

      if (!(status === "전체" || item.status === status)) return false;

      return search === "" ||
        item.title.includes(search) ||
        item.summary.includes(search) ||
        item.tags.some(t => t.includes(search)) ||
        item.dept.includes(search);
    });

    const combined: CombinedCard[] = [
      ...filteredProjects.map(p => ({ kind: "project" as const, data: p })),
      ...filteredPlatformItems.map(p => ({ kind: "platform" as const, data: p })),
    ];

    return combined.sort((a, b) => {
      const aDate = a.kind === "project" ? a.data.updated : a.data.updatedAt;
      const bDate = b.kind === "project" ? b.data.updated : b.data.updatedAt;
      const aDept = a.data.dept;
      const bDept = b.data.dept;

      if (sort === "최신순") return new Date(bDate.replace(/\./g, "-")).getTime() - new Date(aDate.replace(/\./g, "-")).getTime();
      if (sort === "인기순") return b.data.likes - a.data.likes;
      if (sort === "이름순") return a.data.title.localeCompare(b.data.title, "ko");
      if (sort === "부서순") return aDept.localeCompare(bDept, "ko");
      return 0;
    });
  }, [projects, platformItems, search, domain, status, type, sort, company, source, isGroupViewer, projectOnlyFilterActive]);

  const filteredCompanyOptions = availableCompanies.filter(c => companySearch === "" || c.name.includes(companySearch));

  const detailPathOf = (card: CombinedCard) => {
    if (card.kind === "project") return `/projects/${card.data.id}`;
    const platform = PLATFORMS.find(p => p.id === card.data.platformId)!;
    return `${platform.path}/${card.data.id}`;
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

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
                placeholder="프로젝트, 워크플로우, AI 모델 검색"
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
                <span onClick={resetFilters}
                  style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", fontWeight: 500 }}>
                  초기화
                </span>
              </div>

              {/* 출처 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  출처
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {SOURCE_OPTIONS.map(opt => {
                    const style = opt.key === "전체" ? null : SOURCE_STYLE[opt.key];
                    return (
                      <div key={opt.key} onClick={() => handleSourceChange(opt.key)} style={{
                        padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                        fontSize: 13, fontWeight: source === opt.key ? 600 : 400,
                        color: source === opt.key ? "#2563EB" : "#475569",
                        background: source === opt.key ? "#EFF6FF" : "transparent",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {style && <span style={{ width: 7, height: 7, borderRadius: 2, background: style.color, display: "inline-block", flexShrink: 0 }} />}
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 상태 — 프로젝트·플랫폼 공통 */}
              <FilterSection label="상태" options={STATUSES} value={status} onChange={setStatus} />

              {/* 관계사 — 항상 노출, 프로젝트·플랫폼 공통 적용 */}
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
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                  전사 공용 플랫폼 항목은 관계사를 선택해도 항상 함께 표시됩니다.
                </div>
              </div>

              {/* 도메인·시스템 유형 — 프로젝트 전용, 출처가 전체/프로젝트일 때만 노출 */}
              {projectFiltersVisible && (
                <>
                  {projectOnlyFilterActive && (
                    <div style={{ marginBottom: 16, padding: "8px 10px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 11, color: "#9A3412", lineHeight: 1.5 }}>
                      도메인·시스템 유형은 일반 프로젝트 전용 조건입니다. 선택 시 플랫폼 항목은 제외됩니다.
                    </div>
                  )}
                  <FilterSection label="비즈니스 도메인" options={DOMAINS} value={domain} onChange={setDomain} />
                  <FilterSection label="시스템 유형" options={TYPES} value={type} onChange={setType} />
                </>
              )}
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
                {!sidebarOpen && activeFilterCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: "#2563EB", color: "#fff", padding: "1px 7px", borderRadius: 20 }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                <strong style={{ color: "#0F172A" }}>{filtered.length}</strong>개 항목
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setSort(opt)} style={{
                  padding: "5px 12px", borderRadius: 6,
                  borderWidth: 1.5, borderStyle: "solid",
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

          {(source !== "전체" || domain !== "전체" || status !== "전체" || type !== "전체" || company !== "전체") && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                source !== "전체" && SOURCE_OPTIONS.find(o => o.key === source)?.label,
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

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.map((card, i) => {
                const sourceKey = sourceKeyOf(card);
                const sourceStyle = SOURCE_STYLE[sourceKey];
                const item = card.data;
                const summaryLine = card.kind === "project" ? projectSummary(card.data) : card.data.summary;
                const tagList = card.kind === "project" ? card.data.stack.slice(0, 3) : card.data.tags.slice(0, 3);

                return (
                  <div
                    key={`${card.kind}-${item.id}`}
                    onClick={() => navigate(detailPathOf(card))}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${hovered === i ? sourceStyle.color : "#E2E8F0"}`,
                      borderTop: `3px solid ${sourceStyle.color}`,
                      borderRadius: 10, padding: "15px 17px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                      boxShadow: hovered === i ? `0 6px 18px ${sourceStyle.color}1F` : "0 1px 2px rgba(0,0,0,0.02)",
                      transform: hovered === i ? "translateY(-1px)" : "none",
                      display: "flex", flexDirection: "column",
                      minHeight: 172,
                    }}
                  >
                    {/* 상단 줄: [상태][출처] ........... ♥ 좋아요수 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: STATUS_COLOR[item.status]?.bg,
                          color: STATUS_COLOR[item.status]?.color,
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          {item.status}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: sourceStyle.bg, color: sourceStyle.color,
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          {sourceStyle.label}
                        </span>
                      </div>
                      {/* ★ 좋아요 카운트 — 우측 끝 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94A3B8", flexShrink: 0 }}>
                        <HeartIcon />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.title}
                    </div>

                    {/* 1줄 요약 */}
                    <div style={{
                      fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {summaryLine}
                    </div>

                    {/* 태그 */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                      {tagList.map((t, ti) => (
                        <span key={ti} style={{
                          fontSize: 10, fontWeight: 600,
                          background: "#F1F5F9", color: "#475569",
                          padding: "2px 7px", borderRadius: 4,
                        }}>
                          {card.kind === "project" ? t : `#${t}`}
                        </span>
                      ))}
                    </div>

                    {/* ★ 하단 줄: 업데이트일(좌) ........... 부서명(우) */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: "auto", gap: 8,
                    }}>
                      <span style={{ fontSize: 10, color: "#CBD5E1", flexShrink: 0 }}>
                        업데이트 {card.kind === "project" ? card.data.updated : card.data.updatedAt}
                      </span>
                      <span style={{
                        fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, textAlign: "right",
                      }}>
                        {item.dept}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}