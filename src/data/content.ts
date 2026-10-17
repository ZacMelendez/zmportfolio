// Optimised from design/unused-site-assets/originals (lossless WebP; the
// headshot at 3x its 56px avatar). Imported so the build hashes and caches them.
import headshot from "@/assets/headshot.webp"
import acaImage from "@/assets/projects/aca.webp"
import peadboImage from "@/assets/projects/peadbo.webp"
import yardlyImage from "@/assets/projects/yardly.webp"
import site from "@/content/site.json"

/** The site copy lives in src/content/site.json. */
export const SITE = site

/** Photos bundled with the build, by the key site.json uses for them. */
const BUNDLED_IMAGES: Record<string, string> = {
  aca: acaImage,
  peadbo: peadboImage,
  yardly: yardlyImage,
}

export const PROFILE = {
  ...site.profile,
  headshot,
}

/** Numbered sections, in page order: the section labels and the mobile menu. */
export const SECTIONS = [
  { id: "experience", number: "01", label: "Experience" },
  { id: "work", number: "02", label: "Featured work" },
  // { id: "skills", number: "03", label: "Skills" },
  { id: "about", number: "03", label: "About" },
  { id: "contact", number: "04", label: "Contact" },
] as const

export type SectionId = (typeof SECTIONS)[number]["id"]

export const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const

export const SKILL_TILES = [
  { name: "React", mark: "R" },
  { name: "Next.js", mark: "N" },
  { name: "TypeScript", mark: "TS" },
  { name: "JavaScript", mark: "JS" },
  { name: "HTML", mark: "5" },
  { name: "CSS", mark: "CSS" },
  { name: "Tailwind", mark: "TW" },
  { name: "Node", mark: "Node" },
  { name: "Python", mark: "Py" },
  { name: "GraphQL", mark: "GQL" },
  { name: "AWS", mark: "AWS" },
  { name: "Git", mark: "Git" },
] as const

/**
 * Skydance work, newest first. Metrics cover the 30 days to 2026-09-28; see
 * skills-inventory.md in the resume repo for what's safe to cite (views and
 * requests, never visitors; don't add page types together).
 */
export type CaseStudy = {
  title: string
  area: string
  year: string
  metric: { value: string; label: string }
  description: string
  tags: string[]
  href?: string
}

export const SKYDANCE_WORK: CaseStudy[] = site.featuredWork

export type Project = {
  title: string
  year: string
  tags: string[]
  description: string
  href?: string
  image?: string
}

/** Freelance and side projects, below the Skydance work. */
export const PROJECTS: Project[] = site.projects.map((project) => ({
  ...project,
  image: project.image && BUNDLED_IMAGES[project.image],
}))

export type Experience = {
  title: string
  company: string
  period: string
  points: string[]
  /** The timeline's paragraph in the Experience section. */
  summary: string
  current?: boolean
  /** Earlier company name, e.g. before a merger. */
  formerly?: string
  kind?: "role" | "volunteer"
}

export const EXPERIENCE: Experience[] = site.experience as Experience[]

export const VOLUNTEER: Experience[] = site.volunteer as Experience[]

export const SKILLS: { category: string; items: string[] }[] = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "PHP / Symfony", "SQL"],
  },
  {
    category: "Frontend",
    items: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "Mantine",
      "Material UI",
      "React Hook Form",
      "D3.js",
    ],
  },
  {
    category: "Backend & data",
    items: [
      "Node.js",
      "Fastify",
      "Express",
      "GraphQL",
      "Cosmo SuperGraph",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "DynamoDB",
      "Okta",
    ],
  },
  {
    category: "Cloud & delivery",
    items: [
      "AWS CDK",
      "Lambda",
      "Docker",
      "Kubernetes",
      "Argo CD",
      "Playwright",
      "Jest",
    ],
  },
]

export const CONTACT_LINKS = [
  { label: "Email", href: `mailto:${PROFILE.email}`, display: PROFILE.email },
  { label: "GitHub", href: PROFILE.github, display: "GitHub" },
  { label: "Resume", href: PROFILE.resume, display: "Resume" },
  // { label: "Spotify", href: PROFILE.spotify, display: "Spotify" },
] as const
