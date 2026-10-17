/**
 * Builds the maps' contours in src/assets/contours from TopoStack's exports
 * in design/contours-unsimplified: drops TopoStack's summit triangle markers,
 * irons the grid's stair-step jitter out of each line (Gaussian, SMOOTHING
 * points either side), thins it (Ramer-Douglas-Peucker, THINNING map units),
 * then draws a centripetal Catmull-Rom curve through what's left. The maps
 * are 1000 units across. Settings were picked on the dev page at
 * /dev/contours.html ("Smoothed original, curved"), which uses the same code.
 * Run again after re-exporting contours (Node 22.18+, for the .ts import):
 *
 *   node scripts/smooth-contours.mjs
 */
import fs from "node:fs"
import path from "node:path"
import {
  catmullRomD,
  gaussian,
  parseSubpaths,
  simplifySubpath,
} from "../src/utils/smoothContours.ts"

const SMOOTHING = 4
const THINNING = 1.1
const TENSION = 1

const ROOT = path.resolve(import.meta.dirname, "..")
const SOURCE = path.join(ROOT, "design/contours-unsimplified")
const OUT = path.join(ROOT, "src/assets/contours")
const FILES = {
  hero: ["kuwohi-contours-minor.svg", "kuwohi-contours-index.svg"],
  maps: [
    "hawksbill-contours-minor.svg",
    "hawksbill-contours-index.svg",
    "chocorua-contours-minor.svg",
    "chocorua-contours-index.svg",
  ],
}

/** TopoStack's summit marker: a path that's nothing but one closed triangle. */
const isSummitMarker = (subpaths) =>
  subpaths.length === 1 &&
  subpaths[0].closed &&
  subpaths[0].points.length === 3

function smoothD(d) {
  const lines = parseSubpaths(d).map((s) =>
    simplifySubpath(gaussian(s, SMOOTHING), THINNING),
  )
  return catmullRomD(lines, 0.5, TENSION)
}

for (const [folder, files] of Object.entries(FILES)) {
  for (const file of files) {
    const before = fs.readFileSync(path.join(SOURCE, folder, file), "utf8")
    let markers = 0
    const after = before.replace(/<path\b[^>]*\/>\n?/g, (element) => {
      const d = element.match(/\bd="([^"]+)"/)?.[1]
      if (!d) return element
      if (isSummitMarker(parseSubpaths(d))) {
        markers++
        return ""
      }
      return element.replace(/\bd="[^"]+"/, `d="${smoothD(d)}"`)
    })
    fs.writeFileSync(path.join(OUT, file), after)
    console.log(
      `${file}: ${(before.length / 1024).toFixed(0)} KB -> ${(after.length / 1024).toFixed(0)} KB` +
      (markers ? `, ${markers} summit marker dropped` : ""),
    )
  }
}
