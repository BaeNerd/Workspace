import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminScopeSelect from "../../components/AdminScopeSelect";
import type { ScopeSelection } from "../../components/AdminScopeSelect";
import { CATEGORIES } from "../../types/categoryTypes";
import { useAuth } from "../../context/useAuth";
import { getDashboardData, orgCompanyName } from "../../lib/dataSource";
import type { SourceKey } from "../../lib/dataSource";
import { COLOR } from "../../styles/tokens";

// 출처 표시용 정의 — CATEGORIES 단일 소스에서 파생 (7유형: etc 포함)
const SOURCES: { key: SourceKey; label: string; color: string }[] =
  CATEGORIES.map(p => ({ key: p.id, label: p.name, color: p.color }));

const sourceColor = (key: SourceKey) => SOURCES.find(s => s.key === key)!.color;
const sourceLabel = (key: SourceKey) => SOURCES.find(s => s.key === key)!.label;

const detailPathOf = (source: SourceKey, id: string) => {
  const category = CATEGORIES.find(p => p.id === source)!;
  return `${category.path}/${id}`;
};

// 운영 콕핏 = "지금 내가 처리할 것"에 답한다. 수치는 자산 SSOT·검토 큐·후기·게시글에서 파생되며
// (승인 대기 = 검토 큐 미종결분 / 최근 게시 = 게시 카탈로그 최신순 / 최근 활동 = 후기·게시글 최신순),
// 파생·범위 집계는 dataSource.getDashboardData가 담당한다. 분석성 차트(추이·분포)는 통계(ADM-04) 소관이라
// 콕핏에 두지 않는다. 기간 필터는 없다(고정 스냅숏).

const CARD_BORDER = `1.5px solid ${COLOR.border}`;

// 검토 단계 칩 색 — 값은 파일에 이미 쓰이는 강조색을 재사용(칩 배경은 중립 토큰). 승인 대기=주황, 부분 승인=파랑.
const STAGE_COLOR: Record<string, string> = { "승인 대기": "#D97706", "부분 승인": "#2563EB" };

// 담당 관계사 배지 텍스트 (코드 → 표시명, 조직 SSOT orgCompanyName 파생)
const scopeCompanyNames = (codes: string[]): string =>
  codes.map(c => orgCompanyName(c)).join(" · ");

const ACTIVITY_LABEL: Record<"review" | "post", string> = { review: "후기", post: "게시글" };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isCompanyAdmin, managedCompanies } = useAuth();

  // 조회 범위 선택 (표시용 필터). 권한 범위(baseScope) 안에서만 선택 가능.
  const [scopeSel, setScopeSel] = useState<ScopeSelection>({ kind: "all" });
  // 권한 범위: companyAdmin은 담당 관계사만, 그 외(admin)는 전사(null) — 선택기 restrictTo로도 사용
  const baseScope = isCompanyAdmin ? managedCompanies : null;
  const baseKey = baseScope ? [...baseScope].sort().join(",") : "ALL";
  // 역할/담당 구성이 바뀌면(다른 계정 로그인 등) 이전 선택이 남지 않도록 리셋
  useEffect(() => { setScopeSel({ kind: "all" }); }, [baseKey]);
  // 담당 관계사가 지정되지 않은 companyAdmin 예외 케이스
  const noScope = isCompanyAdmin && managedCompanies.length === 0;
  // 선택기 노출: admin 항상 / companyAdmin은 담당 2곳 이상일 때만 (1곳=배지, 0곳=미지정 안내)
  const showScopeSelect = !isCompanyAdmin || managedCompanies.length >= 2;
  // 유효 조회 범위: 개별 관계사 선택 시 해당 코드, 아니면 권한 범위
  const viewScope = scopeSel.kind === "company" ? [scopeSel.code] : baseScope;
  // useMemo 의존성용 안정 키 ("ALL"=전사, ""=담당 없음, 그 외=코드 정렬 조인)
  const scopeKey = viewScope ? [...viewScope].sort().join(",") : "ALL";

  const agg = useMemo(() => {
    const currentScope = scopeKey === "ALL" ? null : (scopeKey === "" ? [] : scopeKey.split(","));
    return getDashboardData(currentScope);
  }, [scopeKey]);

  const { sourceTotal, pending, recentApproved, recentActivity } = agg;

  // 사이드바 pendingCount — 조회 선택과 무관하게 권한 범위(baseScope) 기준으로 산출
  // (조회 범위는 표시용 필터일 뿐, "내가 처리할 건수" 알림을 바꾸지 않는다)
  // admin: 미종결 대기 항목 전체 / companyAdmin: 담당 범위 내 관계사 슬롯 미승인 항목
  const userPendingCount = getDashboardData(baseScope).pending
    .filter(p => isCompanyAdmin ? !p.approvalSlots.company.approved : true).length;

  // 스냅숏 KPI(소형): 총 카드 수 · 이번 달 신규 · 승인 대기 총계. 참여 부서·관계사류(분석성)는 통계로 위임.
  const totalCards =
    sourceTotal.n8n + sourceTotal.pa + sourceTotal.assistant +
    sourceTotal["ai-orchestration"] + sourceTotal.ml + sourceTotal.vibe + sourceTotal.etc;
  const KPIS = [
    { label: "총 카드 수", value: String(totalCards), sub: "게시된 AX 카드 합산" },
    { label: "이번 달 신규", value: String(agg.newThisMonth), sub: "당월 createdAt 기준" },
    { label: "승인 대기 총계", value: String(pending.length), sub: `부분 승인 ${agg.partialCount}건 포함` },
  ];

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text }}>
      <AdminNavbar />
      <div style={{ display: "flex" }}>
        <AdminSidebar pendingCount={userPendingCount} />
        <main style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{isCompanyAdmin ? "관계사 관리자" : "관리자"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>대시보드</h1>
                {showScopeSelect ? (
                  <AdminScopeSelect value={scopeSel} onChange={setScopeSel} restrictTo={baseScope} />
                ) : !noScope && baseScope ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B4602E", background: "#FBEEE4", padding: "3px 10px", borderRadius: 20 }}>
                    담당 관계사 {baseScope.length}곳: {scopeCompanyNames(baseScope)}
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>지금 처리할 승인 대기·수정 요청과 최근 게시·활동을 한눈에 봅니다.</p>
            </div>
          </div>

          {noScope && (
            <div style={{ background: "#FBEEE4", border: "1px solid #F0D4BF", borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 13, fontWeight: 600, color: "#B4602E" }}>
              담당 관계사가 지정되지 않았습니다. 전사관리자에게 문의하세요.
            </div>
          )}

          {/* 스냅숏 KPI (소형) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
            {KPIS.map((k, i) => (
              <div key={i} style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLOR.text3, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.03em", marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: COLOR.text3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* 액션 대기 ROW — 승인 대기 큐 + 수정 요청 대기 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>승인 대기 <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>{pending.length}</span></div>
                <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>검토 화면 →</span>
              </div>
              {pending.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>승인 대기 건이 없습니다.</div>
              ) : pending.slice(0, 5).map((p, i, arr) => (
                <div
                  key={p.id}
                  onClick={() => navigate("/admin/review")}
                  style={{
                    padding: "12px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLOR.bgSubtle)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <span style={{ fontSize: 10, color: COLOR.text3, flexShrink: 0, fontFamily: "var(--font-mono)" }}>{p.id}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: STAGE_COLOR[p.stage] ?? COLOR.text3, background: COLOR.bgSubtle, padding: "1px 8px", borderRadius: 20 }}>{p.stage}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#B4602E", background: "#FBEEE4", padding: "1px 8px", borderRadius: 20 }}>{orgCompanyName(p.company)}</span>
                      <span style={{ fontSize: 11, color: COLOR.text3 }}>{p.dept}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: COLOR.text3, flexShrink: 0 }}>{p.submittedAt}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>수정 요청 대기 <span style={{ fontSize: 12, color: COLOR.text3, fontWeight: 700 }}>0</span></div>
                <span onClick={() => navigate("/admin/review")} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>검토 화면 →</span>
              </div>
              {/* 게시본 수정 요청은 검토 화면에서 처리한다. 데모 수집 데이터가 없어 빈 상태로 표시(데이터 신설 금지). */}
              <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>대기 중인 수정 요청이 없습니다.</div>
            </div>
          </div>

          {/* 현황 ROW — 최근 게시된 카드 + 최근 활동 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>최근 게시된 카드</div>
                <span onClick={() => navigate("/admin/projects")} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>카드 관리 →</span>
              </div>
              {recentApproved.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>게시된 카드가 없습니다.</div>
              ) : recentApproved.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate("/admin/projects")}
                  style={{
                    padding: "12px 18px", borderBottom: i < recentApproved.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLOR.bgSubtle)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: sourceColor(p.source), padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>{sourceLabel(p.source)}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text3 }}>{p.dept}</div>
                  </div>
                  <span style={{ fontSize: 10, color: COLOR.text3, flexShrink: 0 }}>{p.approvedAt}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: CARD_BORDER, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.bgSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>최근 활동 <span style={{ fontSize: 11, color: COLOR.text3, fontWeight: 500, marginLeft: 4 }}>후기 · 게시글</span></div>
              </div>
              {recentActivity.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", fontSize: 12, color: COLOR.text3 }}>최근 활동이 없습니다.</div>
              ) : recentActivity.map((a, i) => (
                <div
                  key={`${a.activity}-${a.itemId}-${i}`}
                  onClick={() => navigate(detailPathOf(a.source, a.itemId))}
                  style={{
                    padding: "12px 18px", borderBottom: i < recentActivity.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLOR.bgSubtle)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: COLOR.text2, background: COLOR.bgSubtle, padding: "1px 7px", borderRadius: 20, flexShrink: 0 }}>{ACTIVITY_LABEL[a.activity]}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.itemTitle}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLOR.text3 }}>{a.author} · {a.dept}</div>
                  </div>
                  <span style={{ fontSize: 10, color: COLOR.text3, flexShrink: 0 }}>{a.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 분석 위임 링크 — 추이·분포 등 상세 분석은 통계(ADM-04) 소관 */}
          <div style={{ fontSize: 12, color: COLOR.text3 }}>
            등록 추이·카테고리 분포 등 상세 분석은
            <span onClick={() => navigate("/admin/statistics")} style={{ color: COLOR.primary, fontWeight: 600, cursor: "pointer", marginLeft: 4 }}>통계에서 보기 →</span>
          </div>

        </main>
      </div>
    </div>
  );
}
