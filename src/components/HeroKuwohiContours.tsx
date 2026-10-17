import type { RefObject } from "react"
import { HERO_ENGRAVING } from "@/data/heroSplit"
import SvgTierPulse from "./SvgTierPulse"
import kuwohiMinor from "../assets/contours/kuwohi-contours-minor.svg?url"
import kuwohiIndex from "../assets/contours/kuwohi-contours-index.svg?url"

export default function HeroKuwohiContours({
  scrollSectionRef,
  canvasHost,
}: {
  scrollSectionRef: RefObject<HTMLElement | null>
  canvasHost: HTMLElement | null
}) {
  const { x, y, width, height } = HERO_ENGRAVING

  return (
    <SvgTierPulse
      sources={[kuwohiMinor, kuwohiIndex]}
      observeRef={scrollSectionRef}
      loop
      layout={{ x, y, width, height }}
      canvasHost={canvasHost}
    />
  )
}
