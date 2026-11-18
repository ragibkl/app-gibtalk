// Word sets kept in this browser (IndexedDB: sets with photos are too big
// for localStorage). Nothing leaves the browser unless it's shared.
import type { BuilderWord } from "./words";

export type WordSet = {
  id: string;
  name: string;
  words: BuilderWord[];
  updated: number;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("gibtalk-app", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("sets", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction("sets", mode).objectStore("sets"));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function listSets(): Promise<WordSet[]> {
  const sets = await run<WordSet[]>("readonly", (s) => s.getAll());
  return sets.sort((a, b) => b.updated - a.updated);
}

export function getSet(id: string): Promise<WordSet | undefined> {
  return run("readonly", (s) => s.get(id));
}

export async function saveSet(set: WordSet): Promise<void> {
  await run("readwrite", (s) => s.put({ ...set, updated: Date.now() }));
  keepStorage();
}

/**
 * Asks the browser not to clear these sets when the disk runs low. Chrome and
 * Edge decide quietly; Firefox would ask with a pop-up, so it isn't asked.
 */
let askedToKeep = false;
function keepStorage() {
  if (askedToKeep || /firefox/i.test(navigator.userAgent)) return;
  askedToKeep = true;
  navigator.storage?.persisted?.()
    .then((kept) => (kept ? true : navigator.storage.persist()))
    .catch(() => {});
}

/** Safari deletes a site's saved data after 7 days without a visit. */
export const isSafari =
  /safari/i.test(navigator.userAgent) &&
  !/chrome|chromium|crios|fxios|edg|android/i.test(navigator.userAgent);

export async function deleteSet(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

export function newSetId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
