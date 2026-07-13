import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS, STATUS_ORDER, STATUS_COLOR } from "../types/platformTypes";
import type { PlatformId, ApprovalStage, PlatformReview } from "../types/platformTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";

const TERMINAL_STATUSES = new Set(["사용 중지"]);

type MyItem = {
  id: string;
  kind: PlatformId;
  title: string;
  summary: string;
  submittedAt: string;
  updatedAt: string;
  approvalStage: ApprovalStage;
  status: string;
  rejectionReason: string | null;
  difficulty?: string;
  expectedTimeSaved?: string;
  shareScope?: string;
  provider?: string;
  costTier?: string;
  mlType?: string;
  devTool?: string;
};

const INITIAL_ITEMS: MyItem[] = [
  {
    id: "N8N-012", kind: "n8n",
    title: "신규 입사자 계정 자동 생성",
    summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성하는 n8n 워크플로우",
    submittedAt: "2025.02.10", updatedAt: "2025.02.14",
    approvalStage: "게시됨", status: "사용 가능",
    rejectionReason: null,
    difficulty: "보통", expectedTimeSaved: "주 2시간",
  },
  {
    id: "AST-011", kind: "assistant",
    title: "원료 성분 규제 문의 봇",
    summary: "원료 MSDS·규제 데이터를 자연어로 검색하는 HK GPT 커스텀 봇",
    submittedAt: "2025.05.06", updatedAt: "2025.05.09",
    approvalStage: "2차대기", status: "준비 중",
    rejectionReason: null,
    shareScope: "팀 공유 비서",
  },
  {
    id: "PA-003", kind: "pa",
    title: "신제품 출시 승인 자동화 플로우",
    summary: "신제품 등록 시 관련 부서 순차 승인을 Power Automate로 자동화",
    submittedAt: "2025.06.01", updatedAt: "2025.06.01",
    approvalStage: "1차대기", status: "준비 중",
    rejectionReason: null,
    difficulty: "쉬움",
  },
  {
    id: "ML-005", kind: "ml",
    title: "색차 불량 이미지 분류 모델",
    summary: "분광측색계 이미지를 분석해 색차 불량 여부를 자동 판정하는 ML 모델",
    submittedAt: "2025.05.20", updatedAt: "2025.05.22",
    approvalStage: "반려", status: "준비 중",
    rejectionReason: "유사한 기능의 ML 모델이 이미 운영 중입니다(ML-001). 해당 모델 담당자와 협의 후 개선 방향을 명확히 하여 재제출해 주세요.",
    mlType: "이미지 인식",
  },
];

const MOCK_MY_REVIEWS: PlatformReview[] = [
  {
    id: "mr1", itemId: "N8N-001", itemTitle: "신규 입사자 계정 자동 생성",
    itemKind: "n8n", author: "나", dept: "IT인프라팀",
    text: "입사자 계정 생성 시간이 1시간에서 5분으로 줄었습니다. 현업 부서 만족도가 매우 높습니다.",
    createdAt: "2025.06.10", likes: 8,
  },
  {
    id: "mr2", itemId: "AST-001", itemTitle: "해외법인 계약서 1차 검토 비서",
    itemKind: "assistant", author: "나", dept: "IT인프라팀",
    text: "영문 계약서 리뷰 시간이 절반으로 줄었어요. 사소한 오류도 잘 잡아줍니다.",
    createdAt: "2025.06.20", likes: 5,
  },
];

const STAGE_CONFIG: Record<ApprovalStage, { bg: string; fg: string; dot: string; label: string; tabLabel: string }> = {
  "1차대기": { bg: "#FBF3E4", fg: "#B4802E", dot: "#B4802E", label: "1차 대기", tabLabel: "1차 대기" },
  "2차대기": { bg: "#E8F0FE", fg: "#2563C9", dot: "#2563C9", label: "2차 대기", tabLabel: "2차 대기" },
  "게시됨":  { bg: "#E6F5EC", fg: "#1F7A46", dot: "#1F7A46", label: "게시됨",  tabLabel: "게시됨"  },
  "반려":    { bg: "#FEE2E2", fg: "#991B1B", dot: "#EF4444", label: "반려",    tabLabel: "반려"    },
  "중지":    { bg: "#EDF0F4", fg: "#4B5768", dot: "#4B5768", label: "중지",    tabLabel: "중지"    },
};

// 4단계 승인 흐름 인디케이터
const APPROVAL_STEPS: { stage: ApprovalStage | null; label: string }[] = [
  { stage: null,       label: "신청 완료" },
  { stage: "1차대기", label: "1차 검토"  },
  { stage: "2차대기", label: "2차 검토"  },
  { stage: "게시됨",  label: "게시 완료" },
];
const STAGE_STEP_INDEX: Partial<Record<ApprovalStage, number>> = {
  "1차대기": 1,
  "2차대기": 2,
  "게시됨": 3,
  "반려": -1,
  "중지": -1,
};

function ApprovalIndicator({ stage }: { stage: ApprovalStage }) {
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
  const currentStep = STAGE_STEP_INDEX[stage] ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
      {APPROVAL_STEPS.map((step, i) => {
        const isDone = i < currentStep || (i === 0);
        const isCurrent = i === currentStep && stage !== "게시됨";
        const isFuture = !isDone && !isCurrent;
        const dotBg = isDone || (stage === "게시됨" && i === 3) ? "#059669" : isCurrent ? "#1C6BFF" : "#EBEEF3";
        const dotBorder = isCurrent ? "2px solid #1C6BFF" : "none";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: dotBg, border: dotBorder, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {(isDone || stage === "게시됨") && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isFuture ? "#CBD5E1" : isCurrent ? "#1C6BFF" : "#475569", whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
            {i < 3 && (
              <div style={{ flex: 1, height: 2, background: i < currentStep ? "#059669" : "#EBEEF3", margin: "0 4px", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusChanger({ status, onChange }: { status: string; kind: PlatformId; onChange: (v: string) => void }) {
  const isTerminal = TERMINAL_STATUSES.has(status);
  const sc = STATUS_COLOR[status as import("../types/platformTypes").PlatformItemStatus] ?? { bg: "#F1F5F9", fg: "#475569" };
  return (
    <div>
      <select value={status} disabled={isTerminal} onChange={e => onChange(e.target.value)} style={{
        fontSize: 11, fontWeight: 700,
        background: sc.bg, color: sc.fg,
        border: "none", borderRadius: 20, padding: "3px 22px 3px 10px",
        cursor: isTerminal ? "not-allowed" : "pointer", outline: "none",
        opacity: isTerminal ? 0.7 : 1, appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(sc.fg)}' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
      }}>
        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {isTerminal && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>종료 상태는 관리자에게 복원 요청이 필요합니다.</div>}
    </div>
  );
}

const platformPathOf = (kind: PlatformId, id: string) => {
  const p = PLATFORMS.find(pl => pl.id === kind);
  return p ? `${p.path}/${id}` : "/projects";
};

function KindSummaryChips({ item }: { item: MyItem }) {
  const chips: { label: string; value: string }[] = [];
  if (item.kind === "n8n" || item.kind === "pa") {
    if (item.difficulty) chips.push({ label: "난이도", value: item.difficulty });
    if (item.expectedTimeSaved) chips.push({ label: "절감시간", value: item.expectedTimeSaved });
  } else if (item.kind === "assistant") {
    if (item.shareScope) chips.push({ label: "공유 범위", value: item.shareScope });
  } else if (item.kind === "ai-orchestration") {
    if (item.provider) chips.push({ label: "제공사", value: item.provider });
    if (item.costTier) chips.push({ label: "비용 등급", value: item.costTier });
  } else if (item.kind === "ml") {
    if (item.mlType) chips.push({ label: "모델 유형", value: item.mlType });
  } else if (item.kind === "vibe") {
    if (item.devTool) chips.push({ label: "AI 도구", value: item.devTool });
  }
  if (chips.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {chips.map((c, i) => (
        <span key={i} style={{ fontSize: 10, background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 4 }}>
          <span style={{ color: "#94A3B8" }}>{c.label} · </span>{c.value}
        </span>
      ))}
    </div>
  );
}

const STAT_TABS: { key: "전체" | ApprovalStage; label: string; color: string }[] = [
  { key: "전체",   label: "전체",   color: "#1A1F27" },
  { key: "1차대기", label: "1차 대기", color: "#B4802E" },
  { key: "2차대기", label: "2차 대기", color: "#2563C9" },
  { key: "게시됨",  label: "게시됨",  color: "#1F7A46" },
  { key: "반려",   label: "반려",   color: "#EF4444" },
];

export default function MyStatusPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"전체" | ApprovalStage>("전체");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resubmit, setResubmit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const items = useMemo(() => {
    return [...INITIAL_ITEMS]
      .sort((a, b) => new Date(b.submittedAt.replace(/\./g, "-")).getTime() - new Date(a.submittedAt.replace(/\./g, "-")).getTime())
      .map(item => ({ ...item, status: statusOverrides[item.id] ?? item.status }));
  }, [statusOverrides]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setStatusOverrides(p => ({ ...p, [id]: newStatus }));
  };

  const visible = items.filter(i => !deleted.includes(i.id) && (filter === "전체" || i.approvalStage === filter));
  const counts: Record<"전체" | ApprovalStage, number> = {
    "전체":   items.filter(i => !deleted.includes(i.id)).length,
    "1차대기": items.filter(i => !deleted.includes(i.id) && i.approvalStage === "1차대기").length,
    "2차대기": items.filter(i => !deleted.includes(i.id) && i.approvalStage === "2차대기").length,
    "게시됨":  items.filter(i => !deleted.includes(i.id) && i.approvalStage === "게시됨").length,
    "반려":   items.filter(i => !deleted.includes(i.id) && i.approvalStage === "반려").length,
    "중지":   items.filter(i => !deleted.includes(i.id) && i.approvalStage === "중지").length,
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F4F6F9", minHeight: "100vh", color: "#1A1F27", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #EBEEF3", padding: "20px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1C6BFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>나의 등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A1F27", letterSpacing: "-0.02em" }}>내 등록 현황</h1>
        </div>
      </div>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "24px 32px", width: "100%", boxSizing: "border-box" }}>

        {/* ===== 상태 탭 KPI ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
          {STAT_TABS.map(s => (
            <div key={s.key} onClick={() => setFilter(s.key)} style={{
              background: filter === s.key ? s.color : "#fff",
              border: `1.5px solid ${filter === s.key ? s.color : "#EBEEF3"}`,
              borderRadius: 10, padding: "14px 16px",
              cursor: "pointer", boxShadow: filter === s.key ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: filter === s.key ? "#fff" : s.color }}>
                {counts[s.key as keyof typeof counts] ?? 0}
              </div>
              <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600, color: filter === s.key ? "rgba(255,255,255,0.8)" : "#697386" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ===== 신청 목록 ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8", fontSize: 14 }}>
              해당 상태의 신청 내역이 없습니다.
            </div>
          )}
          {visible.map((item) => {
            const stageStyle = STAGE_CONFIG[item.approvalStage];
            const isExpanded = expanded === item.id;
            const isResubmit = resubmit === item.id;
            const isDeleteConfirm = deleteConfirm === item.id;
            const platformMeta = PLATFORMS.find(p => p.id === item.kind);
            const isPublished = item.approvalStage === "게시됨";
            const isPending = item.approvalStage === "1차대기" || item.approvalStage === "2차대기";
            const isRejected = item.approvalStage === "반려";

            return (
              <div key={item.id} style={{
                background: "#fff", borderRadius: 10,
                border: `1.5px solid ${isRejected ? "#FECACA" : "#EBEEF3"}`,
                overflow: "hidden",
              }}>
                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: isPublished ? "pointer" : "default" }}
                      onClick={() => isPublished && navigate(platformPathOf(item.kind, item.id))}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#94A3B8" }}>{item.id}</span>

                        {isPublished ? (
                          <span onClick={e => e.stopPropagation()}>
                            <StatusChanger status={item.status} kind={item.kind} onChange={v => handleStatusChange(item.id, v)} />
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_COLOR[item.status as import("../types/platformTypes").PlatformItemStatus]?.bg ?? "#F1F5F9", color: STATUS_COLOR[item.status as import("../types/platformTypes").PlatformItemStatus]?.fg ?? "#475569", padding: "2px 8px", borderRadius: 20 }}>
                            {item.status}
                          </span>
                        )}

                        {item.status === "준비 중" && !isPublished && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#E8F0FE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 20, border: "1px solid #BFDBFE" }}>
                            게시 후 활성화
                          </span>
                        )}

                        {platformMeta && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: platformMeta.bg, color: platformMeta.color, padding: "2px 8px", borderRadius: 20 }}>{platformMeta.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F27", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#697386" }}>{item.summary}</div>
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

                  {/* 승인 진행 인디케이터 */}
                  <ApprovalIndicator stage={item.approvalStage} />

                  {isRejected && item.rejectionReason && (
                    <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>반려 사유</div>
                      <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.7 }}>{item.rejectionReason}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => { setExpanded(isExpanded ? null : item.id); setResubmit(null); setDeleteConfirm(null); }} style={{
                      background: "#F4F6F9", border: "1.5px solid #EBEEF3", borderRadius: 6,
                      padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                    }}>
                      {isExpanded ? "접기" : "내용 확인"}
                    </button>

                    {isPending && (
                      <button onClick={() => setDeleteConfirm(isDeleteConfirm ? null : item.id)} style={{
                        background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 6,
                        padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#697386", cursor: "pointer",
                      }}>
                        신청 취소
                      </button>
                    )}

                    {isRejected && (
                      <>
                        <button onClick={() => { setResubmit(isResubmit ? null : item.id); setDeleteConfirm(null); }} style={{
                          background: "#1C6BFF", border: "none", borderRadius: 6,
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
                  <div style={{ borderTop: "1px solid #F1F5F9", padding: "16px 22px", background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#697386", marginBottom: 10 }}>등록 내용 요약</div>
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontSize: 12 }}>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>플랫폼</span>
                      <span style={{ color: "#334155" }}>{platformMeta?.name ?? item.kind}</span>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>항목 ID</span>
                      <span style={{ color: "#334155", fontFamily: "var(--font-mono)" }}>{item.id}</span>
                      {(item.kind === "n8n" || item.kind === "pa") && item.difficulty && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>구성 난이도</span><span style={{ color: "#334155" }}>{item.difficulty}</span></>
                      )}
                      {(item.kind === "n8n" || item.kind === "pa") && item.expectedTimeSaved && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>예상 절감 시간</span><span style={{ color: "#334155" }}>{item.expectedTimeSaved}</span></>
                      )}
                      {item.kind === "assistant" && item.shareScope && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>공유 범위</span><span style={{ color: "#334155" }}>{item.shareScope}</span></>
                      )}
                      {item.kind === "ai-orchestration" && item.provider && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>제공사</span><span style={{ color: "#334155" }}>{item.provider}</span></>
                      )}
                      {item.kind === "ai-orchestration" && item.costTier && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>비용 등급</span><span style={{ color: "#334155" }}>{item.costTier}</span></>
                      )}
                      {item.kind === "ml" && item.mlType && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>모델 유형</span><span style={{ color: "#334155" }}>{item.mlType}</span></>
                      )}
                      {item.kind === "vibe" && item.devTool && (
                        <><span style={{ color: "#94A3B8", fontWeight: 600 }}>사용 AI 도구</span><span style={{ color: "#334155" }}>{item.devTool}</span></>
                      )}
                    </div>
                  </div>
                )}

                {isDeleteConfirm && (
                  <div style={{ borderTop: "1px solid #FECACA", padding: "14px 22px", background: "#FEF2F2" }}>
                    <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 10 }}>이 신청 건을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#697386", cursor: "pointer" }}>취소</button>
                      <button onClick={() => { setDeleted(p => [...p, item.id]); setDeleteConfirm(null); }} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== 내가 남긴 후기 ===== */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1F27", marginBottom: 16, letterSpacing: "-0.01em" }}>내가 남긴 후기</div>
          {MOCK_MY_REVIEWS.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 13 }}>아직 남긴 후기가 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MOCK_MY_REVIEWS.map(r => {
                const platform = PLATFORMS.find(p => p.id === r.itemKind);
                return (
                  <div key={r.id} style={{ background: "#fff", border: "1.5px solid #EBEEF3", borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      {platform && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: platform.bg, color: platform.color, padding: "2px 7px", borderRadius: 20 }}>{platform.name}</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1F27" }}>{r.itemTitle}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, marginBottom: 10 }}>{r.text}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#94A3B8" }}>
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
