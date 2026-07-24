import { useState } from "react";
import { COLOR } from "../styles/tokens";

// 첨부 사진 최대 장수 — 등록 폼·게시 항목 관리 편집이 공유하는 단일 상한.
export const MAX_IMAGES = 10;

// 사진 업로드 + 좌우 캐러셀 미리보기 (모듈 레벨 — 리렌더 시 포커스 손실 방지).
// 등록 폼(ProjectRegisterPage)과 게시 항목 관리(AdminProjectManage) 편집 모드가 공유해
// "편집 필드는 등록 폼과 동일" 원칙을 구조적으로 보장한다.
// 데모 단계에서는 FileReader data URL로 미리보기만 유지한다.
// TODO: 실제 연동 시 이미지 스토리지 업로드(POST /api/v1/platform-items/:id/images)로 교체.
export function ImageCarouselInput({ images, onFiles, onRemoveAt, overCapacity }: {
  images: string[]; onFiles: (files: FileList) => void; onRemoveAt: (i: number) => void; overCapacity: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const safeIdx = images.length === 0 ? 0 : Math.min(idx, images.length - 1);
  const go = (delta: number) => setIdx(() => (safeIdx + delta + images.length) % images.length);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: overCapacity ? 8 : 0 }}>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#1A1F27", color: "#fff", borderRadius: 7,
          padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: images.length >= MAX_IMAGES ? "not-allowed" : "pointer",
          opacity: images.length >= MAX_IMAGES ? 0.5 : 1, flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          사진 추가
          <input type="file" accept="image/*" multiple disabled={images.length >= MAX_IMAGES}
            onChange={e => { if (e.target.files && e.target.files.length > 0) onFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }} />
        </label>
        <span style={{ fontSize: 12, color: COLOR.text3 }}>
          {images.length > 0 ? `${images.length} / ${MAX_IMAGES}장` : "선택된 사진 없음"}
        </span>
      </div>

      {overCapacity && (
        <div style={{ fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 7, padding: "8px 12px" }}>
          사진은 최대 {MAX_IMAGES}장까지 첨부할 수 있어 앞 {MAX_IMAGES}장만 반영되었습니다.
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            position: "relative", background: COLOR.bgSubtle, border: `1.5px solid ${COLOR.border}`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 180,
          }}>
            {images.length > 1 && (
              <button type="button" onClick={() => go(-1)} aria-label="이전 사진" style={{
                position: "absolute", left: 10, width: 32, height: 32, borderRadius: "50%",
                background: "#fff", border: `1.5px solid ${COLOR.border}`, cursor: "pointer",
                fontSize: 16, color: COLOR.text2, display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
            )}
            <img src={images[safeIdx]} alt={`첨부 사진 ${safeIdx + 1}`} style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }} />
            {images.length > 1 && (
              <button type="button" onClick={() => go(1)} aria-label="다음 사진" style={{
                position: "absolute", right: 10, width: 32, height: 32, borderRadius: "50%",
                background: "#fff", border: `1.5px solid ${COLOR.border}`, cursor: "pointer",
                fontSize: 16, color: COLOR.text2, display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: COLOR.text2 }}>{safeIdx + 1} / {images.length}</span>
            <button type="button" onClick={() => onRemoveAt(safeIdx)} style={{
              background: "#fff", border: "1.5px solid #FECACA", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#EF4444", cursor: "pointer",
            }}>이 사진 삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}
