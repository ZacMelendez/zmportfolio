import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react"
import { HAWKSBILL_MAP, SKYLINE_DRIVE } from "@/data/hawksbillMap"
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
/** Px the trace's mask reaches past the road, clearing its widest stroke and the dot. */
const ROAD_PAD = 20

type Box = { left: number; right: number; top: number; bottom: number }

type Geometry = {
  width: number
  height: number
  /** Section y where the contours start fading out. */
  fadeFrom: number
  map: { x: number; y: number; size: number }
  /**
   * The road and its name's guide: down the right margin on wide screens,
   * across the band at `bandY` on narrow ones.
   */
  road: { points: Point[]; guideD: string | null; bandY?: number }
  /** The field notes pin's top-right corner. */
  pin: Point
}

/** A square map big enough to cover `area`, with the summit at `summit`. */
function coverMap(
  area: { left: number; right: number; bottom: number },
  summit: Point,
) {
  const { x: sx, y: sy } = HAWKSBILL_MAP.summit
  const size =
    Math.max(
      (summit.x - area.left) / sx,
      (area.right - summit.x) / (1 - sx),
      summit.y / sy,
      (area.bottom - summit.y) / (1 - sy),
    ) * 1.02
  return { x: summit.x - sx * size, y: summit.y - sy * size, size }
}

/**
 * Lays the map out in the section's own pixels. The summit sits in the open
 * space right of the heading and the contours fade out behind the cards below.
 * Wide: Skyline Drive also runs down the right margin, beside the content.
 * Narrow: the contours behind the heading, and the road across the gap
 * between the featured projects and the rest. If either list is empty, the
 * road crosses the section's bottom padding instead.
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
  const heading = relative(section.querySelector("[data-map-heading]"))
  const title = relative(
    section.querySelector("[data-map-heading] > :first-child"),
  )
  const content = relative(section.querySelector("[data-map-content]"))
  const featured = relative(section.querySelector("[data-map-featured]"))
  const more = relative(section.querySelector("[data-map-more]"))
  if (!heading || !title || !content || !box.height) return null

  const { width, height } = box
  const fadeFrom = heading.bottom
  const bottom = fadeFrom + HAWKSBILL_MAP.fadeOut
  const summitY = (heading.top + heading.bottom) / 2

  if (!window.matchMedia(LG_QUERY).matches) {
    const bandY =
      featured && more
        ? (featured.bottom + more.top) / 2
        : (content.bottom + box.height) / 2
    const road = placeGuidedTraceAcross(
      SKYLINE_DRIVE,
      0,
      width,
      bandY,
      HAWKSBILL_MAP.bandHeight,
    )
    return {
      width,
      height,
      fadeFrom,
      map: coverMap({ left: 0, right: width, bottom }, {
        x: width * 0.7,
        y: summitY,
      }),
      road: { ...road, bandY },
      // Across from the section label, at the content's right edge.
      pin: { x: content.right, y: heading.top - 5 },
    }
  }

  // The road runs down the margin right of the content.
  const margin = width - content.right
  const roadX = content.right + margin / 2
  const wander = Math.max(
    0,
    Math.min(
      HAWKSBILL_MAP.roadWander,
      margin - HAWKSBILL_MAP.roadClearance * 2,
    ),
  )
  const road = placeGuidedTrace(SKYLINE_DRIVE, roadX, height, wander)
  const roadInner = roadX - wander / 2

  return {
    width,
    height,
    fadeFrom,
    map: coverMap({ left: 0, right: roadInner, bottom }, {
      x: (title.right + roadInner) / 2,
      y: summitY,
    }),
    road: {
      points: road.points,
      // Name the road only if the margin fits the letters between guide and road.
      guideD: wander >= HAWKSBILL_MAP.labelMinWander ? road.guideD : null,
    },
    // In the open space above the heading's right end, like a map's cartouche.
    pin: { x: content.right, y: Math.max(8, heading.top / 2 - 13) },
  }
}

export default function HawksbillMap({
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

  const roadD = geo ? polylineD(geo.road.points) : ""
  const guideD = geo?.road.guideD ?? null
  const bandY = geo?.road.bandY

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
      // Slides the road's name along its guide as the road draws.
      onRender: (drawn) =>
        slideLabel(
          labelRef.current,
          drawn / (trace.path.current?.getTotalLength() || 1),
          HAWKSBILL_MAP.roadLabel.travel,
          guide.current,
          HAWKSBILL_MAP.roadLabel.fontSize,
        ),
      target: (length) => {
        const section = sectionRef.current
        if (!section) return 0
        if (bandY !== undefined)
          return length * easeOutEnd(acrossProgress(section, bandY))
        const line = window.innerHeight * HAWKSBILL_MAP.readingLine
        const reached = lookup.current(
          line - section.getBoundingClientRect().top,
        )
        return length * easeOutEnd(reached / (length || 1))
      },
    },
    [roadD, guideD],
  )

  if (!geo) return null

  // Wide: the margin outside the road stays clear.
  const start = geo.road.points[0]
  const edge = geo.width + 2
  const coverD =
    geo.road.bandY === undefined
      ? `${roadD}L${edge} ${geo.height + 2}L${edge} -2L${start.x} -2Z`
      : null

  // Keep the trace's mask to the road's own strip: the mask redraws on every
  // scroll frame, and a section-wide one re-rasters everything under it.
  const roadBounds = paddedBounds(geo.road.points, ROAD_PAD)

  const svgProps = {
    className: "absolute inset-0 h-full w-full",
    viewBox: `0 0 ${geo.width} ${geo.height}`,
    fill: "none",
  }

  // Three layers: the pulsing contours on a canvas, the fade over them, and the
  // road (redrawn on every scroll frame) over that, so none repaints another.
  return (
    <>
      <div
        data-testid="work-map"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div ref={setContourHost} className="absolute inset-0" />
        <svg
          {...svgProps}
          className={`${svgProps.className} will-change-transform`}
        >
          <g
            data-testid="work-contours"
            style={
              {
                "--svg-tier-pulse-rest": HAWKSBILL_MAP.contourOpacity.rest,
                "--svg-tier-pulse-peak": HAWKSBILL_MAP.contourOpacity.peak,
              } as CSSProperties
            }
          >
            <SvgTierPulse
              sources={[...HAWKSBILL_MAP.contours]}
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
                x: 0,
                y: 0,
                width: geo.width,
                height: geo.fadeFrom + HAWKSBILL_MAP.fadeOut,
              }}
            />
          </g>

          {/* Fades the map into the ground below the heading, behind the cards.
              An overlay rather than a mask: masks are re-rendered offscreen on
              every pulse frame in WebKit. */}
          <defs>
            <linearGradient
              id={fadeId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={geo.fadeFrom}
              x2={0}
              y2={geo.fadeFrom + HAWKSBILL_MAP.fadeOut}
            >
              <stop offset={0} stopColor={HAWKSBILL_MAP.ground} stopOpacity={0} />
              <stop offset={1} stopColor={HAWKSBILL_MAP.ground} />
            </linearGradient>
          </defs>
          <rect
            y={geo.fadeFrom}
            width={geo.width}
            height={Math.max(0, geo.height - geo.fadeFrom)}
            fill={`url(#${fadeId})`}
          />
        </svg>

        <svg {...svgProps}>
          {coverD && <path d={coverD} fill={HAWKSBILL_MAP.ground} />}

          <g data-testid="work-road">
            <TraceStrokes
              d={roadD}
              refs={trace}
              strokeOpacity={0.65}
              strokeWidth={2}
              bounds={roadBounds}
              testId="work-road"
            />
            {guideD && (
              <RoadLabel
                d={guideD}
                text={HAWKSBILL_MAP.roadLabel.text}
                fontSize={HAWKSBILL_MAP.roadLabel.fontSize}
                halo={HAWKSBILL_MAP.ground}
                testId="work-road-label"
                pathRef={guideRef}
                textPathRef={labelRef}
              />
            )}
          </g>
        </svg>
      </div>

      <FieldNotes id="hawksbill" pin={{ at: geo.pin, testId: "work-notes-pin" }} />
    </>
  )
}
