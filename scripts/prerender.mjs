/**
 * Fills dist/index.html's #root with the app rendered to HTML, so the page
 * paints its content before the script loads; main.tsx then hydrates it.
 * Runs after the client and server builds (`pnpm build`).
 */
import { readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const DIST = join(ROOT, "dist")
const SERVER = join(ROOT, "dist-server")

const { render } = await import(join(SERVER, "entry-server.js"))
const html = render()

const page = join(DIST, "index.html")
const template = await readFile(page, "utf8")
const marker = '<div id="root"></div>'
if (!template.includes(marker)) throw new Error(`no ${marker} in ${page}`)
await writeFile(page, template.replace(marker, `<div id="root">${html}</div>`))
await rm(SERVER, { recursive: true, force: true })

console.log(`prerendered ${(html.length / 1024).toFixed(1)} kB of HTML into dist/index.html`)
