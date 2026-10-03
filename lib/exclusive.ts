import { artists } from "./data"
import { archiveArtists } from "./archive"
import type { TvArtistContext } from "./types"
import type { PlayableTrack } from "./broadcast"

export const exclusiveGroups: { label: string; artists: TvArtistContext[] }[] = [
  { label: "MEMBERS", artists: ["danoot", "moxli", "matei"].map((slug) => ({ kind: "official", slug })) },
  { label: "ARCHIVE", artists: ["andreas-shinso", "cyupercah", "moise6969", "2007"].map((id) => ({ kind: "archive", id })) },
]

export function resolveExclusiveArtist(context: TvArtistContext) {
  return context.kind === "official"
    ? artists.find((artist) => artist.slug === context.slug)!
    : archiveArtists.find((artist) => artist.id === context.id)!
}

export function exclusiveAudioQueue(context: TvArtistContext, selectedId: string): PlayableTrack[] {
  const artist = resolveExclusiveArtist(context)
  const audio = artist.exclusives.filter((item) => item.kind === "audio")
  const selected = audio.find((item) => item.id === selectedId)
  if (!selected) return []
  const queue = selected.projectId
    ? audio.filter((item) => item.projectId === selected.projectId).sort((a, b) => (a.trackNumber ?? Infinity) - (b.trackNumber ?? Infinity))
    : [selected]
  return queue.map((item) => ({
    id: item.id, title: item.title, audioUrl: item.audioUrl, artwork: item.coverUrl ?? item.artwork ?? "",
    artist: artist.name, artistSlug: context.kind === "official" ? context.slug : context.id,
  }))
}
