import { SECTIONS, type SectionId } from "@/data/content"
import { useInView } from "./Reveal"

/**
 * `02 - - - • Featured work`: the section number, then a dashed trail that
 * draws out to a trail marker, then the section's name. Styles live in
 * `index.css` under "Section label".
 */
export default function SectionLabel({
  section,
  className = "",
}: {
  section: SectionId
  className?: string
}) {
  const [ref, visible] = useInView<HTMLParagraphElement>()
  const { number, label } = SECTIONS.find((s) => s.id === section)!

  return (
    <p
      ref={ref}
      className={`section-label ${visible ? "is-visible" : ""} ${className}`}
    >
      <span className="section-label-number">{number}</span>
      <span className="section-label-trail" aria-hidden />
      <span className="section-label-text">{label}</span>
    </p>
  )
}
