// One set as a talking board, laid out like the GibTalk app: tap a word to
// say it and add it to the sentence; folders open their words. Edit mode
// changes words in place; drag to reorder.
import { useEffect, useMemo, useState } from "preact/hooks";
import type { WordSet } from "../lib/store";
import { APP_LANGUAGES, type BuilderWord, type Language } from "../lib/words";
import { folderNames, move, replaceAt, wordsAt } from "../lib/tree";
import { canSpeak, hasVoice, onVoicesChanged, speak, speakAll, stopSpeaking } from "../lib/speech";
import WordDialog from "./WordDialog";
import ShareDialog from "./ShareDialog";
import PrintDialog from "./PrintDialog";

type Props = {
  set: WordSet;
  shared: boolean;
  onChange(set: WordSet): void;
  onSaveShared(): void;
  onExit(): void;
};

const SIZES = [100, 130, 160, 200, 250];

function usedLanguages(words: BuilderWord[], out = new Set<Language>()): Set<Language> {
  for (const w of words) {
    out.add(w.language);
    if (w.children) usedLanguages(w.children, out);
  }
  return out;
}

export default function Board({ set, shared, onChange, onSaveShared, onExit }: Props) {
  const [path, setPath] = useState<string[]>([]);
  const [sentence, setSentence] = useState<BuilderWord[]>([]);
  const [editing, setEditing] = useState(false);
  const [size, setSize] = useState(() => {
    try {
      return Number(localStorage.getItem("tile")) || 160;
    } catch {
      return 160;
    }
  });
  const [dialog, setDialog] = useState<
    | null
    | { kind: "word"; word: BuilderWord | null; folder: boolean }
    | { kind: "share" }
    | { kind: "print" }
  >(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [, setVoicesTick] = useState(0);

  useEffect(() => onVoicesChanged(() => setVoicesTick((n) => n + 1)), []);
  useEffect(() => {
    try {
      localStorage.setItem("tile", String(size));
    } catch {}
  }, [size]);

  const words = wordsAt(set.words, path);
  const names = folderNames(set.words, path);
  const lastLanguage: Language = words[words.length - 1]?.language ?? set.words[0]?.language ?? "en";

  const missingVoices = useMemo(
    () =>
      canSpeak()
        ? [...usedLanguages(set.words)].filter((l) => !hasVoice(l))
        : [],
    [set.words, canSpeak()],
  );

  const setWords = (list: BuilderWord[]) =>
    onChange({ ...set, words: replaceAt(set.words, path, list) });

  const tap = (w: BuilderWord) => {
    if (editing) {
      if (w.children) setPath([...path, w.id]);
      else setDialog({ kind: "word", word: w, folder: false });
      return;
    }
    speak(w.label, w.language);
    if (w.children) setPath([...path, w.id]);
    // Tapping the same word again says it again but doesn't repeat it in
    // the sentence (children often tap a word several times).
    else setSentence((s) => (s[s.length - 1]?.id === w.id ? s : [...s, w]));
  };

  const saveWord = (w: BuilderWord) => {
    const i = words.findIndex((x) => x.id === w.id);
    setWords(i >= 0 ? words.map((x) => (x.id === w.id ? w : x)) : [...words, w]);
    setDialog(null);
  };

  const removeWord = (w: BuilderWord) => {
    const n = w.children?.length ?? 0;
    const ask = n
      ? `Delete the folder "${w.label}" and the ${n} words in it?`
      : `Delete "${w.label}"?`;
    if (confirm(ask)) setWords(words.filter((x) => x.id !== w.id));
    setDialog(null);
  };

  const fullscreen = () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();

  return (
    <div class={`board ${editing ? "editing" : ""}`} style={{ "--tile": `${size}px` }}>
      {shared && (
        <div class="banner">
          <span>
            <strong>{set.name}</strong> was shared with you. Try it here, or keep a copy.
          </span>
          <button class="btn primary" onClick={onSaveShared}>Save to my sets</button>
        </div>
      )}
      {!canSpeak() && (
        <div class="banner warn">
          This browser has no voices, so words won't be spoken. Try Microsoft Edge or Chrome.
        </div>
      )}
      {missingVoices.length > 0 && (
        <div class="banner warn">
          This browser has no{" "}
          {missingVoices
            .map((l) => APP_LANGUAGES.find((x) => x.code === l)?.label ?? l)
            .join(" or ")}{" "}
          voice, so those words use another voice. Microsoft Edge has Malay, Tamil
          and Chinese voices.
        </div>
      )}

      <header class="topbar">
        <button class="round" onClick={() => setPath(path.slice(0, -1))} disabled={!path.length}>
          <span aria-hidden="true">←</span>Back
        </button>
        <button class="round" onClick={() => setPath([])} disabled={!path.length}>
          <span aria-hidden="true">⌂</span>Home
        </button>
        <div class="sentence" aria-label="Sentence">
          {sentence.map((w, i) => (
            <button
              class="mini"
              title="Remove"
              onClick={() => setSentence(sentence.filter((_, j) => j !== i))}
            >
              <img src={w.uri} alt="" />
              <span>{w.label}</span>
            </button>
          ))}
        </div>
        <button class="round" onClick={() => setSentence(sentence.slice(0, -1))} disabled={!sentence.length}>
          <span aria-hidden="true">⌫</span>Undo
        </button>
        <button class="round" onClick={() => { stopSpeaking(); setSentence([]); }} disabled={!sentence.length}>
          <span aria-hidden="true">✕</span>Clear
        </button>
        <button class="round play" onClick={() => speakAll(sentence)} disabled={!sentence.length}>
          <span aria-hidden="true">▶</span>Play
        </button>
      </header>

      <nav class="toolbar">
        <div class="crumbs">
          <button class="link" onClick={() => setPath([])}>{set.name}</button>
          {names.map((n, i) => (
            <>
              {" › "}
              <button class="link" onClick={() => setPath(path.slice(0, i + 1))}>{n}</button>
            </>
          ))}
        </div>
        <div class="tools">
          <label class="size" title="Tile size">
            <span>Size</span>
            <input
              type="range"
              min={0}
              max={SIZES.length - 1}
              value={Math.max(0, SIZES.indexOf(size))}
              onInput={(e) => setSize(SIZES[+e.currentTarget.value])}
            />
          </label>
          {!shared && (
            <button class={`btn ${editing ? "primary" : ""}`} onClick={() => setEditing(!editing)}>
              {editing ? "Done" : "Edit"}
            </button>
          )}
          <button class="btn" onClick={() => setDialog({ kind: "share" })}>Share</button>
          <button class="btn" onClick={() => setDialog({ kind: "print" })}>Print</button>
          <button class="btn" onClick={fullscreen}>Full screen</button>
          <button class="btn" onClick={onExit}>My sets</button>
        </div>
      </nav>

      {editing && (
        <div class="edit-bar">
          <label>
            Set name{" "}
            <input value={set.name} onChange={(e) => onChange({ ...set, name: e.currentTarget.value.trim() || set.name })} />
          </label>
          <span class="muted">Click a word to change it, drag to move it, or open a folder to edit inside.</span>
        </div>
      )}

      <main class="grid">
        {words.map((w, i) => (
          <div
            class={`tile ${w.children ? "folder" : ""} ${dragFrom === i ? "dragging" : ""}`}
            role="button"
            tabIndex={0}
            draggable={editing}
            onClick={() => tap(w)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), tap(w))}
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => editing && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null && dragFrom !== i) setWords(move(words, dragFrom, i));
              setDragFrom(null);
            }}
          >
            <span class="tile-pic">{w.uri && <img src={w.uri} alt="" draggable={false} />}</span>
            <span class="tile-label">{w.label}</span>
            {editing && (
              <span class="tile-tools">
                <button
                  title={`Change ${w.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ kind: "word", word: w, folder: !!w.children });
                  }}
                >
                  ✎
                </button>
                <button
                  title={`Delete ${w.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWord(w);
                  }}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        ))}
        {editing && (
          <>
            <button class="tile add" onClick={() => setDialog({ kind: "word", word: null, folder: false })}>
              <span class="tile-pic plus">+</span>
              <span class="tile-label">Add word</span>
            </button>
            <button class="tile add folder" onClick={() => setDialog({ kind: "word", word: null, folder: true })}>
              <span class="tile-pic plus">+</span>
              <span class="tile-label">Add folder</span>
            </button>
          </>
        )}
        {!editing && !words.length && (
          <p class="empty muted">
            {shared ? "This set is empty." : "No words here yet. Click Edit to add some."}
          </p>
        )}
      </main>

      {dialog?.kind === "word" && (
        <WordDialog
          word={dialog.word}
          folder={dialog.folder}
          language={lastLanguage}
          onSave={saveWord}
          onDelete={dialog.word ? () => removeWord(dialog.word!) : undefined}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "share" && <ShareDialog set={set} onClose={() => setDialog(null)} />}
      {dialog?.kind === "print" && (
        <PrintDialog
          name={set.name}
          words={set.words}
          folderTitle={names[names.length - 1] ?? set.name}
          folderWords={words}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
