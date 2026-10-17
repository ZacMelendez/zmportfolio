/**
 * Field notes behind each topo map's pin: every trip up that mountain, opened
 * from the pin in a drawer. Trips are newest first; the drawer opens on the
 * first.
 *
 * Copy follows WRITING_STYLE.md: short, first person, only what happened.
 */

import fieldNotes from "@/content/fieldNotes.json"

export type FieldNotePhoto = {
  /** Path in the images container's originals, as for `imageProps`. */
  path: string
  alt: string
  /** A line or two under the photo. */
  summary: string
  date: string
}

export type FieldNoteStat = { label: string; value: string }

export type FieldNoteTrip = {
  /**
   * Where, when a note spans more than one peak: shown in the trip's tab, and
   * as the drawer's subtitle while the trip is open.
   */
  place?: string
  /** Overrides the note's own coordinates while the trip is open. */
  coordinates?: string
  /** When, as the trip's tab and its "Hiked" stat. */
  date: string
  /** This trip's stats (route, distance, gain), after the mountain's own. */
  stats: readonly FieldNoteStat[]
  /** One line pulled out above the story. */
  lede: string
  story: readonly string[]
  /**
   * The hike's AllTrails page (or the recording of it), linked under the
   * story, e.g. "https://www.alltrails.com/trail/us/virginia/hawksbill-loop".
   */
  allTrails?: string
  photos: readonly FieldNotePhoto[]
}

export type FieldNote = {
  /** The mountain (or range), as the drawer's title and the pin's label. */
  name: string
  region: string
  coordinates?: string
  /** Stats that hold for every trip, like the summit's height. */
  stats: readonly FieldNoteStat[]
  /** Newest first. */
  trips: readonly FieldNoteTrip[]
}

export type FieldNoteId = "kuwohi" | "hawksbill" | "chocorua"

// The trips live in src/content/fieldNotes.json.
// The ids are fixed: each one is a hand-drawn topo map with a pin.
export const FIELD_NOTES: Record<FieldNoteId, FieldNote> = fieldNotes
