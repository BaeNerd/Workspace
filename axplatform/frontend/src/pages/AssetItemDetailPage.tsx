// ===== pages/AssetItemDetailPage.tsx =====
/* ============================================================
   경로: /n8n/:itemId, /pa/:itemId, /assistant/:itemId,
        /ai-orchestration/:itemId, /ml/:itemId, /vibe/:itemId, /etc/:itemId
   상태·실행 버튼·관계사 표시 제거 (등록 플로우 개편). 예외: ai-orchestration의
   agentAvailability 뱃지와 모델 접속(specificUrl) 버튼만 유지.
   ============================================================ */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CATEGORIES } from "../types/categoryTypes";
import type { CategoryId, AssetReview, Post, PostTag } from "../types/categoryTypes";
import N8nFlowPreview from "../components/N8nFlowPreview";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";
import { useScraps } from "../hooks/useScraps";
import CardIdTag from "../components/CardIdTag";
import { getAssetItem, getReviewsByItem, getPostsByItem, getFallbackN8nWorkflowJson } from "../lib/dataSource";


const COST_TIER_COLOR: Record<string, { bg: string; color: string }> = {
  "낮음": { bg: "#DCFCE7", color: "#166534" },
  "보통": { bg: "#FEF3C7", color: "#92400E" },
  "높음": { bg: "#FEE2E2", color: "#991B1B" },
};

// ai-orchestration 이용 가능 뱃지 색 (상태 체계와 별개 축)
const AGENT_AVAIL_STYLE: Record<string, { bg: string; color: string }> = {
  "사용 가능": { bg: "#DCFCE7", color: "#166534" },
  "사용 불가": { bg: "#F1F5F9", color: "#697386" },
};

// 클립보드 복사 (공유 프롬프트 복사 버튼용)
const copyText = (t: string) => { void navigator.clipboard?.writeText(t); };

const carouselNavStyle = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute", left: side === "left" ? 10 : undefined, right: side === "right" ? 10 : undefined,
  width: 34, height: 34, borderRadius: "50%", background: "#fff", border: `1.5px solid ${COLOR.border}`,
  cursor: "pointer", fontSize: 18, color: COLOR.text2, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
});

// 이미지 캐러셀 (표시 전용, 모듈 레벨) — 상세 개요 상단. 등록 페이지 입력용과 별개.
function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const safe = Math.min(idx, images.length - 1);
  const go = (d: number) => setIdx((safe + d + images.length) % images.length);
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: COLOR.bgSubtle, borderRadius: 8, minHeight: 200, overflow: "hidden" }}>
        {images.length > 1 && <button type="button" onClick={() => go(-1)} aria-label="이전 이미지" style={carouselNavStyle("left")}>‹</button>}
        <img src={images[safe]} alt={`이미지 ${safe + 1}`} style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain", borderRadius: 6 }} />
        {images.length > 1 && <button type="button" onClick={() => go(1)} aria-label="다음 이미지" style={carouselNavStyle("right")}>›</button>}
      </div>
      {images.length > 1 && (
        <div style={{ textAlign: "center", fontSize: 12, color: COLOR.text2, marginTop: 8 }}>{safe + 1} / {images.length}</div>
      )}
    </div>
  );
}

const POST_TAGS = ["공지", "Q&A", "이슈제보", "건의"] as const;

const POST_TAG_COLOR: Record<PostTag, { bg: string; color: string }> = {
  "공지": { bg: "#E8F0FE", color: "#1E40AF" },
  "Q&A": { bg: "#FEF3C7", color: "#92400E" },
  "이슈제보": { bg: "#FEE2E2", color: "#991B1B" },
  "건의": { bg: "#F5F3FF", color: "#6D28D9" },
};


// 상세 탭 라벨 — 유형별 성격에 맞게. vibe/etc는 상세 탭을 숨기므로 개요만 노출(폴백값만 존재).
const detailTabLabelFor = (categoryId: CategoryId): string => {
  if (categoryId === "ai-orchestration") return "모델 사양";
  if (categoryId === "assistant") return "비서 구성";
  if (categoryId === "pa") return "플로우 정보";
  if (categoryId === "ml") return "모델 정보";
  if (categoryId === "vibe") return "제작 이야기";
  if (categoryId === "etc") return "프로젝트 소개";
  return "상세 동작"; // n8n
};

export default function AssetItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const item = itemId ? getAssetItem(itemId) : undefined;
  const category = item ? CATEGORIES.find(p => p.id === item.categoryId)! : null;

  const { isScrapped, toggle: toggleScrap } = useScraps();
  const scrapped = item ? isScrapped(item.id) : false;

  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "contact" | "posts">("overview");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item?.likes ?? 0);
  const [posts, setPosts] = useState<Post[]>(item ? getPostsByItem(item.id) : []);
  const [postText, setPostText] = useState("");
  const [postTag, setPostTag] = useState<PostTag>("Q&A");
  const [reviews, setReviews] = useState<AssetReview[]>(item ? getReviewsByItem(item.id) : []);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!item?.id) return;
    const raw = localStorage.getItem("ax_recent_viewed");
    const arr: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const updated = [item.id, ...arr.filter(id => id !== item.id)].slice(0, 10);
    localStorage.setItem("ax_recent_viewed", JSON.stringify(updated));
  }, [item?.id]);

  if (!item || !category) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: COLOR.text3 }}>
        항목을 찾을 수 없습니다. (id: {itemId})
      </div>
    );
  }

  // vibe/etc는 유형별 전용 필드가 없어 상세 탭을 숨기고 개요에 통합한다.
  const hasDetailTab = item.categoryId !== "vibe" && item.categoryId !== "etc";

  const TABS = [
    { id: "overview" as const, label: "개요" },
    ...(hasDetailTab ? [{ id: "detail" as const, label: detailTabLabelFor(item.categoryId) }] : []),
    { id: "contact" as const, label: "담당자" },
    { id: "posts" as const, label: `업데이트 & 논의 ${posts.length}` },
  ];

  const toggleLike = () => {
    setLiked(v => !v);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const togglePostLike = (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
      : p
    ));
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    setPosts(prev => [{
      id: Date.now(), author: "김철수", dept: "IT개발팀", date: "2025.06.29",
      tag: postTag, text: postText, likes: 0, likedByMe: false,
    }, ...prev]);
    setPostText("");
  };

  const handleReview = () => {
    if (!reviewText.trim()) return;
    const r: AssetReview = {
      id: `local-${Date.now()}`, itemId: item.id, itemTitle: item.title, itemKind: item.categoryId,
      author: "김철수", dept: "IT개발팀", text: reviewText, createdAt: "2026.07.10", likes: 0,
    };
    setReviews(prev => [r, ...prev]);
    setReviewText("");
  };

  const downloadWorkflow = () => {
    const content = item.workflowJson ?? getFallbackN8nWorkflowJson();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.id.toLowerCase()}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "var(--font-ui)", background: COLOR.bgSubtle, minHeight: "100vh", color: COLOR.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "10px 32px" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLOR.text3 }}>
          <span onClick={() => navigate("/projects")} style={{ cursor: "pointer", color: COLOR.primary, fontWeight: 500 }}>AX Platform</span>
          <span>/</span>
          <span onClick={() => navigate(`/projects?q=${encodeURIComponent(category.name)}`)} style={{ cursor: "pointer", color: COLOR.text2 }}>{category.name}</span>
          <span>/</span>
          <span style={{ color: COLOR.text, fontWeight: 600 }}>{item.title}</span>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: `1px solid ${COLOR.border}`, padding: "28px 32px 0" }}>
        <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: category.bg, color: category.color, padding: "3px 10px", borderRadius: 20 }}>
                  {category.name}
                </span>
                {item.categoryId === "ai-orchestration" && item.agentAvailability && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: AGENT_AVAIL_STYLE[item.agentAvailability].bg, color: AGENT_AVAIL_STYLE[item.agentAvailability].color, padding: "3px 10px", borderRadius: 20 }}>
                    {item.agentAvailability}
                  </span>
                )}
                {item.modelMeta && (
                  <>
                    <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
                    <span style={{ fontSize: 12, color: COLOR.text3 }}>{item.modelMeta.provider}</span>
                  </>
                )}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3 }}>
                {item.title}
              </h1>
              <p style={{ fontSize: 14, color: COLOR.text2, lineHeight: 1.7, maxWidth: 640 }}>
                {item.summary}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              {item.views != null && (
                <span title="조회수" style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                  fontSize: 13, fontWeight: 600, color: COLOR.text2,
                  background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`, borderRadius: 7,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  {item.views.toLocaleString()}
                </span>
              )}
              <button onClick={toggleLike} style={{
                background: liked ? "#FEF2F2" : "#fff",
                border: `1.5px solid ${liked ? "#FCA5A5" : COLOR.border}`,
                borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: liked ? "#DC2626" : COLOR.text2, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "#DC2626" : "none"} stroke={liked ? "#DC2626" : COLOR.text2} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {likeCount}
              </button>
              {/* 스크랩(북마크) 토글 — localStorage "ax_scraps"(useScraps). 개인화 패널 카운트와 실시간 동기화 */}
              <button
                onClick={() => toggleScrap(item.id)}
                aria-pressed={scrapped}
                title={scrapped ? "스크랩 해제" : "스크랩"}
                style={{
                  background: scrapped ? COLOR.primaryWeak : "#fff",
                  border: `1.5px solid ${scrapped ? "#93C5FD" : COLOR.border}`,
                  borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                  color: scrapped ? COLOR.primary : COLOR.text2, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={scrapped ? COLOR.primary : "none"} stroke={scrapped ? COLOR.primary : COLOR.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                {scrapped ? "스크랩됨" : "스크랩"}
              </button>
              <button onClick={() => setActiveTab("contact")} style={{
                background: "#fff", color: COLOR.text2,
                border: `1.5px solid ${COLOR.border}`, borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                담당자 연락
              </button>
              {/* 수정 요청 진입 — 게시된 항목의 정보 정정을 담당자/관리자에게 요청(USR-06, /edit-request/:id) */}
              <button onClick={() => navigate(`/edit-request/${item.id}`)} style={{
                background: "#fff", color: COLOR.text2,
                border: `1.5px solid ${COLOR.border}`, borderRadius: 7,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                수정 요청
              </button>
              {item.categoryId === "ai-orchestration" && item.specificUrl && (
                <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                  background: category.color, color: "#fff",
                  border: "none", borderRadius: 7,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  모델 접속 →
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 12, color: COLOR.text3, paddingBottom: 16, flexWrap: "wrap" }}>
            {/* 항목 ID — 등록 부서 왼쪽 고정(0.3·USR-04). 공용 CardIdTag 단일 컴포넌트. */}
            <CardIdTag id={item.id} />
            <span>등록 부서 {item.dept}</span>
            <span>·</span>
            <span>최종 수정 {item.updatedAt}</span>
            <span>·</span>
            <span>카테고리 {category.name}</span>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 4 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                background: "transparent", border: "none", cursor: "pointer",
                color: activeTab === tab.id ? COLOR.primary : COLOR.text2,
                borderBottom: activeTab === tab.id ? `2px solid ${COLOR.primary}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "28px 32px", width: "100%", boxSizing: "border-box" }}>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
            <div>
              <ImageCarousel images={item.images ?? []} />
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 14 }}>설명</div>
                <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {item.description}
                </div>
              </div>

              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 14 }}>출처</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, background: category.bg, color: category.color, padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>
                    {category.name}
                  </span>
                  <span style={{ fontSize: 12, background: COLOR.bgSubtle, color: COLOR.text2, padding: "4px 12px", borderRadius: 6, border: `1px solid ${COLOR.border}` }}>
                    {category.shortDesc}
                  </span>
                </div>
              </div>

              {/* ===== 활용 후기 ===== */}
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px", marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 14 }}>
                  활용 후기 <span style={{ fontSize: 12, fontWeight: 500, color: COLOR.text3 }}>{reviews.length}</span>
                </div>
                {reviews.length === 0 && (
                  <div style={{ textAlign: "center", padding: "12px 0 8px", color: COLOR.text3, fontSize: 13 }}>
                    아직 등록된 후기가 없습니다.
                  </div>
                )}
                {reviews.map((r, ri) => (
                  <div key={r.id} style={{ paddingBottom: 14, marginBottom: ri < reviews.length - 1 ? 14 : 0, borderBottom: ri < reviews.length - 1 ? `1px solid ${COLOR.bgSubtle}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: COLOR.border, color: COLOR.text2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {r.author[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLOR.text }}>{r.author}</span>
                      <span style={{ fontSize: 11, color: COLOR.text3 }}>{r.dept}</span>
                      <span style={{ fontSize: 11, color: "#CBD5E1", marginLeft: "auto" }}>{r.createdAt}</span>
                    </div>
                    <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.8, paddingLeft: 32 }}>{r.text}</div>
                  </div>
                ))}
                <div style={{ marginTop: reviews.length > 0 ? 16 : 8, paddingTop: reviews.length > 0 ? 14 : 0, borderTop: reviews.length > 0 ? `1px solid ${COLOR.bgSubtle}` : "none" }}>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="이 항목을 활용한 경험을 공유해 주세요."
                    style={{
                      width: "100%", boxSizing: "border-box", minHeight: 68,
                      padding: "10px 12px", fontSize: 13, color: COLOR.text,
                      border: `1.5px solid ${COLOR.border}`, borderRadius: 8, outline: "none",
                      resize: "vertical", fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={handleReview} style={{
                      background: "#1A1F27", color: "#fff", border: "none", borderRadius: 7,
                      padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>
                      후기 등록
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {item.categoryId === "ai-orchestration" && item.specificUrl && (
                <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text, marginBottom: 12 }}>모델 접속</div>
                  <a href={item.specificUrl} target="_blank" rel="noreferrer" style={{
                    fontSize: 12, color: COLOR.primary, fontWeight: 500,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    모델 접속
                  </a>
                </div>
              )}

              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 18px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text, marginBottom: 10 }}>태그</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {item.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: COLOR.bgSubtle, color: COLOR.text2, padding: "3px 8px", borderRadius: 4, border: `1px solid ${COLOR.border}` }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "detail" && hasDetailTab && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ===== AI Model — 모델 사양 (블로그형: 강점 서술 우선) ===== */}
            {item.categoryId === "ai-orchestration" && item.modelMeta && (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text, marginBottom: 14 }}>강점 및 활용 방법</div>
                <div style={{ fontSize: 14, color: COLOR.text2, lineHeight: 1.8, marginBottom: 20, background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                  {item.modelMeta.strengthsDetail || "등록된 설명이 없습니다."}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 6 }}>세부 모델명</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>{item.modelMeta.modelName || "—"}</div>
                  </div>
                  <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 6 }}>처리 가능한 글 분량</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>{item.modelMeta.contextWindow}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>비용 등급</div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    background: COST_TIER_COLOR[item.modelMeta.costTier].bg,
                    color: COST_TIER_COLOR[item.modelMeta.costTier].color,
                    padding: "5px 14px", borderRadius: 20,
                  }}>
                    {item.modelMeta.costTier}
                  </span>
                </div>

                {item.specificUrl && (
                  <button onClick={() => window.open(item.specificUrl, "_blank")} style={{
                    background: category.color, color: "#fff", border: "none", borderRadius: 7,
                    padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    모델 접속 →
                  </button>
                )}

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLOR.bgSubtle}` }}>
                  <span onClick={() => navigate(`/projects?platform=ai-orchestration`)} style={{ fontSize: 12, color: COLOR.primary, fontWeight: 600, cursor: "pointer" }}>
                    다른 AI 모델과 비교해보기 →
                  </span>
                </div>
              </div>
            )}

            {/* ===== 나만의 비서 — 비서 구성 (공유 프롬프트 + 기반 모델) ===== */}
            {item.categoryId === "assistant" && (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>기반 모델</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>{item.basedModel || "—"}</div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.06em", textTransform: "uppercase" }}>공유 프롬프트</div>
                    {item.sharedPrompt && (
                      <button onClick={() => copyText(item.sharedPrompt ?? "")} style={{
                        background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                        padding: "4px 12px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
                      }}>복사</button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    {item.sharedPrompt || "등록된 프롬프트가 없습니다."}
                  </div>
                </div>
              </div>
            )}

            {/* ===== Power Automate — 플로우 정보 (예상 효과) ===== */}
            {item.categoryId === "pa" && (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>예상 효과</div>
                <div style={{ fontSize: 14, color: COLOR.text2, lineHeight: 1.7 }}>
                  {item.expectedTimeSaved || "등록된 예상 효과 정보가 없습니다. 플로우 구성은 상단 이미지와 상세 설명을 참고하세요."}
                </div>
              </div>
            )}

            {/* ===== ML — 모델 정보 (모델 유형 + 학습 데이터 + 개발 도구) ===== */}
            {item.categoryId === "ml" && (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 6 }}>모델 유형</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>{item.mlType || "—"}</div>
                  </div>
                  <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 6 }}>개발 도구</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>{item.devTool || "—"}</div>
                  </div>
                </div>

                {item.trainingDataDesc && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.text3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>학습 데이터 개요</div>
                    <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.7 }}>{item.trainingDataDesc}</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== n8n — 워크플로우 다이어그램 + 예상 효과 + 난이도 ===== */}
            {item.categoryId === "n8n" && (
              <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>워크플로우 다이어그램</div>
                  <button onClick={downloadWorkflow} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                    padding: "5px 12px", fontSize: 12, fontWeight: 600, color: COLOR.text2, cursor: "pointer",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    JSON 다운로드
                  </button>
                </div>
                <N8nFlowPreview json={item.workflowJson ?? getFallbackN8nWorkflowJson()} />
                {(item.expectedTimeSaved || item.difficulty) && (
                  <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
                    {item.expectedTimeSaved && (
                      <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 4 }}>예상 효과</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>{item.expectedTimeSaved}</div>
                      </div>
                    )}
                    {item.difficulty && (
                      <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: COLOR.text3, marginBottom: 4 }}>구성 난이도</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>{item.difficulty}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{
                  fontSize: 13, color: COLOR.text2, lineHeight: 1.9, whiteSpace: "pre-line",
                  marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLOR.bgSubtle}`,
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#1A1F27", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.owner[0]}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.text }}>{item.owner}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#1A1F27", color: "#fff", padding: "2px 7px", borderRadius: 20 }}>
                        담당자
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: COLOR.text2 }}>{item.dept}</div>
                  </div>
                </div>
                <a href={`mailto:${item.ownerEmail}`} style={{ textDecoration: "none" }}>
                  <button style={{
                    background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 6,
                    padding: "7px 14px", fontSize: 12, fontWeight: 600, color: COLOR.text2,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    이메일
                  </button>
                </a>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLOR.bgSubtle}`, fontSize: 12, color: COLOR.text3 }}>
                {item.ownerEmail}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: COLOR.bgSubtle, border: `1px solid ${COLOR.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: COLOR.text2 }}>
              공지·질문·이슈제보·건의를 자유롭게 남길 수 있는 공간입니다. 담당자 직접 문의는 담당자 탭을 이용하세요.
            </div>

            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: COLOR.text3, fontSize: 13 }}>
                아직 등록된 글이 없습니다.
              </div>
            )}

            {posts.map(p => (
              <div key={p.id} style={{
                background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: COLOR.border, color: COLOR.text2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.author[0]}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{p.author}</span>
                        <span style={{ fontSize: 11, color: COLOR.text3 }}>{p.dept}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: POST_TAG_COLOR[p.tag].bg, color: POST_TAG_COLOR[p.tag].color,
                          padding: "1px 8px", borderRadius: 20,
                        }}>
                          {p.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#CBD5E1", flexShrink: 0 }}>{p.date}</span>
                </div>
                <div style={{ fontSize: 13, color: COLOR.text2, lineHeight: 1.8, paddingLeft: 38, marginBottom: 10 }}>
                  {p.text}
                </div>
                <div style={{ paddingLeft: 38 }}>
                  <button onClick={() => togglePostLike(p.id)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, padding: "3px 8px",
                    borderRadius: 6, color: p.likedByMe ? "#DC2626" : COLOR.text3,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={p.likedByMe ? "#DC2626" : "none"} stroke={p.likedByMe ? "#DC2626" : COLOR.text3} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.likes}</span>
                  </button>
                </div>
              </div>
            ))}

            <div style={{ background: "#fff", border: `1.5px solid ${COLOR.border}`, borderRadius: 10, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLOR.text, marginBottom: 10 }}>글 작성</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {POST_TAGS.map(tag => (
                  <button key={tag} onClick={() => setPostTag(tag)} style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${postTag === tag ? POST_TAG_COLOR[tag].color : COLOR.border}`,
                    background: postTag === tag ? POST_TAG_COLOR[tag].bg : "#fff",
                    color: postTag === tag ? POST_TAG_COLOR[tag].color : COLOR.text3,
                  }}>
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="공지, 질문, 이슈, 건의 등 자유롭게 남겨주세요."
                style={{
                  width: "100%", boxSizing: "border-box", minHeight: 80,
                  padding: "12px 14px", fontSize: 13, color: COLOR.text,
                  border: `1.5px solid ${COLOR.border}`, borderRadius: 8, outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={handlePost} style={{
                  background: COLOR.primary, color: "#fff", border: "none", borderRadius: 7,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}