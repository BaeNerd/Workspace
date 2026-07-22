import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

// 공유 모드 전역 안내 상태 — 내부 이동 차단 시 미리보기 배너 문구를 잠깐 전환한다.
// Provider 바깥에서 호출돼도 안전하도록 기본값은 no-op (본 빌드에서 그대로 사용됨).
type ShareNoticeValue = { active: boolean; showNotice: () => void };

const ShareNoticeContext = createContext<ShareNoticeValue>({ active: false, showNotice: () => {} });

export function ShareNoticeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showNotice = useCallback(() => {
    setActive(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(false), 3000); // 약 3초 후 자동 해제
  }, []);

  // 언마운트 시 타이머 정리 (메모리 누수·언마운트 후 setState 방지)
  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }, []);

  return <ShareNoticeContext.Provider value={{ active, showNotice }}>{children}</ShareNoticeContext.Provider>;
}

export function useShareNotice() {
  return useContext(ShareNoticeContext);
}
