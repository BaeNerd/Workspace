import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import { CATEGORIES, BUSINESS_DOMAINS } from "../types/categoryTypes";
import type { AssetItem, CategoryId, BusinessDomain } from "../types/categoryTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { useScraps } from "../hooks/useScraps";
import { getAssetItems } from "../lib/dataSource";


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



const POPULAR_TAGS: string[] = (() => {
  const freq = new Map<string, number>();
  getAssetItems().forEach(item => item.tags.forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)));
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
})();

const SORT_OPTIONS = ["최신순", "인기순", "이름순"] as const;

const SOURCE_OPTIONS: { key: "전체" | CategoryId; label: string }[] = [
  { key: "전체", label: "전체" },
  ...CATEGORIES.map(p => ({ key: p.id, label: p.name })),
];

const SOURCE_STYLE: Record<string, { color: string; bg: string; label: string }> = Object.fromEntries(
  CATEGORIES.map(p => [p.id, { color: p.color, bg: p.bg, label: p.name }])
);

const COST_TIER_BADGE_COLOR: Record<"낮음" | "보통" | "높음", { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#E8F0FE", color: "#1E3A8A" },
  "높음": { bg: "#FFEDD5", color: "#9A3412" },
};

const HeartIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color === "#94A3B8" ? "none" : color} stroke={color} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const EyeIcon = ({ color = "#94A3B8" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const BookmarkIcon = ({ active }: { active: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "#1D4ED8" : "none"} stroke={active ? "#1D4ED8" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isGroupViewer } = useAuth();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState<"전체" | CategoryId>(() => {
    const p = searchParams.get("platform");
    return (p && CATEGORIES.some(pl => pl.id === p)) ? p as CategoryId : "전체";
  });
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]>("최신순");
  const [domainFilter, setDomainFilter] = useState<BusinessDomain | "전체">(() => {
    const d = searchParams.get("domain");
    if (d && (BUSINESS_DOMAINS as readonly string[]).includes(d)) return d as BusinessDomain;
    return "전체";
  });
  const [visibleCount, setVisibleCount] = useState(24);
  const [hovered, setHovered] = useState<number | null>(null);
  // 스크랩 필터 — 개인화 패널 "내가 스크랩한 항목"에서 ?scrap=1로 진입(단순한 쪽 선택: 전용 목록 대신 목록 재사용).
  // 아래 search useEffect가 URL 파라미터를 정리하므로 초기값만 URL에서 읽고 이후 로컬 상태로 유지한다.
  const { scraps, isScrapped, toggle: toggleScrap } = useScraps();
  const [scrapOnly, setScrapOnly] = useState(searchParams.get("scrap") === "1");

  const location = useLocation();
  const resetAtRef = useRef<number | null>(null);
  useEffect(() => {
    const _resetAt = (location.state as { _resetAt?: number } | null)?._resetAt ?? null;
    if (_resetAt !== null && _resetAt !== resetAtRef.current) {
      resetAtRef.current = _resetAt;
      setSource("전체");
      setDomainFilter("전체");
      setSearch("");
      setSort("최신순");
      setSearchParams({});
    }
  }, [location.state]);

  useEffect(() => {
    if (search) setSearchParams({ q: search });
    else setSearchParams({});
  }, [search]);

  useEffect(() => {
    setVisibleCount(24);
  }, [search, source, domainFilter, sort, scrapOnly]);

  const resetFilters = () => {
    setSource("전체"); setDomainFilter("전체"); setScrapOnly(false);
  };

  const filtered = useMemo(() => {
    const items = getAssetItems().filter(item => {
      if (scrapOnly && !isScrapped(item.id)) return false;
      if (source !== "전체" && item.categoryId !== source) return false;

      // 비노출 관계사에만 속한 항목은 그룹 전체보기 권한자가 아니면 접근 불가 (표시 축 아닌 접근 규칙)
      const itemCompanies = item.company ?? [];
      const isCompanyWide = itemCompanies.length === 0;
      const hasNonVisible = itemCompanies.some(code => !COMPANIES.find(c => c.code === code)?.visible);
      if (!isCompanyWide && hasNonVisible && !isGroupViewer) return false;

      if (domainFilter !== "전체" && item.domain !== domainFilter) return false;

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
      return 0;
    });
  }, [search, sort, source, domainFilter, isGroupViewer, scrapOnly, scraps]);

  const detailPathOf = (item: AssetItem) => {
    const category = CATEGORIES.find(p => p.id === item.categoryId)!;
    return `${category.path}/${item.id}`;
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "20px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            AX Platform
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em" }}>
                AX 플랫폼 탐색
              </h1>
              {isGroupViewer && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F3E8FF", border: "1px solid #E9D5FF", borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6D28D9" }}>그룹 관리자 권한으로 모든 관계사 항목을 조회 중입니다</span>
                </div>
              )}
            </div>
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="워크플로우, AI 모델, ML 모델 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 40px 9px 14px",
                  fontSize: 13, color: "#1A1F27",
                  background: "#F4F6F9", border: "1.5px solid #EBEEF3",
                  borderRadius: 8, outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#1C6BFF")}
                onBlur={e => (e.target.style.borderColor = "#EBEEF3")}
              />
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ position: "sticky", top: 56, zIndex: 99, background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "10px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          {/* 1행: 플랫폼 + 도메인 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#F3F5F8", borderRadius: 10, padding: "4px 6px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "0 6px", letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>카테고리</span>
              {SOURCE_OPTIONS.map(opt => {
                const sStyle = opt.key === "전체" ? null : SOURCE_STYLE[opt.key];
                const isActive = source === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => setSource(opt.key)}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#EBEEF3"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    style={{
                      padding: "5px 10px", borderRadius: 7, cursor: "pointer",
                      fontSize: 12.5, fontWeight: isActive ? 700 : 400,
                      color: isActive ? "#1C6BFF" : "#475569",
                      background: isActive ? "#E8F0FE" : "transparent",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {sStyle && <span style={{ width: 7, height: 7, borderRadius: 2, background: sStyle.color, display: "inline-block", flexShrink: 0 }} />}
                    {opt.label}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#F3F5F8", borderRadius: 10, padding: "4px 6px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "0 6px", letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>도메인</span>
              {(["전체", ...BUSINESS_DOMAINS] as const).map(opt => {
                const isActive = domainFilter === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => setDomainFilter(opt as BusinessDomain | "전체")}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#EBEEF3"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    style={{
                      padding: "5px 10px", borderRadius: 7, cursor: "pointer",
                      fontSize: 12.5, fontWeight: isActive ? 700 : 400,
                      color: isActive ? "#1C6BFF" : "#475569",
                      background: isActive ? "#E8F0FE" : "transparent",
                    }}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
          {/* 2행: 인기 태그 + 초기화 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {POPULAR_TAGS.length > 0 && (
              <div style={{ display: "flex", gap: 4, flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
                {POPULAR_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearch(search === tag ? "" : tag)}
                    style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      borderTop: `1px solid ${search === tag ? "#1C6BFF" : "#EBEEF3"}`,
                      borderRight: `1px solid ${search === tag ? "#1C6BFF" : "#EBEEF3"}`,
                      borderBottom: `1px solid ${search === tag ? "#1C6BFF" : "#EBEEF3"}`,
                      borderLeft: `1px solid ${search === tag ? "#1C6BFF" : "#EBEEF3"}`,
                      background: search === tag ? "#E8F0FE" : "#F4F6F9",
                      color: search === tag ? "#1C6BFF" : "#697386",
                      flexShrink: 0,
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            {/* 스크랩만 보기 토글 (개인화 패널 "내가 스크랩한 항목" 진입점과 동일 필터) */}
            <button
              onClick={() => setScrapOnly(v => !v)}
              aria-pressed={scrapOnly}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                borderWidth: 1, borderStyle: "solid",
                borderColor: scrapOnly ? "#1D4ED8" : "#EBEEF3",
                background: scrapOnly ? "#EFF6FF" : "#F4F6F9",
                color: scrapOnly ? "#1D4ED8" : "#697386",
              }}
            >
              <BookmarkIcon active={scrapOnly} />
              스크랩 {scraps.length}
            </button>
            <button onClick={resetFilters} style={{ fontSize: 11, color: "#94A3B8", cursor: "pointer", background: "none", border: "none", fontWeight: 500, padding: "4px 6px" }}>
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "24px 32px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#697386" }}>
            <strong style={{ color: "#1A1F27" }}>{filtered.length}</strong>개 항목
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setSort(opt)} style={{
                padding: "5px 12px", borderRadius: 6,
                borderWidth: 1.5, borderStyle: "solid",
                borderColor: sort === opt ? "#1C6BFF" : "#EBEEF3",
                background: sort === opt ? "#E8F0FE" : "#fff",
                color: sort === opt ? "#1C6BFF" : "#475569",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>
            {scrapOnly && scraps.length === 0
              ? "아직 스크랩한 항목이 없습니다. 카드나 상세에서 북마크를 눌러 스크랩해 보세요."
              : "검색 결과가 없습니다."}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filtered.slice(0, visibleCount).map((item, i) => {
              const sourceStyle = SOURCE_STYLE[item.categoryId];
              const sideColor = hovered === i ? sourceStyle.color : "#EBEEF3";
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", minWidth: 0, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: sourceStyle.bg, color: sourceStyle.color,
                        padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                      }}>
                        {sourceStyle.label}
                      </span>
                      {item.domain && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: "#F1F5F9", color: "#475569",
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                        }}>
                          {item.domain}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94A3B8", flexShrink: 0 }}>
                      {item.views != null && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <EyeIcon />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{item.views.toLocaleString()}</span>
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <HeartIcon />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{item.likes}</span>
                      </span>
                      {/* 스크랩 토글 — 카드 클릭(상세 이동)과 분리하기 위해 stopPropagation */}
                      <button
                        type="button"
                        aria-pressed={isScrapped(item.id)}
                        title={isScrapped(item.id) ? "스크랩 해제" : "스크랩"}
                        onClick={e => { e.stopPropagation(); toggleScrap(item.id); }}
                        style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
                      >
                        <BookmarkIcon active={isScrapped(item.id)} />
                      </button>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 14, fontWeight: 700, color: "#1A1F27", marginBottom: 6, lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.title}
                  </div>

                  <div style={{
                    fontSize: 12, color: "#697386", lineHeight: 1.5, marginBottom: 12,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.summary}
                  </div>

                  {item.categoryId === "ai-orchestration" && item.modelMeta ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                      {item.modelMeta.strengths.slice(0, 3).map((s, si) => (
                        <span key={si} style={{ fontSize: 10, fontWeight: 600, background: "#F5F3FF", color: "#6D28D9", padding: "2px 7px", borderRadius: 4 }}>
                          {s}
                        </span>
                      ))}
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: COST_TIER_BADGE_COLOR[item.modelMeta.costTier].bg,
                        color: COST_TIER_BADGE_COLOR[item.modelMeta.costTier].color,
                        padding: "2px 7px", borderRadius: 4,
                      }}>
                        비용 {item.modelMeta.costTier}
                      </span>
                    </div>
                  ) : (
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
                  )}

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
          {filtered.length > visibleCount && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={() => setVisibleCount(v => v + 24)}
                style={{
                  background: "#fff",
                  borderTop: "1.5px solid #EBEEF3",
                  borderRight: "1.5px solid #EBEEF3",
                  borderBottom: "1.5px solid #EBEEF3",
                  borderLeft: "1.5px solid #EBEEF3",
                  borderRadius: 8, padding: "10px 28px",
                  fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
                }}
              >
                더 보기 ({filtered.length - visibleCount}개 남음)
              </button>
            </div>
          )}
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}
