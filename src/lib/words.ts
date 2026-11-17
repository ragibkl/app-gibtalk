// Reading and writing GibTalk word files. Backups and templates share one
// format: a YAML list of words, each with a label, a picture and a language,
// and folders holding more words in `children`.
import YAML from "yaml";

/**
 * The languages always offered. Any other language the browser has a voice for
 * is offered too (see speech.ts), as the app offers the device's languages.
 */
export const APP_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Malaysia" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "zh", label: "Chinese" },
  { code: "ta", label: "Tamil" },
  // The app uses "tu" for Telugu, so files must too.
  { code: "tu", label: "Telugu" },
] as const;

/**
 * A language code as the app stores it: the base code ("es", not "es-ES"), and
 * "tu" for Telugu. Any language is kept, even one this browser can't speak.
 */
export type Language = string;

const names = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" });
  } catch {
    return undefined;
  }
})();

/** "es" → "Spanish". */
export function languageLabel(code: Language): string {
  const own = APP_LANGUAGES.find((l) => l.code === code);
  if (own) return own.label;
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** A word being edited. `id` only lives in the builder, never in the file. */
export type BuilderWord = {
  id: string;
  label: string;
  uri: string;
  language: Language;
  /** Present, even when empty, means this is a folder. */
  children?: BuilderWord[];
};

type FileWord = {
  label: string;
  uri: string;
  language: string;
  children?: FileWord[];
};

let nextId = 0;
export function newId(): string {
  nextId += 1;
  return `w${Date.now().toString(36)}${nextId}`;
}

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && /^[a-z]{2,3}$/.test(value);
}

function fromFile(items: unknown, fallback: Language): BuilderWord[] {
  if (!Array.isArray(items)) throw new Error("not a list of words");
  return items.map((item) => {
    if (!item || typeof item !== "object" || !("label" in item)) {
      throw new Error("a word without a label");
    }
    const w = item as Partial<FileWord>;
    return {
      id: newId(),
      label: String(w.label ?? ""),
      uri: typeof w.uri === "string" ? w.uri : "",
      language: isLanguage(w.language) ? w.language : fallback,
      children: Array.isArray(w.children)
        ? fromFile(w.children, fallback)
        : undefined,
    };
  });
}

export function parseWords(text: string): BuilderWord[] {
  return fromFile(YAML.parse(text), "en");
}

/** A template from the symbols API: JSON with its words under `words`. */
export function parseTemplate(json: unknown): BuilderWord[] {
  const words =
    json && typeof json === "object" && "words" in json ? json.words : [];
  return fromFile(words, "en");
}

function toFile(words: BuilderWord[]): FileWord[] {
  return words.map((w) => ({
    label: w.label.trim(),
    uri: w.uri,
    language: w.language,
    ...(w.children ? { children: toFile(w.children) } : {}),
  }));
}

export function stringifyWords(words: BuilderWord[]): string {
  return YAML.stringify(toFile(words), { lineWidth: 0 });
}

/** Words the app would refuse: every word needs a label and a picture. */
export function incomplete(words: BuilderWord[]): BuilderWord[] {
  return words.flatMap((w) => [
    ...(!w.label.trim() || !w.uri ? [w] : []),
    ...incomplete(w.children ?? []),
  ]);
}

export function countWords(words: BuilderWord[]): number {
  return words.reduce((n, w) => n + 1 + countWords(w.children ?? []), 0);
}
