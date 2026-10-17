import { useEffect, useId, useRef, useState, type RefObject } from "react"
import {
  HERO_EDGE_TRACE,
  HERO_EDGE_TRACE_D,
  HERO_ENGRAVING,
  HERO_LOCATION_LABEL,
  HERO_PHOTO_MASK,
  HERO_PHOTO_MASK_D,
  HERO_PORTRAIT_FADE_HEIGHT,
  HERO_RIDGE_COVER_FILL,
  HERO_ROAD_GUIDE_D,
  HERO_ROAD_LABEL,
  HERO_SPLIT_FRAME,
} from "@/data/heroSplit"
import {
  lengthAtYLookup,
  pathSampler,
  type PathSampler,
  type Point,
} from "@/utils/tracePath"
import HeroKuwohiContours from "./HeroKuwohiContours"
import {
  RoadLabel,
  easeOutEnd,
  TraceStrokes,
  slideLabel,
  useMediaQuery,
  useTraceDrawing,
  useTraceRefs,
  type GuideSpan,
} from "./TopoTrace"

/** Matches Tailwind's `landscape:` variant, which lays out the hero copy. */
const LANDSCAPE_QUERY = "(orientation: landscape)"

/** Share of the hero's height scrolled away when the trace finishes drawing. */
const TRACE_FINISH_AT = 0.35
/**
 * Share of the trail already drawn before any scrolling, measured from where it
 * first appears on screen (wide screens crop the start), so the dot starts in view.
 */
const TRACE_START_AT = 0.05

function traceTarget(section: HTMLElement) {
  const rect = section.getBoundingClientRect()
  return Math.min(1, Math.max(0, -rect.top / (rect.height * TRACE_FINISH_AT)))
}

/**
 * Path lengths where the trace enters and leaves the visible map, so the
 * drawing starts at the top of the screen even when the frame crops the
 * start of the ridge, and finishes before the tail runs off-screen.
 */
function visibleTraceRange(
  path: SVGPathElement,
  trace: PathSampler,
  svg: SVGSVGElement,
) {
  const { length } = trace
  const ctm = path.getScreenCTM()
  const box = svg.getBoundingClientRect()
  if (!ctm) return { start: 0, end: length }

  const SAMPLES = 400
  let start = -1
  let end = -1
  for (let i = 0; i <= SAMPLES; i++) {
    const at = (i / SAMPLES) * length
    const p = trace.pointAt(at)
    const x = ctm.a * p.x + ctm.c * p.y + ctm.e
    const y = ctm.b * p.x + ctm.d * p.y + ctm.f
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue
    if (start < 0) start = at
    end = at
  }

  return start < 0 ? { start: 0, end: length } : { start, end }
}

/**
 * Where the field notes pin goes: an invisible stand-in the pin is measured
 * from, so the clickable pin (rendered outside this `aria-hidden` layer)
 * tracks the map as the frame scales.
 */
function LocationAnchor({
  anchorRef,
}: {
  anchorRef: RefObject<SVGRectElement | null>
}) {
  const { x, y, width, height } = HERO_LOCATION_LABEL
  return <rect ref={anchorRef} x={x} y={y} width={width} height={height} />
}

export default function HeroSplitScene({
  scrollSectionRef,
  onNotesAnchor,
}: {
  scrollSectionRef: RefObject<HTMLElement | null>
  /** The field notes pin's centre in the scene's pixels, or null when off-screen. */
  onNotesAnchor?: (at: Point | null) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<SVGRectElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [contourHost, setContourHost] = useState<HTMLDivElement | null>(null)
  const trace = useTraceRefs()
  const fadeId = useId()
  const range = useRef({ start: 0, end: 0 })
  const isLandscape = useMediaQuery(LANDSCAPE_QUERY)
  const roadLabelSize =
    HERO_ROAD_LABEL.fontSize[isLandscape ? "landscape" : "portrait"]
  const guideRef = useRef<SVGPathElement>(null)
  const labelRef = useRef<SVGTextPathElement>(null)
  // The guide's length, and the stretch of it beside the visible road.
  const guide = useRef<GuideSpan>({ length: 0, start: 0, end: 0 })

  // Slides the road name along the guide as the trace draws, over just the
  // `travel` stretch of it, but never past the ends of the road on screen.
  const placeLabel = (drawn: number) => {
    const { start, end } = range.current
    slideLabel(
      labelRef.current,
      (drawn - start) / (end - start || 1),
      HERO_ROAD_LABEL.travel,
      guide.current,
      roadLabelSize,
    )
  }

  useTraceDrawing(
    trace,
    {
      measure: (length) => {
        const path = trace.path.current
        const svg = svgRef.current
        if (!path || !svg) return
        const ridge = pathSampler(path)
        const visible = visibleTraceRange(path, ridge, svg)
        range.current = {
          ...visible,
          start: visible.start + length * TRACE_START_AT,
        }

        const guidePath = guideRef.current
        if (guidePath) {
          const lengthAt = lengthAtYLookup(guidePath)
          guide.current = {
            length: guidePath.getTotalLength(),
            start: lengthAt(ridge.pointAt(visible.start).y),
            end: lengthAt(ridge.pointAt(visible.end).y),
          }
        }
      },
      onRender: placeLabel,
      target: (length) => {
        const section = scrollSectionRef.current
        if (!section) return 0
        const progress = traceTarget(section)
        const { start, end } = range.current
        return progress >= 1
          ? length
          : start + easeOutEnd(progress) * (end - start)
      },
    },
    [scrollSectionRef, isLandscape],
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root || !onNotesAnchor) return
    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return onNotesAnchor(null)
      const box = root.getBoundingClientRect()
      const r = anchor.getBoundingClientRect()
      onNotesAnchor({
        x: r.left - box.left + r.width / 2,
        y: r.top - box.top + r.height / 2,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => {
      observer.disconnect()
      onNotesAnchor(null)
    }
  }, [isLandscape, onNotesAnchor])

  const frame = isLandscape
    ? HERO_SPLIT_FRAME.landscape
    : HERO_SPLIT_FRAME.portrait
  const maskTransform = `translate(${HERO_PHOTO_MASK.x} ${HERO_PHOTO_MASK.y})`
  const edgeTransform = `translate(${HERO_EDGE_TRACE.x} ${HERO_EDGE_TRACE.y})`

  const svgProps = {
    className: "absolute inset-0 h-full w-full",
    viewBox: frame.viewBox,
    preserveAspectRatio: frame.preserveAspectRatio,
    fill: "none",
  }
  const { x, y, width, height } = HERO_ENGRAVING

  // Three layers: the pulsing contours on a canvas, the fade over them, and the
  // ridge (redrawn on every scroll frame) over that, so none repaints another.
  return (
    <div
      ref={rootRef}
      data-testid="hero-map"
      className="pointer-events-none absolute top-0 left-0 h-svh w-full"
      aria-hidden
    >
      <div ref={setContourHost} className="absolute inset-0" />
      <svg {...svgProps} className={`${svgProps.className} will-change-transform`}>
        <g transform={frame.transform}>
          <g data-testid="hero-contours">
            <HeroKuwohiContours
              scrollSectionRef={scrollSectionRef}
              canvasHost={contourHost}
            />
          </g>

          {/* Fades the map into the ground at the screen's bottom edge, before
              the next section's map. An overlay rather than a mask: masks are
              re-rendered offscreen on every pulse frame in WebKit. */}
          {frame.fade && (
            <>
              <defs>
                <linearGradient id={fadeId} {...frame.fade}>
                  <stop offset={0} stopColor={HERO_RIDGE_COVER_FILL} />
                  <stop
                    offset={1}
                    stopColor={HERO_RIDGE_COVER_FILL}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#${fadeId})`}
              />
            </>
          )}
        </g>
      </svg>
      {!frame.fade && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: HERO_PORTRAIT_FADE_HEIGHT,
            background: `linear-gradient(to top, ${HERO_RIDGE_COVER_FILL}, ${HERO_RIDGE_COVER_FILL}00)`,
          }}
        />
      )}

      <svg ref={svgRef} {...svgProps}>
        <g transform={frame.transform}>
          {/* Off-screen once the map is turned for portrait. */}
          {isLandscape && <LocationAnchor anchorRef={anchorRef} />}

          <path
            d={HERO_PHOTO_MASK_D}
            transform={maskTransform}
            fill={HERO_RIDGE_COVER_FILL}
          />

          <g data-testid="hero-ridge" transform={edgeTransform}>
            <TraceStrokes
              d={HERO_EDGE_TRACE_D}
              refs={trace}
              strokeOpacity={0.65}
              bounds={{ x: -50, y: -50, width: 350, height: 1150 }}
              testId="hero-ridge"
            />
            <RoadLabel
              d={HERO_ROAD_GUIDE_D}
              text={HERO_ROAD_LABEL.text}
              fontSize={roadLabelSize}
              halo={HERO_RIDGE_COVER_FILL}
              testId="hero-road-label"
              pathRef={guideRef}
              textPathRef={labelRef}
            />
          </g>
        </g>
      </svg>
    </div>
  )
}
