// Speaking with the browser's own voices. What's available depends on the
// browser and computer: Edge has Malay; Chrome on Windows often doesn't.
import type { Language } from "./words";

const BCP47: Record<Language, string> = {
  en: "en",
  ms: "ms",
  id: "id",
  zh: "zh",
  ta: "ta",
  tu: "te",
};

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

function load() {
  voices = speechSynthesis.getVoices();
  listeners.forEach((l) => l());
}
if ("speechSynthesis" in window) {
  load();
  speechSynthesis.addEventListener("voiceschanged", load);
}

export function onVoicesChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function voiceFor(language: Language): SpeechSynthesisVoice | undefined {
  const code = BCP47[language];
  const matching = voices.filter(
    (v) => v.lang.toLowerCase().split(/[-_]/)[0] === code,
  );
  // Prefer the Malaysian/Indian variants, then any local voice.
  const regional = { ms: "my", ta: "in", te: "in", en: "", id: "", zh: "" }[code] ?? "";
  return (
    matching.find((v) => regional && v.lang.toLowerCase().endsWith(regional)) ??
    matching.find((v) => v.localService) ??
    matching[0]
  );
}

export function hasVoice(language: Language): boolean {
  return !!voiceFor(language);
}

export function canSpeak(): boolean {
  return "speechSynthesis" in window && voices.length > 0;
}

export function speak(text: string, language: Language) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[language];
  const voice = voiceFor(language);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** Speaks a sentence, keeping each word in its own language. */
export function speakAll(words: { label: string; language: Language }[]) {
  speechSynthesis.cancel();
  // Neighbouring words in the same language go together, so they flow.
  const chunks: { text: string; language: Language }[] = [];
  for (const w of words) {
    const last = chunks[chunks.length - 1];
    if (last && last.language === w.language) last.text += " " + w.label;
    else chunks.push({ text: w.label, language: w.language });
  }
  chunks.forEach((c) => speak(c.text, c.language));
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}
