/**
 * Dev-only page (/dev/contours.html, not part of the build): ways to take the
 * sharp corners off the topo maps' contours. A side-by-side comparison of one
 * method against the original while its settings are tuned, then every method
 * on the same map, with what each would cost to ship and to draw. The methods
 * live in `src/utils/smoothContours.ts`.
 */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import ReactDOM from "react-dom/client"
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch"
import { CHOCORUA_MAP } from "@/data/chocoruaMap"
import { HAWKSBILL_MAP } from "@/data/hawksbillMap"
import { TIER_PULSE_DEFAULTS, tierFromId } from "@/utils/svgTierPulse"
import {
  catmullRomD,
  chaikin,
  countSegments,
  gaussian,
  parseSubpaths,
  polylineD,
  roundedCornersD,
  simplifySubpath,
  type Subpath,
} from "@/utils/smoothContours"
import "../index.css"

const SHIPPED = import.meta.glob<string>("../assets/contours/*.svg", {
  query: "?raw",
  import: "default",
})
const SOURCE = import.meta.glob<string>(
  "../../design/contours-unsimplified/*/*.svg",
  { query: "?raw", import: "default" },
)

const STROKE = "#B6C494"

const MAPS = [
  {
    id: "kuwohi",
    name: "Kuwohi",
    section: "Hero",
    ground: "#202A19",
    opacity: {
      rest: TIER_PULSE_DEFAULTS.baseOpacity,
      peak: TIER_PULSE_DEFAULTS.peakOpacity,
    },
  },
  {
    id: "hawksbill",
    name: "Hawksbill",
    section: "Work",
    ground: HAWKSBILL_MAP.ground,
    opacity: HAWKSBILL_MAP.contourOpacity,
  },
  {
    id: "chocorua",
    name: "Chocorua",
    section: "About",
    ground: CHOCORUA_MAP.ground,
    opacity: CHOCORUA_MAP.contourOpacity,
  },
] as const

type MapId = (typeof MAPS)[number]["id"]

/** How much of the 1000-unit map each view shows, centred on the summit. */
const VIEWS = {
  detail: { label: "Corner detail", span: 60 },
  summit: { label: "Summit close-up", span: 140 },
  site: { label: "Site scale", span: 320 },
  full: { label: "Whole map", span: 1000 },
} as const
type ViewId = keyof typeof VIEWS

const LOOKS = {
  site: "As on the site",
  peak: "At pulse peak",
  lines: "Lines only",
} as const
type LookId = keyof typeof LOOKS

/** One contour: as shipped, as it shipped before smoothing, and as exported. */
type Contour = {
  tier: number
  strokeWidth: number
  /** The shipped path data, as is. */
  shippedD: string
  /** TopoStack's lines thinned as they were before smoothing: straight segments. */
  straight: Subpath[]
  source: Subpath[]
}

/** How far the straight lines that shipped before smoothing were thinned, in map units. */
const STRAIGHT_THINNING = 0.35

type Loaded = { contours: Contour[]; summit: { x: number; y: number } }

/** TopoStack's summit marker: one closed triangle, which the shipped files drop. */
const isSummitMarker = (subpaths: Subpath[]) =>
  subpaths.length === 1 &&
  subpaths[0].closed &&
  subpaths[0].points.length === 3

function readPaths(svg: string) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml")
  return [...doc.querySelectorAll("path[id]")].map((el) => ({
    id: el.getAttribute("id")!,
    d: el.getAttribute("d") ?? "",
    strokeWidth: Number(el.getAttribute("stroke-width") ?? 1),
  }))
}

async function loadMap(id: MapId): Promise<Loaded> {
  const contours: Contour[] = []
  let summit: { x: number; y: number } | null = null
  for (const kind of ["minor", "index"]) {
    const file = `${id}-contours-${kind}.svg`
    const shippedKey = Object.keys(SHIPPED).find((k) => k.endsWith(`/${file}`))
    const sourceKey = Object.keys(SOURCE).find((k) => k.endsWith(`/${file}`))
    if (!shippedKey || !sourceKey) throw new Error(`Missing ${file}`)
    const [shipped, source] = await Promise.all([
      SHIPPED[shippedKey](),
      SOURCE[sourceKey](),
    ])
    const sourcePaths = readPaths(source)
    const sourceById = new Map(sourcePaths.map((p) => [p.id, p]))
    // The summit: the middle of TopoStack's marker triangle.
    for (const p of sourcePaths) {
      const subpaths = parseSubpaths(p.d)
      if (!isSummitMarker(subpaths)) continue
      const pts = subpaths[0].points
      summit = {
        x: pts.reduce((sum, q) => sum + q[0], 0) / pts.length,
        y: pts.reduce((sum, q) => sum + q[1], 0) / pts.length,
      }
    }
    for (const p of readPaths(shipped)) {
      const original = sourceById.get(p.id)
      const sourceSubpaths = original ? parseSubpaths(original.d) : []
      contours.push({
        tier: tierFromId(p.id) ?? 0,
        strokeWidth: p.strokeWidth,
        shippedD: p.d,
        straight: sourceSubpaths.map((s) =>
          simplifySubpath(s, STRAIGHT_THINNING),
        ),
        source: sourceSubpaths,
      })
    }
  }

  return { contours, summit: summit ?? { x: 500, y: 500 } }
}

type Param = {
  label: string
  min: number
  max: number
  step: number
  initial: number
  unit?: string
}

type Method = {
  id: string
  name: string
  blurb: string
  params?: Param[]
  build: (contour: Contour, params: number[]) => string
}

const METHODS: Method[] = [
  {
    id: "today",
    name: "Today",
    blurb:
      "What ships now, straight from src/assets/contours: built by scripts/smooth-contours.mjs (smoothed original, curved).",
    build: (c) => c.shippedD,
  },
  {
    id: "before",
    name: "Before (straight)",
    blurb:
      "What shipped before smoothing: TopoStack's lines thinned with RDP (0.35 units) and drawn as straight segments with round joins.",
    build: (c) => polylineD(c.straight),
  },
  {
    id: "source",
    name: "TopoStack original",
    blurb:
      "The export before thinning, for reference. Denser, but the corners come from TopoStack's grid, so it's jagged too.",
    build: (c) => polylineD(c.source),
  },
  {
    id: "rounded",
    name: "Rounded corners",
    blurb:
      "The straight lines' points, with each corner rounded off over a set radius (less where a segment is too short). Straight stretches stay straight; at the largest radius it's all curves.",
    params: [
      { label: "Radius", min: 0.5, max: 12, step: 0.5, initial: 3, unit: "u" },
    ],
    build: (c, [radius]) => roundedCornersD(c.straight, radius),
  },
  {
    id: "catmull",
    name: "Catmull-Rom through points",
    blurb:
      "A smooth curve through the straight lines' points (centripetal, so no loops). Tension 1 is the full curve, 0 straight lines; it can swing a little wide between far-apart points.",
    params: [{ label: "Tension", min: 0, max: 1, step: 0.05, initial: 1 }],
    build: (c, [tension]) => catmullRomD(c.straight, 0.5, tension),
  },
  {
    id: "chaikin",
    name: "Chaikin corner cutting",
    blurb:
      "Each pass cuts every corner off at a quarter of each edge. Stays close to the straight lines' shape; each pass doubles the points.",
    params: [{ label: "Passes", min: 1, max: 4, step: 1, initial: 2 }],
    build: (c, [passes]) => polylineD(c.straight.map((s) => chaikin(s, passes))),
  },
  {
    id: "smooth-poly",
    name: "Smoothed original, straight",
    blurb:
      "Irons the grid jitter out of TopoStack's original first, then thins it like before. Gentler angles at the straight lines' size, still straight segments.",
    params: [
      { label: "Smoothing", min: 1, max: 8, step: 1, initial: 3, unit: "pts" },
      { label: "Thinning", min: 0.1, max: 1.5, step: 0.05, initial: 0.35, unit: "u" },
    ],
    build: (c, [radius, tolerance]) =>
      polylineD(
        c.source.map((s) => simplifySubpath(gaussian(s, radius), tolerance)),
      ),
  },
  {
    id: "smooth-curve",
    name: "Smoothed original, curved",
    blurb:
      "The same smoothing and thinning, then a Catmull-Rom curve through what's left. What ships now; starts at its settings (in scripts/smooth-contours.mjs).",
    params: [
      { label: "Smoothing", min: 1, max: 8, step: 1, initial: 4, unit: "pts" },
      { label: "Thinning", min: 0.1, max: 1.5, step: 0.05, initial: 1.1, unit: "u" },
      { label: "Tension", min: 0, max: 1, step: 0.05, initial: 1 },
    ],
    build: (c, [radius, tolerance, tension]) =>
      catmullRomD(
        c.source.map((s) => simplifySubpath(gaussian(s, radius), tolerance)),
        0.5,
        tension,
      ),
  },
]

const methodById = (id: string) => METHODS.find((m) => m.id === id)!

/** The two the comparison can be measured against. */
const BASELINES = {
  before: "Before (straight)",
  today: "Today",
  source: "TopoStack original",
} as const
type BaselineId = keyof typeof BASELINES

/** Drawn under the compared method when overlaid. */
const OVERLAY_STROKE = "#E8836B"

type Params = Record<string, number[]>
const INITIAL_PARAMS: Params = Object.fromEntries(
  METHODS.map((m) => [m.id, m.params?.map((p) => p.initial) ?? []]),
)

type Built = { d: string; strokeWidth: number }[]

function useBuilt(method: Method, data: Loaded, params: number[]) {
  return useMemo<Built>(
    () =>
      data.contours.map((c) => ({
        d: method.build(c, params),
        strokeWidth: c.strokeWidth,
      })),
    [data, method, params],
  )
}

async function gzipSize(text: string) {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("gzip"))
  return (await new Response(stream).arrayBuffer()).byteLength
}

/** Median ms to stroke the whole map on a canvas at site scale, as the pulse does. */
function drawCost(paths: Built) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1500
  const ctx = canvas.getContext("2d")
  if (!ctx) return 0
  const shapes = paths.map((p) => ({ path: new Path2D(p.d), width: p.strokeWidth }))
  ctx.setTransform(1.5, 0, 0, 1.5, 0, 0)
  ctx.strokeStyle = STROKE
  ctx.lineJoin = ctx.lineCap = "round"
  const runs: number[] = []
  for (let i = 0; i < 7; i++) {
    ctx.clearRect(0, 0, 1000, 1000)
    const start = performance.now()
    for (const s of shapes) {
      ctx.lineWidth = s.width
      ctx.stroke(s.path)
    }
    // Reading a pixel waits for the drawing to finish.
    ctx.getImageData(0, 0, 1, 1)
    runs.push(performance.now() - start)
  }
  return runs.sort((a, b) => a - b)[3]
}

/** Where each segment ends: the points a path passes through. */
function anchors(d: string, box: Box) {
  const out: [number, number][] = []
  for (const m of d.matchAll(/[MLCQ]([^MLCQZ]+)/g)) {
    const nums = m[1].trim().split(/[\s,]+/).map(Number)
    const x = nums.at(-2)!
    const y = nums.at(-1)!
    if (x >= box.x && x <= box.x + box.span && y >= box.y && y <= box.y + box.span)
      out.push([x, y])
  }
  return out
}

type Box = { x: number; y: number; span: number }

/** The view's square of the map, centred on the summit but kept on the map. */
function viewBox(summit: { x: number; y: number }, view: ViewId): Box {
  const { span } = VIEWS[view]
  return {
    x: Math.min(Math.max(summit.x - span / 2, 0), 1000 - span),
    y: Math.min(Math.max(summit.y - span / 2, 0), 1000 - span),
    span,
  }
}

type Display = {
  box: Box
  look: LookId
  showPoints: boolean
  ground: string
  opacity: { rest: number; peak: number }
}

/**
 * Stroke width in map units, times `--stroke-scale`: 1 everywhere except the
 * full-screen view, which can hold lines at their on-screen width as it zooms.
 */
const strokeStyle = (width: number) =>
  ({ strokeWidth: `calc(${width}px * var(--stroke-scale, 1))` }) as React.CSSProperties

function MapPanel({
  built,
  under,
  display: { box, look, showPoints, ground, opacity },
}: {
  built: Built
  /** Drawn first, in a contrasting colour, to show where the lines moved. */
  under?: Built
  display: Display
}) {
  const strokeOpacity =
    look === "site" ? opacity.rest : look === "peak" ? opacity.peak : 0.9
  const dots =
    showPoints && box.span < 1000 ? built.flatMap((p) => anchors(p.d, box)) : []

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.span} ${box.span}`}
      className="aspect-square w-full rounded-sm ring-1 ring-olive/50"
      style={{ background: ground }}
      fill="none"
    >
      {under?.map((p, i) => (
        <path
          key={`u${i}`}
          d={p.d}
          stroke={OVERLAY_STROKE}
          style={strokeStyle(p.strokeWidth)}
          strokeOpacity={0.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {built.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={STROKE}
          style={strokeStyle(p.strokeWidth)}
          strokeOpacity={under ? Math.max(strokeOpacity, 0.6) : strokeOpacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {dots.map(([x, y], i) => (
        <circle
          key={`p${i}`}
          cx={x}
          cy={y}
          // Shrinks as the full-screen view zooms in, so points stay dots.
          style={{ r: `calc(${box.span / 320}px / var(--zoom, 1))` } as React.CSSProperties}
          fill="#FAFDF4"
          fillOpacity={0.7}
        />
      ))}
    </svg>
  )
}

type StatsValue = { bytes: number; gzip: number; segments: number; ms: number }

function useStats(built: Built) {
  const [stats, setStats] = useState<StatsValue | null>(null)
  useEffect(() => {
    let cancelled = false
    setStats(null)
    // Settles while a slider is dragged before measuring.
    const timer = setTimeout(async () => {
      const all = built.map((p) => p.d).join("")
      const gzip = await gzipSize(all)
      const ms = drawCost(built)
      if (!cancelled)
        setStats({ bytes: all.length, gzip, segments: countSegments(all), ms })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [built])
  return stats
}

function Stats({ stats, against }: { stats: StatsValue | null; against?: StatsValue | null }) {
  const change = (now: number, before?: number) => {
    if (!before) return null
    const pct = Math.round(((now - before) / before) * 100)
    return pct === 0 ? "same" : `${pct > 0 ? "+" : ""}${pct}%`
  }
  const rows: [string, string | null, string | null][] = stats
    ? [
      ["Size", `${(stats.bytes / 1024).toFixed(0)} KB`, change(stats.bytes, against?.bytes)],
      ["Gzipped", `${(stats.gzip / 1024).toFixed(0)} KB`, change(stats.gzip, against?.gzip)],
      ["Segments", stats.segments.toLocaleString(), change(stats.segments, against?.segments)],
      ["Draw", `${stats.ms.toFixed(1)} ms`, change(stats.ms, against?.ms)],
    ]
    : ["Size", "Gzipped", "Segments", "Draw"].map((l) => [l, null, null])

  return (
    <dl className="grid grid-cols-4 gap-2 text-xs">
      {rows.map(([label, value, delta]) => (
        <div key={label}>
          <dt className="tracking-wider text-sage/70 uppercase">{label}</dt>
          <dd className="mt-0.5 text-cream tabular-nums">
            {value ?? "…"}
            {delta && <span className="ml-1.5 text-cream/50">{delta}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Sliders({
  method,
  values,
  onChange,
}: {
  method: Method
  values: number[]
  onChange: (values: number[]) => void
}) {
  if (!method.params?.length)
    return <p className="text-xs text-cream/50">Nothing to adjust.</p>
  return (
    <div className="flex flex-col gap-2">
      {method.params.map((p, i) => (
        <label key={p.label} className="flex items-center gap-3 text-xs">
          <span className="w-20 tracking-wider text-sage/80 uppercase">{p.label}</span>
          <input
            type="range"
            min={p.min}
            max={p.max}
            step={p.step}
            value={values[i]}
            onChange={(e) =>
              onChange(values.map((v, j) => (j === i ? Number(e.target.value) : v)))
            }
            className="flex-1 accent-sage"
          />
          <span className="w-14 text-right text-cream tabular-nums">
            {values[i]}
            {p.unit ? ` ${p.unit}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onChange(values.map((v, j) => (j === i ? p.initial : v)))}
            disabled={values[i] === p.initial}
            className="text-cream/50 hover:text-cream disabled:invisible"
            aria-label={`Reset ${p.label}`}
          >
            ↺
          </button>
        </label>
      ))}
    </div>
  )
}

/** What a full-screen view can show; more than one can be flipped between. */
type ZoomLayer = { label: string; built: Built; under?: Built }
type ZoomRequest = { title: string; layers: ZoomLayer[]; initial: number }

/** A map panel with a button to open it full screen. */
function Expandable({
  onExpand,
  children,
}: {
  onExpand: () => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={onExpand}
        aria-label="Open full screen"
        title="Open full screen"
        className="absolute top-2 right-2 rounded-sm border border-cream/20 bg-ink/80 px-2 py-1 text-sm text-cream/80 hover:border-cream/50 hover:text-cream"
      >
        ⤢
      </button>
    </div>
  )
}

function ZoomButtons() {
  const { zoomIn, zoomOut, resetTransform } = useControls()
  const button =
    "rounded-sm border border-cream/20 px-3 py-1.5 text-sm text-cream/80 hover:border-cream/50 hover:text-cream"
  return (
    <div className="flex gap-2">
      <button type="button" className={button} onClick={() => zoomOut(0.5)} aria-label="Zoom out">
        −
      </button>
      <button type="button" className={button} onClick={() => zoomIn(0.5)} aria-label="Zoom in">
        +
      </button>
      <button type="button" className={button} onClick={() => resetTransform()}>
        Reset
      </button>
    </div>
  )
}

/**
 * One map full screen, to pan and zoom (wheel, pinch, drag, double-click).
 * With several layers, buttons, the number keys or Space flip between them
 * in place, so a change shows up as the lines moving.
 */
function ZoomModal({
  request,
  display,
  onClose,
}: {
  request: ZoomRequest
  display: Display
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(request.initial)
  const [hairlines, setHairlines] = useState(true)
  const scale = useRef(1)
  const hairlinesRef = useRef(hairlines)
  hairlinesRef.current = hairlines
  const { layers } = request
  const layer = layers[index]

  useEffect(() => {
    stageRef.current?.style.setProperty(
      "--stroke-scale",
      String(hairlines ? 1 / scale.current : 1),
    )
  }, [hairlines])

  // No close() on cleanup: it fires `close`, which would unmount the modal as
  // soon as StrictMode re-runs this effect. Unmounting dismisses it anyway.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    if (layers.length < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault()
        setIndex((i) => (i + 1) % layers.length)
      }
      const n = Number(e.key)
      if (n >= 1 && n <= layers.length) setIndex(n - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [layers.length])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-ink p-0 text-cream backdrop:bg-black/80"
    >
      <TransformWrapper
        minScale={1}
        maxScale={40}
        centerOnInit
        wheel={{ step: 0.008 }}
        doubleClick={{ step: 0.7 }}
        onTransform={(_, state) => {
          scale.current = state.scale
          const stage = stageRef.current
          stage?.style.setProperty("--zoom", String(state.scale))
          stage?.style.setProperty(
            "--stroke-scale",
            String(hairlinesRef.current ? 1 / state.scale : 1),
          )
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-olive/40 px-6 py-4">
            <h2 className="font-display text-xl">{request.title}</h2>
            {layers.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {layers.map((l, i) => (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-pressed={i === index}
                    className={`rounded-sm border px-3 py-1.5 text-sm ${i === index
                        ? "border-sage bg-sage/15 text-cream"
                        : "border-cream/20 text-cream/70 hover:border-cream/40"
                      }`}
                  >
                    <span className="mr-1.5 text-cream/40">{i + 1}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
            <ZoomButtons />
            <label className="flex items-center gap-2 text-sm text-cream/80">
              <input
                type="checkbox"
                checked={hairlines}
                onChange={(e) => setHairlines(e.target.checked)}
                className="accent-sage"
              />
              Hairlines
            </label>
            <p className="text-xs text-cream/50">
              Scroll or pinch to zoom, drag to pan, double-click to zoom in
              {layers.length > 1 ? "; Space or 1-3 to flip" : ""}. Hairlines
              keep lines thin as you zoom; off, they scale like the map.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-sm border border-cream/20 px-3 py-1.5 text-sm text-cream/80 hover:border-cream/50 hover:text-cream"
            >
              Close (Esc)
            </button>
          </div>
          <div ref={stageRef} className="min-h-0 flex-1">
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "min(100vw, 100dvh - 5rem)" }}
            >
              <MapPanel built={layer.built} under={layer.under} display={display} />
            </TransformComponent>
          </div>
        </div>
      </TransformWrapper>
    </dialog>
  )
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Record<T, string>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="mr-1 text-xs tracking-wider text-sage/80 uppercase">{label}</span>
      {(Object.entries(options) as [T, string][]).map(([id, text]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={`rounded-sm border px-3 py-1.5 text-sm ${value === id
              ? "border-sage bg-sage/15 text-cream"
              : "border-cream/20 text-cream/70 hover:border-cream/40"
            }`}
        >
          {text}
        </button>
      ))}
    </fieldset>
  )
}

function Panel({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="font-display text-xl text-cream">{title}</h3>
      {children}
    </div>
  )
}

function Compare({
  data,
  display,
  params,
  setParams,
  onZoom,
}: {
  data: Loaded
  display: Display
  params: Params
  setParams: (id: string, values: number[]) => void
  onZoom: (request: ZoomRequest) => void
}) {
  const [methodId, setMethodId] = useState("smooth-curve")
  const [baselineId, setBaselineId] = useState<BaselineId>("before")
  const [overlay, setOverlay] = useState(false)
  const method = methodById(methodId)
  const baseline = methodById(baselineId)
  const baselineBuilt = useBuilt(baseline, data, params[baselineId])
  const built = useBuilt(method, data, params[methodId])
  const baselineStats = useStats(baselineBuilt)
  const stats = useStats(built)
  // Flipping between these full screen keeps the zoom, so changes stand out.
  const zoom = (initial: number) =>
    onZoom({
      title: `${method.name} vs ${baseline.name.toLowerCase()}`,
      initial,
      layers: [
        { label: baseline.name, built: baselineBuilt },
        { label: method.name, built },
        { label: "Overlaid", built, under: baselineBuilt },
      ],
    })
  const candidates = Object.fromEntries(
    METHODS.filter((m) => !(m.id in BASELINES)).map((m) => [m.id, m.name]),
  ) as Record<string, string>

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-cream">Compare</h2>
      <div className="mt-4 flex flex-col gap-3">
        <Choice label="Method" options={candidates} value={methodId} onChange={setMethodId} />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Choice label="Against" options={BASELINES} value={baselineId} onChange={setBaselineId} />
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
              className="accent-sage"
            />
            Overlay {BASELINES[baselineId].toLowerCase()} on the right
            <span
              className="ml-1 inline-block h-0.5 w-5"
              style={{ background: OVERLAY_STROKE }}
              aria-hidden
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <Panel title={baseline.name}>
          <Expandable onExpand={() => zoom(0)}>
            <MapPanel built={baselineBuilt} display={display} />
          </Expandable>
          <Stats stats={baselineStats} />
        </Panel>
        <Panel title={method.name}>
          <Expandable onExpand={() => zoom(overlay ? 2 : 1)}>
            <MapPanel
              built={built}
              under={overlay ? baselineBuilt : undefined}
              display={display}
            />
          </Expandable>
          <Stats stats={stats} against={baselineStats} />
          <Sliders
            method={method}
            values={params[methodId]}
            onChange={(values) => setParams(methodId, values)}
          />
          <p className="text-sm leading-snug text-cream/65">{method.blurb}</p>
        </Panel>
      </div>
    </section>
  )
}

function Card({
  method,
  data,
  display,
  values,
  onChange,
  onZoom,
}: {
  method: Method
  data: Loaded
  display: Display
  values: number[]
  onChange: (values: number[]) => void
  onZoom: (request: ZoomRequest) => void
}) {
  const built = useBuilt(method, data, values)
  const stats = useStats(built)
  return (
    <section className="flex w-full max-w-[480px] flex-col gap-3">
      <header>
        <h3 className="font-display text-xl text-cream">{method.name}</h3>
        <p className="mt-1 min-h-[3.75rem] text-sm leading-snug text-cream/65">
          {method.blurb}
        </p>
      </header>
      <Expandable
        onExpand={() =>
          onZoom({ title: method.name, initial: 0, layers: [{ label: method.name, built }] })
        }
      >
        <MapPanel built={built} display={display} />
      </Expandable>
      <Stats stats={stats} />
      {method.params && <Sliders method={method} values={values} onChange={onChange} />}
    </section>
  )
}

function ContourSmoothing() {
  const [mapId, setMapId] = useState<MapId>("hawksbill")
  const [view, setView] = useState<ViewId>("summit")
  const [look, setLook] = useState<LookId>("lines")
  const [showPoints, setShowPoints] = useState(false)
  const [params, setAllParams] = useState<Params>(INITIAL_PARAMS)
  const [data, setData] = useState<Loaded | null>(null)
  const [zoom, setZoom] = useState<ZoomRequest | null>(null)
  const map = MAPS.find((m) => m.id === mapId)!

  useEffect(() => {
    let cancelled = false
    setData(null)
    loadMap(mapId).then((loaded) => !cancelled && setData(loaded))
    return () => {
      cancelled = true
    }
  }, [mapId])

  const setParams = (id: string, values: number[]) =>
    setAllParams((prev) => ({ ...prev, [id]: values }))

  const display: Display | null = data && {
    box: viewBox(data.summit, view),
    look,
    showPoints,
    ground: map.ground,
    opacity: map.opacity,
  }

  return (
    <main className="min-h-full bg-ink px-6 py-12 text-cream">
      <h1 className="font-display text-3xl">Contour smoothing</h1>
      <p className="mt-2 max-w-3xl text-sm text-cream/70">
        Tune one method against the original in <em>Compare</em>, or see them
        all below; settings are shared between the two. <em>Size</em> and{" "}
        <em>Gzipped</em> are the map's path data (both files) as it would
        ship; <em>Draw</em> is how long this browser takes to stroke the whole
        map on a canvas at site scale, which the pulse does for the tiers
        mid-pulse. Map units: the map is 1000 across, drawn about 1.5px per
        unit on the site.
      </p>

      <div className="sticky top-0 z-10 -mx-6 mt-8 flex flex-col gap-3 border-b border-olive/40 bg-ink/95 px-6 py-4 backdrop-blur">
        <Choice
          label="Map"
          options={
            Object.fromEntries(
              MAPS.map((m) => [m.id, `${m.name} (${m.section})`]),
            ) as Record<MapId, string>
          }
          value={mapId}
          onChange={setMapId}
        />
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Choice
            label="View"
            options={
              Object.fromEntries(
                Object.entries(VIEWS).map(([k, v]) => [k, v.label]),
              ) as Record<ViewId, string>
            }
            value={view}
            onChange={setView}
          />
          <Choice label="Look" options={LOOKS} value={look} onChange={setLook} />
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              checked={showPoints}
              onChange={(e) => setShowPoints(e.target.checked)}
              className="accent-sage"
            />
            Show points
          </label>
        </div>
      </div>

      {data && display ? (
        <>
          <Compare
            data={data}
            display={display}
            params={params}
            setParams={setParams}
            onZoom={setZoom}
          />

          <h2 className="mt-16 font-display text-2xl text-cream">All methods</h2>
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-10">
            {METHODS.map((m) => (
              <Card
                key={m.id}
                method={m}
                data={data}
                display={display}
                values={params[m.id]}
                onChange={(values) => setParams(m.id, values)}
                onZoom={setZoom}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-10 text-sm text-cream/60">Loading {map.name}…</p>
      )}

      {zoom && display && (
        <ZoomModal request={zoom} display={display} onClose={() => setZoom(null)} />
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ContourSmoothing />
  </React.StrictMode>,
)
