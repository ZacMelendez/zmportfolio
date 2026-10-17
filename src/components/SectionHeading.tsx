import type { SectionId } from "@/data/content"
import Reveal from "./Reveal"
import SectionLabel from "./SectionLabel"

export default function SectionHeading({
  section,
  title,
  action,
}: {
  section: SectionId
  title: string
  action?: React.ReactNode
}) {
  return (
    <div
      data-map-heading
      className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14"
    >
      <div>
        <SectionLabel section={section} />
        <Reveal
          as="h2"
          variant="mask"
          delay={150}
          className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-medium tracking-tight text-cream"
        >
          {title}
        </Reveal>
      </div>
      {action}
    </div>
  )
}
