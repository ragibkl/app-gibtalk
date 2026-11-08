import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

type Props = { title: string; onClose(): void; children: ComponentChildren; wide?: boolean };

export default function Dialog({ title, onClose, children, wide }: Props) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div class="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`dialog ${wide ? "wide" : ""}`} role="dialog" aria-label={title}>
        <div class="panel-head">
          <h2>{title}</h2>
          <button class="btn small" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
