# zmelendez.com

The source for [zmelendez.com](https://zmelendez.com), my personal portfolio:
React 19 + Vite + Tailwind CSS v4, prerendered to static HTML and served from
a small nginx container on a home server.

This is a public copy of the repo, shared to show how the site works. The
private one also has a small CMS for editing the copy; it's left out here, so
the copy is edited directly in `src/content/`. Full-size photos aren't
included either (they're served from `img.zmelendez.com`).

## How it works

- **Static, then hydrated.** `pnpm build` renders the app to HTML on the build
  machine, so the text paints before any JavaScript loads. React then hydrates
  it in the browser. See [Prerendering](#prerendering).
- **Real terrain.** The maps, the hero ridge and the Contact section's
  mountains are drawn from real elevation data: TopoStack contour exports
  smoothed into curves (`scripts/smooth-contours.mjs`), Figma traces of the
  roads and trails, and USGS terrain cross-sections of the Blue Ridge
  (`scripts/ridge-slices.mjs`). The traces draw themselves as you scroll
  (`src/components/TopoTrace.tsx`, `src/utils/tracePath.ts`).
- **Copy as data.** Everything you read on the page is in
  `src/content/site.json` and `src/content/fieldNotes.json`, typed by
  `src/data/content.ts` and `src/data/fieldNotes.ts`. In headings, `*word*`
  gets the rust accent (`src/components/Accent.tsx`).
- **Photos on demand.** An images container resizes and re-encodes photos to
  AVIF, WebP or JPEG XL for each browser, behind an nginx cache, with blurred
  placeholders baked into the site. See [Photos](#4-photos-images-container).
- **Locked-down hosting.** Every container runs as non-root on a read-only
  filesystem with `no-new-privileges`; the image encoder has no ports and no
  internet access. Traefik sits in front for TLS.
- **Tested in a real browser.** Playwright tests (`e2e/`) check the layout at
  phone through ultrawide sizes, against both the dev server and the
  production build.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload |
| `pnpm typecheck` | TypeScript check |
| `pnpm build` | Typecheck, build the static site into `dist/`, then prerender its HTML (see below) |
| `pnpm preview` | Serve the built `dist/` locally |
| `pnpm test:e2e` | Playwright tests against the dev server |
| `pnpm test:e2e:prod` | Playwright tests against the production build |
| `pnpm placeholders` | Regenerate the blurred photo placeholders (see Photos) |

To test a running container: `E2E_BASE_URL=http://localhost:8080 pnpm exec playwright test`.
First run only: `pnpm exec playwright install chromium`.

### Prerendering

`pnpm build` also renders the app to HTML (`src/entry-server.tsx`, via
`scripts/prerender.mjs`) into `dist/index.html`, so the page's text paints
before the script loads; `src/main.tsx` then hydrates it. That means
components render once without a browser:

- Don't read `window` or `document` while rendering. Do it in effects, or use
  `useMediaQuery` / `useHydrated` from `src/utils/hydration.ts`, which render
  what the server did until the browser takes over.
- Decoration that depends on the screen (the hero map, the contact ridges)
  renders only once hydrated, to keep it out of the HTML.
- Copy in the first screen uses `<Reveal appear>`, which animates in with CSS
  at first paint instead of waiting for the script.

## Self-host on a NAS (Docker)

The `Dockerfile` builds the site and serves it with
[nginx-unprivileged](https://hub.docker.com/r/nginxinc/nginx-unprivileged) on
port **8080** as a non-root user. `docker-compose.yml` runs it with a read-only
filesystem and restarts it automatically. `/healthz` is the health check.

### 1. Copy the project to the NAS

Everything except `node_modules`, `dist`, and `design` (see `.dockerignore`):

```bash
rsync -av --exclude node_modules --exclude dist --exclude design --exclude test-results \
  ./ you@nas:/volume1/docker/portfolio/
```

### 2. Build and start it

- **Synology (Container Manager):** Project → Create → choose the
  `/docker/portfolio` folder. It picks up `docker-compose.yml`; build and start.
- **Unraid / TrueNAS / QNAP / Portainer:** create a compose stack from
  `docker-compose.yml` in that folder.
- **Over SSH, anywhere:**
  ```bash
  cd /volume1/docker/portfolio && sudo docker compose up -d --build
  ```

The site is then at `http://<nas-ip>:8080`. If 8080 is taken, set
`PORTFOLIO_PORT` (e.g. `PORTFOLIO_PORT=8090 docker compose up -d --build`) or
edit the port in `docker-compose.yml`.

Building on the NAS gives an image for its own CPU. To build on a Mac (Apple
silicon) for an Intel/AMD NAS instead, build for that platform and import it:

```bash
docker buildx build --platform linux/amd64 -t zmelendez-portfolio:latest --load .
docker save zmelendez-portfolio:latest | gzip > portfolio.tar.gz
# On the NAS: import the image (Container Manager → Image → Import, or
# `docker load < portfolio.tar.gz`), then `docker compose up -d` without --build.
```

### 3. Domain and HTTPS

The container speaks plain HTTP; put the NAS's reverse proxy in front for TLS.
On Synology: Control Panel → Login Portal → Advanced → Reverse Proxy, from
`https://zmelendez.com:443` to `http://localhost:8080`, with a Let's Encrypt
certificate from Control Panel → Security → Certificate. Nginx Proxy Manager,
Traefik, Caddy, or a Cloudflare Tunnel work the same way.

`index.html` hard-codes `https://zmelendez.com` as the canonical and Open Graph
URL; change it if the site lives elsewhere.

### 4. Photos (images container)

`docker compose up -d --build` also starts two image services:

- **`images`** (no host port; Traefik routes `img.zmelendez.com` to it over
  the `apps` network): nginx, which serves the full-size originals and is the
  only way in to transformimgs.
- **`transformimgs`** ([Pixboost/transformimgs](https://github.com/Pixboost/transformimgs)):
  resizes and re-encodes to AVIF, WebP or JPEG XL, depending on what the
  browser accepts. It sits on an internal network with no ports and no
  internet access.

| URL | Returns |
| --- | --- |
| `/originals/<path>` | The file as uploaded |
| `/img/<path>/optimise` | Re-encoded at its own size |
| `/img/<path>/resize?size=<w>` | Re-encoded at width `w`: 320, 480, 640, 800, 960, 1280, 1600, 1920 or 2560 |

Put photos in `images/originals/` (git-ignored), or set `IMAGES_DIR` to a
NAS share, e.g. `IMAGES_DIR=/volume1/photos/site docker compose up -d`.

The site is built with `VITE_IMAGES_URL=https://img.zmelendez.com` (the
Dockerfile's default), so photos load from that host.

In code, use `src/utils/image.ts`:

```tsx
<img {...imageProps("hikes/hawksbill.jpeg", { sizes: "(min-width: 1024px) 50vw, 100vw" })} alt="" />
```

How it behaves:

- transformimgs fetches whatever URL it is given, so nginx builds that URL
  itself, from `/originals/` only. Paths may not start with a dot, and only the
  widths above are allowed, so nobody can make the NAS encode endless sizes.
- transformimgs keeps no cache, so nginx caches each result (up to 2 GB, in
  the `image-cache` volume; the `X-Cache` header shows HIT or MISS). The first
  request for a size takes a few seconds on a large photo, so `images/warm.sh`
  requests every width in each browser format when the container starts and
  daily after that (`docker logs zmelendez-images | grep warm:`).
- Results are cached for 60 days by nginx and for 30 days by browsers. Give a
  changed photo a new filename. To drop nginx's cache:
  `docker compose down && docker volume rm zmelendez-portfolio_image-cache`.
- `pixboost/transformimgs` is published for **amd64 only**. On an ARM NAS,
  build it from the upstream repo's `Dockerfile` instead.

`pnpm dev` proxies `/img/` and `/originals/` to `https://img.zmelendez.com`
(`IMAGES_PROXY` to change).

#### Blurred placeholders

Each photo shows a blurred ~32px version (a couple hundred bytes) as its
`<img>`'s background until the real one paints over it. `imageProps` adds it
for any photo listed in `src/data/placeholders.json`. After adding or changing
a photo, regenerate them with [sharp](https://sharp.pixelplumbing.com/):

```bash
pnpm placeholders            # reads images/originals/, or pass another folder
```

This writes `public/placeholders/<name>-<hash>.webp` (served by the site, cached
for a year) and the manifest with each photo's size. The Docker build does not
see the originals, so run it before deploying.

### Updating

Copy the changed project over again (step 1), then:

```bash
sudo docker compose up -d --build --force-recreate
```

## Project layout

- `src/` — the app. Map artwork the code imports is in `src/assets/`
  (including `newfound-gap-vertical.svg` and `champney-falls-trail.svg`,
  whose black guide paths the hero's road label and the About trail label
  follow).
- `src/assets/skyline-drive/` — Skyline Drive at 100, 500, 1,000, 2,500 and
  all 6,977 points; `src/data/hawksbillMap.ts` picks one. Compare them at
  `/dev/skyline.html` on the dev server (not part of the build).
- `src/assets/contact-ridges.svg` — the Blue Ridge from Newport, VA, looking
  east, as nine terrain cross-sections from 4 to 32 km: the Contact section's
  ridges (colours and parallax in `src/data/contactRidges.ts`). Made from
  USGS elevation by `scripts/ridge-slices.mjs`, which also writes the other
  slice counts to `design/ridge-slices/`; compare them at `/dev/ridges.html`
  on the dev server (not part of the build).
- `src/assets/contours/` — the maps' TopoStack contours, smoothed into
  curves by `scripts/smooth-contours.mjs` from the exports in
  `design/contours-unsimplified/` (settings picked at `/dev/contours.html`
  on the dev server), fetched at runtime. Imported with `?url`,
  so they ship under `/assets/` with a content hash and a new export is never
  stuck behind a cached copy.
- `src/content/` — the site's copy (see How it works).
- `public/` — files served as-is: icons and photos.
- `nginx/` — server config copied into the image.
- `images/` — the images container's Dockerfile and nginx config; full-size
  photos go in `images/originals/` (not in git or the site image).
- `e2e/` — Playwright tests.
- `design/` — sources, not part of the build or the image:
  - `traces/` — Figma exports of the route traces;
    `skyline-drive-source.svg` is the full-detail frame the
    `src/assets/skyline-drive/` resolutions were cut from.
  - `contours-unsimplified/` — the raw TopoStack contour exports.
  - `ridge-slices/` — the other slice counts from `scripts/ridge-slices.mjs`.

## License

The code is yours to read and borrow from. The copy, photos and my headshot
are mine; please don't reuse them as-is.
