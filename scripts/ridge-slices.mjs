/**
 * Draws the Blue Ridge east of Newport, VA as stacked terrain cross-sections:
 * the land's profile at each of SLICES distances, as seen from the observer,
 * farthest first. Painted back to front with a fill, nearer slices hide what's
 * behind them, so every line is real ground at a known distance. Elevation is
 * AWS's Terrarium tiles (USGS 3DEP in the US), cached in node_modules/.cache.
 * Lines are Gaussian-smoothed, thinned (RDP, THINNING frame units) and drawn
 * as Catmull-Rom curves, like the maps' contours. The nearest slices are moved
 * onto PEAKS marked `snap`, so those summits sit exactly on a line; every peak
 * is written as a `<circle data-peak>` on its ridge's line, for the Contact
 * section's tags. Writes one SVG per variant to design/ridge-slices/; compare
 * them at /dev/ridges.html on the dev server. The variant marked `ship` is also
 * written to src/assets/contact-ridges.svg for the Contact section. Lines run
 * MARGIN units past both sides of the frame, so they can slide sideways
 * without showing an end (Node 22.18+, for the .ts import):
 *
 *   node scripts/ridge-slices.mjs
 */
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"
import {
  catmullRomD,
  gaussian,
  simplifySubpath,
} from "../src/utils/smoothContours.ts"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "design/ridge-slices")
const CACHE = path.join(ROOT, "node_modules/.cache/terrarium")

/** The view the old skyline-east.svg (design/unused-site-assets) was drawn from. */
const VIEW = {
  lat: 38.5549,
  lon: -78.4806,
  eyeM: 600,
  bearing: 90,
  fov: 50,
  vexag: 2,
  width: 1200,
  height: 337,
}
const ZOOM = 12
const COLUMNS = 400
const THINNING = 0.6
/** Frame units above the highest crest; keeps the centre peak below the links. */
const TOP_PAD = 60
/** Frame units each line runs past the left and right edges. */
const MARGIN = 180

/** Variants to compare: how many slices, between which distances (km). */
const VARIANTS = [
  { name: "slices-06", slices: 6, nearKm: 5, farKm: 32, smooth: 5 },
  { name: "slices-09", slices: 9, nearKm: 4, farKm: 32, smooth: 5, ship: true },
  { name: "slices-12", slices: 12, nearKm: 3.5, farKm: 34, smooth: 4 },
]

/**
 * Named summits in view that no nearer ground hides, from OpenStreetMap
 * (natural=peak; © OpenStreetMap contributors, ODbL). `eleFt` is shown on
 * the tag: the Park Service's figure for Hawksbill (as in the field notes),
 * OSM's metres in feet for the others.
 */
const PEAKS = [
  { name: "Pollock Knob", lat: 38.5825592, lon: -78.3857258, eleFt: 3563, snap: true },
  { name: "Hawksbill", lat: 38.555363, lon: -78.3951378, eleFt: 4051, snap: true },
  { name: "Spitler Hill", lat: 38.5406795, lon: -78.390839, eleFt: 3734 },
]

const R = 6371000
const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI
const focal = VIEW.width / 2 / Math.tan(toRad(VIEW.fov / 2))

/** A peak's frame x and its depth: metres straight ahead, as slices measure. */
function placePeak({ lat, lon }) {
  const p1 = toRad(VIEW.lat)
  const p2 = toRad(lat)
  const dl = toRad(lon - VIEW.lon)
  const bearing = toDeg(
    Math.atan2(
      Math.sin(dl) * Math.cos(p2),
      Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl),
    ),
  )
  const dist =
    R *
    Math.acos(
      Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl),
    )
  const off = toRad(bearing - VIEW.bearing)
  return { x: VIEW.width / 2 + focal * Math.tan(off), depth: dist * Math.cos(off) }
}

/** A line's height at frame x, between its sampled columns. */
function lineAt(pts, x) {
  const i = pts.findIndex(([px]) => px >= x)
  if (i <= 0) return pts[Math.max(0, i)][1]
  const [x0, y0] = pts[i - 1]
  const [x1, y1] = pts[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

/** Destination point from the observer, `dist` metres along `bearing`. */
function travel(bearing, dist) {
  const b = toRad(bearing)
  const lat1 = toRad(VIEW.lat)
  const lon1 = toRad(VIEW.lon)
  const a = dist / R
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(a) + Math.cos(lat1) * Math.sin(a) * Math.cos(b),
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(a) * Math.cos(lat1),
      Math.cos(a) - Math.sin(lat1) * Math.sin(lat2),
    )
  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI]
}

/** Fractional Web Mercator tile coordinates at ZOOM. */
function tileXY(lat, lon) {
  const n = 2 ** ZOOM
  const x = ((lon + 180) / 360) * n
  const r = toRad(lat)
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
  return [x, y]
}

const tiles = new Map()
async function loadTile(tx, ty) {
  const key = `${tx}/${ty}`
  if (tiles.has(key)) return
  const file = path.join(CACHE, `${ZOOM}-${tx}-${ty}.png`)
  if (!fs.existsSync(file)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tx}/${ty}.png`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: ${res.status}`)
    fs.mkdirSync(CACHE, { recursive: true })
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const h = new Float32Array(info.width * info.height)
  for (let i = 0; i < h.length; i++)
    h[i] = data[i * 3] * 256 + data[i * 3 + 1] + data[i * 3 + 2] / 256 - 32768
  tiles.set(key, { h, size: info.width })
}

/** Bilinear elevation (m) at a lat/lon whose tiles are loaded. */
function elevation(lat, lon) {
  const [fx, fy] = tileXY(lat, lon)
  const sample = (px, py) => {
    const tx = Math.floor(px / 256)
    const ty = Math.floor(py / 256)
    const t = tiles.get(`${tx}/${ty}`)
    return t.h[(py - ty * 256) * t.size + (px - tx * 256)]
  }
  const px = fx * 256 - 0.5
  const py = fy * 256 - 0.5
  const x0 = Math.floor(px)
  const y0 = Math.floor(py)
  const dx = px - x0
  const dy = py - y0
  return (
    sample(x0, y0) * (1 - dx) * (1 - dy) +
    sample(x0 + 1, y0) * dx * (1 - dy) +
    sample(x0, y0 + 1) * (1 - dx) * dy +
    sample(x0 + 1, y0 + 1) * dx * dy
  )
}

async function loadArea(farM) {
  const half =
    (Math.atan((VIEW.width / 2 + MARGIN) / focal) * 180) / Math.PI + 2
  const corners = [
    [VIEW.lat, VIEW.lon],
    travel(VIEW.bearing - half, farM * 1.05),
    travel(VIEW.bearing + half, farM * 1.05),
    travel(VIEW.bearing, farM * 1.05),
  ].map(([la, lo]) => tileXY(la, lo))
  const xs = corners.map((c) => Math.floor(c[0]))
  const ys = corners.map((c) => Math.floor(c[1]))
  for (let tx = Math.min(...xs) - 1; tx <= Math.max(...xs) + 1; tx++)
    for (let ty = Math.min(...ys) - 1; ty <= Math.max(...ys) + 1; ty++)
      await loadTile(tx, ty)
}

/** Screen point for ground `h` metres high, `dist` metres out, at column angle `off`. */
function project(off, dist, h) {
  // Drop for the earth's curve, less a little for refraction.
  const drop = (0.87 * dist * dist) / (2 * R)
  const rise = (h - drop - VIEW.eyeM) / dist
  return VIEW.vexag * rise * focal
}

function slice(dist, smooth) {
  const pts = []
  const span = VIEW.width + 2 * MARGIN
  const columns = Math.round((COLUMNS * span) / VIEW.width)
  for (let c = 0; c <= columns; c++) {
    const x = (c / columns) * span - MARGIN
    const off = Math.atan((x - VIEW.width / 2) / focal)
    // Along the ray, so the slice is a true arc at this distance.
    const along = dist / Math.cos(off)
    const [lat, lon] = travel(VIEW.bearing + (off * 180) / Math.PI, along)
    pts.push([x, project(off, along, elevation(lat, lon))])
  }
  return gaussian({ points: pts, closed: false }, smooth).points
}

function build({ name, slices, nearKm, farKm, smooth, ship }) {
  // Geometric spacing: closer together far off, where a km moves less.
  const dists = Array.from(
    { length: slices },
    (_, i) => nearKm * 1000 * (farKm / nearKm) ** (i / (slices - 1)),
  )
  const placed = PEAKS.map((p) => ({ ...p, ...placePeak(p) }))
  const taken = new Set()
  for (const p of placed.filter((p) => p.snap)) {
    let best = -1
    for (let i = 0; i < dists.length; i++)
      if (
        !taken.has(i) &&
        (best < 0 || Math.abs(dists[i] - p.depth) < Math.abs(dists[best] - p.depth))
      )
        best = i
    taken.add(best)
    dists[best] = p.depth
  }
  dists.sort((a, b) => b - a)
  const lines = dists.map((d) => slice(d, smooth))

  // Frame: horizon of the farthest slices near the top, the bottom cutting
  // through the nearest ones, VIEW.height tall.
  const top = Math.max(
    ...lines
      .flat()
      .filter(([x]) => x >= 0 && x <= VIEW.width)
      .map((p) => p[1]),
  )
  const toY = (v) => TOP_PAD + (top - v)
  const paths = lines.map((pts, i) => {
    const screen = simplifySubpath(
      { points: pts.map(([x, v]) => [x, toY(v)]), closed: false },
      THINNING,
    )
    const d = catmullRomD([screen], 0.5, 1).replace(/\d+\.\d+/g, (n) =>
      (+n).toFixed(1),
    )
    return `  <path data-km="${(dists[i] / 1000).toFixed(1)}" d="${d} V${VIEW.height + 40} H${-MARGIN} Z"/>`
  })
  const peaks = placed.map((p) => {
    // On the line of the slice nearest the summit, so the tag rides that ridge.
    let ridge = 0
    dists.forEach((d, i) => {
      if (Math.abs(d - p.depth) < Math.abs(dists[ridge] - p.depth)) ridge = i
    })
    const y = toY(lineAt(lines[ridge], p.x))
    const hiddenBy = lines
      .slice(ridge + 1)
      .some((pts) => toY(lineAt(pts, p.x)) < y - 2)
    if (hiddenBy) console.warn(`  ${p.name} is behind a nearer ridge`)
    const off = Math.abs(dists[ridge] - p.depth)
    if (off > 50)
      console.warn(`  ${p.name}: nearest slice is ${Math.round(off)} m off its summit`)
    return `    <circle data-peak="${p.name}" data-ele-ft="${p.eleFt}" data-ridge="${ridge}" cx="${p.x.toFixed(1)}" cy="${y.toFixed(1)}" r="0"/>`
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" width="${VIEW.width}" height="${VIEW.height}">
  <title>Blue Ridge from ${VIEW.lat}, ${VIEW.lon}, bearing ${VIEW.bearing}, eye ${VIEW.eyeM} m, vexag ${VIEW.vexag}: ${slices} slices, ${nearKm}-${farKm} km</title>
${paths.join("\n")}
  <g id="peaks">
${peaks.join("\n")}
  </g>
</svg>
`
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg)
  if (ship) fs.writeFileSync(path.join(ROOT, "src/assets/contact-ridges.svg"), svg)
  console.log(`${name}: ${slices} slices, ${(svg.length / 1024).toFixed(0)} kB`)
}

fs.mkdirSync(OUT, { recursive: true })
await loadArea(Math.max(...VARIANTS.map((v) => v.farKm)) * 1000)
for (const v of VARIANTS) build(v)
