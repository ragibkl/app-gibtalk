// "My sets": the word sets kept in this browser.
import { useEffect, useState } from "preact/hooks";
import { deleteSet, listSets, newSetId, saveSet, type WordSet } from "../lib/store";
import { countWords, parseTemplate } from "../lib/words";
import { downloadWords, pickWordFile } from "../lib/files";
import { getTemplate, getTemplates, type TemplateOption } from "../lib/api";
import ShareDialog from "./ShareDialog";

type Props = { onOpen(id: string): void };

export default function Library({ onOpen }: Props) {
  const [sets, setSets] = useState<WordSet[] | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [sharing, setSharing] = useState<WordSet | null>(null);
  const [message, setMessage] = useState("");

  const reload = () => listSets().then(setSets);
  useEffect(() => {
    reload();
  }, []);

  const create = async (name: string, words: WordSet["words"]) => {
    const set = { id: newSetId(), name, words, updated: Date.now() };
    await saveSet(set);
    onOpen(set.id);
  };

  const fromTemplate = async (t: TemplateOption) => {
    setMessage(`Opening ${t.name}…`);
    try {
      const words = parseTemplate(await getTemplate(t.url));
      // Templates come as one folder (that's how the app adds them to Home);
      // as a set of its own, its words go straight on the first page.
      const only = words.length === 1 ? words[0] : null;
      await create(t.name, only?.children ? only.children : words);
    } catch {
      setMessage("That template didn't load. Check the internet connection and try again.");
    }
  };

  const openFile = async () => {
    try {
      const file = await pickWordFile();
      if (file) await create(file.name, file.words);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const showTemplates = async () => {
    setPicking(true);
    if (!templates) {
      try {
        setTemplates(await getTemplates());
      } catch {
        setMessage("Templates need an internet connection.");
        setPicking(false);
      }
    }
  };

  return (
    <main class="page">
      <header class="lib-head">
        <img src="/favicon.png" alt="" width="48" height="48" />
        <div>
          <h1>GibTalk</h1>
          <p class="muted">Build, show and share word boards. Your sets stay in this browser.</p>
        </div>
      </header>

      <div class="actions">
        <button class="btn primary" onClick={() => create("New set", [])}>+ New set</button>
        <button class="btn" onClick={showTemplates}>Start from a template</button>
        <button class="btn" onClick={openFile}>Open a GibTalk file</button>
      </div>
      {message && <p class="note" role="status">{message}</p>}

      {picking && (
        <section class="panel">
          <div class="panel-head">
            <h2>Templates</h2>
            <button class="btn small" onClick={() => setPicking(false)}>Close</button>
          </div>
          {!templates && <p class="muted">Loading…</p>}
          <ul class="tpl-list">
            {templates?.map((t) => (
              <li>
                <button class="tpl" onClick={() => fromTemplate(t)}>
                  <strong>{t.name}</strong>
                  <span class="muted">{t.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2>My sets</h2>
      {sets && !sets.length && (
        <p class="muted">No sets yet. Start a new one, or begin from a template.</p>
      )}
      <ul class="set-list">
        {sets?.map((s) => (
          <li class="set-card">
            <button class="set-open" onClick={() => onOpen(s.id)}>
              <span class="set-pics">
                {s.words.slice(0, 4).map((w) =>
                  w.uri ? <img src={w.uri} alt="" /> : <span />,
                )}
              </span>
              <strong>{s.name}</strong>
              <span class="muted">
                {countWords(s.words)} words · {new Date(s.updated).toLocaleDateString()}
              </span>
            </button>
            <div class="set-actions">
              <button class="btn small" onClick={() => setSharing(s)}>Share</button>
              <button class="btn small" onClick={() => downloadWords(s.name, s.words)}>Download</button>
              <button
                class="btn small danger"
                onClick={async () => {
                  if (confirm(`Delete "${s.name}" from this browser?`)) {
                    await deleteSet(s.id);
                    reload();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <footer class="lib-foot muted">
        Sets are saved in this browser only. To use one on another device, tap Share and
        scan the code, or download the file for the GibTalk app. <a href="https://gibtalk.com">gibtalk.com</a>
      </footer>

      {sharing && <ShareDialog set={sharing} onClose={() => setSharing(null)} />}
    </main>
  );
}
