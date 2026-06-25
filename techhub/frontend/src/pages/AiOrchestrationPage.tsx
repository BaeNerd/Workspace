/* ============================================================
   파일: src/pages/AiOrchestrationPage.tsx
   경로: /ai-orchestration

   AI Orchestration 플랫폼 전용 카탈로그.
   PlatformItem 중 platformId === "ai-orchestration"인 항목만 모델
   선택 카드 형태로 보여줌. 각 카드는 modelMeta를 포함하여 일반
   PlatformItem보다 더 풍부한 비교 정보(컨텍스트 윈도우, 강점, 비용)를
   표시. "선택" 클릭 시 해당 모델의 specificUrl로 이동(연결).
   ============================================================ */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformItem } from "../types/platformTypes";

// TODO: 실제 연동 시 GET /api/v1/platform-items?platformId=ai-orchestration 응답으로 교체
const MOCK_MODELS: PlatformItem[] = [
  {
    id: "AIO-001", platformId: "ai-orchestration",
    title: "GPT-4 (범용)", summary: "범용 작업에 적합한 OpenAI GPT-4 모델",
    description: "다양한 업무 전반에 활용 가능한 범용 모델입니다. 코드 생성, 문서 작성, 데이터 분석 보조 등에 적합합니다.",
    status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["범용", "코드생성", "문서작성"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gpt-4", updatedAt: "2025.06.10",
    modelMeta: { provider: "OpenAI", contextWindow: "128K", strengths: ["범용성", "코드 생성", "빠른 응답"], costTier: "보통" },
  },
  {
    id: "AIO-002", platformId: "ai-orchestration",
    title: "Claude (문서 분석 특화)", summary: "긴 문서 분석과 정밀한 추론에 강한 Anthropic Claude 모델",
    description: "긴 컨텍스트가 필요한 계약서 검토, 보고서 분석, 복잡한 추론 작업에 적합합니다.",
    status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["문서분석", "긴컨텍스트", "법무"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/claude", updatedAt: "2025.06.12",
    modelMeta: { provider: "Anthropic", contextWindow: "200K", strengths: ["긴 컨텍스트", "정밀 추론", "안전성"], costTier: "보통" },
  },
  {
    id: "AIO-003", platformId: "ai-orchestration",
    title: "콜마 파인튜닝 모델 (사내 전용 용어 특화)", summary: "콜마 사내 용어와 제품 데이터로 파인튜닝된 전용 모델",
    description: "화장품 원료명, 사내 제품 코드, 콜마 그룹 조직 용어 등을 정확히 이해하는 사내 전용 모델입니다.",
    status: "파일럿", dept: "IT개발팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr",
    tags: ["사내전용", "화장품용어", "원료데이터"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/kolmar-ft", updatedAt: "2025.06.18",
    modelMeta: { provider: "사내 파인튜닝", contextWindow: "32K", strengths: ["콜마 전용 용어", "원료 데이터 이해"], costTier: "낮음" },
  },
  {
    id: "AIO-004", platformId: "ai-orchestration",
    title: "Gemini (멀티모달)", summary: "이미지·문서를 함께 분석할 수 있는 Google Gemini 모델",
    description: "용기 디자인 이미지 분석, 도면 검토 등 이미지와 텍스트를 함께 다루는 작업에 적합합니다.",
    status: "개발 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr",
    tags: ["멀티모달", "이미지분석", "디자인검토"], specificUrl: "https://ai-gateway.kolmar.co.kr/models/gemini", updatedAt: "2025.06.20",
    modelMeta: { provider: "Google", contextWindow: "1M", strengths: ["이미지 분석", "초장문 컨텍스트"], costTier: "높음" },
  },
];

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

const COST_COLOR: Record<string, { bg: string; color: string }> = {
  "낮음": { bg: "#D1FAE5", color: "#065F46" },
  "보통": { bg: "#FEF3C7", color: "#92400E" },
  "높음": { bg: "#FEE2E2", color: "#991B1B" },
};

export default function AiOrchestrationPage() {
  const navigate = useNavigate();
  const platform = PLATFORMS.find(p => p.id === "ai-orchestration")!;
  const [search, setSearch] = useState("");
  const [selectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_MODELS.filter(m =>
      search === "" || m.title.includes(search) || m.tags.some(t => t.includes(search)) || m.modelMeta?.provider.includes(search)
    );
  }, [search]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <Navbar />

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, ${platform.color} 0%, #0F172A 100%)`, padding: "40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 14px", borderRadius: 20, marginBottom: 14, textTransform: "uppercase" }}>
            Tech Hub Platform
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>{platform.name}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, maxWidth: 560 }}>
            업무 목적에 맞는 AI 모델을 비교하고 선택하여 바로 연결할 수 있습니다. 각 모델의 강점과 비용 수준을 확인한 뒤 적합한 모델을 고르세요.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>

        {/* 검색 */}
        <div style={{ position: "relative", marginBottom: 24, maxWidth: 420 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="모델명, 제공사, 용도로 검색"
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 14px",
              fontSize: 13, border: "1.5px solid #E2E8F0", borderRadius: 8, outline: "none",
            }}
          />
          <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>

        {/* 모델 카드 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map(m => {
            const isSelected = selectedId === m.id;
            return (
              <div key={m.id} style={{
                background: "#fff", border: `1.5px solid ${isSelected ? platform.color : "#E2E8F0"}`,
                borderRadius: 12, padding: "22px 24px",
                boxShadow: isSelected ? `0 4px 16px ${platform.color}22` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_COLOR[m.status].bg, color: STATUS_COLOR[m.status].color, padding: "2px 8px", borderRadius: 20 }}>{m.status}</span>
                  {m.modelMeta && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: COST_COLOR[m.modelMeta.costTier].bg, color: COST_COLOR[m.modelMeta.costTier].color, padding: "2px 8px", borderRadius: 20 }}>
                      비용 {m.modelMeta.costTier}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>{m.summary}</div>

                {m.modelMeta && (
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                      <span>제공사</span><strong style={{ color: "#0F172A" }}>{m.modelMeta.provider}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 10 }}>
                      <span>컨텍스트 윈도우</span><strong style={{ color: "#0F172A" }}>{m.modelMeta.contextWindow}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>강점</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {m.modelMeta.strengths.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, background: platform.bg, color: platform.color, padding: "3px 9px", borderRadius: 6 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                  {m.tags.map((t, i) => <span key={i} style={{ fontSize: 10, color: "#94A3B8" }}>#{t}</span>)}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => navigate(`/ai-orchestration/${m.id}`)} style={{
                    flex: 1, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 7,
                    padding: "9px 0", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer",
                  }}>
                    자세히 보기
                  </button>
                  <button onClick={() => window.open(m.specificUrl, "_blank")} style={{
                    flex: 1, background: platform.color, border: "none", borderRadius: 7,
                    padding: "9px 0", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
                  }}>
                    이 모델로 연결
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>검색 결과가 없습니다.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}