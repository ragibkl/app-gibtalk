// The pages to print, rendered straight into <body> so the rest of the site
// can be hidden while printing. The browser's print dialog can also save a PDF.
import { useEffect, useRef } from "preact/hooks";
import { createPortal } from "preact/compat";

import type { GridSize, PrintPage } from "../lib/printPages";

type Props = {
  pages: PrintPage[];
  grid: GridSize;
  onDone(): void;
};

// Smaller cells get smaller labels: sized by the tighter of rows and columns
// (A4 landscape is about 1.4 times wider than tall).
function labelSize({ rows, cols }: GridSize): string {
  const cells = Math.max(rows, cols / 1.4);
  return `${Math.max(8, Math.min(22, Math.round(64 / cells)))}pt`;
}

/** Wait until every picture has loaded (or failed), at most a few seconds. */
async function picturesReady(root: HTMLElement) {
  const images = [...root.querySelectorAll("img")];
  const loads = images.map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
  await Promise.race([Promise.all(loads), timeout]);
}

export default function PrintSheet({ pages, grid, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    document.body.classList.add("b-printing");
    const done = () => {
      document.body.classList.remove("b-printing");
      onDone();
    };
    window.addEventListener("afterprint", done, { once: true });
    picturesReady(ref.current!).then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("b-printing");
    };
  }, []);

  const style = {
    "--b-rows": String(grid.rows),
    "--b-cols": String(grid.cols),
    "--b-label": labelSize(grid),
  };

  return createPortal(
    <div class="b-print" ref={ref} style={style}>
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      {pages.map((page) => (
        <section class="b-page">
          <header class="b-page-head">
            <span class="b-page-title">{page.title}</span>
            {page.back !== undefined && (
              <span class="b-page-back">← back to page {page.back}</span>
            )}
          </header>
          <div class="b-page-grid">
            {page.cells.map(({ word, page: to }) => (
              <div class={`b-print-cell ${word.children ? "folder" : "word"}`}>
                {word.uri ? <img src={word.uri} alt="" /> : <span />}
                <span class="b-print-label">
                  {word.label}
                  {to !== undefined && (
                    <span class="b-print-to"> → p.{to}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <footer class="b-page-foot">
            <span>gibtalk.com</span>
            {pages.length > 1 && <span>Page {page.number}</span>}
          </footer>
        </section>
      ))}
    </div>,
    document.body,
  );
}
