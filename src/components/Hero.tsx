import { useRef, useState, type CSSProperties } from "react"
import { PROFILE } from "@/data/content"
import {
  HERO_GROUND_PIN_TOP,
  HERO_RIDGE_CLEARANCE,
  HERO_SKY_HEIGHT,
} from "@/data/heroSplit"
import { useHydrated } from "@/utils/hydration"
import type { Point } from "@/utils/tracePath"
import FieldNotes from "./FieldNotes"
import HeroSplitScene from "./HeroSplitScene"
import Reveal from "./Reveal"

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [notesAt, setNotesAt] = useState<Point | null>(null)
  const hydrated = useHydrated()

  return (
    <section
      ref={sectionRef}
      className="relative min-h-dvh overflow-hidden bg-band"
      style={
        {
          "--ridge-clearance": HERO_RIDGE_CLEARANCE,
          "--sky-height": HERO_SKY_HEIGHT,
          "--ground-pin-top": HERO_GROUND_PIN_TOP,
        } as CSSProperties
      }
    >
      {/* Browser only: its frame depends on the screen's shape, and its
          contours would add ~40 kB to the prerendered HTML. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {hydrated && (
          <HeroSplitScene scrollSectionRef={sectionRef} onNotesAnchor={setNotesAt} />
        )}
      </div>

      {/* Landscape: on the map's location spot. Portrait turns the map, so
          the pin sits on the map below the ridge instead, clear of the copy. */}
      <FieldNotes
        id="kuwohi"
        pin={
          notesAt
            ? { at: notesAt, centered: true, testId: "hero-notes-pin" }
            : {
              className: "left-6 top-(--ground-pin-top) md:left-10 landscape:hidden",
              testId: "hero-notes-pin",
            }
        }
      />

      {/* Always over the open half, never the contours. Portrait: above the
          horizontal ridge and its road label. Landscape: right of the ridge
          and its road label. */}
      <div className="relative z-10 flex min-h-dvh w-full flex-col px-6 pb-10 md:px-10 lg:pb-16 landscape:ml-[calc(50%+var(--ridge-clearance))] landscape:w-[min(30rem,calc(50%-var(--ridge-clearance)-2.5rem))] landscape:px-0 landscape:pt-28">
        <div className="flex min-h-(--sky-height) max-w-xl flex-col justify-end pt-20 landscape:min-h-0 landscape:flex-1 landscape:justify-center landscape:pt-0">
          {/* Fades and masks only: nothing here shifts its box, so the copy
              stays where the ridge left room for it while it animates. */}
          <Reveal
            appear
            as="p"
            variant="fade"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-sage"
          >
            {PROFILE.role}
          </Reveal>
          <Reveal
            appear
            as="h1"
            variant="mask"
            delay={120}
            className="mt-4 font-display text-[clamp(3.5rem,min(12vw,18svh),7rem)] leading-[0.92] font-medium tracking-tight text-cream"
          >
            Zach
          </Reveal>
          <Reveal
            appear
            as="p"
            variant="fade"
            delay={380}
            className="mt-[min(1.5rem,2.5svh)] max-w-lg text-base leading-relaxed text-cream/85 sm:text-lg"
          >
            {PROFILE.headline}
          </Reveal>
          {/* Portrait: under the headline, clear of the map below the ridge.
              Landscape keeps it in the footer row instead. */}
          <Reveal
            appear
            as="p"
            variant="fade"
            delay={520}
            className="mt-[min(1.5rem,2.5svh)] max-w-xs border-t border-cream/10 pt-[min(1rem,2svh)] text-balance text-xs font-semibold uppercase leading-relaxed tracking-[0.18em] text-sage/70 landscape:hidden"
          >
            {PROFILE.tagline}
          </Reveal>
        </div>

        <div className="mt-auto flex items-center justify-between gap-6 pt-8 landscape:border-t landscape:border-cream/10 landscape:pt-5">
          <p className="hidden text-balance text-xs font-semibold uppercase leading-relaxed tracking-[0.18em] text-sage/70 landscape:block">
            {PROFILE.tagline}
          </p>
          <a
            href="#experience"
            className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sage/80 no-underline hover:text-sage"
          >
            Scroll
            <span className="inline-block animate-bounce" aria-hidden>
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
