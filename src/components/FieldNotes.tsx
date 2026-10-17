import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { createPortal } from "react-dom"
import {
  FIELD_NOTES,
  type FieldNoteId,
  type FieldNotePhoto,
  type FieldNoteTrip,
} from "@/data/fieldNotes"
import { useHydrated } from "@/utils/hydration"
import { imageProps, placeholder } from "@/utils/image"
import { MAX_ZOOM, usePanZoom } from "@/utils/panZoom"
import type { Point } from "@/utils/tracePath"

/**
 * Centre the pin's rust ink on the pointer, with a radius that just reaches
 * the pin's far corner from there.
 */
function placeInk(e: PointerEvent<HTMLElement>) {
  const pin = e.currentTarget
  const box = pin.getBoundingClientRect()
  const x = Math.min(Math.max(e.clientX - box.left, 0), box.width)
  const y = Math.min(Math.max(e.clientY - box.top, 0), box.height)
  pin.style.setProperty("--ink-at", `${x}px ${y}px`)
  return Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 2
}

/** Grow the ink out from where the pointer came in. */
function inkFrom(e: PointerEvent<HTMLElement>) {
  const pin = e.currentTarget
  pin.classList.add("is-snapping")
  placeInk(e)
  pin.style.setProperty("--ink-r", "0px")
  // Commit the empty circle before transitions come back on.
  void pin.offsetWidth
  pin.classList.remove("is-snapping")
  pin.style.setProperty("--ink-r", `${placeInk(e)}px`)
}

/** Shrink the ink down to where the pointer left. */
function inkTo(e: PointerEvent<HTMLElement>) {
  const pin = e.currentTarget
  // Re-centre while still covering the whole pin, so the move doesn't show.
  pin.classList.add("is-snapping")
  pin.style.setProperty("--ink-r", `${placeInk(e)}px`)
  void pin.offsetWidth
  pin.classList.remove("is-snapping")
  pin.style.setProperty("--ink-r", "0px")
}

/**
 * A topo map's way into its field notes: a small pin that opens the notes in a
 * drawer. Positioned in the section's own pixels, so render it in the
 * section, outside the map's `aria-hidden`, pointer-less layers.
 */
export default function FieldNotes({
  id,
  pin,
}: {
  id: FieldNoteId
  /**
   * The pin, its top-right corner at `at` (its centre with `centered`), or
   * placed by `className`.
   */
  pin: { at?: Point; centered?: boolean; className?: string; testId: string }
}) {
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const notes = FIELD_NOTES[id]

  return (
    <>
      <button
        type="button"
        data-testid={pin.testId}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") inkFrom(e)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") inkTo(e)
        }}
        className={`field-notes-pin absolute z-20 ${pin.className ?? ""}`}
        style={
          pin.at && {
            left: pin.at.x,
            top: pin.at.y,
            translate: pin.centered ? "-50% -50%" : "-100% 0",
          }
        }
      >
        <span className="field-notes-badge" aria-hidden>
          i
        </span>
        <span className="sr-only">Field notes: </span>
        {notes.name}
        <span className="field-notes-pin-ink" aria-hidden>
          <span className="field-notes-badge">i</span>
          {notes.name}
        </span>
      </button>

      {/* In the body, clear of the section's own queries and stacking; the
          body only exists once the browser has the page. */}
      {hydrated &&
        createPortal(
          <FieldNotesDrawer id={id} open={open} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  )
}

function FieldNotesDrawer({
  id,
  open,
  onClose,
}: {
  id: FieldNoteId
  open: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const notes = FIELD_NOTES[id]
  const titleId = `field-notes-${id}-title`
  const [tripIndex, setTripIndex] = useState(0)
  const trip = notes.trips[tripIndex]
  const coordinates = trip.coordinates ?? notes.coordinates
  const tripsId = `field-notes-${id}-trips`

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      // Always open on the latest trip.
      setTripIndex(0)
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      data-testid={`field-notes-${id}`}
      aria-labelledby={titleId}
      className="field-notes"
      onClose={onClose}
      // The panel fills the dialog, so a click on the dialog itself is on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="field-notes-panel">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">
              Field notes
            </p>
            <h2
              id={titleId}
              className="mt-3 font-display text-4xl leading-none font-medium text-cream"
            >
              {notes.name}
            </h2>
            <p className="mt-3 text-sm text-cream/65">
              {trip.place ?? notes.region}
              {coordinates && (
                <>
                  <span className="mx-2 text-olive" aria-hidden>
                    ·
                  </span>
                  <span className="tabular-nums">{coordinates}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close field notes"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/20 text-cream/80 hover:border-cream/50 hover:text-cream"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {notes.trips.length > 1 && (
          <TripTabs
            trips={notes.trips}
            index={tripIndex}
            onIndex={setTripIndex}
            panelId={tripsId}
          />
        )}

        <div
          // Keyed so a new trip starts its carousel at the first photo.
          key={tripIndex}
          id={tripsId}
          role={notes.trips.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={
            notes.trips.length > 1 ? `${tripsId}-tab-${tripIndex}` : undefined
          }
          className="field-notes-trip"
        >
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-olive/50 py-5">
            {[
              ...notes.stats,
              ...trip.stats,
              { label: "Hiked", value: trip.date },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sage/80">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-cream">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-display text-xl leading-snug text-sage italic">
            {trip.lede}
          </p>
          <div className="mt-4 space-y-4 leading-relaxed text-cream/75">
            {trip.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {trip.allTrails && <AllTrailsLink href={trip.allTrails} />}

          <div className="mt-8">
            {trip.photos.length ? (
              <PhotoCarousel
                photos={trip.photos}
                label={`${trip.place ?? notes.name} photos, ${trip.date}`}
              />
            ) : (
              <div className="field-notes-photo-empty">Photos coming soon</div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}

/** An outlined link out to the hike on AllTrails, with their mark. */
function AllTrailsLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="field-notes-alltrails"
    >
      {/* AllTrails' mark, from Simple Icons. */}
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M19.441 8.451c-.653-1.247-1.158-1.841-1.813-1.841-.731 0-1.053.387-1.494 1.079-.357.464-.7 1.1-1.273 1.036-.604-.063-.954-1.491-1.41-2.686-.625-1.63-.985-3.322-2.024-3.322-.593 0-1.111.54-1.915 1.747l-8.301 12.73c-.954 1.593-1.753 2.704-.742 3.748 1.187 1.142 3.975-.857 5.883-2.063 1.908-1.205 3.859-2.38 6.615-2.316 3.71.085 5.512 3.808 7.76 4.516 1.526.487 2.926-.074 3.223-1.65.174-.866-.129-1.707-.547-2.604zm-.254 7.467c-.753.56-1.803-.339-2.481-.72-.72-.401-1.94-1.364-4.124-1.332-1.78.021-2.745.687-3.805 1.407-2.3 1.565-4.379 3.384-4.972 2.443-.382-.603.646-1.809 3.063-5.574 1.718-2.676 2.927-4.813 3.785-4.813.948 0 1 .93 1.145 1.883.272 1.518 1.014 2.308 1.978 2.433 1.08.146 2.014-.76 2.756-.751.693.014 1.15 1.018 1.722 2.065.725 1.301 1.482 2.546.933 2.959z" />
      </svg>
      View on AllTrails
      <svg viewBox="0 0 24 24" className="field-notes-alltrails-arrow" fill="none" aria-hidden>
        <path
          d="M8 16L16 8M9 8h7v7"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/**
 * One tab per trip up the mountain, newest first. Arrow keys move between
 * them (and select, as the panels are cheap to swap), Home and End jump to
 * the ends.
 */
function TripTabs({
  trips,
  index,
  onIndex,
  panelId,
}: {
  trips: readonly FieldNoteTrip[]
  index: number
  onIndex: (i: number) => void
  panelId: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  const select = (i: number) => {
    const to = (i + trips.length) % trips.length
    onIndex(to)
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[to]?.focus()
  }

  return (
    <div className="mt-8">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sage/80">
        {trips.length} trips
      </p>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Trips"
        className="field-notes-trips"
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
          if (step) select(index + step)
          else if (e.key === "Home") select(0)
          else if (e.key === "End") select(trips.length - 1)
          else return
          e.preventDefault()
        }}
      >
        {trips.map((trip, i) => (
          <button
            key={trip.date}
            id={`${panelId}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-controls={panelId}
            tabIndex={i === index ? 0 : -1}
            onClick={() => onIndex(i)}
            className="field-notes-trip-tab"
          >
            {trip.place && (
              <span className="field-notes-trip-place">{trip.place}</span>
            )}
            {trip.date}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Photos side by side in a scroll-snapped track: swipe or scroll on touch,
 * arrows and dots otherwise. The track's scroll position is the source of
 * truth, so every way of moving it keeps the counter in step.
 */
function PhotoCarousel({
  photos,
  label,
}: {
  photos: readonly FieldNotePhoto[]
  label: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  /** The photo open full screen, if any. */
  const [zoomed, setZoomed] = useState<number | null>(null)
  const many = photos.length > 1

  const goTo = (i: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current
    if (!track) return
    const to = Math.max(0, Math.min(photos.length - 1, i))
    track.scrollTo({ left: to * track.clientWidth, behavior })
  }

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div
        ref={trackRef}
        className="field-notes-track"
        tabIndex={many ? 0 : undefined}
        onScroll={(e) => {
          const track = e.currentTarget
          setIndex(Math.round(track.scrollLeft / (track.clientWidth || 1)))
        }}
      >
        {photos.map((photo, i) => (
          <figure
            key={photo.path}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${photos.length}`}
            className="field-notes-slide"
          >
            <button
              type="button"
              aria-label={`View photo ${i + 1} full screen`}
              aria-haspopup="dialog"
              onClick={() => setZoomed(i)}
              className="field-notes-zoomable relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-sm bg-ink ring-1 ring-olive/50"
            >
              <img
                {...imageProps(photo.path, {
                  sizes: "(min-width: 640px) 416px, calc(100vw - 48px)",
                  maxWidth: 1280,
                  fit: "contain",
                })}
                alt={photo.alt}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-contain"
              />
              <span className="field-notes-expand" aria-hidden>
                <ExpandIcon />
              </span>
            </button>
            <figcaption className="mt-3">
              <p className="text-sm leading-relaxed text-cream/80">
                {photo.summary}
              </p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sage/80">
                {photo.date}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      {zoomed !== null && (
        <Lightbox
          photos={photos}
          index={zoomed}
          onIndex={setZoomed}
          onClose={() => {
            // Leave the carousel on the photo last seen full screen.
            goTo(zoomed, "instant")
            setZoomed(null)
          }}
        />
      )}

      {many && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {photos.map((photo, i) => (
              <button
                key={photo.path}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                  i === index ? "w-5 bg-rust" : "w-1.5 bg-cream/25 hover:bg-cream/50"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-cream/55" aria-live="polite">
              {index + 1} / {photos.length}
            </span>
            <CarouselArrow
              direction="previous"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            />
            <CarouselArrow
              direction="next"
              disabled={index === photos.length - 1}
              onClick={() => goTo(index + 1)}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`${direction === "next" ? "Next" : "Previous"} photo`}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream/80 hover:border-cream/50 hover:text-cream disabled:pointer-events-none disabled:opacity-30"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${direction === "previous" ? "rotate-180" : ""}`}
        fill="none"
        aria-hidden
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/** Four corners pulling outward: "this opens bigger". */
function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The lightbox photo, sized from its known shape before it loads so the
 * blurred placeholder fills the same box the photo will. Once zoomed it asks
 * for the largest width, so the detail holds up close.
 */
function lightboxProps(path: string, zoomed: boolean) {
  const props = imageProps(path, { sizes: zoomed ? "400vw" : "100vw" })
  const blur = placeholder(path)
  if (!blur) return props
  return {
    ...props,
    style: {
      ...props.style,
      "--photo-ratio": blur.width / blur.height,
      aspectRatio: `${blur.width} / ${blur.height}`,
    } as CSSProperties,
  }
}

/**
 * A photo full screen over everything, its summary and date beneath. Arrow
 * keys, swipes and the side buttons move between photos; pinch, scroll,
 * double tap or the + and − buttons zoom, and a drag pans once zoomed. Esc,
 * the close button or a click off the photo closes it. Mounted only while
 * open.
 */
function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: readonly FieldNotePhoto[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const photo = photos[index]
  const many = photos.length > 1
  const go = (i: number) => onIndex(Math.max(0, Math.min(photos.length - 1, i)))
  const zoom = usePanZoom(frameRef, photoRef, (step) => go(index + step))
  const zoomed = zoom.scale > 1
  /** Whether this photo has been zoomed, so it's fetched at full size. */
  const [sharp, setSharp] = useState(false)
  if (zoomed && !sharp) setSharp(true)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  // Each photo starts at fit size.
  const { reset } = zoom
  useEffect(() => {
    reset()
    setSharp(false)
  }, [index, reset])

  return createPortal(
    <dialog
      ref={ref}
      data-testid="field-notes-lightbox"
      aria-label={photo.alt}
      className="field-notes-lightbox"
      onClose={onClose}
      onKeyDown={(e) => {
        // Zoomed, the arrows look around the photo; otherwise they change it.
        const pan = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
          e.key
        ]
        if (pan && zoomed) zoom.panBy(pan[0] * 120, pan[1] * 120)
        else if (e.key === "ArrowLeft") go(index - 1)
        else if (e.key === "ArrowRight") go(index + 1)
        else if (e.key === "+" || e.key === "=") zoom.zoomBy(1.5)
        else if (e.key === "-") zoom.zoomBy(1 / 1.5)
        else if (e.key === "0") zoom.reset(true)
        else return
        e.preventDefault()
      }}
      // Anywhere but the photo, its caption and the buttons closes it.
      onClick={(e) => {
        if (zoom.isGestureClick(e.timeStamp)) return
        const target = e.target as HTMLElement
        if (!target.closest("img, button, figcaption")) onClose()
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="min-w-12 text-xs tabular-nums text-cream/60">
          {many && `${index + 1} / ${photos.length}`}
        </span>
        <div className="flex items-center gap-3">
          <ZoomControls
            scale={zoom.scale}
            onZoomIn={() => zoom.zoomBy(1.5)}
            onZoomOut={() => zoom.zoomBy(1 / 1.5)}
            onReset={() => zoom.reset(true)}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 hover:border-cream/50 hover:text-cream"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <figure className="flex min-h-0 flex-1 flex-col items-center px-4 pb-6 sm:px-20">
        <div
          ref={frameRef}
          data-zoomed={zoomed || undefined}
          className="field-notes-lightbox-frame flex min-h-0 w-full flex-1 items-center justify-center"
          {...zoom.handlers}
        >
          <img
            ref={photoRef}
            key={photo.path}
            {...lightboxProps(photo.path, sharp)}
            alt={photo.alt}
            draggable={false}
            className="field-notes-lightbox-photo"
          />
          {/* Fades once read; says how for the pointer in hand. */}
          <p className="field-notes-lightbox-hint" aria-hidden>
            <span className="field-notes-hint-touch">Pinch or double-tap to zoom</span>
            <span className="field-notes-hint-mouse">Scroll or double-click to zoom</span>
          </p>
        </div>
        <figcaption className="mt-4 max-w-xl text-center">
          <p className="text-sm leading-relaxed text-cream/85">{photo.summary}</p>
          <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sage/80">
            {photo.date}
          </p>
        </figcaption>
      </figure>

      {many && !zoomed && (
        <>
          <div className="field-notes-lightbox-arrow left-3 sm:left-6">
            <CarouselArrow
              direction="previous"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            />
          </div>
          <div className="field-notes-lightbox-arrow right-3 sm:right-6">
            <CarouselArrow
              direction="next"
              disabled={index === photos.length - 1}
              onClick={() => go(index + 1)}
            />
          </div>
        </>
      )}
    </dialog>,
    document.body,
  )
}

/** −, the zoom level (which resets to fit) and +, as one pill. */
function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  const button =
    "flex h-10 w-10 items-center justify-center text-cream/80 hover:text-cream disabled:pointer-events-none disabled:opacity-30"
  return (
    <div
      role="group"
      aria-label="Zoom"
      className="flex items-center rounded-full border border-cream/20"
    >
      <button
        type="button"
        aria-label="Zoom out"
        disabled={scale <= 1}
        onClick={onZoomOut}
        className={button}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path d="M6 12h12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={scale > 1 ? "Fit photo to screen" : "Zoom level"}
        disabled={scale <= 1}
        onClick={onReset}
        className="min-w-11 text-xs tabular-nums text-cream/70 hover:text-cream disabled:pointer-events-none"
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={scale >= MAX_ZOOM}
        onClick={onZoomIn}
        className={button}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M6 12h12M12 6v12"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
