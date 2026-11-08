import { useEffect, useState } from "preact/hooks";
import Library from "./components/Library";
import Board from "./components/Board";
import { getSet, newSetId, saveSet, type WordSet } from "./lib/store";
import { readShareLink } from "./lib/share";

type View =
  | { kind: "library" }
  | { kind: "board"; set: WordSet }
  | { kind: "shared"; set: WordSet }
  | { kind: "error"; message: string };

export default function App() {
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const start = async () => {
      if (location.pathname.replace(/\/$/, "") === "/s" && location.hash) {
        try {
          const { name, words } = await readShareLink(location.hash);
          setView({
            kind: "shared",
            set: { id: newSetId(), name, words, updated: Date.now() },
          });
        } catch {
          setView({ kind: "error", message: "This share link is damaged or incomplete. Ask for it again." });
        }
        return;
      }
      await route();
    };
    // Each set has its own address (/set/<id>), so reloading or the
    // browser's Back button keeps you where you were.
    const route = async () => {
      const m = location.pathname.match(/^\/set\/([\w-]+)$/);
      const set = m ? await getSet(m[1]) : undefined;
      setView(set ? { kind: "board", set } : { kind: "library" });
    };
    start();
    addEventListener("popstate", route);
    return () => removeEventListener("popstate", route);
  }, []);

  const toLibrary = () => {
    if (location.pathname !== "/") history.pushState(null, "", "/");
    setView({ kind: "library" });
  };

  const openSet = async (id: string) => {
    const set = await getSet(id);
    if (!set) return;
    history.pushState(null, "", `/set/${id}`);
    setView({ kind: "board", set });
  };

  if (!view) return null;
  if (view.kind === "error")
    return (
      <main class="page">
        <h1>GibTalk</h1>
        <p>{view.message}</p>
        <button class="btn" onClick={toLibrary}>Go to my sets</button>
      </main>
    );
  if (view.kind === "library") return <Library onOpen={openSet} />;

  const shared = view.kind === "shared";
  return (
    <Board
      key={view.set.id}
      set={view.set}
      shared={shared}
      onChange={async (set) => {
        if (!shared) await saveSet(set);
        setView({ kind: view.kind, set });
      }}
      onSaveShared={async () => {
        await saveSet(view.set);
        history.replaceState(null, "", `/set/${view.set.id}`);
        setView({ kind: "board", set: view.set });
      }}
      onExit={toLibrary}
    />
  );
}
