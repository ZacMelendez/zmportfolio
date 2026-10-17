import contactRidgesRaw from "../assets/contact-ridges.svg?raw"

/**
 * The Blue Ridge from Newport, VA (38.555, -78.481), looking east: the land's
 * profile at nine distances from 4 to 32 km, farthest first, each closed down
 * to the frame's bottom edge, plus the named summits on them. Made by
 * scripts/ridge-slices.mjs; the lines run past both sides of the frame so
 * they can slide in sideways.
 */
const FRAME = contactRidgesRaw.match(/viewBox="([^"]+)"/)?.[1]
const PATHS = [
  ...contactRidgesRaw.matchAll(/<path\b[^>]*\bd="([^"]+)"/g),
].map((m) => m[1])
if (!FRAME || PATHS.length < 2)
  throw new Error("contact-ridges.svg needs a viewBox and its ridge paths")
const [, , FRAME_W, FRAME_H] = FRAME.split(/\s+/).map(Number)

/** Site colours from the farthest ridge to the nearest: hazier olive behind,
 * fading to near-ink in front so the footer reads on it. */
const FILLS = ["#38412A", "#2B3320", "#202718", "#161A0E"]

const channel = (hex: string, i: number) =>
  parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)

/** FILLS sampled at `t` (0 farthest, 1 nearest). */
function fillAt(t: number) {
  const x = t * (FILLS.length - 1)
  const i = Math.min(FILLS.length - 2, Math.floor(x))
  const f = x - i
  const rgb = [0, 1, 2].map((c) =>
    Math.round(
      channel(FILLS[i], c) + (channel(FILLS[i + 1], c) - channel(FILLS[i], c)) * f,
    )
      .toString(16)
      .padStart(2, "0"),
  )
  return `#${rgb.join("")}`
}

/**
 * Per ridge, farthest to nearest: its fill, its sage outline's opacity, and
 * where it starts as the section first scrolls into view, in frame units:
 * `rise` lower and `drift` to one side, alternating sides ridge to ridge.
 * Nearer ridges start further out. Drift stays inside the lines' 180-unit
 * overhang past the frame.
 */
const RIDGES = PATHS.map((d, i) => {
  const t = i / (PATHS.length - 1)
  return {
    d,
    fill: fillAt(t),
    strokeOpacity: 0.12 + 0.45 * t,
    rise: 8 + 56 * t ** 1.4,
    drift: (i % 2 ? -1 : 1) * (40 + 110 * t),
  }
})

/**
 * Summits to tag, each on its ridge's line: `x`/`y` as percentages of the
 * frame, and its ridge's `rise`/`drift` as percentages too, so the tag can
 * travel with that ridge in screen units.
 */
const PEAKS = [
  ...contactRidgesRaw.matchAll(
    /<circle data-peak="([^"]+)" data-ele-ft="(\d+)" data-ridge="(\d+)" cx="([\d.-]+)" cy="([\d.-]+)"/g,
  ),
].map(([, name, eleFt, ridge, cx, cy]) => {
  const { rise, drift } = RIDGES[Number(ridge)]
  return {
    name,
    elevation: `${Number(eleFt).toLocaleString("en-US")} ft`,
    x: (Number(cx) / FRAME_W) * 100,
    y: (Number(cy) / FRAME_H) * 100,
    rise: (rise / FRAME_H) * 100,
    drift: (drift / FRAME_W) * 100,
  }
})

export const CONTACT_RIDGES = { viewBox: FRAME, ridges: RIDGES, peaks: PEAKS }
