// Word files (.yaml), the same format as the GibTalk app's backups.
import { parseWords, stringifyWords, type BuilderWord } from "./words";

export function downloadWords(name: string, words: BuilderWord[]) {
  const blob = new Blob([stringifyWords(words)], { type: "application/yaml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "gibtalk"}.yaml`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function pickWordFile(): Promise<{ name: string; words: BuilderWord[] } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".yaml,.yml,text/yaml,application/yaml";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve({
          name: file.name.replace(/\.ya?ml$/i, ""),
          words: parseWords(await file.text()),
        });
      } catch {
        reject(new Error(`${file.name} isn't a GibTalk file.`));
      }
    };
    input.click();
  });
}

/** A photo from the computer, shrunk to 200 × 200 like the app does. */
export function pickPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 200;
        canvas
          .getContext("2d")!
          .drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            200,
            200,
          );
        resolve(canvas.toDataURL("image/jpeg", 0.85));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  });
}
