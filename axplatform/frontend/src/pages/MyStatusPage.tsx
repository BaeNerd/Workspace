import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CATEGORIES, APPROVAL_SLOT_LABEL, deriveStage } from "../types/categoryTypes";
import type { CategoryId, ApprovalStage, ApprovalSlots, ApprovalSlotKey } from "../types/categoryTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";
import CardIdTag from "../components/CardIdTag";
import { useVisibleCount } from "../hooks/useVisibleCount";
import LoadMoreButton from "../components/LoadMoreButton";
import { getMyApplications, getMyReviews } from "../lib/dataSource";

// 운영 상태(PlatformItemStatus)는 폐기. 승인 수명주기(승인 대기/부분 승인/게시됨/반려/중지)만 유지.
export type MyItem = {
  id: string;
  kind: CategoryId;
  title: string;
  summary: string;
  submittedAt: string;
  updatedAt: string;
  approvalSlots: ApprovalSlots;
  rejected: boolean;
  suspended: boolean;
  rejectionReason: string | null;
  // 유형별 요약 칩용
  difficulty?: string;
  expectedTimeSaved?: string;
  basedModel?: string;
  agentAvailability?: string;
  costTier?: string;
  mlType?: string;
};

const STAGE_CONFIG: Record<ApprovalStage, { bg: string; fg: string; dot: string; label: string; tabLabel: string }> = {
  "승인 대기": { bg: "#FBF3E4", fg: "#B4802E", dot: "#B4802E", label: "승인 대기", tabLabel: "승인 대기" },
  "부분 승인": { bg: "#E8F0FE", fg: "#2563C9", dot: "#2563C9", label: "부분 승인", tabLabel: "부분 승인" },
  "게시됨":   { bg: "#E6F5EC", fg: "#1F7A46", dot: "#1F7A46", label: "게시됨",   tabLabel: "게시됨"   },
  "반려":     { bg: "#FEE2E2", fg: "#991B1B", dot: "#EF4444", label: "반려",     tabLabel: "반려"     },
  "중지":     { bg: "#EDF0F4", fg: "#4B5768", dot: "#4B5768", label: "중지",     tabLabel: "중지"     },
};

// 병렬 승인 슬롯 칩 (대기 회색 / 승인 초록 체크)
const CHIP_PENDING = { bg: "#EDF0F4", fg: "#94A3B8" };
const CHIP_APPROVED = { bg: "#E6F5EC", fg: "#1F7A46" };

function SlotChip({ slotKey, approved }: { slotKey: ApprovalSlotKey; approved: boolean }) {
  const s = approved ? CHIP_APPROVED : CHIP_PENDING;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: s.bg, color: s.fg, borderRadius: 20, padding: "5px 12px", whiteSpace: "nowrap" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: approved ? "#059669" : "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {approved && <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700 }}>{APPROVAL_SLOT_LABEL[slotKey]}</span>
    </div>
  );
}

// 병렬 승인 인디케이터 — 신청 완료 → (관계사·전사 슬롯 병렬) → 게시 완료
function ParallelApprovalIndicator({ slots, stage }: { slots: ApprovalSlots; stage: ApprovalStage }) {
  if (stage === "반려" || stage === "중지") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", background: STAGE_CONFIG[stage].bg, borderRadius: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_CONFIG[stage].dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: STAGE_CONFIG[stage].fg }}>
          {stage === "반려" ? "승인이 반려되었습니다." : "항목이 중지되었습니다."}
        </span>
      </div>
    );
  }
  const published = stage === "게시됨";
  const node = (on: boolean): React.CSSProperties => ({
    width: 18, height: 18, borderRadius: "50%", background: on ? "#059669" : "#EBEEF3",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLOR.border}`, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={node(true)}><span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span></div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>신청 완료</span>
      </div>
      <div style={{ width: 18, height: 2, background: "#EBEEF3" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SlotChip slotKey="company" approved={slots.company.approved} />
        <SlotChip slotKey="global" approved={slots.global.approved} />
      </div>
      <div style={{ width: 18, height: 2, background: published ? "#059669" : "#EBEEF3" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={node(published)}>{published && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span>}</div>
        <span style={{ fontSize: 11, fontWeight: published ? 700 : 500, color: published ? "#059669" : "#CBD5E1", whiteSpace: "nowrap" }}>게시 완료</span>
      </div>
    </div>
  );
}

const categoryPathOf = (kind: CategoryId, id: string) => {
  const p = CATEGORIES.find(pl => pl.id === kind);
  return p ? `${p.path}/${id}` : "/projects";
};

// 유형별 요약 칩 — 간소화 필드 체계 (vibe·etc는 칩 없음)
function KindSummaryChips({ item }: { item: MyItem }) {
  const chips: { label: string; value: string }[] = [];
  if (item.kind === "n8n") {
    if (item.difficulty) chips.push({ label: "난이도", value: item.difficulty });
    if (item.expectedTimeSaved) chips.push({ label: "절감시간", value: item.expectedTimeSaved });
  } else if (item.kind === "pa") {
    if (item.expectedTimeSaved) chips.push({ label: "절감시간", value: item.expectedTimeSaved });
  } else if (item.kind === "assistant") {
    if (item.basedModel) chips.push({ label: "기반 모델", value: item.basedModel });
  } else if (item.kind === "ai-orchestration") {
    if (item.agentAvailability) chips.push({ label: "가용 여부", value: item.agentAvailability });
    if (item.costTier) chips.push({ label: "비용 등급", value: item.costTier });
  } else if (item.kind === "ml") {
    if (item.mlType) chips.push({ label: "모델 유형", value: item.mlType });
  }
  if (chips.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {chips.map((c, i) => (
        <span key={i} style={{ fontSize: 10, background: COLOR.bgSubtle, color: COLOR.text2, padding: "2px 8px", borderRadius: 4 }}>
          <span style={{ color: COLOR.text3 }}>{c.label} · </span>{c.value}
        </span>
      ))}
    </div>
  );
}

// 승인 단계 기준 탭
const STAT_TABS: { key: "전체" | ApprovalStage; label: string; color: string }[] = [
  { key: "전체",     label: "전체",     color: "#1A1F27" },
  { key: "승인 대기", label: "승인 대기", color: "#B4802E" },
  { key: "부분 승인", label: "부분 승인", color: "#2563C9" },
  { key: "게시됨",    label: "게시됨",    color: "#1F7A46" },
  { key: "반려",     label: "반려",     color: "#EF4444" },
];

export default function MyStatusPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"전체" | ApprovalStage>("전체");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resubmit, setResubmit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const items = useMemo(() => {
    return [...getMyApplications()]
      .sort((a, b) => new Date(b.submittedAt.replace(/\./g, "-")).getTime() - new Date(a.submittedAt.replace(/\./g, "-")).getTime())
      .map(item => ({ ...item, approvalStage: deriveStage(item.approvalSlots, item.rejected, item.suspended) }));
  }, []);

  const visible = items.filter(i => !deleted.includes(i.id) && (filter === "전체" || i.approvalStage === filter));
  // 신청 목록 성장형 — 승인 단계 탭이 바뀌면 표시 수 초기화.
  const { visibleCount, showMore } = useVisibleCount(10, 10, filter);
  const counts: Record<"전체" | ApprovalStage, number> = {
    "전체":     items.filter(i => !deleted.includes(i.id)).length,
    "승인 대기": items.filter(i => !deleted.includes(i.id) && i.approvalStage === "승인 대기").length,
    "부분 승인": items.filter(i => !deleted.includes(i.id) && i.approvalStage === "부분 승인").length,
    "게시됨":    items.filter(i => !deleted.includes(i.id) && i.approvalStage === "게시됨").length,
    "반려":     items.filter(i => !deleted.includes(i.id) && i.approvalStage === "반려").length,
    "중지":     items.filter(i => !deleted.includes(i.id) && i.approvalStage === "중지").length,
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>나의 등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>내 등록 현황</h1>
        </div>
      </div>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "24px 32px", width: "100%", boxSizing: "border-box" }}>

        {/* ===== 승인 단계 탭 KPI ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
          {STAT_TABS.map(s => (
            <div key={s.key} onClick={() => setFilter(s.key)} style={{
              background: filter === s.key ? s.color : "#fff",
              border: `1.5px solid ${filter === s.key ? s.color : COLOR.border}`,
              borderRadius: 10, padding: "14px 16px",
              cursor: "pointer", boxShadow: filter === s.key ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: filter === s.key ? "#fff" : s.color }}>
                {counts[s.key as keyof typeof counts] ?? 0}
              </div>
              <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600, color: filter === s.key ? "rgba(255,255,255,0.8)" : COLOR.text2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ===== 신청 목록 ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: COLOR.text3, fontSize: 14 }}>
              해당 단계의 신청 내역이 없습니다.
            </div>
          )}
          {visible.slice(0, visibleCount).map((item) => {
            const stageStyle = STAGE_CONFIG[item.approvalStage];
            const isExpanded = expanded === item.id;
            const isResubmit = resubmit === item.id;
            const isDeleteConfirm = deleteConfirm === item.id;
            const categoryMeta = CATEGORIES.find(p => p.id === item.kind);
            const isPublished = item.approvalStage === "게시됨";
            const isPending = item.approvalStage === "승인 대기" || item.approvalStage === "부분 승인";
            const isRejected = item.approvalStage === "반려";

            return (
              <div key={item.id} style={{
                background: "#fff", borderRadius: 10,
                border: `1.5px solid ${isRejected ? "#FECACA" : COLOR.border}`,
                overflow: "hidden",
              }}>
                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: isPublished ? "pointer" : "default" }}
                      onClick={() => isPublished && navigate(categoryPathOf(item.kind, item.id))}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        {/* 항목 ID — 메타 줄 선두(dept 미표기 줄, 0.3·USR-07). 공용 CardIdTag 단일 컴포넌트. */}
                        <CardIdTag id={item.id} />
                        {categoryMeta && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: categoryMeta.bg, color: categoryMeta.color, padding: "2px 8px", borderRadius: 20 }}>{categoryMeta.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: COLOR.text2 }}>{item.summary}</div>
                      <KindSummaryChips item={item} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: stageStyle.bg, padding: "4px 12px", borderRadius: 20 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: stageStyle.dot }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: stageStyle.fg }}>{stageStyle.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#CBD5E1", textAlign: "right", lineHeight: 1.8 }}>
                        신청 {item.submittedAt}<br />처리 {item.updatedAt}
                      </div>
                    </div>
                  </div>

                  {/* 승인 진행 인디케이터 (병렬 2슬롯) */}
                  <ParallelApprovalIndicator slots={item.approvalSlots} stage={item.approvalStage} />

                  {isRejected && item.rejectionReason && (
                    <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>반려 사유</div>
                      <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.7 }}>{item.rejectionReason}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => { setExpanded(isExpanded ? null : item.id); setResubmit(null); setDeleteConfirm(null); }} style={{
                      background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                      padding: "6px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
                    }}>
                      {isExpanded ? "접기" : "내용 확인"}
                    </button>

                    {isPending && (
                      <button onClick={() => setDeleteConfirm(isDeleteConfirm ? null : item.id)} style={{
                        background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                        padding: "6px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
                      }}>
                        신청 취소
                      </button>
                    )}

                    {/* 게시된 항목의 정보 정정 요청 진입(USR-06, /edit-request/:id) */}
                    {isPublished && (
                      <button onClick={() => navigate(`/edit-request/${item.id}`)} style={{
                        background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                        padding: "6px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
                      }}>
                        수정 요청
                      </button>
                    )}

                    {isRejected && (
                      <>
                        <button onClick={() => { setResubmit(isResubmit ? null : item.id); setDeleteConfirm(null); }} style={{
                          background: COLOR.primary, border: "none", borderRadius: 6,
                          padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
                        }}>
                          수정 후 재제출
                        </button>
                        <button onClick={() => { setDeleteConfirm(isDeleteConfirm ? null : item.id); setResubmit(null); }} style={{
                          background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6,
                          padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: "pointer",
                        }}>
                          신청 삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${COLOR.bgSubtle}`, padding: "16px 22px", background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text2, marginBottom: 10 }}>등록 내용 요약</div>
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontSize: 12 }}>
                      <span style={{ color: COLOR.text3, fontWeight: 600 }}>카테고리</span>
                      <span style={{ color: COLOR.text2 }}>{categoryMeta?.name ?? item.kind}</span>
                      <span style={{ color: COLOR.text3, fontWeight: 600 }}>항목 ID</span>
                      <span style={{ color: COLOR.text2, fontFamily: "var(--font-mono)" }}>{item.id}</span>
                      {item.kind === "n8n" && item.difficulty && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>구성 난이도</span><span style={{ color: COLOR.text2 }}>{item.difficulty}</span></>
                      )}
                      {(item.kind === "n8n" || item.kind === "pa") && item.expectedTimeSaved && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>예상 절감 시간</span><span style={{ color: COLOR.text2 }}>{item.expectedTimeSaved}</span></>
                      )}
                      {item.kind === "assistant" && item.basedModel && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>기반 모델</span><span style={{ color: COLOR.text2 }}>{item.basedModel}</span></>
                      )}
                      {item.kind === "ai-orchestration" && item.agentAvailability && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>가용 여부</span><span style={{ color: COLOR.text2 }}>{item.agentAvailability}</span></>
                      )}
                      {item.kind === "ai-orchestration" && item.costTier && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>비용 등급</span><span style={{ color: COLOR.text2 }}>{item.costTier}</span></>
                      )}
                      {item.kind === "ml" && item.mlType && (
                        <><span style={{ color: COLOR.text3, fontWeight: 600 }}>모델 유형</span><span style={{ color: COLOR.text2 }}>{item.mlType}</span></>
                      )}
                    </div>
                  </div>
                )}

                {isDeleteConfirm && (
                  <div style={{ borderTop: "1px solid #FECACA", padding: "14px 22px", background: "#FEF2F2" }}>
                    <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 10 }}>이 신청 건을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer" }}>취소</button>
                      <button onClick={() => { setDeleted(p => [...p, item.id]); setDeleteConfirm(null); }} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <LoadMoreButton remaining={visible.length - visibleCount} onClick={showMore} />

        {/* ===== 내가 남긴 후기 ===== */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLOR.text, marginBottom: 16, letterSpacing: "-0.01em" }}>내가 남긴 후기</div>
          {getMyReviews().length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: COLOR.text3, fontSize: 13 }}>아직 남긴 후기가 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {getMyReviews().map(r => {
                const category = CATEGORIES.find(p => p.id === r.itemKind);
                return (
                  <div key={r.id} style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      {category && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: category.bg, color: category.color, padding: "2px 7px", borderRadius: 20 }}>{category.name}</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{r.itemTitle}</span>
                    </div>
                    <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7, marginBottom: 10 }}>{r.text}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: COLOR.text3 }}>
                      <span>{r.createdAt}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        {r.likes}명이 도움됨
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}
