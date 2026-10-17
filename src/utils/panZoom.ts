import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react"

/** How far in a photo can zoom. */
export const MAX_ZOOM = 4
/** The zoom a double tap goes to. */
const TAP_ZOOM = 2.5
/** Px a pointer can drift and still be a tap. */
const TAP_SLOP = 8
/** Ms between the taps of a double tap. */
const DOUBLE_TAP_MS = 300
/** Px a swipe has to travel sideways to count. */
const SWIPE = 50

type Pt = { x: number; y: number }
type View = { scale: number; x: number; y: number }

const FIT: View = { scale: 1, x: 0, y: 0 }

const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(1, s))
const clamp = (v: number, max: number) => Math.min(max, Math.max(-max, v))
const distance = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
const midpoint = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const at = (e: { clientX: number; clientY: number }) => ({ x: e.clientX, y: e.clientY })

/**
 * Zoom and pan for an element (`target`) centred in another (`frame`): pinch,
 * wheel, double tap or click, and drag once zoomed, never leaving a gap at
 * the frame's edges. A one-finger swipe at fit size goes to `onSwipe`.
 *
 * Spread `handlers` on the frame. Moves write the target's transform
 * directly; only the scale goes through React.
 */
export function usePanZoom(
  frame: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
  onSwipe: (step: 1 | -1) => void,
) {
  const [scale, setScale] = useState(1)
  const swipe = useRef(onSwipe)
  useEffect(() => {
    swipe.current = onSwipe
  })

  const zoom = useMemo(() => {
    let view = FIT
    const pointers = new Map<number, Pt>()
    let gesture: { from: View; at: Pt; moved: boolean; multi: boolean } | null = null
    let pinch: { from: View; span: number; mid: Pt } | null = null
    let lastTap: { time: number; at: Pt } | null = null
    /** When the last drag or pinch ended, so its trailing click is ignored. */
    let gestureEnd = -Infinity

    /** A client point relative to the frame's centre. */
    const local = (p: Pt): Pt => {
      const r = frame.current?.getBoundingClientRect()
      return r ? { x: p.x - r.left - r.width / 2, y: p.y - r.top - r.height / 2 } : p
    }

    const set = (next: View, animate = false) => {
      const el = target.current
      const box = frame.current
      if (!el || !box) return
      const s = clampScale(next.scale)
      // The target's layout box is centred in the frame, so it can travel
      // half its overhang either way.
      const maxX = Math.max(0, (el.offsetWidth * s - box.clientWidth) / 2)
      const maxY = Math.max(0, (el.offsetHeight * s - box.clientHeight) / 2)
      view = { scale: s, x: clamp(next.x, maxX), y: clamp(next.y, maxY) }
      el.style.transition = animate ? "transform 250ms ease" : "none"
      el.style.transform =
        s === 1 ? "" : `translate(${view.x}px, ${view.y}px) scale(${s})`
      setScale(s)
    }

    /** To `scale`, keeping the frame-centred point `anchor` where it is. */
    const zoomTo = (scale: number, anchor: Pt = { x: 0, y: 0 }, animate = false) => {
      const k = clampScale(scale) / view.scale
      set(
        {
          scale,
          x: anchor.x - (anchor.x - view.x) * k,
          y: anchor.y - (anchor.y - view.y) * k,
        },
        animate,
      )
    }

    const capture = (id: number) => {
      try {
        frame.current?.setPointerCapture(id)
      } catch {
        // Already lifted.
      }
    }

    const end = (e: ReactPointerEvent, cancelled: boolean) => {
      if (!pointers.delete(e.pointerId) || !gesture) return
      if (pointers.size === 1) {
        // Down to one finger: carry on as a pan from here.
        pinch = null
        const [rest] = pointers.values()
        gesture.from = view
        gesture.at = rest
        return
      }
      if (pointers.size) return

      const g = gesture
      gesture = pinch = null
      delete frame.current?.dataset.panning
      if (cancelled) return

      if (g.moved) {
        gestureEnd = e.timeStamp
        const dx = e.clientX - g.at.x
        const dy = e.clientY - g.at.y
        if (
          !g.multi &&
          g.from.scale === 1 &&
          e.pointerType !== "mouse" &&
          Math.abs(dx) > SWIPE &&
          Math.abs(dx) > Math.abs(dy)
        )
          swipe.current(dx < 0 ? 1 : -1)
        return
      }

      // A tap: two on the photo in quick succession zoom in, or back out.
      if (!target.current?.contains(e.target as Node)) {
        lastTap = null
        return
      }
      const p = at(e)
      if (lastTap && e.timeStamp - lastTap.time < DOUBLE_TAP_MS && distance(lastTap.at, p) < 30) {
        lastTap = null
        if (view.scale > 1) set(FIT, true)
        else zoomTo(TAP_ZOOM, local(p), true)
      } else lastTap = { time: e.timeStamp, at: p }
    }

    const handlers = {
      onPointerDown(e: ReactPointerEvent) {
        if (e.pointerType === "mouse" && e.button !== 0) return
        pointers.set(e.pointerId, at(e))
        if (pointers.size === 1) {
          gesture = { from: view, at: at(e), moved: false, multi: false }
        } else if (pointers.size === 2 && gesture) {
          gesture.moved = gesture.multi = true
          const [a, b] = pointers.values()
          pinch = { from: view, span: distance(a, b) || 1, mid: local(midpoint(a, b)) }
          for (const id of pointers.keys()) capture(id)
        }
      },
      onPointerMove(e: ReactPointerEvent) {
        if (!pointers.has(e.pointerId) || !gesture) return
        pointers.set(e.pointerId, at(e))

        if (pinch) {
          const [a, b] = pointers.values()
          const s = clampScale((pinch.from.scale * distance(a, b)) / pinch.span)
          const k = s / pinch.from.scale
          const mid = local(midpoint(a, b))
          set({
            scale: s,
            x: mid.x - (pinch.mid.x - pinch.from.x) * k,
            y: mid.y - (pinch.mid.y - pinch.from.y) * k,
          })
          return
        }

        const dx = e.clientX - gesture.at.x
        const dy = e.clientY - gesture.at.y
        if (!gesture.moved) {
          if (Math.hypot(dx, dy) < TAP_SLOP) return
          gesture.moved = true
          if (gesture.from.scale > 1) {
            capture(e.pointerId)
            if (frame.current) frame.current.dataset.panning = ""
          }
        }
        if (gesture.from.scale > 1)
          set({ scale: view.scale, x: gesture.from.x + dx, y: gesture.from.y + dy })
      },
      onPointerUp: (e: ReactPointerEvent) => end(e, false),
      onPointerCancel: (e: ReactPointerEvent) => end(e, true),
    }

    return {
      handlers,
      local,
      zoomTo,
      scale: () => view.scale,
      /** Zoom by `factor` about the frame's centre. */
      zoomBy: (factor: number) => zoomTo(view.scale * factor, undefined, true),
      panBy: (dx: number, dy: number) =>
        set({ ...view, x: view.x + dx, y: view.y + dy }, true),
      reset: (animate = false) => set(FIT, animate),
      /** Re-fit the view to the frame, e.g. after a resize. */
      refit: () => set(view),
      /** Whether a click is the tail end of a drag or pinch, not a click. */
      isGestureClick: (timeStamp: number) => timeStamp - gestureEnd < 300,
    }
  }, [frame, target])

  useEffect(() => {
    const box = frame.current
    if (!box) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const px = e.deltaY * (e.deltaMode === 1 ? 16 : 1)
      // Trackpad pinches arrive as ctrl+wheel, in much smaller steps.
      const factor = Math.exp(-px * (e.ctrlKey ? 0.01 : 0.0015))
      zoom.zoomTo(zoom.scale() * factor, zoom.local(at(e)))
    }
    box.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("resize", zoom.refit)
    return () => {
      box.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", zoom.refit)
    }
  }, [frame, zoom])

  return { ...zoom, scale }
}
