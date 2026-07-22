// 랜딩 전용 단일 HTML 공유 빌드 판별 플래그 — 공유 모드의 단일 참조점.
// `vite build --mode share`(=.env.share의 VITE_SHARE_MODE=true)에서만 true.
// 본 빌드(npm run build)·개발 서버에서는 항상 false.
export const IS_SHARE_MODE = import.meta.env.VITE_SHARE_MODE === "true";
