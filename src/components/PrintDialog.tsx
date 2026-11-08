// Printing this folder as a board, or the whole set as a book.
import { useState } from "preact/hooks";
import { bookPages, boardPages, COLUMN_CHOICES, ROW_CHOICES } from "../lib/printPages";
import type { BuilderWord } from "../lib/words";
import Dialog from "./Dialog";
import PrintSheet from "./PrintSheet";

type Props = {
  name: string;
  words: BuilderWord[];
  folderTitle: string;
  folderWords: BuilderWord[];
  onClose(): void;
};

export default function PrintDialog({ name, words, folderTitle, folderWords, onClose }: Props) {
  const [what, setWhat] = useState<"board" | "book">("board");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [printing, setPrinting] = useState(false);
  const grid = { rows, cols };
  const pages =
    what === "board" ? boardPages(folderTitle, folderWords, grid) : bookPages(name, words, grid);

  return (
    <Dialog title="Print" onClose={onClose}>
      <fieldset class="choices">
        <label>
          <input type="radio" checked={what === "board"} onChange={() => setWhat("board")} />
          This page as a board ({folderTitle})
        </label>
        <label>
          <input type="radio" checked={what === "book"} onChange={() => setWhat("book")} />
          The whole set as a book (each folder on its own page)
        </label>
      </fieldset>
      <p class="grid-size">
        <select value={rows} onChange={(e) => setRows(+e.currentTarget.value)}>
          {ROW_CHOICES.map((n) => <option value={n}>{n}</option>)}
        </select>
        rows ×
        <select value={cols} onChange={(e) => setCols(+e.currentTarget.value)}>
          {COLUMN_CHOICES.map((n) => <option value={n}>{n}</option>)}
        </select>
        columns on A4 landscape · {pages.length} page{pages.length > 1 ? "s" : ""}
      </p>
      <p class="muted">Your browser's print window can also save a PDF.</p>
      <div class="dialog-foot">
        <span class="spacer" />
        <button class="btn primary" onClick={() => setPrinting(true)}>Print</button>
      </div>
      {printing && <PrintSheet pages={pages} grid={grid} onDone={() => setPrinting(false)} />}
    </Dialog>
  );
}
