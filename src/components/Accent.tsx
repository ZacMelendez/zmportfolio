/**
 * Headline copy from src/content: words wrapped in *asterisks* get the rust
 * accent, e.g. "I didn't plan on *software*".
 */
export default function Accent({ text }: { text: string }) {
  return text.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="text-rust">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
