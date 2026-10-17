/** Default: TopoStack-style ids such as `contour-14-0-0`. */
export const DEFAULT_TIER_ID_PATTERN = /^contour-(\d+)-/

export const TIER_PULSE_DEFAULTS = {
  baseOpacity: 0.1,
  peakOpacity: 0.3,
  staggerMs: 150,
  tierDurationMs: 2000,
} as const

export type SvgTierPulseOptions = {
  /** RegExp with capture group 1 = tier index (higher = animates first). */
  tierPattern?: RegExp
  /** Query selector for elements that carry tier ids (default `path[id]`). */
  selector?: string
}

export function tierFromId(
  id: string,
  pattern: RegExp = DEFAULT_TIER_ID_PATTERN,
): number | null {
  const match = pattern.exec(id)
  if (!match) return null
  const tier = Number.parseInt(match[1], 10)
  return Number.isFinite(tier) ? tier : null
}

/** One contour as drawn: its geometry and stroke, read off the source SVG. */
export type TierPath = {
  d: string
  stroke: string
  strokeWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
}

function tierPath(el: Element): TierPath | null {
  const d = el.getAttribute("d")
  if (!d) return null
  return {
    d,
    stroke: el.getAttribute("stroke") ?? "#000",
    strokeWidth: Number.parseFloat(el.getAttribute("stroke-width") ?? "1") || 1,
    lineCap: (el.getAttribute("stroke-linecap") as CanvasLineCap) ?? "butt",
    lineJoin: (el.getAttribute("stroke-linejoin") as CanvasLineJoin) ?? "miter",
  }
}

export function groupElementsByTier(
  svgText: string,
  options: SvgTierPulseOptions = {},
): Map<number, TierPath[]> {
  const pattern = options.tierPattern ?? DEFAULT_TIER_ID_PATTERN
  const selector = options.selector ?? "path[id]"
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml")
  const byTier = new Map<number, TierPath[]>()

  for (const el of doc.querySelectorAll(selector)) {
    const id = el.getAttribute("id")
    if (!id) continue
    const tier = tierFromId(id, pattern)
    if (tier === null) continue
    const path = tierPath(el)
    if (!path) continue
    const list = byTier.get(tier)
    if (list) list.push(path)
    else byTier.set(tier, [path])
  }

  return byTier
}

export function mergeTierMaps(
  ...maps: Map<number, TierPath[]>[]
): Map<number, TierPath[]> {
  const merged = new Map<number, TierPath[]>()

  for (const map of maps) {
    for (const [tier, paths] of map) {
      const existing = merged.get(tier)
      if (existing) existing.push(...paths)
      else merged.set(tier, [...paths])
    }
  }

  return merged
}

export function sortedTiersDescending(layers: Map<number, unknown>): number[] {
  return [...layers.keys()].sort((a, b) => b - a)
}

export function tierPulseCycleDurationMs(
  tierCount: number,
  staggerMs: number = TIER_PULSE_DEFAULTS.staggerMs,
  tierDurationMs: number = TIER_PULSE_DEFAULTS.tierDurationMs,
): number {
  if (tierCount <= 0) return tierDurationMs
  return (tierCount - 1) * staggerMs + tierDurationMs
}

export function extractSvgViewBox(
  svgText: string,
  fallback = "0 0 100 100",
): string {
  const match = svgText.match(/\bviewBox="([^"]+)"/)
  return match?.[1] ?? fallback
}

export type SvgTierPulseLoadResult = {
  layers: Map<number, TierPath[]>
  viewBox: string
}

export async function fetchSvgTierLayers(
  sources: string | string[],
  options: SvgTierPulseOptions = {},
): Promise<SvgTierPulseLoadResult> {
  const urls = Array.isArray(sources) ? sources : [sources]
  const responses = await Promise.all(urls.map((url) => fetch(url)))

  if (responses.some((r) => !r.ok)) {
    throw new Error("Failed to load SVG tier source(s)")
  }

  const texts = await Promise.all(responses.map((r) => r.text()))
  const maps = texts.map((text) => groupElementsByTier(text, options))

  return {
    viewBox: texts[0] ? extractSvgViewBox(texts[0]) : "0 0 100 100",
    layers: mergeTierMaps(...maps),
  }
}

export function parseSvgTierLayers(
  sources: string | string[],
  options: SvgTierPulseOptions = {},
): SvgTierPulseLoadResult {
  const texts = Array.isArray(sources) ? sources : [sources]
  const maps = texts.map((text) => groupElementsByTier(text, options))

  return {
    viewBox: texts[0] ? extractSvgViewBox(texts[0]) : "0 0 100 100",
    layers: mergeTierMaps(...maps),
  }
}
