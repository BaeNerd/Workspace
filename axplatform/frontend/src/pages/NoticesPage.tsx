import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CONTENT_MAX_WIDTH } from "../styles/layout";
import { COLOR } from "../styles/tokens";
import { NOTICE_KINDS } from "../types/noticeTypes";
import type { NoticeKind } from "../types/noticeTypes";
import { getNotices } from "../lib/dataSource";
import { useVisibleCount } from "../hooks/useVisibleCount";
import LoadMoreButton from "../components/LoadMoreButton";

// ============================================================
// NoticesPage — 공지사항·업데이트 소식 목록 (/notices)
// 랜딩 최신소식 "더보기"의 연결 대상. 종류 탭 + 목록 + 항목 펼침(본문).
// 표시 규칙: visible=true만, pinned 우선 + 최신순 (mocks/noticeMockData 헬퍼).
// TODO: 실제 연동 시 GET /api/v1/notices 로 교체.
// ============================================================

const C = {
  primary: COLOR.primary, text: COLOR.text, text2: COLOR.text2, text3: COLOR.text3,
  border: COLOR.border, bgSubtle: COLOR.bgSubtle, page: COLOR.page,
};

const KIND_STYLE: Record<NoticeKind, { color: string; bg: string }> = {
  "공지사항": { color: "#2563EB", bg: "#EFF6FF" },
  "업데이트": { color: "#059669", bg: "#ECFDF5" },
};

const isNoticeKind = (v: string | null): v is NoticeKind => v !== null && (NOTICE_KINDS as string[]).includes(v);

export default function NoticesPage() {
  const [params, setParams] = useSearchParams();
  const initialTab: NoticeKind = isNoticeKind(params.get("kind")) ? (params.get("kind") as NoticeKind) : "공지사항";
  const [tab, setTab] = useState<NoticeKind>(initialTab);
  const [expanded, setExpanded] = useState<string | null>(null);

  const notices = getNotices(tab);
  // 탭별 독립 카운트 — resetKey=tab이므로 종류 전환 시 표시 수가 초기값으로 되돌아간다.
  const { visibleCount, showMore } = useVisibleCount(10, 10, tab);

  const selectTab = (t: NoticeKind) => {
    setTab(t);
    setExpanded(null);
    setParams(t === "공지사항" ? {} : { kind: t }, { replace: true });
  };

  return (
    <div style={{ fontFamily: "var(--font-landing)", background: C.page, minHeight: "100vh", color: C.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: "0 auto", padding: "40px 32px 48px", width: "100%", boxSizing: "border-box" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 300, color: C.text }}>
          <span style={{ fontWeight: 600 }}>소식</span>
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: C.text2 }}>AX 플랫폼의 공지사항과 업데이트 소식을 확인하세요.</p>

        {/* 종류 탭 */}
        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          {NOTICE_KINDS.map(t => {
            const on = tab === t;
            return (
              <button key={t} onClick={() => selectTab(t)} style={{
                borderRadius: 9999, padding: "9px 20px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                background: on ? C.primary : "#fff", color: on ? "#fff" : C.text2,
                boxShadow: on ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
              }}>{t}</button>
            );
          })}
        </div>

        {/* 목록 */}
        <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, boxShadow: "2.5px 4.33px 29px 0px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {notices.length === 0 ? (
            <div style={{ padding: "64px 0", textAlign: "center", fontSize: 14, fontWeight: 600, color: C.text3 }}>
              등록된 소식이 없어요
            </div>
          ) : (
            notices.slice(0, visibleCount).map((n, i) => {
              const open = expanded === n.id;
              return (
                <div key={n.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                  <button
                    onClick={() => setExpanded(open ? null : n.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "18px 24px",
                      background: open ? C.bgSubtle : "transparent", border: "none", cursor: "pointer", textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, color: KIND_STYLE[n.kind].color, background: KIND_STYLE[n.kind].bg }}>
                      {n.kind}
                    </span>
                    {n.pinned && (
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "3px 8px", borderRadius: 9999 }}>고정</span>
                    )}
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 12, color: C.text3 }}>{n.date}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {open && (
                    <div style={{ padding: "0 24px 22px", fontSize: 14, color: C.text2, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {n.body}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <LoadMoreButton remaining={notices.length - visibleCount} onClick={showMore} />
      </div>

      <div style={{ flex: 1 }} />
      <Footer />
    </div>
  );
}
