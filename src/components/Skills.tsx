import { SKILL_TILES } from "@/data/content"
import Reveal from "./Reveal"
import SectionHeading from "./SectionHeading"

export default function Skills() {
  return (
    <section
      id="skills"
      className="scroll-mt-24 bg-band px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          {/* @ts-expect-error Skills is off the page; restore its SECTIONS entry to bring it back. */}
          <SectionHeading section="skills" title="Tools & technologies" />
          <Reveal
            as="p"
            delay={250}
            className="-mt-6 max-w-md text-cream/75 leading-relaxed"
          >
            End-to-end ownership: interfaces, APIs, data models, and how the
            thing gets to production — especially when traffic spikes on game
            day.
          </Reveal>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
          {SKILL_TILES.map((skill, i) => (
            <Reveal as="li" key={skill.name} variant="fade" delay={i * 50}>
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md bg-olive/80 ring-1 ring-olive">
                <span className="font-display text-lg text-cream/90">
                  {skill.mark}
                </span>
                <span className="text-center text-[0.65rem] font-semibold uppercase tracking-wider text-cream/70">
                  {skill.name}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
