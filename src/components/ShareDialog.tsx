// A link and QR code that carry the whole set (see lib/share.ts).
import { useEffect, useRef, useState } from "preact/hooks";
import QRCode from "qrcode";
import { makeShareLink } from "../lib/share";
import type { WordSet } from "../lib/store";
import Dialog from "./Dialog";

type Props = { set: WordSet; onClose(): void };

export default function ShareDialog({ set, onClose }: Props) {
  const [link, setLink] = useState<{ url: string; photosLeftOut: number } | null>(null);
  const [big, setBig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    makeShareLink(set.name, set.words).then(setLink);
  }, [set]);

  useEffect(() => {
    if (!link || !canvas.current) return;
    QRCode.toCanvas(canvas.current, link.url, {
      width: big ? Math.min(innerWidth, innerHeight) - 120 : 280,
      margin: 2,
      errorCorrectionLevel: "L",
    }).then(
      () => setTooBig(false),
      () => setTooBig(true),
    );
  }, [link, big]);

  if (big)
    return (
      <div class="qr-full" onClick={() => setBig(false)}>
        <h1>{set.name}</h1>
        <canvas ref={canvas} />
        <p>Scan with a phone or tablet camera to get this set</p>
        <p class="muted">Click anywhere to close</p>
      </div>
    );

  return (
    <Dialog title={`Share "${set.name}"`} onClose={onClose}>
      {!link && <p class="muted">Making the link…</p>}
      {link && (
        <>
          <p>
            Anyone with this link or code gets a copy of the set. It travels inside
            the link itself: nothing is uploaded or stored anywhere.
          </p>
          {link.photosLeftOut > 0 && (
            <p class="note">
              {link.photosLeftOut} photo{link.photosLeftOut > 1 ? "s are" : " is"} left
              out: photos are too big for a link and may be personal. Those words
              arrive without a picture. To include photos, download the file instead.
            </p>
          )}
          <div class="share-row">
            <input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} />
            <button
              class="btn"
              onClick={async () => {
                await navigator.clipboard.writeText(link.url);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          {tooBig ? (
            <p class="note">This set is too big for a QR code. Send the link instead (e.g. on WhatsApp).</p>
          ) : (
            <div class="qr">
              <canvas ref={canvas} />
              <button class="btn" onClick={() => setBig(true)}>Show big (for a projector)</button>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
