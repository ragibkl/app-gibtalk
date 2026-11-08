# app-gibtalk

[app.gibtalk.com](https://app.gibtalk.com): GibTalk in a web browser, made for
teachers and speech therapists working on a laptop. Build word sets, show them
on a projector, print them, and pass them to the GibTalk app on a tablet.

- **My sets**: several word sets kept in this browser (IndexedDB). Nothing is
  uploaded; there are no accounts.
- **Board**: tap a word to say it and add it to the sentence, like the app.
  Uses the browser's own voices (Microsoft Edge has Malay, Tamil and Chinese).
- **Edit**: change words in place, drag to reorder, symbol search from
  [api.gibtalk.com](https://api.gibtalk.com), or a photo from the computer.
- **Share**: a link and QR code that carry the whole set after the `#`, so it
  never reaches a server. Photos are left out. The format is documented in
  [src/lib/share.ts](src/lib/share.ts); the GibTalk app reads the same format.
- **Files**: open and download the app's word files (`.yaml`).
- **Print**: one page as a board, or the whole set as a book.

The [GibTalk app](https://github.com/ragibkl/GibTalk) and
[gibtalk.com](https://github.com/ragibkl/web-gibtalk) are separate repos. The
word-file and print code started as a copy of the gibtalk.com builder's.

## Develop

```sh
npm ci
npm run dev      # http://localhost:5180
npm run build    # type-check and build into dist/
```

## Deploy

Pushes to `master` build `ghcr.io/ragibkl/app-gibtalk:sha-<commit>`; the
homelab runs the tag pinned in flux-deploy. nginx serves `index.html` for every
path, so `/set/<id>` and share links work on reload.

## Licence

Code: MIT. Symbols keep their own licences (ARASAAC, Mulberry, Tawasol); see
[gibtalk.com/symbols](https://gibtalk.com/symbols/#credits).
