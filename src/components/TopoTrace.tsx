import {
  useEffect,
  useId,
  useRef,
  type DependencyList,
  type RefObject,
} from "react"
import {
  lengthAtYLookup,
  pathSampler,
  pathVertices,
  polylinePrefix,
  type Point,
} from "@/utils/tracePath"

export const TRACE_STROKE = "#B6C494"
const CREAM = "#FAFDF4"
/** Fraction of the remaining distance the trace closes each 60fps frame. */
const TRACE_EASE = 0.14
/** Share of a trace's progress after which its head starts easing to a stop. */
const EASE_OUT_FROM = 0.8

/**
 * Eases a trace's progress (0 to 1) into its end: steady up to
 * `EASE_OUT_FROM`, then slowing to a stop at 1 without a kink in between.
 */
export function easeOutEnd(share: number) {
  const s = Math.min(1, Math.max(0, share))
  const tail = 1 - EASE_OUT_FROM
  const rate = 1 / (EASE_OUT_FROM + tail / 2)
  if (s <= EASE_OUT_FROM) return s * rate
  return rate * (EASE_OUT_FROM + tail / 2 - (1 - s) ** 2 / (2 * tail))
}

/** Viewport heights (as shares) a band's centre scrolls between while the trace across it draws. */
const ACROSS_DRAW = { from: 0.9, to: 0.4 }

/**
 * How far a trace laid across a band (narrow screens) should be drawn, 0 to 1,
 * from where the band's centre, `bandY` px down `section`, sits on screen.
 */
export function acrossProgress(section: HTMLElement, bandY: number) {
  const y = section.getBoundingClientRect().top + bandY
  const height = window.innerHeight
  return (
    (height * ACROSS_DRAW.from - y) /
    (height * (ACROSS_DRAW.from - ACROSS_DRAW.to))
  )
}

export { useMediaQuery } from "@/utils/hydration"

export type TraceRefs = {
  path: RefObject<SVGPathElement | null>
  solid: RefObject<SVGPathElement | null>
  travelled: RefObject<SVGPathElement | null>
  dot: RefObject<SVGGElement | null>
}

export function useTraceRefs(): TraceRefs {
  return {
    path: useRef<SVGPathElement>(null),
    solid: useRef<SVGPathElement>(null),
    travelled: useRef<SVGPathElement>(null),
    dot: useRef<SVGGElement>(null),
  }
}

/**
 * Draws a trace straight on the DOM from a rAF loop that eases toward
 * `target(length)` (a path length) on scroll, so it glides between wheel steps
 * without React renders. `measure` runs on start and resize, before targets.
 */
export function useTraceDrawing(
  refs: TraceRefs,
  {
    target,
    measure,
    onRender,
  }: {
    target: (length: number) => number
    measure?: (length: number) => void
    onRender?: (drawn: number) => void
  },
  deps: DependencyList,
) {
  const callbacks = useRef({ target, measure, onRender })
  callbacks.current = { target, measure, onRender }

  useEffect(() => {
    const path = refs.path.current
    const solid = refs.solid.current
    const travelled = refs.travelled.current
    const dot = refs.dot.current
    if (!path || !solid || !travelled || !dot) return

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const length = path.getTotalLength()
    const goal = () =>
      reduceMotion
        ? length
        : Math.min(length, Math.max(0, callbacks.current.target(length)))

    callbacks.current.measure?.(length)
    let current = goal()
    let frame = 0
    let last = 0

    const prefix = polylinePrefix(pathVertices(path.getAttribute("d") ?? ""))
    const toPrefix = prefix.length / (length || 1)

    const render = () => {
      const d = prefix.d(current * toPrefix)
      solid.setAttribute("d", d)
      travelled.setAttribute("d", d)
      solid.dataset.drawn = String(current)

      const dotVisible = current > 0.5 && current < length - 0.5
      dot.style.display = dotVisible ? "" : "none"
      if (dotVisible) {
        const point = prefix.pointAt(current * toPrefix)
        dot.setAttribute("transform", `translate(${point.x} ${point.y})`)
      }
      callbacks.current.onRender?.(current)
    }

    const tick = (now: number) => {
      const next = goal()
      const elapsed = last ? Math.min(now - last, 64) : 1000 / 60
      last = now
      current +=
        (next - current) * (1 - Math.pow(1 - TRACE_EASE, elapsed / (1000 / 60)))
      if (Math.abs(next - current) < 0.05) current = next
      render()

      if (current === next) {
        frame = 0
        last = 0
      } else {
        frame = requestAnimationFrame(tick)
      }
    }

    const onScroll = () => {
      if (!reduceMotion && !frame) frame = requestAnimationFrame(tick)
    }

    const onResize = () => {
      callbacks.current.measure?.(length)
      render()
      onScroll()
    }

    render()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      if (frame) cancelAnimationFrame(frame)
    }
  }, deps)
}

/**
 * The trail itself: a faint dotted line ahead, a solid line behind, and a dot
 * at the head. The dotted line is masked out wherever the solid one is drawn.
 * `d` must be an absolute `M`/`L`/`H`/`V` polyline, which the solid line is
 * cut from as it draws.
 */
export function TraceStrokes({
  d,
  refs,
  strokeOpacity,
  bounds,
  testId,
  strokeWidth = 2.25,
  /** Box covering the path, in its own units, for the mask. */
}: {
  d: string
  refs: TraceRefs
  strokeOpacity: number
  bounds: { x: number; y: number; width: number; height: number }
  testId: string
  strokeWidth?: number
}) {
  const maskId = useId()

  return (
    <>
      <path ref={refs.path} d={d} fill="none" stroke="none" />
      {/* Hides the dotted line wherever the solid line has been drawn over it. */}
      <mask id={maskId} maskUnits="userSpaceOnUse" {...bounds}>
        <rect {...bounds} fill="white" />
        {/* Drawn up to the head on scroll by `useTraceDrawing`. */}
        <path
          ref={refs.travelled}
          fill="none"
          stroke="black"
          strokeWidth={strokeWidth * 3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <path
        data-testid={`${testId}-dotted`}
        mask={`url(#${maskId})`}
        d={d}
        stroke={TRACE_STROKE}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={strokeOpacity * 0.5}
        strokeDasharray={`${strokeWidth * 0.9} ${strokeWidth * 5.3}`}
      />
      <path
        ref={refs.solid}
        data-testid={`${testId}-solid`}
        fill="none"
        stroke={TRACE_STROKE}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={strokeOpacity}
      />
      <g
        ref={refs.dot}
        data-testid={`${testId}-dot`}
        style={{ display: "none" }}
      >
        <circle r={strokeWidth * 2.2} fill={TRACE_STROKE} fillOpacity={0.35} />
        <circle r={strokeWidth * 1.22} fill={CREAM} />
      </g>
    </>
  )
}

/** A guide's length, and the stretch of it beside the trace on screen. */
export type GuideSpan = { length: number; start: number; end: number }

/** A section map's guide: its length and the stretch of it from the section's top to `height`. */
export function guideSpan(path: SVGPathElement, height: number): GuideSpan {
  const sampler = pathSampler(path)
  const lengthAt = lengthAtYLookup(sampler)
  return {
    length: sampler.length,
    start: lengthAt(0),
    end: lengthAt(height),
  }
}

/** Px a name laid across a band keeps clear of the screen's edges. */
const ACROSS_LABEL_GUTTER = 16

/** A guide laid across a band: its length and the stretch of it on screen, clear of the edges. */
export function guideSpanAcross(
  path: SVGPathElement,
  width: number,
  samples = 400,
): GuideSpan {
  const { length, pointAt } = pathSampler(path)
  let start = -1
  let end = length
  for (let i = 0; i <= samples; i++) {
    const at = (i / samples) * length
    const { x } = pointAt(at)
    if (x < ACROSS_LABEL_GUTTER || x > width - ACROSS_LABEL_GUTTER) continue
    if (start < 0) start = at
    end = at
  }
  return { length, start: Math.max(start, 0), end }
}

/**
 * Slides a name along its guide as the trace draws: its centre rides over the
 * `travel` stretch of the guide (shares of its length) as `progress` goes
 * 0 to 1, but never past the ends of the guide's visible span. The ride is
 * cut short to end at the span's edge rather than stopping dead against it.
 */
export function slideLabel(
  label: SVGTextPathElement | null,
  progress: number,
  travel: { from: number; to: number },
  { length, start, end }: GuideSpan,
  fontSize: number,
) {
  const text = label?.parentElement as SVGTextElement | null
  if (!label || !text) return
  const share = Math.min(1, Math.max(0, progress))
  // Half the text, plus a letter's height so its corners don't poke past the edge on a curve.
  const inset = text.getComputedTextLength() / 2 + fontSize
  const from = length * travel.from
  const to = Math.max(from, Math.min(length * travel.to, end - inset))
  const at = from + share * (to - from)
  label.setAttribute(
    "startOffset",
    String(Math.min(Math.max(at, start + inset), end - inset)),
  )
}

/**
 * A road name set along a (smoothed) trace, with a halo in the map's ground
 * colour. Centred on the path unless the caller moves it via `textPathRef`.
 */
export function RoadLabel({
  d,
  text,
  fontSize,
  halo,
  testId,
  pathRef,
  textPathRef,
}: {
  d: string
  text: string
  fontSize: number
  halo: string
  testId: string
  pathRef?: RefObject<SVGPathElement | null>
  textPathRef?: RefObject<SVGTextPathElement | null>
}) {
  const id = useId()

  return (
    <>
      <path ref={pathRef} id={id} d={d} fill="none" stroke="none" />
      <text
        data-testid={testId}
        fill={TRACE_STROKE}
        fillOpacity={0.9}
        stroke={halo}
        strokeWidth={fontSize * 0.3}
        strokeLinejoin="round"
        paintOrder="stroke"
        fontFamily="Source Sans 3, system-ui, sans-serif"
        fontSize={fontSize}
        fontWeight={600}
        letterSpacing="0.14em"
      >
        <textPath
          ref={textPathRef}
          href={`#${id}`}
          startOffset="50%"
          textAnchor="middle"
        >
          {text.toUpperCase()}
        </textPath>
      </text>
    </>
  )
}
