import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId } from "../types/platformTypes";

type ApprovalStatus = "승인" | "대기" | "반려";
const STATUS_OPTIONS = ["개발 중", "운영 중", "파일럿", "보류", "종료"];

type MyItem = {
  id: string;
  kind: PlatformId;
  title: string;
  summary: string;
  submittedAt: string;
  updatedAt: string;
  approval: ApprovalStatus;
  status: string;
  rejectionReason: string | null;
};

const INITIAL_ITEMS: MyItem[] = [
  {
    id: "N8N-012", kind: "n8n",
    title: "신규 입사자 계정 자동 생성",
    summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성하는 n8n 워크플로우",
    submittedAt: "2025.02.10", updatedAt: "2025.02.14",
    approval: "승인", status: "운영 중",
    rejectionReason: null,
  },
  {
    id: "AST-011", kind: "assistant",
    title: "원료 성분 규제 문의 봇",
    summary: "원료 MSDS·규제 데이터를 자연어로 검색하는 HK GPT 커스텀 봇",
    submittedAt: "2025.05.06", updatedAt: "2025.05.09",
    approval: "승인", status: "파일럿",
    rejectionReason: null,
  },
  {
    id: "PA-003", kind: "pa",
    title: "신제품 출시 승인 자동화 플로우",
    summary: "신제품 등록 시 관련 부서 순차 승인을 Power Automate로 자동화",
    submittedAt: "2025.06.01", updatedAt: "2025.06.01",
    approval: "대기", status: "개발 중",
    rejectionReason: null,
  },
  {
    id: "ML-005", kind: "ml",
    title: "색차 불량 이미지 분류 모델",
    summary: "분광측색계 이미지를 분석해 색차 불량 여부를 자동 판정하는 ML 모델",
    submittedAt: "2025.05.20", updatedAt: "2025.05.22",
    approval: "반려", status: "개발 중",
    rejectionReason: "유사한 기능의 ML 모델이 이미 운영 중입니다(ML-001). 해당 모델 담당자와 협의 후 개선 방향을 명확히 하여 재제출해 주세요.",
  },
];

const APPROVAL_STYLE: Record<ApprovalStatus, { bg: string; color: string; dot: string }> = {
  "승인": { bg: "#D1FAE5", color: "#065F46", dot: "#059669" },
  "대기": { bg: "#FEF3C7", color: "#92400E", dot: "#D97706" },
  "반려": { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

function StatusChanger({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const isTerminated = status === "종료";
  return (
    <div>
      <select
        value={status}
        disabled={isTerminated}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: 11, fontWeight: 700,
          background: STATUS_COLOR[status]?.bg, color: STATUS_COLOR[status]?.color,
          border: "none", borderRadius: 20, padding: "3px 22px 3px 10px",
          cursor: isTerminated ? "not-allowed" : "pointer", outline: "none",
          opacity: isTerminated ? 0.7 : 1,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(STATUS_COLOR[status]?.color ?? "#475569")}' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
        }}
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {isTerminated && (
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
          종료된 항목의 상태 복원은 관리자에게 문의하세요.
        </div>
      )}
    </div>
  );
}

const platformPathOf = (kind: PlatformId, id: string) => {
  const p = PLATFORMS.find(pl => pl.id === kind);
  return p ? `${p.path}/${id}` : "/projects";
};

export default function MyStatusPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"전체" | ApprovalStatus>("전체");
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
    // TODO: 실제 연동 시 PATCH /api/v1/platform-items/:id/status (body: { status: newStatus })
    setStatusOverrides(p => ({ ...p, [id]: newStatus }));
  };

  const visible = items.filter(i => !deleted.includes(i.id) && (filter === "전체" || i.approval === filter));
  const counts = {
    "전체": items.filter(i => !deleted.includes(i.id)).length,
    "승인": items.filter(i => !deleted.includes(i.id) && i.approval === "승인").length,
    "대기": items.filter(i => !deleted.includes(i.id) && i.approval === "대기").length,
    "반려": items.filter(i => !deleted.includes(i.id) && i.approval === "반려").length,
  };

  const STAT_TABS: { key: "전체" | ApprovalStatus; label: string; color: string }[] = [
    { key: "전체", label: "전체", color: "#0F172A" },
    { key: "승인", label: "승인", color: "#059669" },
    { key: "대기", label: "대기", color: "#D97706" },
    { key: "반려", label: "반려", color: "#EF4444" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>나의 등록</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>내 등록 현황</h1>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 32px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {STAT_TABS.map(s => (
            <div key={s.key} onClick={() => setFilter(s.key)} style={{
              background: filter === s.key ? s.color : "#fff",
              border: `1.5px solid ${filter === s.key ? s.color : "#E2E8F0"}`,
              borderRadius: 10, padding: "16px 20px",
              cursor: "pointer", transition: "all 0.15s",
              boxShadow: filter === s.key ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: filter === s.key ? "#fff" : s.color }}>
                {counts[s.key]}
              </div>
              <div style={{ fontSize: 12, marginTop: 3, fontWeight: 500, color: filter === s.key ? "rgba(255,255,255,0.8)" : "#64748B" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8", fontSize: 14 }}>
              해당 상태의 신청 내역이 없습니다.
            </div>
          )}
          {visible.map((item) => {
            const aStyle = APPROVAL_STYLE[item.approval];
            const isExpanded = expanded === item.id;
            const isResubmit = resubmit === item.id;
            const isDeleteConfirm = deleteConfirm === item.id;
            const platformMeta = PLATFORMS.find(p => p.id === item.kind);

            return (
              <div key={item.id} style={{
                background: "#fff", borderRadius: 10,
                border: `1.5px solid ${item.approval === "반려" ? "#FECACA" : "#E2E8F0"}`,
                overflow: "hidden",
              }}>
                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: item.approval === "승인" ? "pointer" : "default" }}
                      onClick={() => item.approval === "승인" && navigate(platformPathOf(item.kind, item.id))}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#94A3B8" }}>{item.id}</span>

                        {item.approval === "승인" ? (
                          <span onClick={e => e.stopPropagation()}>
                            <StatusChanger status={item.status} onChange={v => handleStatusChange(item.id, v)} />
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: STATUS_COLOR[item.status]?.bg,
                            color: STATUS_COLOR[item.status]?.color,
                            padding: "2px 8px", borderRadius: 20,
                          }}>{item.status}</span>
                        )}

                        {platformMeta && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: platformMeta.bg, color: platformMeta.color,
                            padding: "2px 8px", borderRadius: 20,
                          }}>{platformMeta.name}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{item.summary}</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: aStyle.bg, padding: "4px 12px", borderRadius: 20 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: aStyle.dot }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: aStyle.color }}>{item.approval}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#CBD5E1", textAlign: "right", lineHeight: 1.8 }}>
                        신청 {item.submittedAt}<br />처리 {item.updatedAt}
                      </div>
                    </div>
                  </div>

                  {item.approval === "반려" && (
                    <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>반려 사유</div>
                      <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.7 }}>{item.rejectionReason}</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => { setExpanded(isExpanded ? null : item.id); setResubmit(null); setDeleteConfirm(null); }} style={{
                      background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 6,
                      padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                    }}>
                      {isExpanded ? "접기" : "내용 확인"}
                    </button>

                    {item.approval === "대기" && (
                      <button onClick={() => setDeleteConfirm(isDeleteConfirm ? null : item.id)} style={{
                        background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6,
                        padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer",
                      }}>
                        신청 취소
                      </button>
                    )}

                    {item.approval === "반려" && (
                      <>
                        <button onClick={() => { setResubmit(isResubmit ? null : item.id); setDeleteConfirm(null); }} style={{
                          background: "#2563EB", border: "none", borderRadius: 6,
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10 }}>등록 내용 요약</div>
                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontSize: 12 }}>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>플랫폼</span>
                      <span style={{ color: "#334155" }}>{platformMeta?.name ?? item.kind}</span>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>항목 ID</span>
                      <span style={{ color: "#334155", fontFamily: "var(--font-mono)" }}>{item.id}</span>
                    </div>
                  </div>
                )}

                {isDeleteConfirm && (
                  <div style={{ borderTop: "1px solid #FECACA", padding: "14px 22px", background: "#FEF2F2" }}>
                    <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 10 }}>이 신청 건을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                      <button onClick={() => { setDeleted(p => [...p, item.id]); setDeleteConfirm(null); }} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>삭제 확인</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
