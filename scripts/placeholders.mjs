/**
 * Blurred, tiny stand-ins for the photos, shown while the real ones load.
 * Reads the images container's originals and writes:
 *   public/placeholders/<name>-<hash>.webp   ~32px on the long side, a few hundred bytes
 *   src/data/placeholders.json               path -> { file, width, height }
 *
 * Run after adding or changing a photo:
 *   pnpm placeholders [originals dir]   (default: images/originals)
 */
import { createHash } from "node:crypto"
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import { join, parse, relative } from "node:path"
import sharp from "sharp"

const ROOT = new URL("..", import.meta.url).pathname
const ORIGINALS = process.argv[2] ?? join(ROOT, "images/originals")
const OUT_DIR = join(ROOT, "public/placeholders")
const MANIFEST = join(ROOT, "src/data/placeholders.json")

// Same formats and naming rule as the /img/ locations in images/nginx.conf.
const IMAGE = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i
const SIZE = 32

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (IMAGE.test(entry.name)) yield path
  }
}

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const manifest = {}
let bytes = 0
for await (const file of walk(ORIGINALS)) {
  const path = relative(ORIGINALS, file).split("\\").join("/")
  // Sizes and pixels both after the EXIF orientation, as transformimgs does.
  const { width, height } = (await sharp(file).metadata()).autoOrient
  const data = await sharp(file)
    .rotate()
    .resize(SIZE, SIZE, { fit: "inside" })
    .blur(1)
    .webp({ quality: 75, effort: 6 })
    .toBuffer()

  const hash = createHash("sha256").update(data).digest("hex").slice(0, 8)
  const name = `${parse(path).name.replace(/[^\w-]/g, "_")}-${hash}.webp`
  await writeFile(join(OUT_DIR, name), data)
  manifest[path] = { file: name, width, height }
  bytes += data.length
  console.log(`${path} -> ${name} (${data.length} B, ${width}x${height})`)
}

const sorted = Object.fromEntries(
  Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
)
await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + "\n")
console.log(`${Object.keys(sorted).length} placeholders, ${bytes} B total`)
