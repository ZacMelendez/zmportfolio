import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type AllHTMLAttributes,
  type ReactNode,
} from "react"

/**
 * Scroll-in reveals. Styles live in `index.css` under "Reveal".
 *
 * - up: fades in while rising 40px.
 * - fade: fades in.
 * - mask: the content slides up from behind the element's own edge, like a
 *   line of type being set. The element's box never moves.
 * - clip: the element's children wipe up from the bottom edge while settling
 *   from a slight zoom (photos). The element's box never moves.
 *
 * The maps measure `data-map-*` elements with getBoundingClientRect, which
 * includes transforms, so put those attributes on mask/clip reveals or on
 * elements outside a reveal — never on an `up` reveal.
 */

type Variant = "up" | "fade" | "mask" | "clip"

const callbacks = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | null = null

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        callbacks.get(entry.target)?.()
        callbacks.delete(entry.target)
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  )
  return observer
}

/** True once the element has scrolled into view; stays true. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = getObserver()
    callbacks.set(el, () => setVisible(true))
    io.observe(el)
    return () => {
      callbacks.delete(el)
      io.unobserve(el)
    }
  }, [])

  return [ref, visible] as const
}

type RevealProps = {
  as?: ElementType
  variant?: Variant
  /** Milliseconds to wait after the element comes into view. */
  delay?: number
  /**
   * Animate in as soon as the page paints, in CSS alone, rather than when
   * scrolled into view: for the first screen, so the prerendered text shows
   * without waiting for the script to load.
   */
  appear?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
} & Omit<AllHTMLAttributes<HTMLElement>, "as" | "className" | "style" | "children">

export default function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  appear = false,
  className = "",
  style,
  children,
  ...rest
}: RevealProps) {
  const [ref, visible] = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${appear ? "reveal-appear" : visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms`, ...style } as CSSProperties}
      {...rest}
    >
      {variant === "mask" ? (
        <span className="reveal-mask-inner">{children}</span>
      ) : (
        children
      )}
    </Tag>
  )
}
