// Laying out words as printed grid pages: one board (a single folder), or a
// communication book (every folder on its own page, linked by page numbers).
import type { BuilderWord } from "./words";

export type GridSize = { rows: number; cols: number };

// Teachers pick rows and columns; core boards are often 6 × 7 or 6 × 9.
export const ROW_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8];
export const COLUMN_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export type PrintCell = {
  word: BuilderWord;
  /** Book only: the page a folder's words start on. */
  page?: number;
};

export type PrintPage = {
  number: number;
  title: string;
  cells: PrintCell[];
  /** Book only: the page of the folder this one sits in. */
  back?: number;
};

type Node = { title: string; words: BuilderWord[]; parent?: Node };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
}

function partTitle(title: string, i: number, n: number): string {
  return n > 1 ? `${title} (${i + 1}/${n})` : title;
}

/** One folder's words as a board; more words than fit run onto more pages. */
export function boardPages(
  title: string,
  words: BuilderWord[],
  grid: GridSize,
): PrintPage[] {
  const parts = chunk(words, grid.rows * grid.cols);
  return parts.map((part, i) => ({
    number: i + 1,
    title: partTitle(title, i, parts.length),
    cells: part.map((word) => ({ word })),
  }));
}

/** Every folder on its own page(s), top level first, then folder by folder. */
export function bookPages(
  title: string,
  words: BuilderWord[],
  grid: GridSize,
): PrintPage[] {
  const perPage = grid.rows * grid.cols;

  // Breadth first: the top level, then each folder in the order it appears.
  const nodes: Node[] = [];
  const folderNode = new Map<string, Node>();
  const queue: Node[] = [{ title, words }];
  while (queue.length) {
    const node = queue.shift()!;
    nodes.push(node);
    for (const w of node.words) {
      if (!w.children) continue;
      const child: Node = {
        title: `${node.title} › ${w.label || "Untitled folder"}`,
        words: w.children,
        parent: node,
      };
      folderNode.set(w.id, child);
      queue.push(child);
    }
  }

  // Number the pages first, so folder cells can point ahead.
  const startPage = new Map<Node, number>();
  let next = 1;
  for (const node of nodes) {
    startPage.set(node, next);
    next += Math.max(1, Math.ceil(node.words.length / perPage));
  }

  const pages: PrintPage[] = [];
  for (const node of nodes) {
    const parts = chunk(node.words, perPage);
    parts.forEach((part, i) => {
      pages.push({
        number: startPage.get(node)! + i,
        title: partTitle(node.title, i, parts.length),
        back: node.parent ? startPage.get(node.parent) : undefined,
        cells: part.map((word) => {
          const child = folderNode.get(word.id);
          return { word, page: child ? startPage.get(child) : undefined };
        }),
      });
    });
  }
  return pages;
}
