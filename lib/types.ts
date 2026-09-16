// Core domain types for no.holds.barred
// Structured so the site can later be backed by Supabase tables.

export type ArtistType = "member" | "affiliate"

export interface SocialLink {
  label: string
  href: string
}

export interface Track {
  id: string
  title: string
  duration: string // mm:ss
  audioUrl: string
}

export interface Artist {
  slug: string
  name: string
  type: ArtistType
  role: string // e.g. "Producer / DJ"
  location: string
  tagline: string
  bio: string[]
  portrait: string
  hero: string
  socials: SocialLink[]
  // Related content (referenced by slug/id for a future relational schema)
  releaseSlugs: string[]
  unreleased: Track[]
  videos: { id: string; title: string; year: string; thumbnail: string }[]
  news: { id: string; date: string; title: string }[]
  merch: { id: string; name: string; price: string; image: string }[]
  eventSlugs: string[]
  photos: string[]
  press: { id: string; outlet: string; quote: string; year: string }[]
}

export type ReleaseType = "Album" | "EP" | "Single" | "Mixtape" | "Compilation"

export interface Release {
  slug: string
  title: string
  artistSlug: string
  artistName: string
  type: ReleaseType
  date: string // ISO
  year: string
  catalog: string // e.g. NHB-007
  artwork: string
  description: string[]
  tracklist: Track[]
}

export type JournalCategory =
  | "Interview"
  | "Studio Visit"
  | "Release Story"
  | "Photography"
  | "Essay"
  | "Playlist"
  | "Event Recap"

export interface JournalEntry {
  slug: string
  title: string
  category: JournalCategory
  excerpt: string
  author: string
  date: string
  readTime: string
  cover: string
  body: string[]
}

export interface NHBEvent {
  slug: string
  title: string
  date: string // ISO
  dateLabel: string
  venue: string
  city: string
  lineup: string[]
  status: "upcoming" | "past"
  image: string
  description: string
}
