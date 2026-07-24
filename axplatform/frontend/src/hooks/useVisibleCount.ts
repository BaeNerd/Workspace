import { useEffect, useState } from "react";

// 성장형 목록의 "더보기" 증분 표시 카운트 — ProjectListPage의 증분 노출 패턴을 공용화한 단일 소스.
// resetKey(필터·검색·탭 등 표시 모집단을 바꾸는 값)가 변하면 표시 수를 initial로 되돌린다.
// 같은 화면에서 서로 독립인 목록(탭별 등)은 훅을 각각 호출해 카운트를 분리한다.
export function useVisibleCount(initial: number, step: number, resetKey?: unknown) {
  const [visibleCount, setVisibleCount] = useState(initial);
  useEffect(() => { setVisibleCount(initial); }, [resetKey, initial]);
  const showMore = () => setVisibleCount(c => c + step);
  return { visibleCount, showMore };
}
