import type { ArchiveArtist, Artist, Release } from "./types"

export interface PlayableTrack {
  id: string
  title: string
  artist: string
  artistSlug?: string
  releaseSlug?: string
  releaseTitle?: string
  artwork: string
  audioUrl: string
}

export function releasePlaylist(release: Release): PlayableTrack[] {
  return release.tracklist.filter((track) => track.audioUrl.trim()).map((track) => ({
    ...track, artist: release.artistName, artistSlug: release.artistSlug,
    releaseSlug: release.slug, releaseTitle: release.title, artwork: release.artwork,
  }))
}

export function artistPlaylist(artist: Pick<Artist, "slug" | "name" | "releaseSlugs"> | ArchiveArtist, releases: Release[]): PlayableTrack[] {
  const artistSlug = "slug" in artist ? artist.slug : artist.id
  const seen = new Set<string>()
  return artist.releaseSlugs.flatMap((slug) => {
    const release = releases.find((item) => item.slug === slug && item.artistSlug === artistSlug)
    if (!release) return []
    return release.tracklist.filter((track) => {
      if (!track.audioUrl.trim() || seen.has(track.id)) return false
      seen.add(track.id)
      return true
    }).map((track) => ({
      ...track,
      artist: release.artistName,
      artistSlug,
      releaseSlug: release.slug,
      releaseTitle: release.title,
      artwork: release.artwork,
    }))
  })
}
