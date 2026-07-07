import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformItem, PlatformId } from "../types/platformTypes";

// 유형별 상태값 (platformTypes.ts의 PlatformItemStatus와 일치)
const STATUS_BY_KIND: Record<PlatformId, string[]> = {
  n8n: ["운영 중", "테스트 중", "일시 중지"],
  pa: ["운영 중", "테스트 중", "일시 중지"],
  assistant: ["사용 가능", "준비 중", "운영 중지"],
  "ai-orchestration": ["사용 가능", "일부 제한", "지원 종료 예정"],
  ml: ["운영 중", "실험 중", "운영 중지"],
  vibe: ["사용 중", "프로토타입", "운영 중지"],
};

const ALL_STATUSES = [...new Set(Object.values(STATUS_BY_KIND).flat())];

// 의미 그룹별 색상 (스펙 §5 지시 기준)
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  // 정상 운영 그룹 — 녹색
  "운영 중":        { bg: "#D1FAE5", color: "#065F46" },
  "사용 가능":      { bg: "#D1FAE5", color: "#065F46" },
  "사용 중":        { bg: "#D1FAE5", color: "#065F46" },
  // 검증/개발 그룹 — 파란색
  "테스트 중":      { bg: "#DBEAFE", color: "#1E40AF" },
  "실험 중":        { bg: "#DBEAFE", color: "#1E40AF" },
  "프로토타입":     { bg: "#DBEAFE", color: "#1E40AF" },
  "준비 중":        { bg: "#DBEAFE", color: "#1E40AF" },
  // 제한 그룹 — 주황색
  "일시 중지":      { bg: "#FEF3C7", color: "#92400E" },
  "일부 제한":      { bg: "#FEF3C7", color: "#92400E" },
  // 종료 그룹 — 빨간색
  "운영 중지":      { bg: "#FEE2E2", color: "#991B1B" },
  "지원 종료 예정": { bg: "#FEE2E2", color: "#991B1B" },
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

// TODO: 실제 연동 시 GET /api/v1/platform-items 응답으로 교체
const MOCK_PLATFORM_ITEMS: PlatformItem[] = [
  { id: "N8N-001", platformId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", description: "", status: "운영 중", dept: "IT인프라팀", company: ["KKM"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["HR", "계정자동화", "온보딩"], specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05", likes: 19 },
  { id: "N8N-002", platformId: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림", description: "", status: "운영 중", dept: "구매팀", company: ["KKM"], owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08", likes: 7 },
  { id: "N8N-003", platformId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", description: "", status: "운영 중", dept: "재무팀", company: ["KKM", "KMG"], owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12", likes: 12 },
  { id: "N8N-004", platformId: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", description: "", status: "테스트 중", dept: "품질관리팀", company: ["KMW"], owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18", likes: 3 },
  { id: "PA-001", platformId: "pa", title: "결재 문서 SharePoint 자동 저장", summary: "전자결재 완료 시 문서를 SharePoint 지정 폴더에 자동으로 보관", description: "", status: "운영 중", dept: "경영지원팀", company: ["KKM"], owner: "최유진", ownerEmail: "yujin.choi@kolmar.co.kr", tags: ["SharePoint", "전자결재", "문서관리"], specificUrl: "https://make.powerautomate.com/environments/kolmar/flows/pa-001", updatedAt: "2025.07.01", likes: 12 },
  { id: "PA-002", platformId: "pa", title: "양식 제출 → Teams 알림 플로우", summary: "Microsoft Forms 제출 시 담당자에게 Teams 메시지 및 이메일 동시 발송", description: "", status: "운영 중", dept: "인사팀", company: [], owner: "김민지", ownerEmail: "minji.kim@kolmar.co.kr", tags: ["Forms", "Teams", "알림"], specificUrl: "", updatedAt: "2025.06.15", likes: 8 },
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "", status: "사용 가능", dept: "법무팀", company: [], owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10", likes: 25 },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "", status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14", likes: 18 },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "", status: "준비 중", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19", likes: 10 },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "", status: "준비 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20", likes: 5 },
  {
    id: "AIO-001", platformId: "ai-orchestration", title: "GPT-4 (범용)", summary: "범용 작업에 적합한 OpenAI GPT-4 모델", description: "",
    status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["범용", "코드생성", "문서작성"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4", updatedAt: "2025.06.10", likes: 31,
    modelMeta: { provider: "OpenAI", contextWindow: "128K", strengths: ["범용성", "코드 생성", "빠른 응답"], costTier: "보통" },
  },
  {
    id: "AIO-002", platformId: "ai-orchestration", title: "Claude (문서 분석 특화)", summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델", description: "",
    status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["문서분석", "긴컨텍스트", "법무"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude", updatedAt: "2025.06.12", likes: 27,
    modelMeta: { provider: "Anthropic", contextWindow: "200K", strengths: ["긴 컨텍스트", "정밀 추론", "안전성"], costTier: "보통" },
  },
  {
    id: "AIO-003", platformId: "ai-orchestration", title: "콜마 파인튜닝 모델 (사내 전용 용어 특화)", summary: "콜마 사내 용어와 제품 데이터로 파인튜닝된 전용 모델", description: "",
    status: "일부 제한", dept: "IT개발팀", company: ["KKM", "KBH", "KMG"], owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["사내전용", "화장품용어", "원료데이터"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/kolmar-ft", updatedAt: "2025.06.18", likes: 8,
    modelMeta: { provider: "사내 파인튜닝", contextWindow: "32K", strengths: ["콜마 전용 용어", "원료 데이터 이해"], costTier: "낮음" },
  },
  {
    id: "AIO-004", platformId: "ai-orchestration", title: "Gemini (멀티모달)", summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델", description: "",
    status: "사용 가능", dept: "IT개발팀", company: [], owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["멀티모달", "이미지분석", "도면검토"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gemini", updatedAt: "2025.06.15", likes: 14,
    modelMeta: { provider: "Google", contextWindow: "1M", strengths: ["멀티모달", "이미지 분석"], costTier: "보통" },
  },
  {
    id: "ML-001", platformId: "ml", title: "조색 예측 ML 모델", summary: "원료 배합 비율로 최종 색상을 예측하는 회귀 모델", description: "",
    status: "실험 중", dept: "메이크업연구소", company: ["KKM"], owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr",
    tags: ["TensorFlow", "회귀모델", "색상예측"], specificUrl: "", updatedAt: "2025.06.01", likes: 21,
    mlType: "회귀 (Regression)", performanceSummary: "평균 오차 3% 이내",
  },
  {
    id: "ML-002", platformId: "ml", title: "원료 수요 예측 모델", summary: "과거 생산·판매 데이터를 기반으로 월별 원료 수요를 예측", description: "",
    status: "실험 중", dept: "구매팀", company: ["KKM", "KBH"], owner: "이재훈", ownerEmail: "jaehoon.lee@kolmar.co.kr",
    tags: ["수요예측", "시계열", "구매"], specificUrl: "", updatedAt: "2025.06.20", likes: 9,
    mlType: "시계열 예측", performanceSummary: "RMSE 12.4 (검증셋 기준)",
  },
  {
    id: "VIBE-001", platformId: "vibe", title: "일일 판매 리포트 자동 생성기", summary: "ERP 데이터를 읽어 매일 아침 판매 실적 요약을 Slack으로 발송", description: "",
    status: "사용 중", dept: "영업기획팀", company: ["KKM"], owner: "한지민", ownerEmail: "jimin.han@kolmar.co.kr",
    tags: ["ERP", "Slack", "리포트자동화"], specificUrl: "", updatedAt: "2025.07.05", likes: 8,
    devTool: "Cursor, Claude", outputType: "Python 스크립트 + Slack 알림",
  },
  {
    id: "VIBE-002", platformId: "vibe", title: "원가 분석 자동화 스크립트", summary: "ChatGPT로 작성한 Python 스크립트로 ERP 원가 데이터 자동 분석 및 리포트 생성", description: "",
    status: "프로토타입", dept: "재무팀", company: ["KMG"], owner: "오현진", ownerEmail: "hyunjin.oh@kolmar.co.kr",
    tags: ["원가분석", "Python", "ERP"], specificUrl: "", updatedAt: "2025.06.21", likes: 6,
    devTool: "ChatGPT", outputType: "Python 스크립트",
  },
];

const SORT_OPTIONS = ["최신순", "인기순", "이름순", "부서순"] as const;

const SOURCE_OPTIONS: { key: "전체" | PlatformId; label: string }[] = [
  { key: "전체", label: "전체" },
  ...PLATFORMS.map(p => ({ key: p.id, label: p.name })),
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

const HeartIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color === "#94A3B8" ? "none" : color} stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

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

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isGroupViewer } = useAuth();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState<"전체" | PlatformId>("전체");
  const [status, setStatus] = useState("전체");
  const [company, setCompany] = useState<string>(() => (isGroupViewer ? "전체" : (user?.company ?? "전체")));
  const [companySearch, setCompanySearch] = useState("");
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [hovered, setHovered] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 선택된 플랫폼에 따른 상태 옵션 (없으면 전체 통합)
  const statusOptions = useMemo(() => {
    if (source === "전체") return ["전체", ...ALL_STATUSES];
    return ["전체", ...STATUS_BY_KIND[source]];
  }, [source]);

  const location = useLocation();
  const resetAtRef = useRef<number | null>(null);
  useEffect(() => {
    const _resetAt = (location.state as { _resetAt?: number } | null)?._resetAt ?? null;
    if (_resetAt !== null && _resetAt !== resetAtRef.current) {
      resetAtRef.current = _resetAt;
      setSource("전체");
      setStatus("전체");
      setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
      setSearch("");
      setSort("최신순");
      setSidebarOpen(false);
      setSearchParams({});
    }
  }, [location.state]);

  // 플랫폼 변경 시 현재 상태값이 새 옵션에 없으면 초기화
  const handleSourceChange = (newSource: "전체" | PlatformId) => {
    setSource(newSource);
    if (newSource !== "전체") {
      const validStatuses = STATUS_BY_KIND[newSource];
      if (status !== "전체" && !validStatuses.includes(status)) {
        setStatus("전체");
      }
    }
  };

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  const availableCompanies = useMemo(
    () => isGroupViewer ? COMPANIES : COMPANIES.filter(c => c.visible),
    [isGroupViewer]
  );

  const resetFilters = () => {
    setSource("전체"); setStatus("전체");
    setCompany(isGroupViewer ? "전체" : (user?.company ?? "전체"));
  };

  const activeFilterCount = [
    source !== "전체",
    company !== "전체",
    status !== "전체",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const items = MOCK_PLATFORM_ITEMS.filter(item => {
      if (source !== "전체" && item.platformId !== source) return false;

      const itemCompanies = item.company ?? [];
      const isCompanyWide = itemCompanies.length === 0;
      const hasNonVisible = itemCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (!isCompanyWide && hasNonVisible && !isGroupViewer) return false;
      if (company !== "전체" && !isCompanyWide && !itemCompanies.includes(company)) return false;
      if (status !== "전체" && item.status !== status) return false;

      return search === "" ||
        item.title.includes(search) ||
        item.summary.includes(search) ||
        item.tags.some(t => t.includes(search)) ||
        item.dept.includes(search);
    });

    return items.sort((a, b) => {
      if (sort === "최신순") return new Date(b.updatedAt.replace(/\./g, "-")).getTime() - new Date(a.updatedAt.replace(/\./g, "-")).getTime();
      if (sort === "인기순") return b.likes - a.likes;
      if (sort === "이름순") return a.title.localeCompare(b.title, "ko");
      if (sort === "부서순") return a.dept.localeCompare(b.dept, "ko");
      return 0;
    });
  }, [search, status, sort, company, source, isGroupViewer]);

  const filteredCompanyOptions = availableCompanies.filter(c => companySearch === "" || c.name.includes(companySearch));

  const detailPathOf = (item: PlatformItem) => {
    const platform = PLATFORMS.find(p => p.id === item.platformId)!;
    return `${platform.path}/${item.id}`;
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            AX Platform
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              AX 플랫폼 탐색
            </h1>
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="워크플로우, AI 에이전트, ML 모델 검색"
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
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>그룹 전체보기 권한으로 모든 관계사 항목을 조회 중입니다</span>
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
                <span onClick={resetFilters} style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", fontWeight: 500 }}>초기화</span>
              </div>

              {/* 플랫폼 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  플랫폼
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

              {/* 상태 — 선택된 플랫폼에 따라 옵션 변경 */}
              <FilterSection label="상태" options={statusOptions} value={status} onChange={setStatus} />

              {/* 관계사 */}
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
                  전사 공용 항목은 관계사를 선택해도 항상 함께 표시됩니다.
                </div>
              </div>
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

          {(source !== "전체" || status !== "전체" || company !== "전체") && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                source !== "전체" && SOURCE_OPTIONS.find(o => o.key === source)?.label,
                company !== "전체" && COMPANIES.find(c => c.code === company)?.name,
                status !== "전체" && status,
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
              {filtered.map((item, i) => {
                const sourceStyle = SOURCE_STYLE[item.platformId];
                const sideColor = hovered === i ? sourceStyle.color : "#E2E8F0";
                const statusStyle = STATUS_COLOR[item.status] ?? { bg: "#F1F5F9", color: "#475569" };
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(detailPathOf(item))}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      background: "#fff",
                      borderTop: `3px solid ${sourceStyle.color}`,
                      borderRight: `1.5px solid ${sideColor}`,
                      borderBottom: `1.5px solid ${sideColor}`,
                      borderLeft: `1.5px solid ${sideColor}`,
                      borderRadius: 10, padding: "15px 17px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s",
                      boxShadow: hovered === i ? `0 6px 18px ${sourceStyle.color}1F` : "0 1px 2px rgba(0,0,0,0.02)",
                      transform: hovered === i ? "translateY(-1px)" : "none",
                      display: "flex", flexDirection: "column",
                      minHeight: 172,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: statusStyle.bg, color: statusStyle.color,
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
                      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94A3B8", flexShrink: 0 }}>
                        <HeartIcon />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.title}
                    </div>

                    <div style={{
                      fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.summary}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                      {item.tags.slice(0, 3).map((t, ti) => (
                        <span key={ti} style={{
                          fontSize: 10, fontWeight: 600,
                          background: "#F1F5F9", color: "#475569",
                          padding: "2px 7px", borderRadius: 4,
                        }}>
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: "auto", gap: 8,
                    }}>
                      <span style={{ fontSize: 10, color: "#CBD5E1", flexShrink: 0 }}>
                        업데이트 {item.updatedAt}
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
