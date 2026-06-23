import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type ApprovalStatus = "승인" | "대기" | "반려";

type MyItem = {
  id: string;
  title: string;
  summary: string;
  submittedAt: string;
  updatedAt: string;
  approval: ApprovalStatus;
  status: string;
  domain: string;
  type: string;
  rejectionReason: string | null;
};

// TODO: 실제 연동 시 GET /api/v1/my/projects 응답으로 교체
const INITIAL_ITEMS: MyItem[] = [
  {
    id: "PRJ-2025-041", title: "조색 예측 ML 모델",
    summary: "원료 배합 데이터 기반 색상 사전 예측 ML 모델",
    submittedAt: "2025.02.10", updatedAt: "2025.02.14",
    approval: "승인", status: "개발 중", domain: "제조/생산", type: "ML/AI 모델",
    rejectionReason: null,
  },
  {
    id: "PRJ-2025-058", title: "원료 입고 품질 검사 자동화",
    summary: "입고 원료의 품질 기준 자동 판정 및 리포팅 시스템",
    submittedAt: "2025.05.06", updatedAt: "2025.05.09",
    approval: "승인", status: "파일럿", domain: "제조/생산", type: "웹 애플리케이션",
    rejectionReason: null,
  },
  {
    id: "PRJ-2025-071", title: "연구 실험 데이터 통합 플랫폼",
    summary: "메이크업연구소 실험 기록을 통합 관리하는 내부 플랫폼",
    submittedAt: "2025.06.01", updatedAt: "2025.06.01",
    approval: "대기", status: "개발 중", domain: "데이터/분석", type: "내부 플랫폼",
    rejectionReason: null,
  },
  {
    id: "PRJ-2025-063", title: "색차 측정 자동 리포트 생성기",
    summary: "분광측색계 측정값을 자동으로 수집하여 리포트를 생성하는 도구",
    submittedAt: "2025.05.20", updatedAt: "2025.05.22",
    approval: "반려", status: "개발 중", domain: "제조/생산", type: "내부 도구",
    rejectionReason: "동일한 기능의 프로젝트를 다른 팀원이 이미 등록하였습니다. 해당 프로젝트(PRJ-2025-039)의 담당자에게 연락하여 공동담당자로 참여하거나, 기능적 차별점이 있다면 이를 상세 설명에 명시한 후 재제출해 주세요.",
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

export default function MyStatusPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MyItem[]>(INITIAL_ITEMS);
  const [filter, setFilter] = useState<"전체" | ApprovalStatus>("전체");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resubmit, setResubmit] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);

  const visible = items.filter(i => !deleted.includes(i.id) && (filter === "전체" || i.approval === filter));
  const allActive = items.filter(i => !deleted.includes(i.id));

  const counts: Record<"전체" | ApprovalStatus, number> = {
    "전체": allActive.length,
    "승인": allActive.filter(i => i.approval === "승인").length,
    "대기": allActive.filter(i => i.approval === "대기").length,
    "반려": allActive.filter(i => i.approval === "반려").length,
  };

  const handleDelete = (id: string) => {
    // TODO: 실제 연동 시 DELETE /api/v1/my/projects/:id
    setDeleted(p => [...p, id]);
    setDeleteConfirm(null);
    setExpanded(null);
    setResubmit(null);
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>내 활동</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>내 등록 현황</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>신청한 프로젝트의 검토 상태를 확인하고 반려된 항목을 수정하여 재제출할 수 있습니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 32px" }}>

        {/* SUMMARY + FILTER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {([
            { label: "전체 신청", key: "전체" as const, color: "#0F172A" },
            { label: "승인 완료", key: "승인" as const, color: "#059669" },
            { label: "검토 대기", key: "대기" as const, color: "#D97706" },
            { label: "반려", key: "반려" as const, color: "#EF4444" },
          ]).map((s) => (
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

        {/* LIST */}
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
                      onClick={() => item.approval === "승인" && navigate(`/projects/${item.id}`)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "#94A3B8" }}>{item.id}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: STATUS_COLOR[item.status]?.bg,
                          color: STATUS_COLOR[item.status]?.color,
                          padding: "2px 8px", borderRadius: 20,
                        }}>{item.status}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{item.domain}</span>
                        <span style={{ fontSize: 11, color: "#CBD5E1" }}>·</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>{item.type}</span>
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
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>시스템 유형</span>
                      <span style={{ color: "#334155" }}>{item.type}</span>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>비즈니스 도메인</span>
                      <span style={{ color: "#334155" }}>{item.domain}</span>
                      <span style={{ color: "#94A3B8", fontWeight: 600 }}>프로젝트 상태</span>
                      <span style={{ color: "#334155" }}>{item.status}</span>
                    </div>
                  </div>
                )}

                {isResubmit && (
                  <div style={{ borderTop: "1px solid #FECACA", padding: "20px 22px", background: "#FFF8F8" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>재제출 — 수정 메모</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>반려 사유를 참고하여 수정한 항목을 간략히 기재해 주세요.</div>
                    <textarea placeholder="예: 기능적 차별점(실시간 Delta E 추적 기능 포함) 및 담당자 정보 보완 완료" style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "10px 12px", fontSize: 13, color: "#0F172A",
                      background: "#fff", border: "1.5px solid #FECACA",
                      borderRadius: 7, outline: "none", resize: "vertical",
                      minHeight: 80, fontFamily: "inherit", lineHeight: 1.6,
                    }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                      <button onClick={() => setResubmit(null)} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>취소</button>
                      <button onClick={() => navigate("/projects/new")} style={{ background: "#2563EB", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>재제출</button>
                    </div>
                  </div>
                )}

                {isDeleteConfirm && (
                  <div style={{ borderTop: `1px solid ${item.approval === "반려" ? "#FECACA" : "#E2E8F0"}`, padding: "16px 22px", background: "#FFFBEB" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>
                      {item.approval === "반려" ? "신청을 삭제하시겠습니까?" : "신청을 취소하시겠습니까?"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                      {item.approval === "반려" ? "삭제된 신청은 복구할 수 없습니다." : "취소 후 동일한 내용으로 다시 신청할 수 있습니다."}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>돌아가기</button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                        {item.approval === "반려" ? "삭제 확인" : "취소 확인"}
                      </button>
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