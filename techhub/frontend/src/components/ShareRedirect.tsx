import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useShareNotice } from "../context/ShareNoticeContext";

// 공유 모드에서 랜딩(/) 외 모든 경로를 가로채는 컴포넌트.
// 마운트 시 안내를 띄우고 랜딩으로 복귀시켜, 모든 내부 이동을 "안내 표시 + 랜딩 유지"로 수렴시킨다.
export default function ShareRedirect() {
  const { showNotice } = useShareNotice();
  useEffect(() => { showNotice(); }, [showNotice]);
  return <Navigate to="/" replace />;
}
