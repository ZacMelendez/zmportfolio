import { useRef } from "react"
import { SKYDANCE_WORK, PROJECTS, SITE, type CaseStudy } from "@/data/content"
import { ArrowIcon } from "./ArrowLink"
import HawksbillMap from "./HawksbillMap"
import Reveal from "./Reveal"
import SectionHeading from "./SectionHeading"

/**
 * Grid columns for a row of `count` items, so lists can grow or shrink without
 * leaving a lone card on its own line. Literal classes, for Tailwind's scanner.
 */
function gridCols(count: number) {
  if (count <= 2) return "md:grid-cols-2"
  if (count === 4) return "md:grid-cols-2 lg:grid-cols-4"
  return "md:grid-cols-3"
}

/** Staggers a row's entrance without long waits on bigger lists. */
const stagger = (i: number, step: number) => Math.min(i, 3) * step

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null)
  const hasFeatured = SKYDANCE_WORK.length > 0
  const hasMore = PROJECTS.length > 0

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative scroll-mt-24 overflow-hidden px-6 py-20 md:px-10 md:py-28"
    >
      <HawksbillMap sectionRef={sectionRef} />

      <div data-map-content className="relative mx-auto max-w-6xl">
        <SectionHeading
          section="work"
          title={SITE.sections.work.heading}
        />

        {hasFeatured && (
          <>
            <p className="-mt-4 mb-8 text-xs font-semibold uppercase tracking-[0.16em] text-sage/90 md:-mt-6">
              {SITE.sections.work.featuredLabel}
            </p>
            <div
              data-map-featured
              className={`grid gap-8 ${gridCols(SKYDANCE_WORK.length)}`}
            >
              {SKYDANCE_WORK.map((study, i) => (
                <Reveal
                  key={study.title}
                  delay={stagger(i, 120)}
                  className="flex"
                >
                  <CaseStudyCard study={study} />
                </Reveal>
              ))}
            </div>
          </>
        )}

        {/* Below lg, Skyline Drive crosses the gap in place of the rule. */}
        {hasMore && (
          <div
            id="work-more"
            data-map-more
            className={`grid gap-8 ${gridCols(PROJECTS.length)} ${
              hasFeatured
                ? "mt-36 border-olive/50 lg:mt-16 lg:border-t lg:pt-12"
                : ""
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage/90 md:col-span-full">
              Freelance &amp; side projects
            </p>
            {PROJECTS.map((project, i) => (
              <Reveal
                as="a"
                key={project.title}
                delay={stagger(i, 100)}
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group block no-underline"
              >
                {project.image && (
                  <div className="mb-4 aspect-[16/9] overflow-hidden rounded-sm bg-olive/30 ring-1 ring-olive/40">
                    <img
                      src={project.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <h3 className="font-display text-lg text-cream group-hover:text-sage">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-cream/65">
                  {project.description}
                </p>
                <p className="mt-2 text-xs text-sage/80">{project.year}</p>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const Tag = study.href ? "a" : "div"
  const linkProps = study.href
    ? {
      href: study.href,
      target: "_blank" as const,
      rel: "noreferrer noopener",
    }
    : {}

  return (
    <Tag
      {...linkProps}
      className="group flex w-full flex-col overflow-hidden rounded-sm bg-band ring-1 ring-olive/40 no-underline"
    >
      <div className="border-b border-olive/40 bg-ink/40 px-5 pt-6 pb-5">
        <p className="font-display text-[clamp(2.25rem,5vw,3rem)] leading-none font-medium text-rust">
          {study.metric.value}
        </p>
        <p className="mt-2 text-sm text-cream/70">{study.metric.label}</p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage/90">
          {study.area} · {study.year}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-cream group-hover:text-sage">
            {study.title}
          </h3>
          {study.href && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream/20 text-cream/80">
              <ArrowIcon />
            </span>
          )}
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-cream/70">
          {study.description}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {study.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-olive/60 bg-ink/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-sage/90"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Tag>
  )
}
