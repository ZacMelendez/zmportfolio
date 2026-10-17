// Stroke-based 24×24 glyphs shared by the mobile menu and the contact footer.
export const PROFILE_ICONS = {
  Email: (
    <>
      <path d="M3.5 6.5h17v11h-17z" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),
  GitHub: (
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
  Resume: (
    <>
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4M9 12.5h6M9 16h6" />
    </>
  ),
  Spotify: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.5c2.5-.7 5.3-.4 7.3.8M8.5 15.3c2-.5 4-.3 5.6.6" />
    </>
  ),
}

export function ProfileIcon({
  name,
  size = 20,
}: {
  name: keyof typeof PROFILE_ICONS
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PROFILE_ICONS[name]}
    </svg>
  )
}
