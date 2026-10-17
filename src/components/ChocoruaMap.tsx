import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { CHAMPNEY_FALLS, CHOCORUA_MAP } from "@/data/chocoruaMap"
import {
  lengthAtYLookup,
  paddedBounds,
  placeGuidedTrace,
  placeGuidedTraceAcross,
  polylineD,
  type Point,
} from "@/utils/tracePath"
import FieldNotes from "./FieldNotes"
import SvgTierPulse from "./SvgTierPulse"
import {
  RoadLabel,
  TraceStrokes,
  acrossProgress,
  guideSpan,
  easeOutEnd,
  slideLabel,
  useTraceDrawing,
  useTraceRefs,
  guideSpanAcross,
  type GuideSpan,
} from "./TopoTrace"

const LG_QUERY = "(min-width: 1024px)"
/** Px the trace's mask reaches past the trail, clearing its widest stroke and the dot. */
const TRAIL_PAD = 20

type Box = { left: number; right: number; top: number; bottom: number }

type Geometry = {
  width: number
  height: number
  summit: Point
  /** Radius of the contours' fade around the summit. */
  fade: number
  map: { x: number; y: number; size: number }
  /**
   * The trail and its name's guide: down the left margin on wide screens,
   * across the band at `bandY` on narrow ones.
   */
  trail: { points: Point[]; guideD: string | null; bandY?: number } | null
  /** The field notes pin's top-right corner. */
  pin: Point
}

/** A square map big enough to cover the section, with the summit at `summit`. */
function coverMap(width: number, height: number, summit: Point) {
  const { x: sx, y: sy } = CHOCORUA_MAP.summit
  const size =
    Math.max(
      summit.x / sx,
      (width - summit.x) / (1 - sx),
      summit.y / sy,
      (height - summit.y) / (1 - sy),
    ) * 1.02
  return { x: summit.x - sx * size, y: summit.y - sy * size, size }
}

/** The trail down the middle of the left margin, its name's guide beside it. */
function placeTrail(margin: number, height: number) {
  const wander = Math.min(
    CHOCORUA_MAP.trailWander,
    margin - CHOCORUA_MAP.trailClearance * 2,
  )
  if (wander < 24) return null

  const trail = placeGuidedTrace(CHAMPNEY_FALLS, margin / 2, height, wander)
  return {
    points: trail.points,
    guideD: wander >= CHOCORUA_MAP.labelMinWander ? trail.guideD : null,
  }
}

/** The trail across the section, edge to edge, along the band at `bandY`. */
function placeTrailAcross(width: number, bandY: number) {
  const trail = placeGuidedTraceAcross(
    CHAMPNEY_FALLS,
    0,
    width,
    bandY,
    CHOCORUA_MAP.bandHeight,
  )
  return { ...trail, bandY }
}

/**
 * Lays the map out in the section's own pixels. Chocorua's summit sits just
 * above the photo (taken up there) and the contours fade out around it, clear
 * of the copy. The Champney Falls Trail climbs down the left margin on wide
 * screens, and across the gap between the photo and the copy when stacked.
 */
function measure(section: HTMLElement): Geometry | null {
  const box = section.getBoundingClientRect()
  const relative = (el: Element | null): Box | null => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      left: r.left - box.left,
      right: r.right - box.left,
      top: r.top - box.top,
      bottom: r.bottom - box.top,
    }
  }
  const photo = relative(section.querySelector("[data-map-photo]"))
  const content = relative(section.querySelector("[data-map-content]"))
  const copy = relative(section.querySelector("[data-map-copy]"))
  if (!photo || !content || !copy || !box.height) return null

  const { width, height } = box
  const wide = window.matchMedia(LG_QUERY).matches
  const summit = {
    x: (photo.left + photo.right) / 2,
    y: photo.top / 2,
  }

  return {
    width,
    height,
    summit,
    fade: Math.max(photo.right - photo.left, photo.bottom - photo.top) * 0.95,
    map: coverMap(width, height, summit),
    trail: wide
      ? placeTrail(content.left, height)
      : placeTrailAcross(width, (photo.bottom + copy.top) / 2),
    // Above the photo's right edge, beside the summit.
    pin: { x: photo.right, y: summit.y - 13 },
  }
}

export default function ChocoruaMap({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>
}) {
  const trace = useTraceRefs()
  const fadeId = useId()
  const lookup = useRef<(y: number) => number>(() => 0)
  const guideRef = useRef<SVGPathElement>(null)
  const labelRef = useRef<SVGTextPathElement>(null)
  const guide = useRef<GuideSpan>({ length: 0, start: 0, end: 0 })
  const [geo, setGeo] = useState<Geometry | null>(null)
  const [contourHost, setContourHost] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const update = () => setGeo(measure(section))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(section)
    document.fonts?.ready.then(update)
    return () => observer.disconnect()
  }, [sectionRef])

  const trailD = geo?.trail ? polylineD(geo.trail.points) : ""
  const guideD = geo?.trail?.guideD ?? null
  const bandY = geo?.trail?.bandY

  useTraceDrawing(
    trace,
    {
      measure: () => {
        const path = trace.path.current
        if (path) lookup.current = lengthAtYLookup(path)
        const guidePath = guideRef.current
        const section = sectionRef.current
        if (guidePath && section)
          guide.current =
            bandY === undefined
              ? guideSpan(guidePath, section.offsetHeight)
              : guideSpanAcross(guidePath, section.offsetWidth)
      },
      // Slides the trail's name along its guide as the trail draws.
      onRender: (drawn) =>
        slideLabel(
          labelRef.current,
          drawn / (trace.path.current?.getTotalLength() || 1),
          CHOCORUA_MAP.trailLabel.travel,
          guide.current,
          CHOCORUA_MAP.trailLabel.fontSize,
        ),
      target: (length) => {
        const section = sectionRef.current
        if (!section) return 0
        if (bandY !== undefined)
          return length * easeOutEnd(acrossProgress(section, bandY))
        const line = window.innerHeight * CHOCORUA_MAP.readingLine
        const reached = lookup.current(
          line - section.getBoundingClientRect().top,
        )
        return length * easeOutEnd(reached / (length || 1))
      },
    },
    [trailD, guideD],
  )

  if (!geo) return null

  // Keep the trace's mask to the trail's own strip: the mask redraws on every
  // scroll frame, and a section-wide one re-rasters everything under it.
  const trailBounds = paddedBounds(
    geo.trail?.points ?? [{ x: 0, y: 0 }],
    TRAIL_PAD,
  )

  const svgProps = {
    className: "absolute inset-0 h-full w-full",
    viewBox: `0 0 ${geo.width} ${geo.height}`,
    fill: "none",
  }

  // Three layers: the pulsing contours on a canvas, the fade over them, and the
  // trail (redrawn on every scroll frame) over that, so none repaints another.
  return (
    <>
      <div
        data-testid="about-map"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div ref={setContourHost} className="absolute inset-0" />
        <svg
          {...svgProps}
          className={`${svgProps.className} will-change-transform`}
        >
          <g
            data-testid="about-contours"
            style={
              {
                "--svg-tier-pulse-rest": CHOCORUA_MAP.contourOpacity.rest,
                "--svg-tier-pulse-peak": CHOCORUA_MAP.contourOpacity.peak,
              } as CSSProperties
            }
          >
            <SvgTierPulse
              sources={[...CHOCORUA_MAP.contours]}
              observeRef={sectionRef}
              loop
              layout={{
                x: geo.map.x,
                y: geo.map.y,
                width: geo.map.size,
                height: geo.map.size,
              }}
              canvasHost={contourHost}
              clip={{
                x: geo.summit.x - geo.fade,
                y: geo.summit.y - geo.fade,
                width: geo.fade * 2,
                height: geo.fade * 2,
              }}
            />
          </g>

          {/* Fades the map into the ground around the summit, before it reaches
              the copy. An overlay rather than a mask: masks are re-rendered
              offscreen on every pulse frame in WebKit. */}
          <defs>
            <radialGradient
              id={fadeId}
              gradientUnits="userSpaceOnUse"
              cx={geo.summit.x}
              cy={geo.summit.y}
              r={geo.fade}
            >
              <stop offset={0} stopColor={CHOCORUA_MAP.ground} stopOpacity={0} />
              <stop
                offset={0.55}
                stopColor={CHOCORUA_MAP.ground}
                stopOpacity={0.3}
              />
              <stop offset={1} stopColor={CHOCORUA_MAP.ground} />
            </radialGradient>
          </defs>
          <rect width={geo.width} height={geo.height} fill={`url(#${fadeId})`} />
        </svg>

        <svg {...svgProps}>
          {geo.trail && (
            <g data-testid="about-trail">
              <TraceStrokes
                d={trailD}
                refs={trace}
                strokeOpacity={0.65}
                strokeWidth={2}
                bounds={trailBounds}
                testId="about-trail"
              />
              {guideD && (
                <RoadLabel
                  d={guideD}
                  text={CHOCORUA_MAP.trailLabel.text}
                  fontSize={CHOCORUA_MAP.trailLabel.fontSize}
                  halo={CHOCORUA_MAP.ground}
                  testId="about-trail-label"
                  pathRef={guideRef}
                  textPathRef={labelRef}
                />
              )}
            </g>
          )}
        </svg>
      </div>

      <FieldNotes id="chocorua" pin={{ at: geo.pin, testId: "about-notes-pin" }} />
    </>
  )
}
