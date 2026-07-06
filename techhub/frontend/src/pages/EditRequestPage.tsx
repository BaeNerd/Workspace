import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// TODO: 실제 연동 시 GET /api/v1/platform-items/:id 응답으로 교체
type CurrentItem = {
  title: string; summary: string; description: string; status: string;
};

const MOCK_CURRENT: CurrentItem = {
  title: "신규 입사자 계정 자동 생성",
  summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성하는 n8n 워크플로우",
  description: "신규 입사자가 HR 시스템에 등록되면 Schedule Trigger가 발동하여 AD 계정 생성 → Teams 초대 → 이메일 계정 활성화까지 자동으로 처리합니다.",
  status: "운영 중",
};

const EDITABLE_FIELDS = [
  { key: "title", label: "항목명" },
  { key: "summary", label: "한 줄 요약" },
  { key: "description", label: "상세 설명" },
  { key: "status", label: "운영 상태" },
] as const;

export default function EditRequestPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const current = MOCK_CURRENT; // TODO: id로 실제 조회 결과 사용

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleField = (key: string) => {
    setSelectedFields(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);
  };

  const setChange = (key: string, value: string) => setChanges(p => ({ ...p, [key]: value }));

  const canSubmit = selectedFields.length > 0 && reason.trim().length > 0 &&
    selectedFields.every(k => changes[k]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    // TODO: 실제 연동 시 POST /api/v1/platform-items/:id/edit-requests
    // body: { fields: selectedFields, changes, reason }
    void id;
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate("/projects"), 1400);
  };

  const fieldValue = (key: string): string => {
    const v = (current as Record<string, unknown>)[key];
    return Array.isArray(v) ? v.join(", ") : String(v ?? "");
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>

      <Navbar />

      {/* BREADCRUMB */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: "#2563EB", fontWeight: 500 }}>AX 플랫폼</span>
          <span>/</span>
          <span style={{ color: "#64748B" }}>{current.title}</span>
          <span>/</span>
          <span style={{ color: "#0F172A", fontWeight: 600 }}>수정 요청</span>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "20px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>수정 요청</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>게시된 AX 항목 수정 요청</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>수정할 항목을 선택하고 변경 내용을 입력하세요. 관리자 검토 후 반영됩니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 32px" }}>

        {submitted ? (
          <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 10, padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46", marginBottom: 4 }}>수정 요청이 제출되었습니다</div>
            <div style={{ fontSize: 12, color: "#059669" }}>AX 플랫폼 목록으로 이동합니다...</div>
          </div>
        ) : (
          <>
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: "#1E40AF" }}>
              수정할 항목을 체크하면 현재 값이 표시됩니다. 변경할 내용을 입력해 주세요.
            </div>

            {/* 항목 선택 */}
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                수정 항목 선택
              </div>

              {EDITABLE_FIELDS.map(f => {
                const isSelected = selectedFields.includes(f.key);
                return (
                  <div key={f.key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F8FAFC" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: isSelected ? 10 : 0 }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleField(f.key)} style={{ cursor: "pointer" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{f.label}</span>
                    </label>

                    {isSelected && (
                      <div style={{ marginLeft: 26 }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>
                          현재 값: <span style={{ color: "#64748B" }}>{fieldValue(f.key)}</span>
                        </div>
                        {f.key === "description" ? (
                          <textarea
                            value={changes[f.key] ?? ""}
                            onChange={e => setChange(f.key, e.target.value)}
                            placeholder="변경할 내용을 입력하세요"
                            style={{
                              width: "100%", boxSizing: "border-box", padding: "10px 12px",
                              fontSize: 13, color: "#0F172A", background: "#F8FAFC",
                              border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none",
                              resize: "vertical", minHeight: 90, fontFamily: "inherit", lineHeight: 1.6,
                            }}
                            onFocus={e => (e.target.style.borderColor = "#2563EB")}
                            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                          />
                        ) : (
                          <input
                            value={changes[f.key] ?? ""}
                            onChange={e => setChange(f.key, e.target.value)}
                            placeholder="변경할 내용을 입력하세요"
                            style={{
                              width: "100%", boxSizing: "border-box", padding: "9px 12px",
                              fontSize: 13, color: "#0F172A", background: "#F8FAFC",
                              border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none",
                            }}
                            onFocus={e => (e.target.style.borderColor = "#2563EB")}
                            onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 수정 사유 */}
            <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "24px 26px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                수정 사유 <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", marginLeft: 4 }}>필수</span>
              </div>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="왜 이 항목을 수정해야 하는지 간략히 작성해 주세요. (예: 담당자 변경에 따른 정보 갱신, 운영 상태 업데이트 등)"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 12px",
                  fontSize: 13, color: "#0F172A", background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0", borderRadius: 7, outline: "none",
                  resize: "vertical", minHeight: 80, fontFamily: "inherit", lineHeight: 1.6,
                }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#92400E" }}>
              제출된 수정 요청은 관리자 검토 후 반영됩니다. 처리 결과는 Teams 및 이메일로 안내됩니다.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => navigate("/projects")} style={{
                background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7,
                padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
                background: canSubmit && !submitting ? "#2563EB" : "#CBD5E1",
                border: "none", borderRadius: 7,
                padding: "10px 28px", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              }}>
                {submitting ? "제출 중..." : "수정 요청 제출"}
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
