import { useEffect, useState, type CSSProperties } from "react"
import { NAV_LINKS, PROFILE, SECTIONS } from "@/data/content"
import { ProfileIcon } from "./ProfileIcons"

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // While the menu is open: hold the page still, close on Escape, and close if
  // the window widens past the menu's breakpoint.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const wide = window.matchMedia("(min-width: 768px)")
    const onWide = () => wide.matches && setOpen(false)
    window.addEventListener("keydown", onKey)
    wide.addEventListener("change", onWide)
    return () => {
      root.style.overflow = ""
      window.removeEventListener("keydown", onKey)
      wide.removeEventListener("change", onWide)
    }
  }, [open])

  // Scrolled: translucent with a frosted blur of the page beneath.
  // Menu open: near-solid so the menu reads as its own surface.
  const surface = open
    ? "bg-ink/95 backdrop-blur-md"
    : scrolled
      ? "bg-ink/70 backdrop-blur-md"
      : "bg-transparent backdrop-blur-none"

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-300 ${surface}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <a
          href="#"
          className="font-display text-2xl leading-none tracking-tight text-cream no-underline"
          onClick={(e) => {
            e.preventDefault()
            setOpen(false)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        >
          Z<span className="text-rust">.</span>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-xs font-semibold uppercase tracking-[0.18em] text-cream/75 no-underline transition-colors after:absolute after:inset-x-0 after:-bottom-[7px] after:h-px after:origin-right after:scale-x-0 after:bg-sage after:transition-transform after:duration-250 after:content-[''] hover:text-cream hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={`menu-toggle text-cream md:hidden ${open ? "is-open" : ""}`}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
      </div>

      <MobileMenu open={open} onNavigate={() => setOpen(false)} />
    </header>
  )
}

/** Three contour lines, nested like a summit's rings, that fold into an X. */
function MenuIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g
        className="menu-toggle-contours"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M2.5 7c3-1.6 6.3 1.6 9.5 0s6.5-1.6 9.5 0" />
        <path d="M5 12c2.4-1.3 4.8 1.3 7 0s4.6-1.3 7 0" />
        <path d="M7.5 17c1.6-.9 3 .9 4.5 0s2.9-.9 4.5 0" />
      </g>
      <path
        className="menu-toggle-close"
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MobileMenu({
  open,
  onNavigate,
}: {
  open: boolean
  onNavigate: () => void
}) {
  return (
    <div
      id="mobile-menu"
      inert={!open}
      className={`mobile-menu absolute inset-x-0 top-full flex h-[calc(100dvh-100%)] flex-col overflow-y-auto border-t border-olive/50 bg-ink px-6 pt-8 pb-8 md:hidden ${
        open ? "is-open" : ""
      }`}
    >
      <nav aria-label="Sections">
        <ol className="space-y-1">
          {SECTIONS.map((s, i) => (
            <li
              key={s.id}
              className="mobile-menu-item"
              style={{ "--i": i } as CSSProperties}
            >
              <a
                href={`#${s.id}`}
                onClick={onNavigate}
                className="group flex items-center gap-4 py-2.5 no-underline"
              >
                <span className="w-6 text-xs font-semibold tracking-[0.12em] text-sage">
                  {s.number}
                </span>
                <span className="section-label-trail w-8" aria-hidden />
                <span className="font-display text-3xl leading-none text-cream transition-colors group-hover:text-sage group-focus-visible:text-sage">
                  {s.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div
        className="mobile-menu-item mt-auto pt-10"
        style={{ "--i": SECTIONS.length } as CSSProperties}
      >
        <div className="flex items-center gap-4 border-t border-olive/50 pt-6">
          <img
            src={PROFILE.headshot}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_40%] ring-1 ring-sage/40"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight text-cream">
              {PROFILE.name}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-sage/75">
              {PROFILE.location}
            </p>
          </div>
        </div>
        <ul className="mt-5 flex gap-3">
          <ProfileLink href={`mailto:${PROFILE.email}`} label="Email" />
          <ProfileLink href={PROFILE.github} label="GitHub" external />
          <ProfileLink href={PROFILE.resume} label="Resume" external />
        </ul>
      </div>
    </div>
  )
}

function ProfileLink({
  href,
  label,
  external,
}: {
  href: string
  label: "Email" | "GitHub" | "Resume"
  external?: boolean
}) {
  return (
    <li>
      <a
        href={href}
        aria-label={label}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-sage hover:text-sage"
      >
        <ProfileIcon name={label} />
      </a>
    </li>
  )
}
