/**
 * Dev-only page (/dev/skyline.html, not part of the build): Skyline Drive at
 * each resolution in `src/assets/skyline-drive/`, at the size the Work
 * section draws it and zoomed in on its native frame.
 */
import React from "react"
import ReactDOM from "react-dom/client"
import {
  guidedTrace,
  placeGuidedTrace,
  polylineD,
} from "@/utils/tracePath"
import { TRACE_STROKE } from "@/components/TopoTrace"
import { HAWKSBILL_MAP } from "@/data/hawksbillMap"
import "../index.css"

const SOURCES = import.meta.glob<string>("../assets/skyline-drive/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
})

const VARIANTS = Object.entries(SOURCES)
  .map(([path, raw]) => ({
    points: Number(path.match(/(\d+)\.svg$/)?.[1]),
    bytes: new Blob([raw]).size,
    trace: guidedTrace(raw, path),
  }))
  .sort((a, b) => a.points - b.points)

/** Roughly the Work section's height on a 1440px-wide screen. */
const SECTION_HEIGHT = 1300
const COLUMN = 120
/** A twisty stretch of the native 900×1472 frame. */
const ZOOM = { x: 400, y: 640, width: 150, height: 240, scale: 2 }

function Variant({ points, bytes, trace }: (typeof VARIANTS)[number]) {
  const placed = placeGuidedTrace(
    trace,
    COLUMN / 2,
    SECTION_HEIGHT,
    HAWKSBILL_MAP.roadWander,
  )
  const nativeD = polylineD(trace.points)

  return (
    <section className="flex flex-col items-center gap-4">
      <header className="text-center">
        <h2 className="font-display text-2xl text-cream">
          {points.toLocaleString()} pts
        </h2>
        <p className="text-xs tracking-wider text-sage/80 uppercase">
          {(bytes / 1024).toFixed(1)} KB
        </p>
      </header>

      <svg
        width={ZOOM.width * ZOOM.scale}
        height={ZOOM.height * ZOOM.scale}
        viewBox={`${ZOOM.x} ${ZOOM.y} ${ZOOM.width} ${ZOOM.height}`}
        className="rounded-sm bg-band ring-1 ring-olive/50"
        fill="none"
      >
        <path
          d={nativeD}
          stroke={TRACE_STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        {trace.points.length <= 2500 &&
          trace.points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={trace.points.length > 500 ? 0.45 : 0.9}
              fill="#FAFDF4"
            />
          ))}
      </svg>

      <svg
        width={COLUMN}
        height={SECTION_HEIGHT}
        viewBox={`0 0 ${COLUMN} ${SECTION_HEIGHT}`}
        className="ring-1 ring-olive/30"
        fill="none"
      >
        <path
          d={placed.guideD}
          stroke={TRACE_STROKE}
          strokeOpacity={0.25}
          strokeDasharray="3 4"
        />
        <path
          d={polylineD(placed.points)}
          stroke={TRACE_STROKE}
          strokeOpacity={0.65}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </section>
  )
}

function SkylineResolutions() {
  return (
    <main className="min-h-full bg-ink px-6 py-12 text-cream">
      <h1 className="font-display text-3xl">Skyline Drive resolutions</h1>
      <p className="mt-2 max-w-3xl text-sm text-cream/70">
        Top: a stretch of the native frame at {ZOOM.scale}×, dots marking the
        kept points. Bottom: the road as the Work section draws it, at{" "}
        {SECTION_HEIGHT}px tall and {HAWKSBILL_MAP.roadWander}px across (dashed:
        the name's guide). The site imports the version named in{" "}
        <code>src/data/hawksbillMap.ts</code>.
      </p>
      <div className="mt-10 flex flex-wrap gap-10">
        {VARIANTS.map((v) => (
          <Variant key={v.points} {...v} />
        ))}
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SkylineResolutions />
  </React.StrictMode>,
)
