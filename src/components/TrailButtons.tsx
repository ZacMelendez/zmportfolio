import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * The site's one button: an outlined link whose arrow turns into a compass
 * when the pointer enters it. The ring draws in around it and the needle
 * swings from the arrow's heading to point at the cursor, following it until
 * the cursor strays more than `COMPASS_RADIUS` from the button. After that it
 * folds back into an arrow and only re-arms when the pointer enters the button
 * again. Styles live in `index.css` under "Trail button".
 */

type TrailButtonProps = {
  href: string
  children: ReactNode
  external?: boolean
}

/** How far (px) outside the button's edges the compass keeps tracking. */
const COMPASS_RADIUS = 200

/** The arrow's heading, which the needle starts from and returns to. */
const EAST = 90

/** Turn `from` toward `to` the short way round, keeping the angle unwrapped. */
function nearestTurn(from: number, to: number) {
  return from + ((((to - from) % 360) + 540) % 360) - 180
}

export function TrailButton({ href, children, external }: TrailButtonProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  // Unwrapped so CSS transitions never spin the long way past 0/360.
  const angleRef = useRef(EAST)
  const [compass, setCompass] = useState(false)

  useEffect(() => {
    if (!compass) return
    const link = linkRef.current
    const icon = iconRef.current
    if (!link || !icon) return

    const setAngle = (deg: number) => {
      angleRef.current = deg
      icon.style.setProperty("--needle-angle", `${deg}deg`)
    }

    const onMove = (e: PointerEvent) => {
      const box = link.getBoundingClientRect()
      const dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right)
      const dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom)
      if (Math.hypot(dx, dy) > COMPASS_RADIUS) {
        setCompass(false)
        return
      }
      const c = icon.getBoundingClientRect()
      const x = e.clientX - (c.left + c.width / 2)
      const y = e.clientY - (c.top + c.height / 2)
      // 0deg is north (needle's resting orientation), clockwise positive.
      const bearing = (Math.atan2(x, -y) * 180) / Math.PI
      setAngle(nearestTurn(angleRef.current, bearing))
    }

    window.addEventListener("pointermove", onMove)
    return () => {
      window.removeEventListener("pointermove", onMove)
      setAngle(nearestTurn(angleRef.current, EAST))
    }
  }, [compass])

  return (
    <a
      ref={linkRef}
      className={compass ? "trail-btn is-compass" : "trail-btn"}
      href={href}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setCompass(true)
      }}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      <span>{children}</span>
      <span ref={iconRef} className="trail-btn-icon" aria-hidden>
        <svg viewBox="0 0 24 24">
          <path className="trail-btn-arrow" d="M5 12h13M14 8l4 4-4 4" />
          <circle className="trail-btn-ring" cx="12" cy="12" r="10" />
        </svg>
        <span className="trail-btn-needle" />
      </span>
    </a>
  )
}
