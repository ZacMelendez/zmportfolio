import { useSyncExternalStore } from "react"

// The page is prerendered at build time (scripts/prerender.mjs) and hydrated
// in the browser. Anything that reads the window while rendering must render
// what the server did first, then update: useSyncExternalStore does both,
// using the server snapshot while hydrating.

const noSubscribe = () => () => {}

/** False on the server and while hydrating; true once the browser has taken over. */
export function useHydrated() {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
}

/** A media query's match, false on the server and while hydrating. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
