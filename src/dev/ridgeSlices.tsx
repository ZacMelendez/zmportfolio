/**
 * Dev-only page (/dev/ridges.html, not part of the build): the Contact
 * section's ridges redrawn as stacked terrain cross-sections, one per variant
 * in `design/ridge-slices/` (made by `scripts/ridge-slices.mjs`), at the size
 * and position the section draws them, beside today's four filled ridges.
 * "Gradient + parallax" lights each ridge's crest and fades it into the
 * valley, hazier with distance, and rises the slices into place on scroll
 * like ContactRidges does.
 */
import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import ReactDOM from "react-dom/client"
import { CONTACT_RIDGES } from "@/data/contactRidges"
import { SITE } from "@/data/content"
import Accent from "@/components/Accent"
import { TrailButton } from "@/components/TrailButtons"
import "../index.css"

const SOURCES = import.meta.glob<string>("../../design/ridge-slices/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
})

const VARIANTS = Object.entries(SOURCES)
  .map(([path, raw]) => ({
    name: path.match(/([^/]+)\.svg$/)?.[1] ?? path,
    bytes: new Blob([raw]).size,
    title: raw.match(/<title>([^<]+)/)?.[1] ?? "",
    paths: [...raw.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((m) => m[1]),
  }))
  .sort((a, b) => a.paths.length - b.paths.length)

type Look = "gradient" | "lines" | "lines-tinted"

/** Today's four ridge fills, farthest to nearest, for the tinted look. */
const FILLS = ["#38412A", "#2B3320", "#202718", "#161A0E"]
const mix = (a: string, b: string, t: number) => {
  const c = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16)
  const ch = [0, 1, 2].map((i) =>
    Math.round(c(a, i) + (c(b, i) - c(a, i)) * t)
      .toString(16)
      .padStart(2, "0"),
  )
  return `#${ch.join("")}`
}
const fillAt = (t: number) => {
  const x = t * (FILLS.length - 1)
  const i = Math.min(FILLS.length - 2, Math.floor(x))
  return mix(FILLS[i], FILLS[i + 1], x - i)
}

/** Crest colours, farthest slice (hazy olive) to nearest (near ink). */
const CREST_FAR = "#4E5A38"
const CREST_NEAR = "#1A1F12"

/** ContactRidges' scroll hook: 1 as the section enters, 0 once it's fully up. */
function useRidgeRest(svgRef: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const svg = svgRef.current
    const section = svg?.closest("section")
    if (!svg || !section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0
    const render = () => {
      frame = 0
      const box = section.getBoundingClientRect()
      const progress = (window.innerHeight - box.top) / (box.height || 1)
      svg.style.setProperty(
        "--ridge-rest",
        String(1 - Math.min(1, Math.max(0, progress))),
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    render()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [svgRef])
}

function Ridges({ paths, look }: { paths: string[]; look: Look | "current" }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const id = useId()
  useRidgeRest(svgRef)
  // 0 for the farthest slice, 1 for the nearest.
  const depth = (i: number) => (paths.length > 1 ? i / (paths.length - 1) : 1)
  // Frame units each slice sits lower as the section enters; nearer move more.
  const rise = (t: number) => 8 + 72 * t ** 1.4

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute bottom-0 left-1/2 h-[clamp(11rem,28.1vw,26rem)] w-[max(100%,39rem)] -translate-x-1/2"
      viewBox={CONTACT_RIDGES.viewBox}
      preserveAspectRatio="none"
      aria-hidden
    >
      {look === "gradient" && (
        <defs>
          {paths.map((_, i) => (
            <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mix(CREST_FAR, CREST_NEAR, depth(i))} />
              <stop offset="0.75" stopColor="#11130a" />
            </linearGradient>
          ))}
        </defs>
      )}
      {look === "current"
        ? CONTACT_RIDGES.ridges.map(({ d, fill, rise }) => (
            <path
              key={fill}
              d={d}
              fill={fill}
              style={{
                transform: `translateY(calc(var(--ridge-rest, 0) * ${rise}px))`,
              }}
            />
          ))
        : paths.map((d, i) => {
            const t = depth(i)
            const gradient = look === "gradient"
            return (
              <path
                key={i}
                d={d}
                fill={
                  gradient
                    ? `url(#${id}-${i})`
                    : look === "lines-tinted"
                      ? fillAt(t)
                      : "#11130a"
                }
                stroke="#b6c494"
                strokeOpacity={gradient ? 0.06 + 0.2 * t : 0.12 + 0.45 * t}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={
                  {
                    transform: `translateY(calc(var(--ridge-rest, 0) * ${rise(t)}px))`,
                  } as CSSProperties
                }
              />
            )
          })}
    </svg>
  )
}

function Section({
  label,
  detail,
  children,
}: {
  label: string
  detail: string
  children: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-t border-olive/40 px-6 pt-24 pb-10 md:px-10 md:pt-32 md:pb-12">
      {children}
      <div className="relative mx-auto max-w-6xl text-center">
        <p className="text-xs tracking-wider text-sage/80 uppercase">
          {label} · {detail}
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight font-medium text-cream">
          <Accent text={SITE.sections.contact.heading} />
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-cream/70">
          {SITE.sections.contact.intro}
        </p>
        {/* The real section's button and links, so the ridges sit as low. */}
        <div className="mt-10 flex flex-col items-center gap-6">
          <TrailButton href="#">{SITE.sections.contact.cta}</TrailButton>
          <p className="text-sm text-sage">GitHub · Resume</p>
        </div>
        <p className="mt-[clamp(8rem,20vw,18rem)] text-xs text-cream/40">
          © 2026
        </p>
      </div>
    </section>
  )
}

function App() {
  const [look, setLook] = useState<Look>("gradient")
  return (
    <main className="min-h-dvh bg-ink text-cream">
      <div className="sticky top-0 z-10 flex justify-center gap-3 bg-ink/90 py-3">
        {(["gradient", "lines", "lines-tinted"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLook(l)}
            className={`rounded-sm px-3 py-1 text-xs tracking-wider uppercase ring-1 ${
              look === l ? "text-cream ring-sage" : "text-sage/70 ring-olive/50"
            }`}
          >
            {l === "gradient"
              ? "Gradient + parallax"
              : l === "lines"
                ? "Lines on ink"
                : "Lines on tinted fills"}
          </button>
        ))}
      </div>
      <Section label="Shipped" detail="src/assets/contact-ridges.svg">
        <Ridges paths={[]} look="current" />
      </Section>
      {VARIANTS.map((v) => (
        <Section
          key={v.name}
          label={`${v.paths.length} slices`}
          detail={`${(v.bytes / 1024).toFixed(0)} KB · ${v.title.split(": ")[1] ?? ""}`}
        >
          <Ridges paths={v.paths} look={look} />
        </Section>
      ))}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
