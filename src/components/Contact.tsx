import { CONTACT_LINKS, PROFILE, SITE } from "@/data/content"
import Accent from "./Accent"
import { useHydrated } from "@/utils/hydration"
import ContactRidges from "./ContactRidges"
import { ProfileIcon } from "./ProfileIcons"
import Reveal from "./Reveal"
import SectionLabel from "./SectionLabel"
import { TrailButton } from "./TrailButtons"

export default function Contact() {
  const secondary = CONTACT_LINKS.filter((l) => l.label !== "Email")
  const hydrated = useHydrated()

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden px-6 pt-24 pb-10 md:px-10 md:pt-32 md:pb-12"
    >
      {/* Browser only: decoration, kept out of the prerendered HTML. */}
      {hydrated && <ContactRidges />}

      <div className="relative mx-auto max-w-6xl text-center">
        <SectionLabel section="contact" className="justify-center" />
        <Reveal
          as="h2"
          variant="mask"
          delay={150}
          className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight font-medium text-cream"
        >
          <Accent text={SITE.sections.contact.heading} />
        </Reveal>
        <Reveal as="p" delay={300} className="mx-auto mt-6 max-w-lg text-cream/70">
          {SITE.sections.contact.intro}
        </Reveal>
        <Reveal delay={400} className="mt-10 flex flex-col items-center gap-6">
          <TrailButton href={`mailto:${PROFILE.email}`}>
            {SITE.sections.contact.cta}
          </TrailButton>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
            {secondary.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-sage no-underline hover:text-cream"
              >
                <ProfileIcon name={link.label} size={18} />
                {link.display}
              </a>
            ))}
          </div>
        </Reveal>
        <p className="mt-[clamp(8rem,20vw,18rem)] text-xs text-cream/40">
          © {new Date().getFullYear()} {PROFILE.name}
        </p>
      </div>
    </section>
  )
}
