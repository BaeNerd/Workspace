/* ============================================================
   파일: src/pages/PlatformCatalogPage.tsx
   경로: /n8n, /assistant

   n8n과 나만의 비서는 "워크플로우/에이전트 목록"이라는 동일한
   패턴을 가지므로 하나의 컴포넌트를 platformId prop으로 재사용.
   AI Orchestration은 모델 비교 카드(별도 구조)라서 분리되어 있음.

   각 PlatformItem 카드는 MK-01과 유사한 정보 밀도를 가지며,
   클릭 시 PlatformItemDetailPage로 이동.
   ============================================================ */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PLATFORMS } from "../types/platformTypes";
import type { PlatformId, PlatformItem } from "../types/platformTypes";

// TODO: 실제 연동 시 GET /api/v1/platform-items?platformId=:id 응답으로 교체
const MOCK_ITEMS: PlatformItem[] = [
  // n8n 워크플로우
  { id: "N8N-001", platformId: "n8n", title: "신규 입사자 계정 자동 생성", summary: "HR 시스템 입력 시 AD/Teams/이메일 계정을 자동 생성", description: "HR 시스템에 신규 입사자가 등록되면 Active Directory 계정, Teams 채널 초대, 사내 이메일 계정을 자동으로 생성하고 담당 부서에 알림을 발송합니다.", status: "운영 중", dept: "IT인프라팀", owner: "이서현", ownerEmail: "seohyun.lee@kolmar.co.kr", tags: ["HR", "계정자동화", "온보딩"], specificUrl: "https://n8n.kolmar.co.kr/workflow/001", updatedAt: "2025.06.05" },
  { id: "N8N-002", platformId: "n8n", title: "발주 승인 알림 자동화", summary: "구매 시스템의 발주 승인 요청을 Teams로 즉시 알림", description: "구매 시스템에서 발주 요청이 생성되면 승인자에게 Teams 메시지로 즉시 알림을 보내고, 승인/반려 결과를 발주 시스템에 자동 반영합니다.", status: "운영 중", dept: "구매팀", owner: "박성훈", ownerEmail: "sunghoon.park@kolmar.co.kr", tags: ["구매", "승인알림", "ERP연동"], specificUrl: "https://n8n.kolmar.co.kr/workflow/002", updatedAt: "2025.06.08" },
  { id: "N8N-003", platformId: "n8n", title: "일일 매출 리포트 자동 발송", summary: "매일 오전 9시 전일 매출 요약을 경영진에게 자동 발송", description: "ERP 매출 데이터를 집계하여 매일 오전 경영진 메일링 리스트에 전일 매출 요약 리포트를 자동으로 발송합니다.", status: "운영 중", dept: "재무팀", owner: "김재원", ownerEmail: "jaewon.kim@kolmar.co.kr", tags: ["매출리포트", "ERP", "자동발송"], specificUrl: "https://n8n.kolmar.co.kr/workflow/003", updatedAt: "2025.06.12" },
  { id: "N8N-004", platformId: "n8n", title: "품질 이슈 발생 시 즉시 에스컬레이션", summary: "품질관리 시스템 이상 감지 시 관련 부서에 즉시 알림", description: "생산 품질관리 시스템에서 기준치 이탈이 감지되면 품질관리팀, 생산본부, 관련 연구소에 동시에 Teams 알림을 발송합니다.", status: "파일럿", dept: "품질관리팀", owner: "이민호", ownerEmail: "minho.lee@kolmar.co.kr", tags: ["품질관리", "에스컬레이션", "생산"], specificUrl: "https://n8n.kolmar.co.kr/workflow/004", updatedAt: "2025.06.18" },

  // 나만의 비서 (LLM 에이전트)
  { id: "AST-001", platformId: "assistant", title: "법무 검토 보조 봇", summary: "계약서 초안의 위험 조항을 자동으로 식별하고 검토 의견 제시", description: "업로드된 계약서 초안에서 표준 계약서와 다른 조항, 위험 요소가 있는 조항을 자동으로 식별하고 검토 포인트를 제시합니다.", status: "운영 중", dept: "법무팀", owner: "강현우", ownerEmail: "hyunwoo.kang@kolmar.co.kr", tags: ["법무", "계약서검토", "위험분석"], specificUrl: "https://assistant.kolmar.co.kr/agents/legal-review", updatedAt: "2025.06.10" },
  { id: "AST-002", platformId: "assistant", title: "회의록 요약 봇", summary: "Teams 회의 녹취록을 업로드하면 핵심 결정사항을 자동 정리", description: "Teams 회의 녹음 파일 또는 자막을 업로드하면 핵심 논의 내용, 결정 사항, 액션 아이템을 구조화하여 정리해줍니다.", status: "운영 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["회의록", "요약", "Teams연동"], specificUrl: "https://assistant.kolmar.co.kr/agents/meeting-summary", updatedAt: "2025.06.14" },
  { id: "AST-003", platformId: "assistant", title: "코드 리뷰 어시스턴트", summary: "GitHub PR에 자동으로 코드 리뷰 코멘트를 남기는 봇", description: "Pull Request가 생성되면 코드 스타일, 잠재적 버그, 보안 이슈를 자동으로 분석하여 리뷰 코멘트를 남깁니다.", status: "개발 중", dept: "IT개발팀", owner: "정태영", ownerEmail: "taeyoung.jung@kolmar.co.kr", tags: ["코드리뷰", "GitHub", "개발도구"], specificUrl: "https://assistant.kolmar.co.kr/agents/code-review", updatedAt: "2025.06.19" },
  { id: "AST-004", platformId: "assistant", title: "원료 안전성 문의 봇", summary: "원료의 MSDS·규제 정보를 빠르게 조회하는 연구원용 봇", description: "원료명을 입력하면 MSDS 정보, 국가별 사용 제한 규제, 과거 클레임 이력을 통합 조회하여 답변합니다.", status: "파일럿", dept: "메이크업연구소", owner: "이수연", ownerEmail: "suyeon.lee@kolmar.co.kr", tags: ["원료", "MSDS", "규제정보"], specificUrl: "https://assistant.kolmar.co.kr/agents/ingredient-safety", updatedAt: "2025.06.20" },
];

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "운영 중": { bg: "#D1FAE5", color: "#065F46" },
  "개발 중": { bg: "#DBEAFE", color: "#1E40AF" },
  "파일럿": { bg: "#FEF3C7", color: "#92400E" },
  "종료": { bg: "#F1F5F9", color: "#475569" },
  "보류": { bg: "#FEE2E2", color: "#991B1B" },
};

export default function PlatformCatalogPage({ platformId }: { platformId: PlatformId }) {
  const navigate = useNavigate();
  const platform = PLATFORMS.find(p => p.id === platformId)!;
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<number | null>(null);

  const items = useMemo(() => MOCK_ITEMS.filter(i => i.platformId === platformId), [platformId]);

  const filtered = useMemo(() => {
    return items.filter(i =>
      search === "" || i.title.includes(search) || i.tags.some(t => t.includes(search)) || i.dept.includes(search)
    );
  }, [items, search]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <Navbar />

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, ${platform.color} 0%, #0F172A 100%)`, padding: "40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 14px", borderRadius: 20, marginBottom: 14, textTransform: "uppercase" }}>
                Tech Hub Platform
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>{platform.name}</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, maxWidth: 520 }}>{platform.shortDesc}</p>
            </div>
            <button onClick={() => window.open(platform.accessUrl, "_blank")} style={{
              background: "#fff", color: platform.color, border: "none", borderRadius: 8,
              padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>
              {platform.name} 바로가기
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ position: "relative", maxWidth: 420, flex: 1 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`${platform.name} 내 항목 검색`}
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 40px 10px 14px",
                fontSize: 13, border: "1.5px solid #E2E8F0", borderRadius: 8, outline: "none",
              }}
            />
            <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
          <span style={{ fontSize: 13, color: "#64748B", marginLeft: 16 }}>
            <strong style={{ color: "#0F172A" }}>{filtered.length}</strong>개 항목
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((item, i) => (
            <div
              key={item.id}
              onClick={() => navigate(`${platform.path}/${item.id}`)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#fff",
                border: `1.5px solid ${hovered === i ? platform.color : "#E2E8F0"}`,
                borderRadius: 10, padding: "18px 18px 16px", cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: hovered === i ? `0 4px 16px ${platform.color}1A` : "none",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, background: STATUS_COLOR[item.status].bg, color: STATUS_COLOR[item.status].color, padding: "2px 8px", borderRadius: 20 }}>{item.status}</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: platform.bg, color: platform.color, padding: "2px 8px", borderRadius: 20 }}>{platform.name}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>{item.summary}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                {item.tags.map((t, ti) => <span key={ti} style={{ fontSize: 10, fontWeight: 600, background: "#F1F5F9", color: "#475569", padding: "2px 7px", borderRadius: 4 }}>#{t}</span>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", fontSize: 10, color: "#94A3B8" }}>
                <span>{item.dept} · {item.owner}</span>
                <span>{item.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8", fontSize: 14 }}>검색 결과가 없습니다.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}