import { useRef } from "react"
import { PROFILE, SITE } from "@/data/content"
import Accent from "./Accent"
import { imageProps } from "@/utils/image"
import ChocoruaMap from "./ChocoruaMap"
import Reveal from "./Reveal"
import SectionLabel from "./SectionLabel"

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative scroll-mt-24 overflow-hidden px-6 py-20 md:px-10 md:py-28"
    >
      <ChocoruaMap sectionRef={sectionRef} />

      <div
        data-map-content
        className="relative mx-auto grid max-w-6xl gap-36 lg:grid-cols-2 lg:gap-16"
      >
        {/* Photo first when stacked; on the right beside the copy on wide
            screens. Taken on Chocorua's summit, so it sits under the map's peak.
            Stacked, the trail crosses the gap below it. */}
        <Reveal
          as="figure"
          variant="clip"
          data-map-photo
          className="overflow-hidden rounded-sm ring-1 ring-olive/50 lg:order-2 lg:mt-32 lg:ml-auto lg:w-[86%]"
        >
          <img
            {...imageProps(PROFILE.aboutPhoto, {
              // Half the 72rem grid, at 86%, on wide screens; full width stacked.
              sizes: "(min-width: 1024px) 470px, calc(100vw - 48px)",
              maxWidth: 1536,
              position: "center 40%",
            })}
            alt={`${PROFILE.name} on Mount Chocorua's summit with two dogs`}
            loading="lazy"
            className="aspect-square w-full object-cover object-[center_40%]"
          />
        </Reveal>

        <div data-map-copy className="flex flex-col justify-center">
          <SectionLabel section="about" />
          <Reveal
            as="h2"
            variant="mask"
            delay={150}
            className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] leading-tight font-medium text-cream"
          >
            <Accent text={SITE.sections.about.heading} />
          </Reveal>
          <Reveal
            delay={300}
            className="mt-6 space-y-4 text-cream/75 leading-relaxed"
          >
            {PROFILE.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
