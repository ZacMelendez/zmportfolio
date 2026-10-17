// Rendered at build time by scripts/prerender.mjs, so the page's HTML (the
// hero copy above all) paints before the script loads. main.tsx hydrates it.
import { StrictMode } from "react"
import { renderToString } from "react-dom/server"
import App from "./App"

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
