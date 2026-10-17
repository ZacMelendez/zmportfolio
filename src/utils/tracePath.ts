export type Point = { x: number; y: number }

/** Points of an absolute `M`/`L` polyline, the format TopoStack and Figma export traces in. */
export function polylinePoints(d: string): Point[] {
  const points: Point[] = []
  for (const match of d.matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)) {
    points.push({
      x: Number.parseFloat(match[1]),
      y: Number.parseFloat(match[2]),
    })
  }
  return points
}

export function polylineD(points: Point[]): string {
  return points
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join("")
}

/** Moves every coordinate pair of an absolute-command path (`M`/`L`/`C`) through `fn`. */
export function mapPath(d: string, fn: (p: Point) => Point): string {
  return d.replace(/(-?[\d.]+)[ ,](-?[\d.]+)/g, (_, x, y) => {
    const p = fn({ x: Number.parseFloat(x), y: Number.parseFloat(y) })
    return `${+p.x.toFixed(3)} ${+p.y.toFixed(3)}`
  })
}

/** Shifts every coordinate pair of an absolute-command path (`M`/`L`/`C`) by `dx`, `dy`. */
export function translatePath(d: string, dx: number, dy: number): string {
  return mapPath(d, (p) => ({ x: p.x + dx, y: p.y + dy }))
}

/** A trace and the guide path its name is set along, in its frame's units. */
export type GuidedTrace = {
  points: Point[]
  guideD: string
  /** Frame height, and the trace and guide's combined extent left to right. */
  size: { height: number; left: number; right: number }
}

/**
 * Reads a Figma frame holding a trace and, stroked black, the guide for its
 * name. The trace is turned to run top to bottom, the way the page is read.
 */
export function guidedTrace(raw: string, name: string): GuidedTrace {
  const paths = [...raw.matchAll(/<path\b[^>]*>/g)].map((m) => m[0])
  const guide = paths.find((p) => /stroke="black"/i.test(p))
  const trace = paths.find((p) => p !== guide)
  const d = (el?: string) => el?.match(/\bd="([^"]+)"/)?.[1] ?? ""
  const height = Number(raw.match(/viewBox="[^"]*?([\d.]+)"/)?.[1])
  if (!trace || !guide || !height)
    throw new Error(`${name} needs a viewBox, the trace and a guide path`)

  const points = polylinePoints(d(trace))
  if (points[0].y > points[points.length - 1].y) points.reverse()
  const xs = [...points, ...polylinePoints(d(guide))].map((p) => p.x)

  return {
    points,
    guideD: d(guide),
    size: { height, left: Math.min(...xs), right: Math.max(...xs) },
  }
}

/**
 * Stretches a guided trace's frame to `height` px and centres the trace and
 * its guide on `centerX`, at most `wander` px across.
 */
export function placeGuidedTrace(
  { points, guideD, size }: GuidedTrace,
  centerX: number,
  height: number,
  wander: number,
) {
  const scaleY = height / size.height
  const scaleX = Math.min(scaleY, wander / (size.right - size.left))
  const middle = (size.left + size.right) / 2
  const place = (p: Point) => ({
    x: centerX + (p.x - middle) * scaleX,
    y: p.y * scaleY,
  })
  return { points: points.map(place), guideD: mapPath(guideD, place) }
}

/**
 * `placeGuidedTrace` turned a quarter anticlockwise, as the hero's map is on
 * mobile: the frame is stretched from `left` to `right`, trimmed to the trace
 * where it stops short of the frame's ends so it still reaches both edges, and
 * the trace and its guide fill a band `thickness` px tall centred on
 * `centerY`. Guides that run down their frame read left to right.
 */
export function placeGuidedTraceAcross(
  { points, guideD, size }: GuidedTrace,
  left: number,
  right: number,
  centerY: number,
  thickness: number,
) {
  const top = Math.max(0, points[0].y)
  const bottom = Math.min(size.height, points[points.length - 1].y)
  const scaleX = (right - left) / (bottom - top)
  const scaleY = thickness / (size.right - size.left)
  const middle = (size.left + size.right) / 2
  const place = (p: Point) => ({
    x: left + (p.y - top) * scaleX,
    y: centerY - (p.x - middle) * scaleY,
  })
  return { points: points.map(place), guideD: mapPath(guideD, place) }
}

/** Box around `points`, `pad` px out on every side. */
export function paddedBounds(points: Point[], pad: number) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs) - pad
  const y = Math.min(...ys) - pad
  return {
    x,
    y,
    width: Math.max(...xs) + pad - x,
    height: Math.max(...ys) + pad - y,
  }
}

export type PathSampler = {
  length: number
  /** The point `at` units along, like `getPointAtLength`. */
  pointAt: (at: number) => Point
}

/** Line segments a cubic Bézier is flattened into for sampling. */
const CURVE_STEPS = 24

/**
 * Flattens a single absolute `M`/`L`/`H`/`V`/`C`/`Z` path (the formats traces
 * and guides come in) to a polyline, or null if it uses any other command or
 * has more than one subpath.
 */
export function flattenPath(d: string): Point[] | null {
  if (/[^MLHVCZ\d\s,.eE+-]/.test(d) || d.split("M").length > 2) return null
  const points: Point[] = []
  let x = 0
  let y = 0
  let start: Point = { x, y }
  for (const [, command, args] of d.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
    const v = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number)
    switch (command) {
      case "H":
        for (const value of v) points.push({ x: (x = value), y })
        break
      case "V":
        for (const value of v) points.push({ x, y: (y = value) })
        break
      case "C":
        for (let i = 0; i + 5 < v.length; i += 6) {
          const [x1, y1, x2, y2, x3, y3] = v.slice(i, i + 6)
          for (let step = 1; step <= CURVE_STEPS; step++) {
            const t = step / CURVE_STEPS
            const u = 1 - t
            const a = u * u * u
            const b = 3 * u * u * t
            const c = 3 * u * t * t
            const e = t * t * t
            points.push({
              x: a * x + b * x1 + c * x2 + e * x3,
              y: a * y + b * y1 + c * y2 + e * y3,
            })
          }
          x = x3
          y = y3
        }
        break
      case "Z":
        ;({ x, y } = start)
        points.push({ x, y })
        break
      default:
        for (let i = 0; i + 1 < v.length; i += 2) {
          x = v[i]
          y = v[i + 1]
          points.push({ x, y })
          // M's later pairs are lines; Z returns to its first point.
          if (command === "M" && i === 0) start = { x, y }
        }
    }
  }
  return points
}

/**
 * Points along a path by length, worked out in JS from its `d`. Stands in for
 * `getPointAtLength`, which walks the whole path on every call: sampling a
 * trace of a thousand-odd vertices hundreds of times cost ~1 s of a throttled
 * phone's main thread. Lengths are scaled to the browser's `getTotalLength`,
 * so they mix with it (e.g. a textPath's startOffset).
 */
export function pathSampler(path: SVGPathElement): PathSampler {
  const length = path.getTotalLength()
  const points = flattenPath(path.getAttribute("d") ?? "")
  if (!points)
    return { length, pointAt: (at) => path.getPointAtLength(at) }
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const scale = length / (lengths[lengths.length - 1] || 1)
  for (let i = 0; i < lengths.length; i++) lengths[i] *= scale

  return {
    length,
    pointAt(at) {
      if (points.length < 2) return points[0] ?? { x: 0, y: 0 }
      if (at <= 0) return points[0]
      if (at >= length) return points[points.length - 1]
      let lo = 0
      let hi = lengths.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (lengths[mid] <= at) lo = mid
        else hi = mid
      }
      const a = points[lo]
      const b = points[hi]
      const t = (at - lengths[lo]) / (lengths[hi] - lengths[lo] || 1)
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    },
  }
}


/**
 * Maps a y coordinate to the path length where a mostly top-to-bottom trace
 * first reaches it, for traces that should keep pace with the reader.
 */
export function lengthAtYLookup(
  path: SVGPathElement | PathSampler,
  samples = 600,
) {
  const sampler = "pointAt" in path ? path : pathSampler(path)
  const { length } = sampler
  const lengths: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= samples; i++) {
    const at = (i / samples) * length
    lengths.push(at)
    ys.push(sampler.pointAt(at).y)
  }

  return (y: number) => {
    if (y <= ys[0]) return 0
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] < y) continue
      const t = ys[i] === ys[i - 1] ? 1 : (y - ys[i - 1]) / (ys[i] - ys[i - 1])
      return lengths[i - 1] + t * (lengths[i] - lengths[i - 1])
    }
    return length
  }
}

/** Vertices of an absolute `M`/`L`/`H`/`V` polyline path. */
export function pathVertices(d: string): Point[] {
  const points: Point[] = []
  let x = 0
  let y = 0
  for (const [, command, args] of d.matchAll(/([MLHV])([^MLHVZ]*)/g)) {
    const values = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(
      Number,
    )
    for (let i = 0; i < values.length; i++) {
      if (command === "H") x = values[i]
      else if (command === "V") y = values[i]
      else {
        x = values[i]
        y = values[++i]
      }
      points.push({ x, y })
    }
  }
  return points
}

/**
 * The first stretch of a polyline as path data, `drawn` units of its `length`
 * along. Drawing the stretch itself, rather than dashing the whole line,
 * sidesteps WebKit breaking long dashes on paths with many segments.
 */
export function polylinePrefix(points: Point[]) {
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const steps = points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
  const length = lengths[lengths.length - 1] ?? 0

  /** The segment `drawn` falls in, and how far along it. */
  const locate = (drawn: number) => {
    let lo = 0
    let hi = lengths.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (lengths[mid] <= drawn) lo = mid
      else hi = mid
    }
    const a = points[lo]
    const b = points[hi]
    const t = (drawn - lengths[lo]) / (lengths[hi] - lengths[lo] || 1)
    return { lo, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }

  return {
    length,
    d(drawn: number) {
      if (drawn <= 0 || points.length < 2) return ""
      if (drawn >= length) return steps.join("")
      const { lo, x, y } = locate(drawn)
      return `${steps.slice(0, lo + 1).join("")}L${+x.toFixed(3)} ${+y.toFixed(3)}`
    },
    /** The head of the line `drawn` units along. */
    pointAt(drawn: number): Point {
      if (points.length < 2 || drawn <= 0) return points[0] ?? { x: 0, y: 0 }
      if (drawn >= length) return points[points.length - 1]
      const { x, y } = locate(drawn)
      return { x, y }
    },
  }
}
