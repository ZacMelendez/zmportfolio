import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

const root = document.getElementById("root")!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Prerendered at build time (scripts/prerender.mjs); empty under `pnpm dev`.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
