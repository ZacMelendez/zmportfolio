import { useRef } from "react"
import { EXPERIENCE, SITE, VOLUNTEER } from "@/data/content"
import Accent from "./Accent"
import Reveal from "./Reveal"
import SectionLabel from "./SectionLabel"

const TIMELINE = [...EXPERIENCE, ...VOLUNTEER]

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="scroll-mt-24 bg-band px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="relative lg:pr-8">
          <SectionLabel section="experience" />
          <Reveal
            as="h2"
            variant="mask"
            delay={150}
            className="mt-3 font-display text-[clamp(1.85rem,4.5vw,3rem)] leading-tight font-medium text-cream"
          >
            <Accent text={SITE.sections.experience.heading} />
          </Reveal>
          <Reveal
            as="p"
            delay={300}
            className="mt-6 max-w-md text-cream/75 leading-relaxed"
          >
            {SITE.sections.experience.intro}
          </Reveal>
        </div>

        <div className="relative border-olive/40 lg:border-l lg:pl-12">
          <ol className="relative space-y-12">
            {TIMELINE.map((item, i) => (
              <Reveal
                as="li"
                key={item.company}
                delay={i * 140}
                className="relative pl-6 lg:pl-0"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage/90">
                  {item.period}
                </p>
                <h3 className="relative mt-2 font-display text-xl text-cream">
                  <span
                    className="absolute -left-6 top-[0.5lh] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-sage lg:-left-[calc(3rem+5px)]"
                    aria-hidden
                  />
                  {item.company}
                  {item.current && (
                    <span className="current-pulse ml-2 inline-block h-1.5 w-1.5 rounded-full bg-rust align-middle" />
                  )}
                </h3>
                <p className="mt-1 text-sm text-cream/60">
                  {item.title}
                  {item.formerly && ` · formerly ${item.formerly}`}
                </p>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-cream/75">
                  {item.summary}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
