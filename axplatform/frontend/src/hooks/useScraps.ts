// ===== hooks/useScraps.ts =====
// 스크랩(북마크) 공용 훅. 상태는 localStorage "ax_scraps"(itemId 문자열 배열)에 저장하고,
// useSyncExternalStore로 같은 탭 내 모든 소비자(상세 헤더·목록/랜딩 카드·개인화 패널·벨 옆 카운트)를
// 즉시 동기화한다. 다른 탭 변경은 window "storage" 이벤트로 반영.
// TODO: 실제 연동 시 백엔드 scraps 테이블(user_id·item_id) + 멱등 PUT/DELETE /api/v1/scraps/:itemId로 교체.

import { useSyncExternalStore } from "react";

const KEY = "ax_scraps";

// 파싱 결과를 캐시해 getSnapshot이 안정 참조를 반환하도록 한다(useSyncExternalStore 요구사항).
let cache: string[] = readRaw();
const listeners = new Set<() => void>();

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function emit() {
  cache = readRaw();
  listeners.forEach(l => l());
}

function write(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패는 무시(데모) */
  }
  emit();
}

// 외부(모듈 레벨) 조작 API — 컴포넌트 밖에서도 호출 가능.
export function toggleScrap(itemId: string): void {
  const cur = readRaw();
  const next = cur.includes(itemId) ? cur.filter(id => id !== itemId) : [itemId, ...cur];
  write(next);
}
export function isScrapped(itemId: string): boolean {
  return readRaw().includes(itemId);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) emit(); };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
function getSnapshot(): string[] {
  return cache;
}

export function useScraps() {
  const scraps = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    scraps,
    count: scraps.length,
    isScrapped: (itemId: string) => scraps.includes(itemId),
    toggle: toggleScrap,
  };
}
