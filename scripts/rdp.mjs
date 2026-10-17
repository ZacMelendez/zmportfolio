/**
 * Ramer-Douglas-Peucker: drops `[x, y]` points that sit within `tolerance`
 * of the line through the points kept either side of them.
 */
export function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
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
