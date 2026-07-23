// ===== hooks/useInterests.ts =====
// 관심사(설정) 공용 훅. 상태는 localStorage "ax_user_interests"에 저장한다.
//   { categories: CategoryId[]; domains: BusinessDomain[] }
// SettingsPage가 저장(save)하고, 개인화 패널 추천이 이 값을 읽어 맞춤 추천을 산출한다.
// useSyncExternalStore로 저장 즉시 패널 추천이 갱신된다.
// TODO: 실제 연동 시 PUT /api/v1/me/interests 저장 + GET /api/v1/me로 프리필로 교체.

import { useSyncExternalStore } from "react";
import type { CategoryId, BusinessDomain } from "../types/categoryTypes";

const KEY = "ax_user_interests";

export type UserInterests = {
  categories: CategoryId[];
  domains: BusinessDomain[];
};

const EMPTY: UserInterests = { categories: [], domains: [] };

let cache: UserInterests = readRaw();
const listeners = new Set<() => void>();

function readRaw(): UserInterests {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<UserInterests>;
    return {
      categories: Array.isArray(parsed.categories) ? (parsed.categories as CategoryId[]) : [],
      domains: Array.isArray(parsed.domains) ? (parsed.domains as BusinessDomain[]) : [],
    };
  } catch {
    return EMPTY;
  }
}

function emit() {
  cache = readRaw();
  listeners.forEach(l => l());
}

export function saveInterests(next: UserInterests): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패는 무시(데모) */
  }
  emit();
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
function getSnapshot(): UserInterests {
  return cache;
}

export function useInterests() {
  const interests = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const hasInterests = interests.categories.length > 0 || interests.domains.length > 0;
  return { interests, hasInterests, save: saveInterests };
}
