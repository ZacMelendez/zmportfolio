/**
 * Ways to take the corners off TopoStack's contour polylines, compared on the
 * dev page at /dev/contours.html. `scripts/smooth-contours.mjs` builds the
 * shipped contours with the chosen one (Gaussian, RDP, then Catmull-Rom), so
 * this file is plain, erasable TypeScript that Node can import directly. Contours arrive as absolute M/L/H/V/Z
 * paths: rings (closed) and lines cut off by the map's edge (open). Open
 * lines keep their endpoints, so they still meet the edge.
 */

export type Pt = [number, number]
export type Subpath = { points: Pt[]; closed: boolean }

/** Splits an absolute M/L/H/V/Z path into its subpaths. */
export function parseSubpaths(d: string): Subpath[] {
  const tokens = d.match(/[MLHVZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []
  const subpaths: Subpath[] = []
  let current: Subpath | null = null
  let command = ""
  let x = 0
  let y = 0
  for (let i = 0; i < tokens.length;) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++].toUpperCase()
    if (command === "Z") {
      if (current) current.closed = true
      current = null
      continue
    }
    if (command === "M") {
      x = +tokens[i++]
      y = +tokens[i++]
      current = { points: [[x, y]], closed: false }
      subpaths.push(current)
      command = "L"
      continue
    }
    if (command === "L") {
      x = +tokens[i++]
      y = +tokens[i++]
    } else if (command === "H") x = +tokens[i++]
    else if (command === "V") y = +tokens[i++]
    else throw new Error(`Unexpected path command ${command}`)
    if (!current) {
      current = { points: [[x, y]], closed: false }
      subpaths.push(current)
    }
    current.points.push([x, y])
  }

  // A ring that returns to its start by an explicit point: drop the repeat.
  for (const s of subpaths) {
    const [first, last] = [s.points[0], s.points.at(-1)!]
    if (s.points.length > 2 && first[0] === last[0] && first[1] === last[1]) {
      s.points.pop()
      s.closed = true
    }
  }
  return subpaths
}

const fmt = (n: number) => String(+n.toFixed(1))
const pt = ([x, y]: Pt) => `${fmt(x)} ${fmt(y)}`

/** Straight segments, as shipped today. */
export function polylineD(subpaths: Subpath[]) {
  return subpaths
    .map(({ points, closed }) => {
      const d = points.map((p, i) => `${i ? "L" : "M"}${pt(p)}`).join("")
      return closed ? `${d}Z` : d
    })
    .join("")
}

/** Ramer-Douglas-Peucker, as in `scripts/rdp.mjs`. */
export function rdp(points: Pt[], tolerance: number): Pt[] {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    const [ax, ay] = points[a]
    const [bx, by] = points[b]
    const dx = bx - ax
    const dy = by - ay
    const length = Math.hypot(dx, dy)
    let furthest = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i]
      const distance = length
        ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length
        : Math.hypot(px - ax, py - ay)
      if (distance > furthest) {
        furthest = distance
        index = i
      }
    }
    if (furthest > tolerance) {
      keep[index] = 1
      stack.push([a, index], [index, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** RDP for a subpath; a ring is simplified from its first point round to itself. */
export function simplifySubpath(
  { points, closed }: Subpath,
  tolerance: number,
): Subpath {
  if (!closed) return { points: rdp(points, tolerance), closed }
  const ring = rdp([...points, points[0]], tolerance).slice(0, -1)
  // Keep a small ring from collapsing to a line.
  return { points: ring.length >= 3 ? ring : points, closed }
}

/**
 * Chaikin corner cutting: each pass replaces every corner with two points a
 * quarter of the way along its edges, converging on a smooth B-spline.
 */
export function chaikin({ points, closed }: Subpath, passes: number): Subpath {
  let pts = points
  for (let pass = 0; pass < passes && pts.length > 2; pass++) {
    const next: Pt[] = closed ? [] : [pts[0]]
    const edges = closed ? pts.length : pts.length - 1
    for (let i = 0; i < edges; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[(i + 1) % pts.length]
      next.push(
        [0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by],
        [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by],
      )
    }
    if (!closed) next.push(pts.at(-1)!)
    pts = next
  }
  return { points: pts, closed }
}

/**
 * Gaussian smoothing of the points themselves, `radius` points either side:
 * irons out the stair-step jitter TopoStack's grid leaves in the line before
 * it's simplified. Open lines keep their ends (the window shrinks to fit).
 */
export function gaussian({ points, closed }: Subpath, radius: number): Subpath {
  const n = points.length
  if (radius < 1 || n < 3) return { points, closed }
  const sigma = radius / 2
  const weights = Array.from({ length: radius * 2 + 1 }, (_, k) =>
    Math.exp(-((k - radius) ** 2) / (2 * sigma * sigma)),
  )
  const out: Pt[] = points.map((p, i) => {
    if (!closed && (i === 0 || i === n - 1)) return p
    const reach = closed ? radius : Math.min(radius, i, n - 1 - i)
    let x = 0
    let y = 0
    let total = 0
    for (let k = -reach; k <= reach; k++) {
      const [px, py] = points[(i + k + n) % n]
      const w = weights[k + radius]
      x += px * w
      y += py * w
      total += w
    }
    return [x / total, y / total]
  })
  return { points: out, closed }
}

/**
 * Curves through every point: quadratic Béziers between edge midpoints, with
 * each original point as the control. The line no longer passes through the
 * points, but stays inside the original polyline's corners.
 */
export function midpointQuadD(subpaths: Subpath[]) {
  return subpaths
    .map(({ points, closed }) => {
      const n = points.length
      if (n < 3) return polylineD([{ points, closed }])
      const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      if (closed) {
        let d = `M${pt(mid(points[n - 1], points[0]))}`
        for (let i = 0; i < n; i++)
          d += `Q${pt(points[i])} ${pt(mid(points[i], points[(i + 1) % n]))}`
        return `${d}Z`
      }
      let d = `M${pt(points[0])}L${pt(mid(points[0], points[1]))}`
      for (let i = 1; i < n - 1; i++)
        d += `Q${pt(points[i])} ${pt(mid(points[i], points[i + 1]))}`
      return `${d}L${pt(points[n - 1])}`
    })
    .join("")
}

/**
 * Rounds each corner off over `radius` map units either side of it (less
 * where a segment is too short to give that much), with a quadratic curve
 * bending at the corner. Straight stretches stay straight; at a large radius
 * every segment is all curve, the same as `midpointQuadD`.
 */
export function roundedCornersD(subpaths: Subpath[], radius: number) {
  const toward = (from: Pt, to: Pt, distance: number): Pt => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
    const t = Math.min(distance, length / 2) / length
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
  }
  return subpaths
    .map(({ points, closed }) => {
      const n = points.length
      if (n < 3 || radius <= 0) return polylineD([{ points, closed }])
      const corner = (i: number) => {
        const b = points[i]
        const a = points[(i - 1 + n) % n]
        const c = points[(i + 1) % n]
        return `L${pt(toward(b, a, radius))}Q${pt(b)} ${pt(toward(b, c, radius))}`
      }
      if (closed) {
        // Start where the first corner's curve ends, and close through it.
        let d = `M${pt(toward(points[0], points[1], radius))}`
        for (let i = 1; i < n; i++) d += corner(i)
        return `${d}${corner(0)}Z`
      }
      let d = `M${pt(points[0])}`
      for (let i = 1; i < n - 1; i++) d += corner(i)
      return `${d}L${pt(points[n - 1])}`
    })
    .join("")
}

/**
 * Curves through every point: centripetal Catmull-Rom (alpha 0.5), as cubic
 * Béziers. Passes through the points like the polyline does, without the
 * loops and overshoots plain Catmull-Rom makes where points bunch up.
 */
export function catmullRomD(subpaths: Subpath[], alpha = 0.5, tension = 1) {
  const segment = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) => {
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** alpha
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** alpha
    const d3 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** alpha
    const eps = 1e-6
    let c1: Pt
    let c2: Pt
    if (d1 < eps || d2 < eps)
      c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    else {
      const a = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2
      const b = 3 * d1 * (d1 + d2)
      c1 = [
        (d1 * d1 * p2[0] - d2 * d2 * p0[0] + a * p1[0]) / b,
        (d1 * d1 * p2[1] - d2 * d2 * p0[1] + a * p1[1]) / b,
      ]
    }
    if (d3 < eps || d2 < eps)
      c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    else {
      const a = 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2
      const b = 3 * d3 * (d3 + d2)
      c2 = [
        (d3 * d3 * p1[0] - d2 * d2 * p3[0] + a * p2[0]) / b,
        (d3 * d3 * p1[1] - d2 * d2 * p3[1] + a * p2[1]) / b,
      ]
    }
    // Tension 0 pulls the handles onto the points: straight segments.
    c1 = [p1[0] + (c1[0] - p1[0]) * tension, p1[1] + (c1[1] - p1[1]) * tension]
    c2 = [p2[0] + (c2[0] - p2[0]) * tension, p2[1] + (c2[1] - p2[1]) * tension]
    return `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }

  return subpaths
    .map(({ points, closed }) => {
      const n = points.length
      if (n < 3) return polylineD([{ points, closed }])
      const at = (i: number): Pt => {
        if (closed) return points[(i + n) % n]
        // Open ends: mirror the neighbour so the curve leaves the end straight.
        if (i < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]]
        if (i >= n)
          return [
            2 * points[n - 1][0] - points[n - 2][0],
            2 * points[n - 1][1] - points[n - 2][1],
          ]
        return points[i]
      }
      let d = `M${pt(points[0])}`
      const segments = closed ? n : n - 1
      for (let i = 0; i < segments; i++)
        d += segment(at(i - 1), at(i), at(i + 1), at(i + 2))
      return closed ? `${d}Z` : d
    })
    .join("")
}

/** Points in a path's data, whatever its commands, for comparing sizes. */
export function countSegments(d: string) {
  return (d.match(/[LCQ]/g) ?? []).length
}
