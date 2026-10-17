// Photos served by the images container (images/ and docker-compose.yml).
// Paths are relative to its originals folder, e.g. "hikes/hawksbill.jpeg".

import type { CSSProperties } from "react"
// Written by `pnpm placeholders` (scripts/placeholders.mjs).
import PLACEHOLDERS from "@/data/placeholders.json"

/** The widths images/nginx.conf allows; anything else is a 400. */
export const IMAGE_WIDTHS = [320, 480, 640, 800, 960, 1280, 1600, 1920, 2560] as const

export type ImageWidth = (typeof IMAGE_WIDTHS)[number]

// Empty means same origin: the reverse proxy (or Vite's dev proxy) routes
// /img/ and /originals/ to the images container.
const BASE = (import.meta.env.VITE_IMAGES_URL ?? "").replace(/\/$/, "")

const encodePath = (path: string) =>
  path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")

/** The full-size file, untouched. */
export function originalUrl(path: string): string {
  return `${BASE}/originals/${encodePath(path)}`
}

/** Re-encoded as AVIF/WebP for the browser, at `width` or at its own size. */
export function imageUrl(path: string, width?: ImageWidth): string {
  const src = `${BASE}/img/${encodePath(path)}`
  return width ? `${src}/resize?size=${width}` : `${src}/optimise`
}

export type Placeholder = { file: string; width: number; height: number }

/** The photo's blurred stand-in and its full size, if `pnpm placeholders` has seen it. */
export function placeholder(path: string): Placeholder | undefined {
  return (PLACEHOLDERS as Record<string, Placeholder>)[path.replace(/^\/+/, "")]
}

/**
 * `src`, `srcSet` and `sizes` for an `<img>`, so the browser picks a width.
 * `sizes` is how wide the image is drawn, e.g. "(min-width: 1024px) 50vw, 100vw".
 *
 * The blurred placeholder is the `<img>`'s own background, so it shows until
 * the photo paints over it. `fit` and `position` should match the image's
 * `object-fit` and `object-position`, so the two line up.
 */
export function imageProps(
  path: string,
  {
    sizes,
    maxWidth = 2560,
    fit = "cover",
    position = "center",
  }: {
    sizes: string
    maxWidth?: number
    fit?: "cover" | "contain"
    position?: string
  },
) {
  const widths = IMAGE_WIDTHS.filter((w) => w <= maxWidth)
  const blur = placeholder(path)
  const style: CSSProperties | undefined = blur && {
    backgroundImage: `url("/placeholders/${blur.file}")`,
    backgroundSize: fit,
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  }
  return {
    src: imageUrl(path, widths.at(-1) ?? IMAGE_WIDTHS[0]),
    srcSet: widths.map((w) => `${imageUrl(path, w)} ${w}w`).join(", "),
    sizes,
    style,
  }
}
