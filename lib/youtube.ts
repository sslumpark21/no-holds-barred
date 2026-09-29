export function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    const id = host === "youtu.be"
      ? parsed.pathname.split("/").filter(Boolean)[0]
      : host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com"
        ? parsed.pathname === "/watch" ? parsed.searchParams.get("v") : parsed.pathname.split("/").filter(Boolean).at(-1)
        : null
    return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null
  } catch { return null }
}
