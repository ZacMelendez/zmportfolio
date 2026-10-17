import photoMaskRaw from "../assets/photo-mask.svg?raw"
import edgeStrokeRaw from "../assets/edge-stroke.svg?raw"
import newfoundGapRaw from "../assets/newfound-gap-vertical.svg?raw"
import { polylinePoints, translatePath } from "@/utils/tracePath"

/**
 * Visible hero artwork, cropped to the contour bounds (x -16…983, y -9…990)
 * so the map runs flush to the viewport edges. The frame is mirrored around
 * the ridge trace's centre (x 621…833) so `xMid` keeps the ridge on the
 * screen's midline; everything right of the ridge is covered by the mask.
 */
const MAP_LEFT = -16
const MAP_TOP = -9
const MAP_BOTTOM = 990
const RIDGE_CENTER_X = 727
const HALF_WIDTH = RIDGE_CENTER_X - MAP_LEFT

/**
 * How far right of the screen's midline the hero copy starts on wide screens,
 * as a CSS length: clear of the road label at its furthest out along the guide
 * (~165 units, near the bottom) plus some air, scaled the same way the
 * landscape frame's `slice` scales it.
 */
const RIDGE_CLEARANCE_UNITS = 190
export const HERO_RIDGE_CLEARANCE = `calc(max(100vw / ${HALF_WIDTH * 2}, 100dvh / ${MAP_BOTTOM - MAP_TOP}) * ${RIDGE_CLEARANCE_UNITS})`

/**
 * Portrait screens turn the map, so the open half (now above the ridge) holds
 * the hero copy. The ridge sits this far down the frame to give it room.
 */
const PORTRAIT_RIDGE_AT = 0.6
const PORTRAIT_HEIGHT = HALF_WIDTH * 2
/** Frame units from the top edge down to the ridge. */
const PORTRAIT_SKY = PORTRAIT_RIDGE_AT * PORTRAIT_HEIGHT
/** CSS px per frame unit for the turned map's `slice`. */
const PORTRAIT_SCALE = `max(100vw / ${MAP_BOTTOM - MAP_TOP}, 100svh / ${PORTRAIT_HEIGHT})`

/**
 * Portrait: how far down the screen the hero copy may reach, clear of the
 * ridge and the road label above it (~130 units over the ridge) with some air.
 */
export const HERO_SKY_HEIGHT = `calc(${PORTRAIT_SCALE} * ${PORTRAIT_SKY - 175})`
/**
 * Portrait: the field notes pin's top, on the map a little below the ridge,
 * or as low as it can go above the scroll cue on squarer screens.
 */
export const HERO_GROUND_PIN_TOP = `min(${PORTRAIT_SCALE} * ${PORTRAIT_SKY + 160}, 100svh - 7rem)`
/** Portrait: height of the map's fade into the screen's bottom edge. */
export const HERO_PORTRAIT_FADE_HEIGHT = `calc(${PORTRAIT_SCALE} * 150)`

export const HERO_SPLIT_FRAME = {
  /** Landscape: ridge runs top to bottom down the middle. */
  landscape: {
    viewBox: `${MAP_LEFT} ${MAP_TOP} ${HALF_WIDTH * 2} ${MAP_BOTTOM - MAP_TOP}`,
    preserveAspectRatio: "xMidYMax slice",
    transform: undefined,
    /** Map fade toward the screen's bottom edge, in the artwork's own box. */
    fade: { x1: 0, y1: 1, x2: 0, y2: 0.85 },
  },
  /**
   * Portrait: the same artwork turned a quarter anticlockwise, so the ridge
   * runs left to right across the screen with the contours below it, at
   * `PORTRAIT_RIDGE_AT` (lower on screens squarer than the frame, which `YMin`
   * crops from the bottom, so the copy above always has room). `xMin` keeps
   * the start of the trace in view; the dotted tail runs off the right edge.
   * The crop moves the bottom edge, so its fade is screen-space instead.
   */
  portrait: {
    viewBox: `${MAP_TOP} ${-RIDGE_CENTER_X - PORTRAIT_SKY} ${MAP_BOTTOM - MAP_TOP} ${PORTRAIT_HEIGHT}`,
    preserveAspectRatio: "xMinYMin slice",
    transform: "rotate(-90)",
    fade: undefined,
  },
} as const

export const HERO_ENGRAVING = {
  x: -16,
  y: -9,
  width: 999,
  height: 999,
} as const

export const HERO_PHOTO_MASK = {
  x: 620,
  y: -97,
} as const

export const HERO_EDGE_TRACE = {
  x: 620,
  y: -9.077,
} as const

/** Map-style name for the ridge trace, set along `HERO_ROAD_GUIDE_D`. */
export const HERO_ROAD_LABEL = {
  text: "Newfound Gap Road",
  /**
   * Stretch of the guide (as shares of its length) the label's centre travels
   * over while the trace draws: a slower, shorter ride than the dot's.
   */
  travel: { from: 0.33, to: 0.75 },
  /** Font size in viewBox units; mobile renders the map at roughly half scale. */
  fontSize: { landscape: 11, portrait: 18 },
} as const

export const HERO_LOCATION_LABEL = {
  x: 657.25,
  y: 909.25,
  width: 144.5,
  height: 55.5,
} as const

export const HERO_RIDGE_COVER_FILL = "#202A19"

function extractPathD(svgRaw: string): string {
  const match = svgRaw.match(/\bd="([^"]+)"/)
  if (!match) throw new Error("SVG path d= not found")
  return match[1]
}

export const HERO_PHOTO_MASK_D = extractPathD(photoMaskRaw)
export const HERO_EDGE_TRACE_D = extractPathD(edgeStrokeRaw)

/**
 * The smooth curve the road name rides along as the trace draws, hand-drawn
 * in `src/assets/newfound-gap-vertical.svg` beside the road (the path that isn't the
 * sage trace). That file has its own frame, so the guide is shifted by the
 * offset between its copy of the trace and `edge-stroke.svg`'s, landing it in
 * the same space as `HERO_EDGE_TRACE_D`.
 */
function roadGuide() {
  const paths = [...newfoundGapRaw.matchAll(/<path\b[^>]*>/g)].map((m) => m[0])
  const trace = paths.find((p) => /stroke="#B6C494"/i.test(p))
  const guide = paths.find((p) => p !== trace)
  const d = (el?: string) => el?.match(/\bd="([^"]+)"/)?.[1] ?? ""
  if (!trace || !guide)
    throw new Error(
      "newfound-gap-vertical.svg needs the trace and a guide path",
    )

  const [ours] = polylinePoints(HERO_EDGE_TRACE_D)
  const [theirs] = polylinePoints(d(trace))
  return translatePath(d(guide), ours.x - theirs.x, ours.y - theirs.y)
}

export const HERO_ROAD_GUIDE_D = roadGuide()
