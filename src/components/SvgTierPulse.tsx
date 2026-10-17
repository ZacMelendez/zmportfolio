import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import {
  TIER_PULSE_DEFAULTS,
  tierPulseCycleDurationMs,
  sortedTiersDescending,
  fetchSvgTierLayers,
  parseSvgTierLayers,
  type SvgTierPulseLoadResult,
  type SvgTierPulseOptions,
} from "@/utils/svgTierPulse"
import {
  createTierPulseRenderer,
  samePlacement,
  tierStrokes,
  type Placement,
  type PulseTiming,
} from "@/utils/tierPulseCanvas"

export type SvgTierPulseTiming = {
  staggerMs?: number
  tierDurationMs?: number
}

type Box = { x: number; y: number; width: number; height: number }

export type SvgTierPulseProps = {
  /** One or more SVG documents (URLs to fetch, or raw SVG strings when `sourcesAreRaw` is true). */
  sources: string | string[]
  /** When true, `sources` are SVG markup strings instead of fetch URLs. */
  sourcesAreRaw?: boolean
  /** Skip fetch/load (e.g. mobile). */
  enabled?: boolean
  /** Optional viewport gate (e.g. `(min-width: 768px)`). */
  minWidthQuery?: string
  /** Loop the cascade while this element is intersecting the viewport. */
  observeRef?: RefObject<HTMLElement | null>
  /** IntersectionObserver threshold (0-1). */
  observeThreshold?: number
  /** When no `observeRef`, loop continuously if true; otherwise animate only while `active`. */
  loop?: boolean
  /** Manual run gate when not using `observeRef`. */
  active?: boolean
  tierPattern?: RegExp
  selector?: string
  timing?: SvgTierPulseTiming
  /** Preloaded layers; skips fetch when provided. */
  initialData?: SvgTierPulseLoadResult
  /** Where the contours sit inside the parent `<svg>`, in its user units. */
  layout: Box
  /**
   * Empty, positioned element covering the parent `<svg>` and stacked beneath
   * it. The pulse is drawn on a canvas in here, under the resting contours, so
   * anything the `<svg>` draws over them (fades, traces) covers it too.
   */
  canvasHost: HTMLElement | null
  /**
   * The part of the parent `<svg>` (its user units) where the contours can
   * show, e.g. above a fade to solid ground. The canvas is cropped to it.
   */
  clip?: Box
  viewBox?: string
  preserveAspectRatio?: string
  onLoad?: (data: SvgTierPulseLoadResult) => void
  onError?: (error: unknown) => void
}

const TIER_CLASS = "svg-tier-pulse-tier"

/** Ms between pulse redraws. */
const PULSE_FRAME_MS = 1000 / 30
/** Ms after the last scroll event before the pulse moves again. */
const SCROLL_SETTLE_MS = 150

/**
 * Reads a pulse opacity custom property, falling back to the default. Rest and
 * peak are variables (`--svg-tier-pulse-rest`/`-peak`, set on an ancestor in
 * the `<svg>`) so a map on a darker ground can lift them.
 */
function pulseOpacity(style: CSSStyleDeclaration, name: string, fallback: number) {
  const value = Number.parseFloat(style.getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

/**
 * Where the canvas goes in `host`, and how the contours' units map onto it:
 * their screen transform (which carries every SVG transform and the viewBox
 * above them), cropped to the host and to `clip`.
 */
function measurePlacement(
  host: HTMLElement,
  contours: SVGGraphicsElement,
  clip: SVGGraphicsElement | null,
  viewBox: number[],
): Placement | null {
  const ctm = contours.getScreenCTM()
  if (!ctm) return null
  const hostBox = host.getBoundingClientRect()
  const toHost = new DOMMatrix([
    ctm.a,
    ctm.b,
    ctm.c,
    ctm.d,
    ctm.e - hostBox.left,
    ctm.f - hostBox.top,
  ])

  const [vx, vy, vw, vh] = viewBox
  const corners = [
    [vx, vy],
    [vx + vw, vy],
    [vx, vy + vh],
    [vx + vw, vy + vh],
  ].map(([x, y]) => toHost.transformPoint({ x, y }))
  let left = Math.max(0, Math.min(...corners.map((p) => p.x)))
  let top = Math.max(0, Math.min(...corners.map((p) => p.y)))
  let right = Math.min(hostBox.width, Math.max(...corners.map((p) => p.x)))
  let bottom = Math.min(hostBox.height, Math.max(...corners.map((p) => p.y)))
  if (clip) {
    const c = clip.getBoundingClientRect()
    left = Math.max(left, c.left - hostBox.left)
    top = Math.max(top, c.top - hostBox.top)
    right = Math.min(right, c.right - hostBox.left)
    bottom = Math.min(bottom, c.bottom - hostBox.top)
  }
  left = Math.floor(left)
  top = Math.floor(top)
  right = Math.ceil(right)
  bottom = Math.ceil(bottom)
  if (right <= left || bottom <= top) return null

  // Past 2x the hairline contours look no different, and memory grows with its square.
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const style = getComputedStyle(contours)
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    dpr,
    transform: new DOMMatrix()
      .scaleSelf(dpr)
      .translateSelf(-left, -top)
      .multiplySelf(toHost),
    opacity: {
      rest: pulseOpacity(
        style,
        "--svg-tier-pulse-rest",
        TIER_PULSE_DEFAULTS.baseOpacity,
      ),
      peak: pulseOpacity(
        style,
        "--svg-tier-pulse-peak",
        TIER_PULSE_DEFAULTS.peakOpacity,
      ),
    },
  }
}

export default function SvgTierPulse({
  sources,
  sourcesAreRaw = false,
  enabled = true,
  minWidthQuery,
  observeRef,
  observeThreshold = 0.15,
  loop = true,
  active = true,
  tierPattern,
  selector,
  timing,
  initialData,
  layout,
  canvasHost,
  clip,
  viewBox: viewBoxOverride,
  preserveAspectRatio = "xMidYMid meet",
  onLoad,
  onError,
}: SvgTierPulseProps) {
  const staggerMs = timing?.staggerMs ?? TIER_PULSE_DEFAULTS.staggerMs
  const tierDurationMs =
    timing?.tierDurationMs ?? TIER_PULSE_DEFAULTS.tierDurationMs

  const parseOptions = useMemo<SvgTierPulseOptions>(
    () => ({
      ...(tierPattern ? { tierPattern } : {}),
      ...(selector ? { selector } : {}),
    }),
    [tierPattern, selector],
  )

  const sourceKey = useMemo(
    () => (Array.isArray(sources) ? sources.join("\0") : sources),
    [sources],
  )

  const [widthGated, setWidthGated] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [inView, setInView] = useState(false)
  const contoursRef = useRef<SVGGElement>(null)
  const clipRef = useRef<SVGRectElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<SvgTierPulseLoadResult | null>(
    initialData ?? null,
  )

  const runEnabled = enabled && widthGated

  const tiers = useMemo(
    () => (data ? sortedTiersDescending(data.layers) : []),
    [data],
  )
  const strokes = useMemo(
    () =>
      data
        ? tierStrokes(tiers.map((tier) => data.layers.get(tier) ?? []))
        : null,
    [data, tiers],
  )

  const shouldRun = observeRef ? inView && active : active && (loop || inView)

  const animating =
    runEnabled && shouldRun && !reduceMotion && !!strokes?.length

  const pulseTiming = useMemo<PulseTiming>(
    () => ({
      staggerMs,
      tierDurationMs,
      loop,
      cycleMs: loop
        ? tierPulseCycleDurationMs(
          strokes?.length ?? 0,
          staggerMs,
          tierDurationMs,
        )
        : tierDurationMs,
    }),
    [staggerMs, tierDurationMs, loop, strokes],
  )

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReduceMotion(motion.matches)
    syncMotion()
    motion.addEventListener("change", syncMotion)

    let md: MediaQueryList | null = null
    const syncWidth = () => setWidthGated(minWidthQuery ? md!.matches : true)

    if (minWidthQuery) {
      md = window.matchMedia(minWidthQuery)
      syncWidth()
      md.addEventListener("change", syncWidth)
    } else {
      setWidthGated(true)
    }

    return () => {
      motion.removeEventListener("change", syncMotion)
      md?.removeEventListener("change", syncWidth)
    }
  }, [minWidthQuery])

  useEffect(() => {
    if (!runEnabled) {
      setData(null)
      return
    }

    let cancelled = false

    if (sourcesAreRaw) {
      try {
        const parsed = parseSvgTierLayers(sources, parseOptions)
        if (!cancelled) {
          setData(parsed)
          onLoad?.(parsed)
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          onError?.(err)
        }
      }
      return () => {
        cancelled = true
      }
    }

    ; (async () => {
      try {
        const loaded = await fetchSvgTierLayers(sources, parseOptions)
        if (cancelled) return
        setData(loaded)
        onLoad?.(loaded)
      } catch (err) {
        if (!cancelled) {
          setData(null)
          onError?.(err)
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // `sourceKey` stands in for `sources`, which callers often rebuild each
    // render; refetching on those would rebuild the canvas for nothing.
  }, [runEnabled, sourcesAreRaw, sourceKey, parseOptions, onLoad, onError, initialData])

  useEffect(() => {
    const root = observeRef?.current
    if (!root || !runEnabled) {
      setInView(!observeRef && active)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: observeThreshold },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [observeRef, runEnabled, observeThreshold, active])

  const viewBox = viewBoxOverride ?? data?.viewBox ?? "0 0 100 100"
  const viewBoxNumbers = useMemo(
    () => viewBox.split(/[\s,]+/).map(Number),
    [viewBox],
  )

  const renderer = useRef<ReturnType<typeof createTierPulseRenderer> | null>(
    null,
  )
  // The cascade's current time, or null at rest; redrawn as is after a re-place.
  const elapsed = useRef<number | null>(null)
  const timingRef = useRef(pulseTiming)
  timingRef.current = pulseTiming

  /** Re-measures where the canvas goes; redraws only if that moved. */
  const replace = useRef(() => { })
  replace.current = () => {
    const r = renderer.current
    const contours = contoursRef.current
    if (!r || !contours || !canvasHost) return
    const next = measurePlacement(
      canvasHost,
      contours,
      clipRef.current,
      viewBoxNumbers,
    )
    if (samePlacement(next, r.placement())) return
    r.place(next)
    r.draw(elapsed.current, timingRef.current)
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasHost || !strokes) return
    renderer.current = createTierPulseRenderer(canvas, strokes)
    replace.current()

    const onResize = () => replace.current()
    const observer = new ResizeObserver(onResize)
    observer.observe(canvasHost)
    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", onResize)
      renderer.current = null
    }
  }, [canvasHost, strokes])

  // Parents move the contours by re-rendering (new layout, frame or clip).
  useLayoutEffect(() => replace.current())

  useEffect(() => {
    const r = renderer.current
    if (!r) return
    if (!animating) {
      elapsed.current = null
      r.draw(null, pulseTiming)
      return
    }

    let frame = 0
    let start = performance.now()
    let drawn = -Infinity
    let scrolledAt = -Infinity
    let last = start
    const onScroll = () => {
      scrolledAt = performance.now()
    }
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      // Hold the pulse still while the page scrolls, so the scroll gets every
      // frame; its clock stops too, so it picks up where it left off.
      if (now - scrolledAt < SCROLL_SETTLE_MS) start += now - last
      last = now
      if (now - scrolledAt < SCROLL_SETTLE_MS) return
      // A slow fade between faint opacities: 30fps looks the same, for half the drawing.
      if (now - drawn < PULSE_FRAME_MS - 2) return
      drawn = now
      elapsed.current = now - start
      renderer.current?.draw(elapsed.current, pulseTiming)
    }
    frame = requestAnimationFrame(tick)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [animating, pulseTiming, strokes, canvasHost])

  if (!runEnabled || !strokes?.length) return null

  return (
    <>
      {clip && <rect ref={clipRef} {...clip} fill="none" />}
      <g transform={`translate(${layout.x} ${layout.y})`}>
        <svg
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
        >
          {/* At rest, and static: the pulse is drawn on the canvas beneath. */}
          <g ref={contoursRef}>
            {tiers.map((tier) => (
              <g key={tier} className={TIER_CLASS} data-tier={tier}>
                {data!.layers.get(tier)?.map((p, i) => (
                  <path
                    key={i}
                    d={p.d}
                    stroke={p.stroke}
                    strokeWidth={p.strokeWidth}
                    strokeLinecap={p.lineCap}
                    strokeLinejoin={p.lineJoin}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
      </g>
      {canvasHost &&
        createPortal(
          <canvas ref={canvasRef} className="absolute" aria-hidden />,
          canvasHost,
        )}
    </>
  )
}
