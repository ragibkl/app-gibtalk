// Adding or changing one word or folder: its name, language and picture.
import { useEffect, useState } from "preact/hooks";
import { APP_LANGUAGES, newId, type BuilderWord, type Language } from "../lib/words";
import { searchSymbols } from "../lib/api";
import { pickPhoto } from "../lib/files";
import Dialog from "./Dialog";

type Props = {
  word: BuilderWord | null;
  folder: boolean;
  language: Language;
  onSave(word: BuilderWord): void;
  onDelete?(): void;
  onClose(): void;
};

export default function WordDialog({ word, folder, language, onSave, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(word?.label ?? "");
  const [lang, setLang] = useState<Language>(word?.language ?? language);
  const [uri, setUri] = useState(word?.uri ?? "");
  const [q, setQ] = useState(word?.label ?? "");
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  // The symbol search follows the word as it's typed, until it's changed by hand.
  const [qTouched, setQTouched] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) return;
    setStatus("Searching…");
    try {
      const found = await searchSymbols(query);
      setResults(found.slice(0, 40));
      setStatus(found.length ? "" : `No symbols for "${query}". Try a simpler word.`);
    } catch {
      setStatus("The search needs an internet connection.");
    }
  };

  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => search(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const save = () => {
    onSave({
      id: word?.id ?? newId(),
      label: label.trim(),
      uri,
      language: lang,
      children: folder ? word?.children ?? [] : undefined,
    });
  };

  const kind = folder ? "folder" : "word";
  return (
    <Dialog title={word ? `Change ${kind}` : `New ${kind}`} onClose={onClose} wide>
      <div class="word-form">
        <div class="word-preview">
          <div class={`tile ${folder ? "folder" : ""}`}>
            <span class="tile-pic">{uri && <img src={uri} alt="" />}</span>
            <span class="tile-label">{label || "…"}</span>
          </div>
        </div>
        <div class="word-fields">
          <label>
            Word
            <input
              autoFocus
              value={label}
              onInput={(e) => {
                setLabel(e.currentTarget.value);
                if (!qTouched) setQ(e.currentTarget.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && label.trim() && uri && save()}
            />
          </label>
          <label>
            Spoken in
            <select value={lang} onChange={(e) => setLang(e.currentTarget.value as Language)}>
              {APP_LANGUAGES.map((l) => (
                <option value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form
        class="search-row"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          search(q);
        }}
      >
        <input
          type="search"
          value={q}
          placeholder="Search symbols (English or Malay)"
          onInput={(e) => {
            setQTouched(true);
            setQ(e.currentTarget.value);
          }}
        />
        <button class="btn" type="submit">Search</button>
        <button
          class="btn"
          type="button"
          onClick={async () => {
            const photo = await pickPhoto();
            if (photo) setUri(photo);
          }}
        >
          Use a photo…
        </button>
      </form>
      {status && <p class="muted">{status}</p>}
      <div class="results">
        {results.map((r) => (
          <button
            class={`result ${r === uri ? "chosen" : ""}`}
            onClick={() => setUri(r)}
          >
            <img src={r} alt="" loading="lazy" />
          </button>
        ))}
      </div>

      <div class="dialog-foot">
        {onDelete && (
          <button class="btn danger" onClick={onDelete}>Delete</button>
        )}
        <span class="spacer" />
        <button class="btn" onClick={onClose}>Cancel</button>
        <button class="btn primary" disabled={!label.trim() || !uri} onClick={save}>
          {word ? "Save" : "Add"}
        </button>
      </div>
      {(!label.trim() || !uri) && (
        <p class="muted right">Every {kind} needs a name and a picture.</p>
      )}
    </Dialog>
  );
}
