import champneyFallsRaw from "../assets/champney-falls-trail.svg?raw"
import chocoruaMinor from "../assets/contours/chocorua-contours-minor.svg?url"
import chocoruaIndex from "../assets/contours/chocorua-contours-index.svg?url"
import { guidedTrace } from "@/utils/tracePath"

/**
 * Champney Falls Trail, from the Kancamagus Highway trailhead (top) south to
 * Chocorua's summit (bottom), with the guide for its name beside it. The
 * trail is decorative here: its frame is stretched to the section.
 */
export const CHAMPNEY_FALLS = guidedTrace(
  champneyFallsRaw,
  "champney-falls-trail.svg",
)

/**
 * The About section's map: Chocorua around the photo, Champney Falls Trail
 * down the left margin (narrow: across the gap between the photo and the copy).
 */
export const CHOCORUA_MAP = {
  contours: [
    chocoruaMinor,
    chocoruaIndex,
  ],
  /** Chocorua summit (inside the top `contour-15` ring) as a share of the 1000-unit map. */
  summit: { x: 0.7131, y: 0.6589 },
  /** Widest the trail and its name may span side to side, in px; they also stay inside the margin. */
  trailWander: 90,
  /** Px the trail keeps clear of the content and the page edge. */
  trailClearance: 14,
  /** Narrow screens: px tall the trail and its name's guide fill, laid across the section. */
  bandHeight: 72,
  /** Narrowest span that still fits the trail's name beside it. */
  labelMinWander: 64,
  /** Where the trace's head sits as a share of the viewport height, keeping pace with reading. */
  readingLine: 0.6,
  trailLabel: {
    text: "Champney Falls Trail",
    fontSize: 11,
    /** Stretch of the guide (as shares of its length) the name's centre rides over while the trail draws. */
    travel: { from: 0.15, to: 0.85 },
  },
  /** Contour opacity at rest and at the pulse's peak. */
  contourOpacity: { rest: 0.18, peak: 0.42 },
  /** The section's background, for label halos. */
  ground: "#11130A",
} as const
