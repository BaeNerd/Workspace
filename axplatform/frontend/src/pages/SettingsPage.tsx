// ===== pages/SettingsPage.tsx =====
// 설정 화면 (/settings). 관심 카테고리(7종)·관심 업무 도메인(6종) 다중 선택 → localStorage "ax_user_interests".
// 저장 시 개인화 패널 추천이 즉시 갱신된다(useInterests useSyncExternalStore).
// TODO: 확장 지점 — 추후 개인 정보 항목 추가 예정.
//   · 프로필(표시명·부서·직함) 편집
//   · 알림 수신 설정(kind별 on/off, 이메일·Teams 채널)
//   · 언어·표시 밀도 등 표시 환경 설정
//   실제 연동 시 GET /api/v1/me(프리필) + PUT /api/v1/me/interests(저장)로 교체.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CATEGORIES, BUSINESS_DOMAINS } from "../types/categoryTypes";
import type { CategoryId, BusinessDomain } from "../types/categoryTypes";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";
import { useInterests } from "../hooks/useInterests";

// 다중 선택 칩 (선택/해제 토글)
function InterestChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
        borderWidth: 1.5, borderStyle: "solid",
        borderColor: active ? color : COLOR.border,
        background: active ? `${color}14` : "#fff",
        color: active ? color : COLOR.text2,
        transition: "all 0.15s",
      }}
    >
      <span style={{
        width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
        border: `1.5px solid ${active ? color : "#CBD5E1"}`,
        background: active ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

const sectionCard: React.CSSProperties = {
  background: "#fff", border: `1px solid ${COLOR.border}`, borderRadius: 14, padding: "24px 26px", marginBottom: 20,
};

const domainColor: Record<BusinessDomain, string> = {
  "영업": "#B4602E", "생산": "#2563C9", "연구": "#0E7490", "재무": "#1F7A46", "HR": "#6D4BC4", "IT": "#4B5768",
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { interests, save } = useInterests();

  // 폼 로컬 상태 — 저장 버튼을 눌러야 localStorage에 반영(저장 완료 피드백 후 패널 갱신).
  const [cats, setCats] = useState<CategoryId[]>(interests.categories);
  const [doms, setDoms] = useState<BusinessDomain[]>(interests.domains);
  const [saved, setSaved] = useState(false);

  const toggleCat = (id: CategoryId) => {
    setSaved(false);
    setCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleDom = (d: BusinessDomain) => {
    setSaved(false);
    setDoms(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = () => {
    save({ categories: cats, domains: doms });
    setSaved(true);
  };

  const selectedCount = cats.length + doms.length;

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* PAGE HEADER */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Settings
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em" }}>설정</h1>
          <p style={{ fontSize: 13, color: COLOR.text2, marginTop: 4 }}>
            관심사를 설정하면 홈 화면에서 맞춤 추천을 받아볼 수 있어요.
          </p>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box", flex: 1 }}>

        {/* ① 관심 카테고리 (7종) */}
        <div style={sectionCard}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: COLOR.text }}>관심 카테고리</span>
            <span style={{ fontSize: 12, color: COLOR.text3 }}>복수 선택 가능</span>
          </div>
          <p style={{ fontSize: 12.5, color: COLOR.text2, margin: "0 0 16px" }}>
            자주 찾는 AX 플랫폼 유형을 골라주세요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.map(c => (
              <InterestChip key={c.id} label={c.name} active={cats.includes(c.id)} color={c.color} onClick={() => toggleCat(c.id)} />
            ))}
          </div>
        </div>

        {/* ② 관심 업무 도메인 (6종) */}
        <div style={sectionCard}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: COLOR.text }}>관심 업무 도메인</span>
            <span style={{ fontSize: 12, color: COLOR.text3 }}>복수 선택 가능</span>
          </div>
          <p style={{ fontSize: 12.5, color: COLOR.text2, margin: "0 0 16px" }}>
            담당하거나 관심 있는 업무 분야를 골라주세요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {BUSINESS_DOMAINS.map(d => (
              <InterestChip key={d} label={d} active={doms.includes(d)} color={domainColor[d]} onClick={() => toggleDom(d)} />
            ))}
          </div>
        </div>

        {/* 확장 안내 — 추후 개인 정보 항목 추가 예정 (코드 TODO는 파일 상단 참조) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#F1F5FF", border: `1px solid ${COLOR.primaryWeak}`, borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLOR.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span style={{ fontSize: 12.5, color: "#3B5AA6", lineHeight: 1.6 }}>
            추후 개인 정보 항목이 추가될 수 있습니다. (프로필·알림 수신 설정 등)
          </span>
        </div>

        {/* 저장 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={handleSave}
            style={{
              background: COLOR.primary, color: "#fff", border: "none", borderRadius: 8,
              padding: "11px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            저장
          </button>
          {saved && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1F7A46" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1F7A46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              저장되었습니다{selectedCount > 0 ? ` — 관심사 ${selectedCount}개 반영` : ""}
            </span>
          )}
          <button
            onClick={() => navigate("/")}
            style={{ marginLeft: "auto", background: "transparent", color: COLOR.text2, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            홈으로
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
