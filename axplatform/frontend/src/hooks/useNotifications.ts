// ===== hooks/useNotifications.ts =====
// 알림 공용 훅. 알림 본문은 목업 단일 소스(notificationMockData)에서 오고,
// 읽음 상태는 localStorage "ax_notifications_read"(읽은 id 배열)와 병합해 파생한다.
//   read = (목업 시드 read) || (읽음 집합에 포함)
// 벨(NotificationBell)과 개인화 패널 "알림 현황"이 동일 소스를 공유한다.
// useSyncExternalStore로 읽음 처리 즉시 벨 뱃지·패널이 동기화된다.
// TODO: 실제 연동 시 GET/PATCH /api/v1/notifications (서버 read 상태)로 교체.

import { useSyncExternalStore } from "react";
import type { AxNotification } from "../types/notificationTypes";
import { notificationsByDate } from "../mocks/notificationMockData";

const KEY = "ax_notifications_read";

let readCache: string[] = readRaw();
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
  readCache = readRaw();
  listeners.forEach(l => l());
}

function writeRead(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패는 무시(데모) */
  }
  emit();
}

export function markRead(id: string): void {
  const cur = readRaw();
  if (cur.includes(id)) return;
  writeRead([...cur, id]);
}
export function markAllRead(): void {
  const allIds = notificationsByDate().map(n => n.id);
  writeRead(Array.from(new Set([...readRaw(), ...allIds])));
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
  return readCache;
}

export function useNotifications() {
  const readIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const readSet = new Set(readIds);
  const notifications: AxNotification[] = notificationsByDate().map(n => ({
    ...n,
    read: n.read || readSet.has(n.id),
  }));
  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, unreadCount, markRead, markAllRead };
}
