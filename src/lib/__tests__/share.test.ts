// Share links already sent to parents and teachers must keep opening, in this
// web app and in the phone app (ragibkl/GibTalk has the same test). If this
// fixed format-1 link stops decoding, old links are broken.
import { beforeAll, describe, expect, it } from "vitest";

const V1 =
  "1bc1BCsIwFATQq5RZR8WDuHQVshjrJy0m_4ckFbx9KRVE6HaYN-NxH1mow_sK5z2aJGb2oTDOcGBlI8dT--SHpXaJZs8hW9VZ47lohENuCM7jxhf1QAj7r7g9KNvRcp1H-V_MVgUOcBBFCFs0WeKBnSQl-2LZcZe0xGXnfdn4Cg";

let share: typeof import("../share");
let MEDIA: string;
beforeAll(async () => {
  // share.ts builds links from the page's address.
  (globalThis as { location?: unknown }).location = { origin: "https://app.gibtalk.com" };
  share = await import("../share");
  MEDIA = (await import("../api")).MEDIA;
});

describe("share links, format 1", () => {
  it("still decodes", async () => {
    const set = await share.readShareLink("#" + V1);
    expect(set.name).toBe("Ucapan v1");
    expect(set.words.map((w) => w.label)).toEqual(["selamat pagi", "Makan", "hola", "telugu"]);
    expect(set.words[0]).toMatchObject({ uri: MEDIA + "arasaac-symbols/good morning.png", language: "ms" });
    expect(set.words[1].children?.map((w) => w.label)).toEqual(["nasi", "more"]);
    expect(set.words[2].language).toBe("es");
    expect(set.words[3]).toMatchObject({ uri: "", language: "tu" });
  });

  it("makes links that read back the same", async () => {
    const set = await share.readShareLink("#" + V1);
    const { url } = await share.makeShareLink(set.name, set.words);
    expect(url.startsWith("https://app.gibtalk.com/s#1")).toBe(true);
    const again = await share.readShareLink(url.slice(url.indexOf("#")));
    expect(again.words.map((w) => [w.label, w.uri, w.language])).toEqual(
      set.words.map((w) => [w.label, w.uri, w.language]),
    );
  });
});
