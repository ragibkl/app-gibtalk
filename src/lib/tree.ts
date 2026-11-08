// Helpers for a word list with folders, addressed by a path of folder ids.
import type { BuilderWord } from "./words";

export function wordsAt(words: BuilderWord[], path: string[]): BuilderWord[] {
  let list = words;
  for (const id of path) {
    const folder = list.find((w) => w.id === id);
    if (!folder?.children) return [];
    list = folder.children;
  }
  return list;
}

/** Returns a new tree with the list at `path` replaced. */
export function replaceAt(
  words: BuilderWord[],
  path: string[],
  list: BuilderWord[],
): BuilderWord[] {
  if (!path.length) return list;
  const [id, ...rest] = path;
  return words.map((w) =>
    w.id === id && w.children
      ? { ...w, children: replaceAt(w.children, rest, list) }
      : w,
  );
}

export function folderNames(words: BuilderWord[], path: string[]): string[] {
  const names: string[] = [];
  let list = words;
  for (const id of path) {
    const folder = list.find((w) => w.id === id);
    if (!folder?.children) break;
    names.push(folder.label);
    list = folder.children;
  }
  return names;
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const out = list.slice();
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}
