/**
 * Thins the hero's ridge trace (src/assets/edge-stroke.svg) to POINTS points,
 * keeping the ones that best hold its shape (Ramer-Douglas-Peucker, with the
 * tolerance searched for to land on that count). Fewer points keep the trace
 * cheap to redraw as it's cut to length every frame. Run again after
 * re-exporting the trace:
 *
 *   node scripts/simplify-trace.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { simplify } from "./rdp.mjs"

const POINTS = 500
const FILE = path.resolve(import.meta.dirname, "../src/assets/edge-stroke.svg")

/** Points of an absolute M/L/H/V polyline. */
function polyline(d) {
  const points = []
  let x = 0
  let y = 0
  for (const [, command, args] of d.matchAll(/([MLHV])([^MLHVZ]*)/g)) {
    const values = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(
      Number,
    )
    for (let i = 0; i < values.length; i++) {
      if (command === "H") x = values[i]
      else if (command === "V") y = values[i]
      else {
        x = values[i]
        y = values[++i]
      }
      points.push([x, y])
    }
  }
  return points
}

const svg = fs.readFileSync(FILE, "utf8")
const points = polyline(svg.match(/\bd="([^"]+)"/)[1])
if (points.length <= POINTS) {
  console.log(`Already ${points.length} points`)
  process.exit(0)
}

// More tolerance keeps fewer points: find the smallest that gets to POINTS.
let low = 0
let high = 50
for (let i = 0; i < 60; i++) {
  const mid = (low + high) / 2
  if (simplify(points, mid).length > POINTS) low = mid
  else high = mid
}
const kept = simplify(points, high)

const round = (n) => String(+n.toFixed(2))
const d = kept
  .map(([x, y], i) => `${i ? "L" : "M"}${round(x)} ${round(y)}`)
  .join("")
fs.writeFileSync(FILE, svg.replace(/\bd="[^"]+"/, `d="${d}"`))
console.log(
  `${points.length} -> ${kept.length} points (tolerance ${high.toFixed(3)} units)`,
)
