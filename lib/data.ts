import type { Artist, Release, JournalEntry, NHBEvent } from "./types"

export const artists: Artist[] = [
  {
    slug: "danoot",
    name: "Danoot",
    type: "member",
    role: "Collective Member",
    location: "no.holds.barred.",
    tagline: "",
    bio: [],
    portrait: "/images/affiliate-lowtide.png",
    hero: "/images/affiliate-lowtide.png",
    socials: [],
    releaseSlugs: [],
    unreleased: [],
    videos: [],
    news: [],
    merch: [],
    eventSlugs: [],
    photos: [],
    press: [],
  },
  {
    slug: "moxli",
    name: "MoxLi",
    type: "member",
    role: "Collective Member",
    location: "no.holds.barred.",
    tagline: "",
    bio: [],
    portrait: "/images/affiliate-ghost-notation.png",
    hero: "/images/affiliate-ghost-notation.png",
    socials: [],
    releaseSlugs: ["moxli-nostalgia-omoara-progresul"],
    unreleased: [],
    videos: [],
    news: [],
    merch: [],
    eventSlugs: [],
    photos: [],
    press: [],
  },
  {
    slug: "matei",
    name: "Matei!",
    type: "member",
    role: "Collective Member",
    location: "no.holds.barred.",
    tagline: "",
    bio: [],
    portrait: "/images/matei-profile.jpg",
    hero: "/images/matei-profile.jpg",
    socials: [],
    releaseSlugs: [],
    unreleased: [],
    videos: [],
    news: [],
    merch: [],
    eventSlugs: [],
    photos: [],
    press: [],
  },
]
export const affiliates: Artist[] = []

export const releases: Release[] = [
  {
    slug: "moxli-nostalgia-omoara-progresul",
    title: "nostalgia omoara progresul",
    artistSlug: "moxli",
    artistName: "MoxLi",
    type: "EP",
    date: "2024",
    year: "2024",
    catalog: "TEST",
    artwork: "/images/moxli-nostalgia-omoara-progresul-cover.jpg",
    description: ["To be announced."],
    tracklist: [
      {
        id: "moxli-nop-printul-persiei",
        title: "printul persiei",
        duration: "1:26",
        audioUrl: "/audio/moxli/nostalgia-omoara-progresul/printul-persiei.wav",
      },
      {
        id: "moxli-nop-grabba",
        title: "grabba",
        duration: "2:46",
        audioUrl: "/audio/moxli/nostalgia-omoara-progresul/grabba.wav",
      },
    ],
  },
]

export const journal: JournalEntry[] = [
  {
    slug: "night-photography-transmission-06",
    title: "Transmission 06 — In Photographs",
    category: "Photography",
    excerpt: "A photo essay from the collective's most recent all-night event.",
    author: "Editorial",
    date: "2025.11.22",
    readTime: "4 min",
    cover: "/images/journal-photo-essay.png",
    body: [
      "No captions. No names. Just the room, the fog, and the hours between midnight and the first train.",
    ],
  },
  {
    slug: "why-we-keep-affiliates",
    title: "Why We Keep a Curated Artists List",
    category: "Essay",
    excerpt: "On curation as generosity, and pointing beyond our own output.",
    author: "no.holds.barred.",
    date: "2025.09.05",
    readTime: "6 min",
    cover: "/images/journal-essay.png",
    body: [
      "A project is a small thing. A scene moves far beyond it.",
      "The curated artists list is where we share music we believe in, wherever it comes from.",
    ],
  },
  {
    slug: "winter-transmission-playlist",
    title: "Winter Transmission — A Playlist",
    category: "Playlist",
    excerpt: "Two hours of what the collective has been playing in the cold months.",
    author: "Editorial",
    date: "2025.12.01",
    readTime: "2 min",
    cover: "/images/journal-playlist.png",
    body: ["Best played loud, in the dark, alone or with two people maximum."],
  },
]

export const events: NHBEvent[] = []

// Lookup helpers
export const allArtists = [...artists, ...affiliates]
export const getArtist = (slug: string) => allArtists.find((a) => a.slug === slug)
export const getRelease = (slug: string) => releases.find((r) => r.slug === slug)
export const getReleasesByArtist = (slug: string) => releases.filter((r) => r.artistSlug === slug)
export const getJournalEntry = (slug: string) => journal.find((j) => j.slug === slug)
export const getEvent = (slug: string) => events.find((e) => e.slug === slug)
export const getEventsBySlugs = (slugs: string[]) => events.filter((e) => slugs.includes(e.slug))
export const featuredArtist = artists[0]
export const latestRelease = releases[0]
