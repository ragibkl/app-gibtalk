// Share links carry the whole set in the part after "#", which browsers never
// send to a server: nothing is uploaded or stored anywhere.
//
// Format (version 1): https://app.gibtalk.com/s#1<data>
//   data = base64url(deflate-raw(JSON [name, words]))
//   word = [label, picture, language] or [label, picture, language, [words]]
//   picture: a GibTalk symbol path ("arasaac/eat.png") or "" (photos are
//   left out: they're too big for a link and may be personal).
// The GibTalk app reads the same format, so keep it backwards compatible.
import { MEDIA } from "./api";
import { newId, type BuilderWord, type Language } from "./words";

type Packed = [string, string, string, Packed[]?];

// Links point at wherever this page is served (app.gibtalk.com when live, a
// test address before that). Readers only look at the part after "#".
const SHARE_BASE = `${location.origin}/s#`;

function pack(words: BuilderWord[], dropped: { n: number }): Packed[] {
  return words.map((w) => {
    let pic = "";
    if (w.uri.startsWith(MEDIA)) pic = w.uri.slice(MEDIA.length);
    else if (w.uri) dropped.n += 1;
    const item: Packed = [w.label, pic, w.language];
    if (w.children) item.push(pack(w.children, dropped));
    return item;
  });
}

function unpack(items: Packed[]): BuilderWord[] {
  return items.map(([label, pic, language, children]) => ({
    id: newId(),
    label: String(label),
    uri: pic ? MEDIA + pic : "",
    language: language as Language,
    children: children ? unpack(children) : undefined,
  }));
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: GenericTransformStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export async function makeShareLink(
  name: string,
  words: BuilderWord[],
): Promise<{ url: string; photosLeftOut: number }> {
  const dropped = { n: 0 };
  const json = JSON.stringify([name, pack(words, dropped)]);
  const bytes = await pipe(
    new TextEncoder().encode(json),
    new CompressionStream("deflate-raw"),
  );
  return { url: SHARE_BASE + "1" + toBase64Url(bytes), photosLeftOut: dropped.n };
}

/** Reads the part after "#" of a share link. */
export async function readShareLink(
  fragment: string,
): Promise<{ name: string; words: BuilderWord[] }> {
  const data = fragment.replace(/^#/, "");
  if (!data.startsWith("1")) throw new Error("unknown share link version");
  const bytes = await pipe(
    fromBase64Url(data.slice(1)),
    new DecompressionStream("deflate-raw"),
  );
  const [name, words] = JSON.parse(new TextDecoder().decode(bytes));
  return { name: String(name), words: unpack(words) };
}
