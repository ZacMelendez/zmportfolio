import skylineDriveRaw from "../assets/skyline-drive/500.svg?raw"
import hawksbillMinor from "../assets/contours/hawksbill-contours-minor.svg?url"
import hawksbillIndex from "../assets/contours/hawksbill-contours-index.svg?url"
import { guidedTrace } from "@/utils/tracePath"

/**
 * Skyline Drive, Shenandoah NP, north (mile 0, Front Royal) to south, top to
 * bottom, with the guide for its name beside it; simplified from the Figma
 * frame. The road is decorative here: it spans 105 miles, the Hawksbill map
 * ~17 km.
 */
export const SKYLINE_DRIVE = guidedTrace(skylineDriveRaw, "skyline-drive.svg")

/**
 * The Projects section's map: Hawksbill beside the heading, Skyline Drive down
 * the right margin (narrow: across the gap between the featured projects and the rest).
 */
export const HAWKSBILL_MAP = {
  contours: [
    hawksbillMinor,
    hawksbillIndex,
  ],
  /** Hawksbill summit (inside the top `contour-15` ring) as a share of the 1000-unit map. */
  summit: { x: 0.4964, y: 0.5174 },
  /** Widest the road and its name's guide may span side to side, in px; they also stay inside the margin. */
  roadWander: 72,
  /** Px the road keeps clear of the content and the page edge. */
  roadClearance: 14,
  /** Narrow screens: px tall the road and its name's guide fill, laid across the section. */
  bandHeight: 72,
  /** Px over which the map fades out below the heading, behind the cards. */
  fadeOut: 200,
  /** Where the trace's head sits as a share of the viewport height, keeping pace with reading. */
  readingLine: 0.6,
  /** Narrowest span that still fits the road's name between the guide and the road. */
  labelMinWander: 64,
  roadLabel: {
    text: "Skyline Drive",
    fontSize: 11,
    /** Stretch of the guide (as shares of its length) the name's centre rides over while the road draws. */
    travel: { from: 0.15, to: 0.85 },
  },
  /** Contour opacity at rest and at the pulse's peak; the near-black ground needs more than the hero's. */
  contourOpacity: { rest: 0.18, peak: 0.42 },
  /** The section's background, for the road's open side and label halos. */
  ground: "#11130A",
} as const
