import type { TierPath } from "@/utils/svgTierPulse"

/**
 * Draws the pulse of a contour map on one canvas, beneath the contours'
 * static SVG: just the tiers mid-pulse, at what they add over their resting
 * opacity. So a map costs one extra compositing layer however many tiers it
 * has. (Animating each tier's `<g>` opacity instead gave every tier its own
 * map-sized GPU layer, which ran Chrome out of tile memory and flickered on
 * scroll.)
 */

/** The same stroke for every path in it, so a tier is a few `stroke()` calls. */
type Stroke = {
  path: Path2D
  color: string
  width: number
  cap: CanvasLineCap
  join: CanvasLineJoin
}

/** Tiers in pulse order, each as its strokes. */
export type TierStrokes = Stroke[][]

export function tierStrokes(tiers: TierPath[][]): TierStrokes {
  return tiers.map((paths) => {
    const byStyle = new Map<string, { style: TierPath; d: string[] }>()
    for (const p of paths) {
      const key = `${p.stroke}|${p.strokeWidth}|${p.lineCap}|${p.lineJoin}`
      const group = byStyle.get(key)
      if (group) group.d.push(p.d)
      else byStyle.set(key, { style: p, d: [p.d] })
    }
    return [...byStyle.values()].map(({ style, d }) => ({
      path: new Path2D(d.join(" ")),
      color: style.stroke,
      width: style.strokeWidth,
      cap: style.lineCap,
      join: style.lineJoin,
    }))
  })
}

function strokeTier(ctx: CanvasRenderingContext2D, tier: Stroke[]) {
  for (const s of tier) {
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.width
    ctx.lineCap = s.cap
    ctx.lineJoin = s.join
    ctx.stroke(s.path)
  }
}

/** CSS `ease-out`, i.e. cubic-bezier(0, 0, 0.58, 1). */
function easeOut(x: number) {
  // Solve x(t) = x by bisection; x(t) is monotonic on [0, 1].
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const t = (lo + hi) / 2
    const xt = 3 * (1 - t) * t * t * 0.58 + t * t * t
    if (xt < x) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2
  return 3 * (1 - t) * t * t + t * t * t
}

export type PulseTiming = {
  /** Ms from one tier's pulse starting to the next one's. */
  staggerMs: number
  /** Ms one tier takes to rise and settle back. */
  tierDurationMs: number
  /** Ms before the cascade repeats (looping) or stops. */
  cycleMs: number
  loop: boolean
}

export type PulseOpacity = { rest: number; peak: number }

/**
 * A tier's opacity `elapsed` ms into the cascade: a quick ease up to `peak`
 * over the first 12% of its pulse, then an ease back down to `rest`.
 */
export function tierOpacity(
  elapsed: number,
  rank: number,
  { staggerMs, tierDurationMs, cycleMs, loop }: PulseTiming,
  { rest, peak }: PulseOpacity,
) {
  const t = elapsed - rank * staggerMs
  if (t < 0 || (!loop && t >= cycleMs)) return rest
  const at = loop ? t % cycleMs : t
  const rise = 0.12 * tierDurationMs
  if (at < rise) return rest + (peak - rest) * easeOut(at / rise)
  if (at < tierDurationMs)
    return peak + (rest - peak) * easeOut((at - rise) / (tierDurationMs - rise))
  return rest
}

/** Where the canvas sits in its host (CSS px) and how map units land on it. */
export type Placement = {
  left: number
  top: number
  width: number
  height: number
  dpr: number
  /** Map units to the canvas's own (device) pixels. */
  transform: DOMMatrix
  opacity: PulseOpacity
}

export function samePlacement(a: Placement | null, b: Placement | null) {
  if (!a || !b) return a === b
  const near = (x: number, y: number) => Math.abs(x - y) < 1e-3
  const ma = a.transform
  const mb = b.transform
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height &&
    a.dpr === b.dpr &&
    a.opacity.rest === b.opacity.rest &&
    a.opacity.peak === b.opacity.peak &&
    near(ma.a, mb.a) &&
    near(ma.b, mb.b) &&
    near(ma.c, mb.c) &&
    near(ma.d, mb.d) &&
    near(ma.e, mb.e) &&
    near(ma.f, mb.f)
  )
}

export function createTierPulseRenderer(
  canvas: HTMLCanvasElement,
  tiers: TierStrokes,
) {
  const ctx = canvas.getContext("2d")
  let placement: Placement | null = null
  let blank = true

  // A canvas on screen costs a texture upload each frame in some browsers even
  // when unchanged, so it's only shown while it has something on it.
  const show = (visible: boolean) => {
    canvas.style.visibility = visible ? "" : "hidden"
  }

  /** Sizes the canvas to `next` (which clears it). */
  const place = (next: Placement | null) => {
    placement = next
    blank = true
    show(false)
    if (!next) return
    Object.assign(canvas.style, {
      left: `${next.left}px`,
      top: `${next.top}px`,
      width: `${next.width}px`,
      height: `${next.height}px`,
    })
    canvas.width = Math.round(next.width * next.dpr)
    canvas.height = Math.round(next.height * next.dpr)
  }

  /** Draws the cascade `elapsed` ms in, or clears it (all at rest) when `elapsed` is null. */
  const draw = (elapsed: number | null, timing: PulseTiming) => {
    if (!ctx || !placement) return
    if (!blank) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      blank = true
    }
    if (elapsed !== null) {
      // Each tier already shows at `rest` in the SVG over this; stroking it
      // here at `extra` adds up to its opacity now: 1 - (1 - rest)(1 - extra).
      const { rest } = placement.opacity
      ctx.setTransform(placement.transform)
      tiers.forEach((tier, rank) => {
        const opacity = tierOpacity(elapsed, rank, timing, placement!.opacity)
        if (opacity - rest < 1e-3) return
        ctx.globalAlpha = (opacity - rest) / (1 - rest)
        strokeTier(ctx, tier)
        blank = false
      })
    }
    show(!blank)
  }

  return { place, draw, placement: () => placement }
}
