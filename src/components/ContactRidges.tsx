import { useEffect, useRef, type CSSProperties } from "react"
import { CONTACT_RIDGES } from "@/data/contactRidges"

/**
 * The Blue Ridge along the bottom of the Contact section. Each ridge rises
 * into place at its own rate as the section scrolls up, nearest fastest, and
 * slides in from alternating sides, for a gentle parallax; with reduced
 * motion they just sit in place. Named summits get a tag hanging below them
 * on a dotted trail, travelling with their ridge and fading in as it settles.
 */
export default function ContactRidges() {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = boxRef.current
    const section = box?.closest("section")
    if (!box || !section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    // 0 when the section's top meets the screen's bottom, 1 once its bottom does.
    const render = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const progress = (window.innerHeight - rect.top) / (rect.height || 1)
      box.style.setProperty(
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
  }, [])

  return (
    // True to the frame (1200 × 337) between ~625 and ~1480px wide; wider
    // screens stretch it sideways rather than crop the peaks, and phones let
    // it run off both sides rather than shrink it to a sliver. A size
    // container, so the tags can move in the frame's own proportions.
    <div
      ref={boxRef}
      className="pointer-events-none absolute bottom-0 left-1/2 h-[clamp(11rem,28.1vw,26rem)] w-[max(100%,39rem)] -translate-x-1/2 [container-type:size]"
      aria-hidden
    >
      <svg
        data-testid="contact-ridges"
        className="absolute inset-0 h-full w-full"
        viewBox={CONTACT_RIDGES.viewBox}
        preserveAspectRatio="none"
      >
        {CONTACT_RIDGES.ridges.map(({ d, fill, strokeOpacity, rise, drift }) => (
          <path
            key={d}
            d={d}
            fill={fill}
            stroke="#B6C494"
            strokeOpacity={strokeOpacity}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            style={
              {
                transform: `translate(calc(var(--ridge-rest, 0) * ${drift}px), calc(var(--ridge-rest, 0) * ${rise}px))`,
              } as CSSProperties
            }
          />
        ))}
      </svg>

      {CONTACT_RIDGES.peaks.map(({ name, elevation, x, y, rise, drift }) => {
        const align = x < 35 ? "start" : x > 65 ? "end" : "center"
        return (
          <div
            key={name}
            data-testid="peak-tag"
            // Phones show only the middle of the frame, with room for one tag.
            className={`peak-tag ${align === "center" ? "" : "max-sm:hidden"}`}
            data-align={align}
            style={
              {
                left: `${x}%`,
                top: `${y}%`,
                translate: `calc(var(--ridge-rest, 0) * ${drift}cqw) calc(var(--ridge-rest, 0) * ${rise}cqh)`,
              } as CSSProperties
            }
          >
            <span className="peak-tag-label">
              {name}
              <span className="peak-tag-elevation">{elevation}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
