/// <reference types="vite/client" />

declare module "*.svg?raw" {
  const content: string
  export default content
}

interface ImportMetaEnv {
  /** Origin of the images container; unset means same origin. */
  readonly VITE_IMAGES_URL?: string
}
