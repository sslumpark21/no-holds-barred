// Run with: node --test tests/broadcast.test.cjs
// Test-only media doubles exercise the real provider/remote code without fabricated site data.
const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function harness(search = "") {
  let frame, cursor = 0, context
  const audios = [], timers = [], ytPlayers = []
  const listeners = new Map()
  const document = { activeElement: null }
  const react = {
    createContext: () => ({ Provider: "provider" }), useContext: () => context,
    useRef: (initial) => { const i = cursor++; return frame.slots[i] ??= { current: initial } },
    useState: (initial) => {
      const f = frame, i = cursor++
      if (!(i in f.slots)) f.slots[i] = typeof initial === "function" ? initial() : initial
      return [f.slots[i], (value) => { f.slots[i] = typeof value === "function" ? value(f.slots[i]) : value }]
    },
    useReducer: (reducer, initial) => {
      const [state, set] = react.useState(initial)
      return [state, (action) => set((previous) => reducer(previous, action))]
    },
    useCallback: (fn, deps) => {
      const i = cursor++, prior = frame.slots[i]
      if (!prior || deps.some((dep, n) => dep !== prior.deps[n])) frame.slots[i] = { fn, deps }
      return frame.slots[i].fn
    },
    useEffect: (effect, deps) => {
      const f = frame, i = cursor++, prior = f.slots[i]
      if (!prior || deps.some((dep, n) => dep !== prior.deps[n])) {
        f.slots[i] = { deps }
        f.effects.push(() => { prior?.cleanup?.(); f.slots[i].cleanup = effect() })
      }
    },
    useImperativeHandle: (ref, create) => { ref.current = create() },
    forwardRef: (fn) => fn,
  }
  class Audio {
    constructor() { audios.push(this); this.currentTime = 0; this.duration = 120; this.paused = true; this.loads = 0 }
    set src(value) { this.source = value; this.currentTime = 0; this.ended = false; this.error = null }
    get src() { return this.source }
    getAttribute() { return this.source }
    removeAttribute() { this.source = "" }
    load() { this.loads++; this.onloadedmetadata?.() }
    play() {
      if (this.rejectPlay) return Promise.reject({ name: "NotAllowedError" })
      this.paused = false; this.ended = false; this.onplay?.(); return Promise.resolve()
    }
    pause() { this.paused = true; this.onpause?.() }
    end() { this.paused = true; this.ended = true; this.onended?.() }
    fail() { this.error = {}; this.onerror?.() }
  }
  class YTPlayer {
    constructor(element, options) {
      this.element = element; this.options = options; this.state = 1; this.currentTime = 50; this.duration = 100; this.calls = []
      ytPlayers.push(this); options.events.onReady({ target: this })
    }
    playVideo() { this.calls.push(["playVideo"]); this.state = 1 }
    pauseVideo() { this.calls.push(["pauseVideo"]); this.state = 2 }
    seekTo(time, ahead) { this.calls.push(["seekTo", time, ahead]); this.currentTime = time }
    getCurrentTime() { return this.currentTime }
    getDuration() { return this.duration }
    getPlayerState() { return this.state }
    setVolume(value) { this.calls.push(["setVolume", value]) }
    destroy() { this.calls.push(["destroy"]) }
  }
  const window = {
    addEventListener: (type, listener, capture = false) => { if (!listeners.has(type)) listeners.set(type, new Map()); listeners.get(type).set(listener, capture) },
    removeEventListener: (type, listener, capture = false) => { if (listeners.get(type)?.get(listener) === capture) listeners.get(type).delete(listener) },
    matchMedia: () => ({ matches: false }),
    YT: { Player: YTPlayer, PlayerState: { PLAYING: 1 } },
    location: { search, pathname: "/", hash: "#broadcast", origin: "http://localhost" },
    history: { state: {}, replaceState: (_, __, url) => { window.location.search = url.includes("?") ? url.slice(url.indexOf("?"), url.indexOf("#")) : "" } },
    setTimeout: (fn) => { timers.push(fn); return timers.length },
    clearTimeout: (id) => { timers[id - 1] = null },
  }
  const cache = new Map()
  function load(file) {
    const full = path.resolve(file)
    if (cache.has(full)) return cache.get(full)
    const output = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const module = { exports: {} }
    const req = (name) => {
      if (name === "react") return react
      if (name === "react/jsx-runtime") return { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) }
      if (name === "next/image") return { __esModule: true, default: "image" }
      if (name === "next/link") return { __esModule: true, default: "link" }
      if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
      if (name === "lucide-react") return { Repeat: "repeat-icon", Repeat1: "repeat-one-icon", Shuffle: "shuffle-icon" }
      let target = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(full), name)
      target += fs.existsSync(target + ".tsx") ? ".tsx" : ".ts"
      return load(target)
    }
    new Function("require", "module", "exports", "Audio", "window", "document", output)(req, module, module.exports, Audio, window, document)
    cache.set(full, module.exports)
    return module.exports
  }
  const Provider = load("components/audio/audio-provider.tsx").AudioProvider
  const Console = load("components/music/broadcast-console.tsx").BroadcastConsole
  const providerFrame = { slots: [], effects: [] }
  let consoleFrame = { slots: [], effects: [] }
  function draw(fn, f, attach) {
    frame = f; cursor = 0
    const tree = fn({ children: null })
    attach?.(tree)
    const effects = f.effects.splice(0)
    effects.forEach((effect) => effect())
    return tree
  }
  function api() { context = draw(Provider, providerFrame).props.value; return context }
  function screen() { api(); return draw(Console, consoleFrame) }
  function player() { api(); return load("components/audio/audio-player.tsx").AudioPlayer() }
  function leaveHome() {
    consoleFrame.slots.forEach((slot) => slot?.cleanup?.())
    consoleFrame = { slots: [], effects: [] }
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join(" ")
    if (node && typeof node === "object") return text(node.props?.children)
    return typeof node === "string" || typeof node === "number" ? String(node) : ""
  }
  function nodes(node, predicate) {
    if (Array.isArray(node)) return node.flatMap((item) => nodes(item, predicate))
    if (!node || typeof node !== "object") return []
    return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)]
  }
  function click(label) {
    const buttons = nodes(screen(), (node) => node.type === "button")
    const button = buttons.find((node) => node.props["aria-label"] === label || text(node).trim() === label)
    assert.ok(button, `button ${label} exists`)
    button.props.onClick?.()
  }
  const videoFrame = { slots: [], effects: [] }, controls = { current: null }
  let videoElement, videoKey
  function video(props) {
    const Component = load("components/music/broadcast-video.tsx").BroadcastVideo
    const tree = draw(() => Component(props, controls), videoFrame, (tree) => {
      const node = nodes(tree, (item) => item.type === "video")[0]
      if (!node) return
      if (node.key !== videoKey) { videoElement?.pause(); videoElement = new Audio(); videoElement.src = node.props.src; videoKey = node.key }
      node.props.ref.current = videoElement
    })
    return { node: nodes(tree, (item) => item.type === "video")[0], element: videoElement, controls: controls.current }
  }
  async function youtube(props) {
    const Component = load("components/music/youtube-player.tsx").YouTubePlayer
    const f = { slots: [], effects: [] }, controls = { current: null }
    const tree = draw(() => Component(props, controls), f, (node) => {
      const mount = nodes(node, (item) => item.type === "div" && item.props?.ref)[0]
      if (mount) mount.props.ref.current = {}
    })
    await Promise.resolve()
    return { tree, controls: controls.current, player: ytPlayers.at(-1) }
  }
  function keydown(overrides = {}, targetHandler) {
    const event = { code: "Space", repeat: false, defaultPrevented: false, propagationStopped: false, target: null,
      preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.propagationStopped = true }, ...overrides }
    for (const [listener, capture] of listeners.get("keydown") ?? []) if (capture) listener(event)
    if (!event.propagationStopped) targetHandler?.(event)
    if (!event.propagationStopped) for (const [listener, capture] of listeners.get("keydown") ?? []) if (!capture) listener(event)
    return event
  }
  function pressButton(button, code = "Space", overrides = {}, scope = null) {
    let activated = false, targetReceivedKey = false, blurred = false
    const target = {
      closest: (selector) => selector.split(",").some((part) => part.trim() === "button") ? target : null,
      matches: (selector) => scope !== null && selector.split(",").some((part) => part.trim() === `[${scope}] button`),
      blur: () => { blurred = true; document.activeElement = null },
    }
    document.activeElement = target
    const event = keydown({ code, target, ...overrides }, (event) => { targetReceivedKey = true; button.props.onKeyDown?.(event) })
    // Model the browser's button activation (Space keyup / Enter keydown).
    if (!event.defaultPrevented && !button.props.disabled && (code === "Space" || code === "Enter")) {
      activated = true
      button.props.onClick?.()
    }
    return { event, activated, targetReceivedKey, blurred }
  }
  return { api, audios, ytPlayers, load, screen, text, nodes, click, video, youtube, player, leaveHome, keydown, pressButton,
    focus: (target) => { document.activeElement = target }, activeElement: () => document.activeElement,
    keyListenerCount: () => listeners.get("keydown")?.size ?? 0,
    unmountProvider: () => providerFrame.slots.forEach((slot) => slot?.cleanup?.()),
    flush: () => timers.splice(0).forEach((fn) => fn?.()) }
}

test("shuffle cycles contain all items and never repeat their boundary", () => {
  const { shuffleCycle } = harness().load("lib/shuffle.ts")
  for (const count of [0, 1, 2, 3, 10]) {
    let previous = -1
    for (let cycle = 0; cycle < 100; cycle++) {
      const order = shuffleCycle(count, previous)
      assert.deepEqual([...order].sort((a, b) => a - b), Array.from({ length: count }, (_, i) => i))
      if (count > 1) assert.notEqual(order[0], previous)
      previous = order.at(-1)
    }
  }
})

function realMusic(h) {
  const { artists, releases } = h.load("lib/data.ts")
  return h.load("lib/broadcast.ts").artistPlaylist(artists[1], releases)
}
test("real playlists and artwork derive from release relationships", () => {
  const h = harness(), { artists, releases } = h.load("lib/data.ts"), { artistPlaylist } = h.load("lib/broadcast.ts")
  const danootTracks = artistPlaylist(artists[0], releases)
  assert.deepEqual(danootTracks.map((track) => track.title), ["erou fara pelerina"])
  assert.equal(danootTracks[0].artwork, "/images/erou-fara-pelerina-cover.jpg")
  assert.equal(artistPlaylist(artists[2], releases).length, 0)
  const tracks = realMusic(h)
  assert.deepEqual(tracks.map((t) => t.title), ["printul persiei", "grabba"])
  tracks.forEach((track) => { assert.equal(track.artwork, releases[0].artwork); assert.equal(track.releaseSlug, releases[0].slug); assert.ok(fs.existsSync(`public${track.audioUrl}`)) })
})
test("Danoot's normal single flows through MUSIC, releases, SINGLES, and its own OPTIONS queue", () => {
  const h = harness("?tv=1&artist=danoot&mode=music")
  const { artists, releases } = h.load("lib/data.ts")
  const { artistPlaylist, releasePlaylist } = h.load("lib/broadcast.ts")
  const danoot = artists.find((artist) => artist.slug === "danoot")
  const release = releases.find((item) => item.slug === "danoot-erou-fara-pelerina")
  assert.ok(fs.statSync("public/audio/danoot/erou-fara-pelerina.wav").size > 0)
  assert.ok(fs.statSync("public/images/erou-fara-pelerina-cover.jpg").size > 0)
  assert.equal(fs.existsSync("public/images/erou-fara-pelerina-cover.png"), false)
  assert.deepEqual(danoot.releaseSlugs, ["danoot-erou-fara-pelerina"])
  assert.equal(release.type, "Single"); assert.equal(release.title, "erou fara pelerina")
  assert.equal(release.artistSlug, "danoot"); assert.equal(release.artistName, "Danoot feat. Mazé Foram")
  assert.equal(release.artwork, "/images/erou-fara-pelerina-cover.jpg")
  assert.deepEqual(release.tracklist, [{ id: "danoot-erou-fara-pelerina", title: "erou fara pelerina", duration: "2:41", audioUrl: "/audio/danoot/erou-fara-pelerina.wav" }])
  assert.deepEqual(artistPlaylist(danoot, releases).map((track) => track.id), ["danoot-erou-fara-pelerina"])
  assert.equal(releasePlaylist(release).length, 1)
  assert.equal(releasePlaylist(release)[0].artist, "Danoot feat. Mazé Foram")
  assert.equal(danoot.exclusives.length, 10)
  assert.ok(!danoot.exclusives.some((item) => item.id === "danoot-erou-fara-pelerina" || item.audioUrl === "/audio/danoot/erou-fara-pelerina.wav"))

  h.screen()
  assert.equal(h.api().playbackMode, "station")
  assert.equal(h.api().stationArtistSlug, "danoot")
  assert.equal(h.api().current.id, "danoot-erou-fara-pelerina")
  assert.equal(h.api().current.artist, "Danoot feat. Mazé Foram")
  assert.equal(h.api().current.artwork, "/images/erou-fara-pelerina-cover.jpg")
  assert.ok(h.nodes(h.screen(), (node) => node.type === "image" && node.props.src === "/images/erou-fara-pelerina-cover.jpg").length)

  h.click("OPTIONS"); h.click("OK") // SINGLES
  assert.match(h.text(h.screen()), /erou fara pelerina/)
  h.click("OK") // release detail
  assert.match(h.text(h.screen()), /erou fara pelerina/)
  h.click("OK") // exact track
  assert.equal(h.api().playbackMode, "queue")
  assert.equal(h.api().queueLength, 1)
  assert.equal(h.api().current.id, "danoot-erou-fara-pelerina")
  assert.equal(h.api().current.artist, "Danoot feat. Mazé Foram")
  const audio = h.audios[0]
  audio.currentTime = 54; audio.ontimeupdate()
  h.keydown({ target: null }); assert.equal(audio.paused, true)
  h.keydown({ target: null }); assert.equal(audio.paused, false); assert.equal(audio.currentTime, 54)
  h.api().nextTrack(); assert.equal(h.api().current.id, "danoot-erou-fara-pelerina")
  h.api().previousTrack(); assert.equal(h.api().current.id, "danoot-erou-fara-pelerina")
  h.api().cycleRepeat(); assert.equal(h.api().repeatMode, "all")
  audio.end(); assert.equal(h.api().current.id, "danoot-erou-fara-pelerina")
  assert.equal(h.api().shuffle, false) // one-track queue keeps shuffle disabled
})
test("station cycles, preferred start, and user-controlled shuffle/repeat", () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("moxli", tracks, tracks[0].id)
  const audio = h.audios[0]
  assert.equal(h.api().current.id, tracks[0].id)
  audio.currentTime = 42
  const loads = audio.loads
  h.api().startStation("moxli", tracks)
  assert.equal(audio.loads, loads)
  assert.equal(audio.currentTime, 42)
  for (let i = 0; i < 12; i++) { audio.end(); assert.equal(h.api().current.id, tracks[(i + 1) % 2].id) }
  const playingId = h.api().current.id, playingTime = audio.currentTime, loadsBeforeShuffle = audio.loads
  h.api().toggleShuffle(); h.api().cycleRepeat()
  assert.equal(h.api().shuffle, false); assert.equal(h.api().repeatMode, "one")
  assert.equal(h.api().current.id, playingId); assert.equal(audio.currentTime, playingTime); assert.equal(audio.loads, loadsBeforeShuffle)
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, true)
  h.api().cycleRepeat(); assert.equal(h.api().repeatMode, "off")
  const staleEnd = audio.onended
  h.api().startStation("danoot", [])
  staleEnd()
  assert.equal(h.api().current, null); assert.equal(audio.paused, true)
  assert.equal(h.audios.length, 1)
})
test("video and off ownership block all ordinary music entry points", () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("moxli", tracks)
  for (const owner of ["video", "browsing", "off"]) {
    h.api().suspend(owner)
    h.api().toggle(); h.api().resume(); h.api().play(tracks[0]); h.api().playQueue(tracks, 0)
    assert.equal(h.audios[0].paused, true); assert.equal(h.api().owner, owner)
  }
  h.api().startStation("moxli", tracks)
  assert.equal(h.audios[0].paused, false)
})
test("exclusive audio restores station position and remaining shuffle", () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("moxli", tracks, tracks[0].id)
  h.audios[0].currentTime = 33
  // Reuse real audio as a test double; no exclusive entries are added to site data.
  h.api().playExclusive({ ...tracks[1], id: "test-exclusive" })
  h.audios[0].end()
  assert.equal(h.api().current.id, "test-exclusive")
  assert.equal(h.api().isPlaying, false)
  h.api().restoreStation()
  assert.equal(h.api().current.id, tracks[0].id)
  assert.equal(h.audios[0].currentTime, 33)
  h.audios[0].end()
  assert.equal(h.api().current.id, tracks[1].id)
})
test("autoplay failure retains track and OK-style resume retries", async () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("danoot", [])
  h.audios[0].rejectPlay = true
  h.api().startStation("moxli", tracks, tracks[0].id)
  await Promise.resolve(); await Promise.resolve()
  assert.equal(h.api().needsGesture, true); assert.equal(h.api().current.id, tracks[0].id)
  h.audios[0].rejectPlay = false
  h.api().resume()
  assert.equal(h.api().needsGesture, false); assert.equal(h.audios[0].paused, false)
})
test("failed station sources stop after bounded attempts", () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("moxli", tracks)
  h.audios[0].fail(); h.audios[0].fail()
  assert.equal(h.api().mediaError, true)
  assert.equal(h.api().isPlaying, false)
})
test("remote deep link, archive artist MUSIC context, video, HOME, and powered-off guards", () => {
  const h = harness("?tv=1&artist=moxli&view=albums-eps&release=moxli-nostalgia-omoara-progresul")
  h.screen()
  assert.equal(h.api().current.title, "printul persiei")
  h.click("ARCHIVE"); assert.match(h.text(h.screen()), /Andreas Shinso/)
  h.click("Menu down"); h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  assert.match(h.text(h.screen()), /ARCHIVE \/ MOISE6969/i)
  h.click("VIDEOS"); assert.equal(h.api().owner, "video")
  assert.match(h.text(h.screen()), /STONER/)
  h.click("OK"); assert.ok(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length)
  h.click("BACK"); assert.match(h.text(h.screen()), /STONER/)
  h.click("BACK"); assert.match(h.text(h.screen()), /NO MUSIC YET/)
  assert.equal(h.api().owner, "music")
  h.click("BACK"); assert.match(h.text(h.screen()), />\s+moise6969/)
  h.click("MUSIC"); assert.match(h.text(h.screen()), /ARCHIVE \/ moise6969/i)
  assert.equal(h.api().tvArtistContext.kind, "archive")
  h.click("HOME"); assert.match(h.text(h.screen()), /CH 02 \/ MoxLi/i)
  assert.equal(h.api().tvArtistContext.kind, "official"); assert.equal(h.api().tvArtistContext.slug, "moxli")
  h.click("ARCHIVE"); h.click("OK")
  h.click("Channel up"); assert.match(h.text(h.screen()), /ARCHIVE \/ 2007/i)
  assert.equal(h.api().tvArtistContext.kind, "archive"); assert.equal(h.api().tvArtistContext.id, "2007")
  assert.equal(h.api().stationArtistSlug, "2007")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  h.click("Channel down"); assert.match(h.text(h.screen()), /ARCHIVE \/ moise6969/i)
  assert.equal(h.api().tvArtistContext.id, "moise6969")
  h.click("VIDEOS"); assert.equal(h.api().owner, "video")
  h.click("Channel up"); assert.match(h.text(h.screen()), /IX/)
  assert.equal(h.api().tvArtistContext.id, "2007"); assert.equal(h.api().owner, "video")
  h.click("Channel down"); assert.match(h.text(h.screen()), /STONER/)
  assert.equal(h.api().tvArtistContext.id, "moise6969"); assert.equal(h.api().owner, "video")
  h.click("OK")
  assert.ok(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length)
  h.click("Channel up")
  assert.match(h.text(h.screen()), /IX/)
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  assert.equal(h.api().tvArtistContext.id, "2007"); assert.equal(h.api().owner, "video")
  assert.match(fs.readFileSync(path.resolve("components/music/broadcast-console.tsx"), "utf8"), /const stopVideo = \(\) => \{[\s\S]*youtubeRef\.current\?\.pause\(\)/)
  h.click("HOME"); assert.equal(h.api().owner, "music"); assert.equal(h.api().stationArtistSlug, "moxli")
  assert.equal(h.api().tvArtistContext.kind, "official")
  h.click("EXCLUSIVE"); h.click("Next track"); h.click("OK"); assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
  h.click("POWER"); h.flush()
  for (const button of ["HOME", "MUSIC", "VIDEOS", "ARCHIVE", "EXCLUSIVE", "OK", "BACK", "Channel up", "Channel down"]) {
    h.click(button); assert.equal(h.api().owner, "off")
  }
  h.click("TV power"); h.flush()
  assert.equal(h.api().owner, "music"); assert.match(h.text(h.screen()), /printul persiei/)
  h.click("Channel up")
  assert.equal(h.api().tvArtistContext.kind, "official"); assert.equal(h.api().stationArtistSlug, "matei")
  assert.equal(h.api().current, null); assert.equal(h.audios[0].paused, true)
  h.click("Channel down")
  assert.equal(h.api().tvArtistContext.slug, "moxli")
  h.click("Channel down")
  assert.equal(h.api().tvArtistContext.slug, "danoot")
  h.click("Channel up")
  assert.equal(h.api().tvArtistContext.slug, "moxli")
  h.leaveHome(); h.screen()
  assert.equal(h.api().tvArtistContext.slug, "moxli")
  h.click("POWER"); h.flush(); h.click("POWER"); h.flush()
  assert.equal(h.api().owner, "music")
})

test("official and archive artist channel controls cycle only within their own context", () => {
  const official = harness("?tv=1&artist=moxli&mode=music")
  official.screen()
  official.click("Channel up")
  assert.equal(official.api().tvArtistContext.kind, "official")
  assert.equal(official.api().tvArtistContext.slug, "matei")
  assert.equal(official.api().lastOfficialArtistSlug, "matei")
  official.click("Channel down")
  assert.equal(official.api().tvArtistContext.kind, "official")
  assert.equal(official.api().tvArtistContext.slug, "moxli")
  assert.equal(official.api().lastOfficialArtistSlug, "moxli")

  const cases = [
    [2, "Channel up", "2007"],
    [2, "Channel down", "cyupercah"],
    [3, "Channel up", "andreas-shinso"],
    [0, "Channel down", "2007"],
  ]
  for (const [startIndex, control, expectedId] of cases) {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen(); h.click("ARCHIVE")
    for (let step = 0; step < startIndex; step++) h.click("Menu down")
    h.click("OK"); h.click(control)
    assert.equal(h.api().tvArtistContext.kind, "archive")
    assert.equal(h.api().tvArtistContext.id, expectedId)
    assert.equal(h.api().stationArtistSlug, expectedId)
    assert.match(h.text(h.screen()), /ARCHIVE \/ /i)
    assert.match(h.text(h.screen()), /NO MUSIC YET/)
  }
})

test("archive OPTIONS channel switching keeps its browser and resolves the new artist releases", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("ARCHIVE"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
  h.click("OPTIONS"); h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO\s+PROJECTS\s+YET/)
  h.click("Channel up")
  assert.equal(h.api().tvArtistContext.kind, "archive")
  assert.equal(h.api().tvArtistContext.id, "2007")
  assert.match(h.text(h.screen()), /NO\s+PROJECTS\s+YET/)
})

test("HOME from archive screens restores the last official artist; MUSIC stays in archive context", () => {
  for (const destination of ["music", "options", "videos", "player"]) {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen(); const officialTrackId = h.api().current?.id
    h.click("ARCHIVE"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
    if (destination === "options") h.click("OPTIONS")
    if (destination === "videos" || destination === "player") {
      h.click("VIDEOS")
      if (destination === "player") h.click("OK")
    }
    h.click("HOME")
    assert.equal(h.api().tvArtistContext.kind, "official", destination)
    assert.equal(h.api().tvArtistContext.slug, "moxli", destination)
    assert.equal(h.api().lastOfficialArtistSlug, "moxli")
    assert.match(h.text(h.screen()), /CH 02 \/ MoxLi/i)
    assert.equal(h.api().current?.id, officialTrackId)
    assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  }

  const matei = harness("?tv=1&artist=matei&mode=music")
  matei.screen(); matei.click("ARCHIVE")
  for (let step = 0; step < 3; step++) matei.click("Menu down")
  matei.click("OK"); matei.click("HOME")
  assert.equal(matei.api().tvArtistContext.kind, "official")
  assert.equal(matei.api().tvArtistContext.slug, "matei")
  assert.match(matei.text(matei.screen()), /CH 03 \/ Matei!/i)
})

test("HOME restores a cached official station without losing its position or queue controls", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const audio = h.audios[0]
  audio.currentTime = 43; audio.ontimeupdate()
  const trackId = h.api().current.id
  h.api().toggleShuffle()
  h.api().cycleRepeat()
  const shuffle = h.api().shuffle, repeat = h.api().repeatMode
  h.click("ARCHIVE"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
  h.click("HOME")
  assert.equal(h.api().tvArtistContext.slug, "moxli")
  assert.equal(h.api().stationArtistSlug, "moxli")
  assert.equal(h.api().current.id, trackId)
  assert.equal(h.api().currentTime, 43)
  assert.equal(audio.currentTime, 43)
  assert.equal(h.api().shuffle, shuffle)
  assert.equal(h.api().repeatMode, repeat)
  h.api().cycleRepeat()
  h.api().cycleRepeat() // Enable wraparound even when shuffle initially selected the final track.
  h.click("Next track")
  assert.notEqual(h.api().current.id, trackId)
})

test("three-track provider cycles include the previous final song, and one track loops", () => {
  const h = harness()
  const tracks = [...realMusic(h), { ...realMusic(h)[0], id: "third-test-track" }]
  h.api().startStation("test-station", tracks, tracks[0].id)
  let previous = null
  for (let cycle = 0; cycle < 12; cycle++) {
    const ids = []
    for (let i = 0; i < 3; i++) {
      const id = h.api().current.id
      if (i === 0) assert.notEqual(id, previous)
      ids.push(id); previous = id; h.audios[0].end()
    }
    assert.equal(new Set(ids).size, 3)
  }
  h.api().startStation("single-test", [tracks[0]])
  for (let i = 0; i < 3; i++) { h.audios[0].end(); assert.equal(h.api().current.id, tracks[0].id); assert.equal(h.audios[0].paused, false) }
})

test("exclusive single video playback pauses and resumes without an automatic playlist", () => {
  const h = harness()
  const video = { id: "0", title: "Test", source: { kind: "file", src: "test-only.mp4" } }
  const props = { video, active: true, volume: 0.4 }
  let v = h.video(props)
  v.element.currentTime = 27
  v = h.video({ ...props, active: false })
  assert.equal(v.element.paused, true)
  v = h.video(props)
  assert.equal(v.element.currentTime, 27); assert.equal(v.element.paused, false)
  assert.equal(v.element.volume, 0.4)
  const single = harness(), oneProps = { video, active: true, volume: 0.8 }
  single.video(oneProps)
  const one = single.video(oneProps)
  one.element.ended = true; one.element.paused = true
  one.node.props.onEnded({ currentTarget: one.element })
  assert.equal(single.video(oneProps).element, one.element)
  assert.equal(one.element.paused, true)
})

function exclusiveRows(h) {
  return h.nodes(h.screen(), (node) => node.props?.role === "group" && node.props["data-selected-artist"])
    .map((node) => `${node.props["data-focused"] ? ">  " : ""}${node.props["data-selected-artist"]}`)
}
for (const [index, name] of ["Danoot", "MoxLi", "Matei!"].entries()) {
  test(`EXCLUSIVE selects ${name} independently, locks channels, and preserves BACK highlight`, () => {
    const original = name === "Danoot" ? "moxli" : "danoot"
    const h = harness(`?tv=1&artist=${original}&mode=music`)
    h.screen()
    const audio = h.audios[0], loads = audio.loads
    h.click("EXCLUSIVE")
    assert.deepEqual(exclusiveRows(h), [">  Danoot", "Andreas Shinso"])
    assert.doesNotMatch(h.text(h.screen()), /NO EXCLUSIVES YET/)
    for (const button of ["Channel up", "Channel down"]) {
      h.click(button)
      assert.equal(h.api().stationArtistSlug, original)
      assert.equal(audio.loads, loads)
      assert.equal(exclusiveRows(h).length, 2)
    }
    for (let n = 0; n < index; n++) h.click("Next track")
    h.click("OK")
    assert.match(h.text(h.screen()), new RegExp(`${name.replace("!", "\\!")} / EXCLUSIVE`))
    assert.match(h.text(h.screen()), name === "Danoot" ? /CASIO/ : /NO EXCLUSIVES YET/)
    assert.equal(h.api().stationArtistSlug, original)
    for (const button of ["Channel up", "Channel down"]) {
      h.click(button)
      assert.match(h.text(h.screen()), name === "Danoot" ? /CASIO/ : /NO EXCLUSIVES YET/)
      assert.equal(h.api().stationArtistSlug, original)
      assert.equal(audio.loads, loads)
    }
    h.click("BACK")
    const rows = exclusiveRows(h)
    assert.equal(rows[0], `>  ${name}`)
    h.click("BACK")
    assert.equal(exclusiveRows(h).length, 0)
    assert.equal(h.api().owner, "music")
    assert.equal(h.api().stationArtistSlug, original)
    h.click("Channel up")
    assert.notEqual(h.api().stationArtistSlug, original)
  })
}

test("Danoot CASIO uses the real exclusive WAV, global player controls, and suspended-station navigation", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  const { artists, releases } = h.load("lib/data.ts")
  const danoot = artists.find((artist) => artist.slug === "danoot")
  assert.deepEqual(danoot.exclusives[0], { id: "danoot-casio", title: "CASIO", kind: "audio", audioUrl: "/audio/danoot/exclusive/casio.wav", coverUrl: "/images/casio-cover.jpg" })
  assert.ok(fs.statSync("public/images/casio-cover.jpg").size > 0)
  assert.ok(fs.statSync(`public${danoot.exclusives[0].audioUrl}`).size > 0)
  const normalTracks = h.load("lib/broadcast.ts").artistPlaylist(danoot, releases)
  assert.deepEqual(normalTracks.map((track) => track.id), ["danoot-erou-fara-pelerina"])
  assert.doesNotMatch(JSON.stringify(normalTracks), /danoot-casio|casio\.wav|exclusive/)
  assert.doesNotMatch(JSON.stringify(releases), /danoot-casio|CASIO|casio\.wav/)
  assert.ok(artists.filter((artist) => artist !== danoot).every((artist) => !JSON.stringify(artist.exclusives).includes("danoot-casio")))
  assert.ok(artists.filter((artist) => artist !== danoot).every((artist) => artist.exclusives.length === 0))
  h.screen()
  const audio = h.audios[0], stationTrack = h.api().current.id
  audio.currentTime = 27
  const lockedNavigation = () => {
    const before = h.text(h.screen()), loads = audio.loads
    for (const label of ["OPTIONS", "Channel up", "Channel down"]) {
      h.click(label)
      assert.equal(h.text(h.screen()), before)
      assert.equal(audio.loads, loads)
      assert.equal(h.api().stationArtistSlug, "moxli")
    }
  }
  h.click("EXCLUSIVE")
  assert.ok(exclusiveRows(h).includes(">  Danoot"))
  assert.equal(audio.paused, true)
  lockedNavigation()
  h.click("OK")
  assert.match(h.text(h.screen()), /Danoot \/ EXCLUSIVE/)
  assert.equal(h.text(h.nodes(h.screen(), (node) => node.key === "danoot-casio")[0]).trim(), ">  CASIO")
  assert.equal(audio.paused, true)
  lockedNavigation()
  h.click("OK")
  assert.equal(h.api().playbackMode, "exclusive")
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(audio.src, "/audio/danoot/exclusive/casio.wav")
  assert.equal(audio.paused, false)
  assert.equal(h.audios.length, 1)
  assert.equal(h.api().current.title, "CASIO")
  assert.equal(h.api().current.artist, "Danoot")
  assert.match(h.text(h.player()), /CASIO\s+Danoot/)
  lockedNavigation()
  const control = (label) => h.nodes(h.player(), (node) => node.props?.["aria-label"] === label)[0]
  assert.equal(control("Pause").props.disabled, false)
  control("Pause").props.onClick(); assert.equal(audio.paused, true)
  control("Play").props.onClick(); assert.equal(audio.paused, false)
  assert.equal(control("Seek").props.disabled, false)
  control("Seek").props.onClick({ clientX: 60, currentTarget: { getBoundingClientRect: () => ({ left: 10, width: 100 }) } })
  assert.equal(audio.currentTime, 60)
  control("Volume").props.onChange({ target: { value: "0.35" } })
  assert.equal(audio.volume, 0.35)
  audio.end()
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(audio.paused, true)
  h.click("OK"); assert.equal(audio.paused, false)
  h.click("BACK")
  assert.match(h.text(h.screen()), /Danoot \/ EXCLUSIVE/)
  assert.ok(h.nodes(h.screen(), (node) => node.key === "danoot-casio").length)
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(audio.paused, false)
  lockedNavigation()
  h.click("BACK")
  assert.equal(exclusiveRows(h)[0], ">  Danoot")
  assert.equal(audio.paused, false)
  lockedNavigation()
  h.click("Next track"); h.click("OK") // Browsing MoxLi cannot replace Danoot's queue.
  assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(audio.paused, false)
  h.click("BACK"); h.click("Menu down"); h.click("Next track")
  assert.equal(audio.paused, false)
  assert.equal(h.api().current.id, "danoot-casio")
  h.click("HOME")
  assert.equal(h.api().current.id, stationTrack)
  assert.equal(audio.currentTime, 27)
  assert.equal(audio.paused, false)
  assert.equal(h.api().playbackMode, "station")
})

test("EXCLUSIVE always reopens the artist list and BACK restores VIDEO mode", () => {
  const h = harness()
  h.screen(); h.click("POWER"); h.flush(); h.click("VIDEOS"); h.click("EXCLUSIVE")
  h.click("Previous track") // Wrap from Danoot to Matei!.
  h.click("OK")
  assert.match(h.text(h.screen()), /Matei! \/ EXCLUSIVE/)
  h.click("EXCLUSIVE")
  assert.deepEqual(exclusiveRows(h), [">  Matei!", "Andreas Shinso"])
  h.click("BACK")
  assert.equal(h.api().owner, "video")
  assert.equal(h.api().stationArtistSlug, "danoot")
  assert.match(h.text(h.screen()), /CH 01 \/ Danoot \/ VIDEO/)
})

test("future exclusive items resolve the browsed artist, lock channels, and restore the original station", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  const artists = h.load("lib/data.ts").artists
  // Memory-only fixture: no invented exclusive content is written to site data.
  artists.find((artist) => artist.slug === "matei").exclusives.push({
    id: "test-exclusive", title: "Test audio", kind: "audio", audioUrl: realMusic(h)[0].audioUrl,
  })
  h.screen()
  const track = h.api().current.id
  h.audios[0].currentTime = 24
  h.click("EXCLUSIVE"); h.click("Previous track"); h.click("OK"); h.click("OK")
  assert.equal(h.api().current.artistSlug, "matei")
  assert.equal(h.api().stationArtistSlug, "moxli")
  const loads = h.audios[0].loads
  for (const button of ["Channel up", "Channel down"]) {
    h.click(button)
    assert.equal(h.api().current.id, "test-exclusive")
    assert.equal(h.api().stationArtistSlug, "moxli")
    assert.equal(h.audios[0].loads, loads)
  }
  h.click("BACK")
  assert.equal(h.api().current.id, "test-exclusive")
  assert.equal(h.audios[0].paused, false)
  assert.match(h.text(h.screen()), /Matei! \/ EXCLUSIVE/)
  h.click("BACK")
  assert.equal(exclusiveRows(h)[0], ">  Matei!")
  h.click("BACK")
  assert.match(h.text(h.screen()), /CH 02 \/ MoxLi \/ MUSIC/)
  assert.equal(h.api().current.id, track)
  assert.equal(h.audios[0].currentTime, 24)
})


test("artist selector has two visible rows, exact orders, wraparound, and independent selection memory", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE")
  assert.match(h.text(h.screen()), /SELECT YOUR ARTIST/)
  assert.doesNotMatch(h.text(h.screen()), /fighter/i)
  const groups = () => h.nodes(h.screen(), (node) => node.props?.role === "group" && node.props["data-selected-artist"])
  assert.deepEqual(groups().map((node) => node.props["aria-label"]), ["MEMBERS", "ARCHIVE"])
  assert.deepEqual(exclusiveRows(h), [">  Danoot", "Andreas Shinso"])
  h.click("Previous track"); assert.equal(exclusiveRows(h)[0], ">  Matei!")
  h.click("Next track"); assert.equal(exclusiveRows(h)[0], ">  Danoot")
  h.click("Next track"); assert.equal(exclusiveRows(h)[0], ">  MoxLi")
  h.click("Next track"); assert.equal(exclusiveRows(h)[0], ">  Matei!")
  h.click("Menu down")
  assert.deepEqual(exclusiveRows(h), ["Matei!", ">  Andreas Shinso"])
  h.click("Previous track"); assert.equal(exclusiveRows(h)[1], ">  2007")
  h.click("Next track"); assert.equal(exclusiveRows(h)[1], ">  Andreas Shinso")
  for (const name of ["Cyupercah", "moise6969", "2007", "Andreas Shinso"]) {
    h.click("Next track"); assert.equal(exclusiveRows(h)[1], `>  ${name}`)
  }
  h.click("Menu up"); assert.deepEqual(exclusiveRows(h), [">  Matei!", "Andreas Shinso"])
  h.click("OK"); assert.match(h.text(h.screen()), /Matei! \/ EXCLUSIVE/)
  h.click("BACK"); assert.deepEqual(exclusiveRows(h), [">  Matei!", "Andreas Shinso"])
  h.click("Menu up"); assert.equal(exclusiveRows(h)[1], ">  Andreas Shinso")
  h.click("Menu down"); assert.equal(exclusiveRows(h)[0], ">  Matei!")
})

for (const [index, name] of ["Andreas Shinso", "Cyupercah", "moise6969", "2007"].entries()) {
  test(`EXCLUSIVE archive artist ${name} opens an empty list and preserves selection`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    const archive = h.load("lib/archive.ts").archiveArtists
    assert.deepEqual(archive[index].exclusives, [])
    const videos = JSON.stringify(archive.map((artist) => artist.videos))
    h.screen(); h.click("EXCLUSIVE"); h.click("Menu down")
    for (let step = 0; step < index; step++) h.click("Next track")
    h.click("OK")
    assert.ok(h.text(h.screen()).includes(`${name} / EXCLUSIVE`))
    assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
    const before = h.text(h.screen())
    for (const label of ["OPTIONS", "Channel up", "Channel down", "Next track", "Previous track", "OK"]) {
      h.click(label); assert.equal(h.text(h.screen()), before)
      assert.equal(h.audios[0].paused, true)
    }
    h.click("BACK"); assert.equal(exclusiveRows(h)[1], `>  ${name}`)
    assert.equal(h.api().tvArtistContext.slug, "moxli")
    assert.equal(JSON.stringify(archive.map((artist) => artist.videos)), videos)
    h.click("BACK"); assert.equal(h.api().stationArtistSlug, "moxli")
    assert.equal(h.audios[0].paused, false)
  })
}

function startCasio(h) {
  h.screen(); h.click("EXCLUSIVE"); h.click("OK"); h.click("OK")
  assert.equal(h.api().current.id, "danoot-casio")
}

const danootProjects = [
  { id: "veni-vidi-vici", title: ".VENI.VIDI.VICI.", titles: ["buimac", "feste", "kubrick", "singur pe pamant", "injunghiat", "venividivici"], files: ["buimac", "feste", "kubrick", "singur-pe-pamant", "injunghiat", "venividivici"], start: 2, offset: 1 },
  { id: "mainile-peste-ochi", title: "mainile peste ochi", titles: ["mainile peste ochi", "dus cu pluta", "circ"], files: ["mainile-peste-ochi", "dus-cu-pluta", "circ"], start: 1, offset: 7 },
]

test("Danoot exclusive EP data has exact titles, paths, track numbers, and real WAVs without normal releases", () => {
  const h = harness(), { artists, releases } = h.load("lib/data.ts")
  const danoot = artists.find((artist) => artist.slug === "danoot")
  assert.equal(danoot.exclusives.length, 10)
  assert.equal(new Set(danoot.exclusives.map((item) => item.id)).size, 10)
  assert.deepEqual(danoot.exclusives[0], { id: "danoot-casio", title: "CASIO", kind: "audio", audioUrl: "/audio/danoot/exclusive/casio.wav", coverUrl: "/images/casio-cover.jpg" })
  for (const project of danootProjects) {
    const items = danoot.exclusives.filter((item) => item.projectId === project.id)
    const coverUrl = project.id === "veni-vidi-vici" ? "/images/veni-vidi-vici-cover.jpg" : "/images/mainile-peste-ochi-cover.png"
    assert.ok(fs.statSync(`public${coverUrl}`).size > 0)
    assert.deepEqual(items.map(({ title, kind, projectId, projectTitle, trackNumber, audioUrl, coverUrl: itemCover }) => ({ title, kind, projectId, projectTitle, trackNumber, audioUrl, coverUrl: itemCover })), project.titles.map((title, index) => ({
      title, kind: "audio", projectId: project.id, projectTitle: project.title, trackNumber: index + 1, coverUrl,
      audioUrl: `/audio/danoot/exclusive/${project.id}/${project.files[index]}.wav`,
    })))
    for (const item of items) {
      assert.ok(fs.statSync(`public${item.audioUrl}`).size > 0)
      assert.equal(item.artwork, undefined)
    }
  }
  assert.deepEqual(danoot.releaseSlugs, ["danoot-erou-fara-pelerina"])
  assert.deepEqual(h.load("lib/broadcast.ts").artistPlaylist(danoot, releases).map((track) => track.title), ["erou fara pelerina"])
  assert.doesNotMatch(JSON.stringify(releases), /veni-vidi-vici|mainile-peste-ochi|buimac|casio/i)
  assert.ok(!danoot.exclusives.some((item) => item.id === "danoot-erou-fara-pelerina" || item.audioUrl === "/audio/danoot/erou-fara-pelerina.wav"))
  assert.ok(artists.filter((artist) => artist !== danoot).every((artist) => artist.exclusives.length === 0))
  assert.ok(h.load("lib/archive.ts").archiveArtists.every((artist) => artist.exclusives.length === 0))
})

test("exclusive project headers are bracketed labels and UP/DOWN visits only the ten real tracks", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE"); h.click("OK")
  const headers = h.nodes(h.screen(), (node) => node.type === "div" && node.key?.startsWith("project-"))
  assert.deepEqual(headers.map((node) => h.text(node).replace(/\s+/g, " ").trim()), ["[ .VENI.VIDI.VICI. ]", "[ mainile peste ochi ]"])
  headers.forEach((node) => { assert.equal(node.props.onClick, undefined); assert.equal(node.props.tabIndex, undefined); assert.equal(node.props.ref, undefined) })
  const items = h.load("lib/data.ts").artists[0].exclusives
  assert.deepEqual(h.nodes(h.screen(), (node) => items.some((item) => item.id === node.key)).map((node) => h.text(node).trim().replace(/^>\s*/, "")), ["CASIO", ...danootProjects.flatMap((project) => project.titles)])
  const selected = () => h.nodes(h.screen(), (node) => items.some((item) => item.id === node.key) && h.text(node).trim().startsWith(">"))
  for (const item of items) {
    assert.equal(selected().length, 1)
    assert.equal(selected()[0].key, item.id)
    h.click("Menu down")
  }
  assert.equal(selected()[0].key, "danoot-casio")
  h.click("Menu up"); assert.equal(selected()[0].key, items.at(-1).id)
  const before = h.text(h.screen())
  for (const label of ["OPTIONS", "Channel up", "Channel down"]) {
    h.click(label); assert.equal(h.text(h.screen()), before)
  }
})

test("Danoot exclusive covers render on CASIO and project headers; playing art stays attached to audio", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE"); h.click("OK")
  const imgs = () => h.nodes(h.screen(), (node) => node.type === "image")
  const danoot = h.load("lib/data.ts").artists[0]
  assert.ok(imgs().some((node) => node.props.src === "/images/casio-cover.jpg" && node.props.width === 44 && node.props.height === 44))
  const projectImages = imgs().filter((node) => node.props.src === "/images/veni-vidi-vici-cover.jpg" || node.props.src === "/images/mainile-peste-ochi-cover.png")
  assert.deepEqual(projectImages.map((node) => node.props.src), ["/images/veni-vidi-vici-cover.jpg", "/images/mainile-peste-ochi-cover.png"])
  assert.ok(projectImages.every((node) => node.props.alt === "" && node.props.width === 44 && node.props.height === 44))
  h.click("Menu down")
  const selectedProject = h.nodes(h.screen(), (node) => node.type === "image" && node.props.src === "/images/veni-vidi-vici-cover.jpg")[0]
  assert.ok(selectedProject.props.className.includes("brightness-100"))
  h.click("Menu up")
  const casioRow = h.nodes(h.screen(), (node) => node.key === "danoot-casio")[0]
  assert.ok(h.nodes(casioRow, (node) => node.type === "image" && node.props.src === "/images/casio-cover.jpg").length)
  h.click("Menu down"); h.click("OK")
  assert.ok(imgs().some((node) => node.props.src === "/images/veni-vidi-vici-cover.jpg"))
  assert.ok(h.nodes(h.player(), (node) => node.type === "image" && node.props.src === "/images/veni-vidi-vici-cover.jpg").length)
  assert.equal(h.api().current.title, "buimac")
  assert.equal(h.api().current.artist, "Danoot")
  assert.equal(danoot.exclusives.find((item) => item.id === "danoot-casio").coverUrl, "/images/casio-cover.jpg")
})

test("exclusive artwork fills the CRT viewport for CASIO and both project covers", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  const coverImages = () => h.nodes(h.screen(), (node) => node.type === "image" && [
    "/images/casio-cover.jpg", "/images/veni-vidi-vici-cover.jpg", "/images/mainile-peste-ochi-cover.png",
  ].includes(node.props.src))
  h.screen(); h.click("EXCLUSIVE"); h.click("OK")
  h.click("OK") // CASIO
  let image = coverImages().find((node) => node.props.src === "/images/casio-cover.jpg" && node.props.fill && node.props.className.includes("object-cover") && node.props.style)
  assert.ok(image)
  assert.equal(image.props.style.objectPosition, "center")
  assert.doesNotMatch(image.props.className, /object-contain|p-5|p-8/)
  h.click("BACK"); h.click("Menu down"); h.click("OK") // buimac
  image = coverImages().find((node) => node.props.src === "/images/veni-vidi-vici-cover.jpg" && node.props.fill && node.props.className.includes("object-cover") && node.props.style)
  assert.ok(image); assert.equal(image.props.style.objectPosition, "center 10%")
  h.click("BACK"); h.click("Menu down"); h.click("Menu down"); h.click("Menu down"); h.click("Menu down"); h.click("Menu down"); h.click("Menu down"); h.click("Menu down"); h.click("OK") // dus cu pluta
  image = coverImages().find((node) => node.props.src === "/images/mainile-peste-ochi-cover.png" && node.props.fill && node.props.className.includes("object-cover") && node.props.style)
  assert.ok(image); assert.equal(image.props.style.objectPosition, "left center"); assert.equal(image.props.style.transform, "scale(1.08)")
})

for (const project of danootProjects) {
  test(`${project.title} starts at the selected song, retains its own queue through BACK/Space, and ends within the project`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen(); h.click("EXCLUSIVE"); h.click("OK")
    for (let n = 0; n < project.offset + project.start; n++) h.click("Menu down")
    h.click("OK")
    const audio = h.audios[0], selected = h.api().current
    const { exclusiveAudioQueue } = h.load("lib/exclusive.ts")
    assert.deepEqual(exclusiveAudioQueue({ kind: "official", slug: "danoot" }, selected.id).map((item) => item.title), project.titles)
    assert.equal(h.api().queueLength, project.titles.length)
    assert.equal(selected.title, project.titles[project.start])
    assert.equal(selected.artist, "Danoot")
    assert.equal(audio.src, `/audio/danoot/exclusive/${project.id}/${project.files[project.start]}.wav`)
    const title = h.nodes(h.player(), (node) => node.type === "p" && h.text(node) === selected.title)[0]
    assert.ok(title)
    assert.ok(!title.props.className.split(" ").includes("uppercase"))
    const control = (label) => h.nodes(h.player(), (node) => node.props?.["aria-label"] === label)[0]
    control("Next track").props.onClick(); assert.equal(h.api().current.title, project.titles[project.start + 1])
    control("Previous track").props.onClick(); assert.equal(h.api().current.id, selected.id)
    audio.currentTime = 31
    const loads = audio.loads
    h.click("BACK"); assert.equal(audio.paused, false)
    h.click("BACK"); assert.match(h.text(h.screen()), /SELECT YOUR ARTIST/)
    assert.equal(audio.paused, false)
    h.click("Next track"); h.click("OK") // Browse MoxLi without replacing the queue.
    assert.equal(h.api().current.id, selected.id)
    h.click("BACK"); h.click("Menu down"); h.click("OK") // Browse archive exclusives.
    const remote = h.nodes(h.screen(), (node) => node.type === "button" && h.text(node).trim() === "MUSIC")[0]
    for (const paused of [true, false]) {
      const result = h.pressButton(remote, "Space", {}, "data-tv-remote")
      assert.equal(result.activated, false); assert.equal(result.blurred, true)
      assert.equal(audio.paused, paused)
      assert.equal(audio.currentTime, 31)
      assert.equal(audio.loads, loads)
      assert.equal(h.api().current.id, selected.id)
      assert.equal(h.api().queueLength, project.titles.length)
      assert.equal(h.api().repeatMode, "off")
      assert.equal(h.api().shuffle, false)
      assert.ok(h.nodes(h.screen(), (node) => node.type === "button" && h.text(node).trim() === "EXCLUSIVE" && node.props.className.includes("remote-destination-active")).length)
    }
    for (const nextTitle of project.titles.slice(project.start + 1)) {
      audio.end(); assert.equal(h.api().current.title, nextTitle); assert.equal(audio.paused, false)
    }
    audio.end(); assert.equal(audio.paused, true)
    assert.equal(h.api().current.title, project.titles.at(-1))
    assert.equal(h.api().current.artist, "Danoot")
    assert.equal(h.api().stationArtistSlug, "moxli")
    h.api().cycleRepeat(); h.api().resume(); audio.end()
    assert.equal(h.api().current.title, project.titles[0])
    assert.equal(h.api().queueLength, project.titles.length)
    h.click("HOME"); assert.equal(h.api().playbackMode, "station")
  })
}

test("LEFT/RIGHT on exclusive audio detail follows the active project queue and updates title/art", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE"); h.click("OK")
  for (let i = 0; i < 3; i++) h.click("Menu down")
  h.click("OK") // kubrick
  assert.equal(h.api().current.title, "kubrick")
  h.click("Next track"); assert.equal(h.api().current.title, "singur pe pamant")
  assert.equal(h.api().current.artist, "Danoot")
  assert.equal(h.api().current.artwork, "/images/veni-vidi-vici-cover.jpg")
  assert.equal(h.text(h.screen()).includes("singur pe pamant"), true)
  h.click("Previous track"); assert.equal(h.api().current.title, "kubrick")
  h.click("Previous track"); assert.equal(h.api().current.title, "feste")
  h.click("Previous track"); assert.equal(h.api().current.title, "buimac")

  h.click("BACK"); h.click("BACK"); h.click("OK")
  for (let i = 0; i < 8; i++) h.click("Menu down")
  h.click("OK") // dus cu pluta
  assert.equal(h.api().current.title, "dus cu pluta", h.text(h.screen()))
  h.click("Next track"); assert.equal(h.api().current.title, "circ")
  assert.equal(h.api().current.artwork, "/images/mainile-peste-ochi-cover.png")
  h.click("Previous track"); assert.equal(h.api().current.title, "dus cu pluta")
  h.click("Previous track"); assert.equal(h.api().current.title, "mainile peste ochi")
  h.api().nextTrack(); assert.equal(h.api().current.title, "dus cu pluta")
})

test("reshuffling preserves current audio, timestamp, active state, repeat, and project bounds", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE"); h.click("OK")
  for (let i = 0; i < 3; i++) h.click("Menu down") // kubrick
  h.click("OK")
  const audio = h.audios[0], id = h.api().current.id
  audio.currentTime = 47; audio.ontimeupdate()
  h.api().cycleRepeat(); assert.equal(h.api().repeatMode, "all")
  const loads = audio.loads
  h.api().toggleShuffle()
  assert.equal(h.api().shuffle, true); assert.equal(h.api().current.id, id)
  assert.equal(audio.currentTime, 47); assert.equal(audio.loads, loads)
  h.api().toggleShuffle()
  assert.equal(h.api().shuffle, false); assert.equal(h.api().repeatMode, "all")
  assert.equal(h.api().current.id, id); assert.equal(audio.currentTime, 47); assert.equal(audio.loads, loads)
  const titles = []
  for (let i = 0; i < 3; i++) { h.api().nextTrack(); titles.push(h.api().current.title) }
  assert.equal(new Set(titles).size, 3)
  assert.ok(titles.every((title) => danootProjects[0].titles.includes(title)))
  assert.equal(h.api().queueLength, 6)
})

test("Shuffle toggles off and on while preserving the current track and timestamp", () => {
  const h = harness(), tracks = ["a", "b", "c"].map((id) => ({ id, title: id, artist: "Test", artwork: "", audioUrl: `/${id}.mp3` }))
  h.api().startStation("test", tracks, "a")
  const audio = h.audios[0]
  audio.currentTime = 27; audio.ontimeupdate()
  assert.equal(h.api().shuffle, true)
  h.api().toggleShuffle()
  assert.equal(h.api().shuffle, false)
  assert.equal(h.api().current.id, "a"); assert.equal(audio.currentTime, 27)
  h.api().nextTrack(); assert.equal(h.api().current.id, "b") // off restores source order
  h.api().previousTrack(); assert.equal(h.api().current.id, "a")
  const originalRandom = Math.random
  Math.random = () => 0
  try { h.api().toggleShuffle() } finally { Math.random = originalRandom }
  assert.equal(h.api().shuffle, true)
  assert.equal(h.api().current.id, "a"); assert.equal(audio.currentTime, 0)
  h.api().nextTrack(); assert.equal(h.api().current.id, "c") // newly enabled shuffle reordered the upcoming queue
  assert.equal(h.api().shuffle, true)
})

test("exclusive shuffle stays active through natural end, remote skips, screen changes, and same-queue selection", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("EXCLUSIVE"); h.click("OK"); h.click("Menu down"); h.click("OK") // buimac
  const audio = h.audios[0]
  h.api().toggleShuffle()
  const activeButton = () => h.nodes(h.player(), (node) => node.type === "button" && node.props["aria-label"] === "Shuffle")[0]
  assert.equal(h.api().shuffle, true)
  assert.equal(activeButton().props["aria-pressed"], true)
  const current = h.api().current.id
  h.click("Next track")
  const shuffledNext = h.api().current.id
  assert.notEqual(shuffledNext, current)
  assert.equal(h.api().shuffle, true)
  h.click("Previous track")
  assert.equal(h.api().current.id, current)
  audio.end()
  assert.equal(h.api().current.id, shuffledNext)
  assert.equal(h.api().shuffle, true)
  assert.equal(activeButton().props["aria-pressed"], true)
  const anotherNext = h.api().current.id
  h.click("BACK") // list screen keeps the same exclusive session
  assert.equal(h.api().shuffle, true)
  const { exclusiveAudioQueue } = h.load("lib/exclusive.ts")
  const projectQueue = exclusiveAudioQueue({ kind: "official", slug: "danoot" }, "danoot-vvv-buimac")
  const selected = projectQueue.find((track) => track.id !== anotherNext)
  assert.ok(selected)
  h.api().playExclusive(selected, projectQueue) // select another track in the same project queue
  assert.equal(h.api().current.id, selected.id)
  assert.equal(h.api().shuffle, true)
  assert.equal(activeButton().props["aria-pressed"], true)
  h.click("Next track")
  assert.equal(h.api().shuffle, true)
  assert.equal(activeButton().props["aria-pressed"], true)
  h.api().toggleShuffle()
  assert.equal(h.api().shuffle, false)
  assert.equal(activeButton().props["aria-pressed"], false)
  h.api().toggleShuffle()
  assert.equal(h.api().shuffle, true)
  assert.equal(activeButton().props["aria-pressed"], true)
})

test("normal station reshuffle keeps its artist boundary and navigation follows shuffled order", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const tracks = realMusic(h)
  assert.equal(h.api().shuffle, true)
  const audio = h.audios[0], current = h.api().current.id
  audio.currentTime = 29; audio.ontimeupdate()
  const loads = audio.loads
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, false)
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, true)
  assert.equal(h.api().current.id, current); assert.equal(audio.currentTime, 29); assert.equal(audio.loads, loads)
  assert.equal(h.api().shuffle, true)
  h.api().nextTrack()
  assert.notEqual(h.api().current.id, current)
  assert.ok(tracks.some((track) => track.id === h.api().current.id))
  assert.equal(h.api().stationArtistSlug, "moxli")
  h.api().previousTrack(); assert.equal(h.api().current.id, current)
})

test("CASIO remains standalone beside the EPs and project ordering uses track numbers", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  startCasio(h)
  assert.equal(h.api().queueLength, 1)
  h.audios[0].end()
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(h.audios[0].paused, true)
  const { exclusiveAudioQueue } = h.load("lib/exclusive.ts")
  const artist = h.load("lib/data.ts").artists[0]
  const selected = artist.exclusives.find((item) => item.title === "kubrick")
  artist.exclusives.reverse() // Memory-only reordering checks trackNumber, not accidental array order.
  assert.deepEqual(exclusiveAudioQueue({ kind: "official", slug: "danoot" }, selected.id).map((item) => item.title), danootProjects[0].titles)
  assert.deepEqual(exclusiveAudioQueue({ kind: "official", slug: "danoot" }, "danoot-casio").map((item) => item.title), ["CASIO"])
})

test("exclusive queue filters audio, advances while browsing another artist, and exposes player next/previous and repeat", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  const danoot = h.load("lib/data.ts").artists[0]
  // Memory-only future-content fixtures reuse the real file; never written to site data.
  danoot.exclusives = [
    { ...danoot.exclusives[0], projectId: "test-project", projectTitle: "Test project", trackNumber: 1 },
    { id: "test-image", title: "Test image", kind: "image", imageUrl: "/test.jpg", alt: "Test" },
    { ...danoot.exclusives[0], id: "test-next", title: "Test next", projectId: "test-project", projectTitle: "Test project", trackNumber: 2 },
  ]
  startCasio(h)
  const audio = h.audios[0]
  assert.equal(h.api().queueLength, 2)
  h.click("BACK"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
  assert.equal(h.api().current.id, "test-next")
  assert.equal(h.api().queueLength, 2)
  h.api().previousTrack(); assert.equal(h.api().current.id, "danoot-casio")
  const playerControl = (name) => h.nodes(h.player(), (node) => node.props?.["aria-label"] === name)[0]
  assert.equal(playerControl("Next track").props.disabled, false)
  playerControl("Next track").props.onClick(); assert.equal(h.api().current.id, "test-next")
  playerControl("Previous track").props.onClick(); assert.equal(h.api().current.id, "danoot-casio")
  h.click("BACK"); h.click("BACK"); h.click("Next track"); h.click("OK")
  assert.match(h.text(h.screen()), /MoxLi \/ EXCLUSIVE/)
  audio.end(); assert.equal(h.api().current.id, "test-next")
  assert.equal(h.api().current.artist, "Danoot")
  assert.equal(audio.paused, false)
  audio.end(); assert.equal(h.api().current.id, "test-next")
  assert.equal(audio.paused, true)
  assert.equal(h.api().isPlaying, false)
  h.api().cycleRepeat(); assert.equal(h.api().repeatMode, "all")
  h.api().resume(); audio.end(); assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(audio.paused, false)
  h.api().cycleRepeat(); audio.end(); assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(h.audios.length, 1)
})

for (const kind of ["audio", "video", "image"]) {
  test(`archive exclusive ${kind} uses the shared renderer and replaces selected audio ownership`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    const archive = h.load("lib/archive.ts").archiveArtists[0]
    const item = { id: `archive-test-${kind}`, title: `Archive ${kind}`, kind,
      ...(kind === "audio" ? { audioUrl: "/audio/danoot/exclusive/casio.wav" }
        : kind === "video" ? { source: { kind: "file", src: "/test.mp4" } }
        : { imageUrl: "/test.jpg", alt: "Archive image" }) }
    archive.exclusives.push(item)
    startCasio(h)
    const audio = h.audios[0], staleEnd = audio.onended
    h.click("BACK"); h.click("BACK"); h.click("Menu down"); h.click("OK")
    assert.equal(audio.paused, false)
    assert.equal(h.api().current.id, "danoot-casio")
    h.click("OK")
    if (kind === "audio") {
      assert.equal(h.api().playbackMode, "exclusive")
      assert.equal(h.api().current.id, item.id)
      assert.equal(h.api().current.artist, "Andreas Shinso")
      assert.equal(audio.paused, false)
      assert.match(h.text(h.screen()), /Archive audio/)
    } else {
      assert.equal(audio.paused, true)
      assert.notEqual(h.api().current.id, "danoot-casio")
      assert.equal(h.api().owner, kind === "video" ? "video" : "browsing")
      if (kind === "video") assert.ok(h.nodes(h.screen(), (node) => node.type?.name === "BroadcastVideo" && node.props.video.id === item.id).length)
      else assert.ok(h.nodes(h.screen(), (node) => node.type === "image" && node.props.src === item.imageUrl).length)
    }
    const currentId = h.api().current.id
    audio.ended = true; staleEnd()
    assert.equal(h.api().current.id, currentId)
    h.click("BACK"); h.click("BACK")
    assert.equal(exclusiveRows(h)[1], ">  Andreas Shinso")
    assert.equal(audio.paused, kind !== "audio")
  })
}

for (const destination of ["HOME", "MUSIC", "VIDEOS", "ARCHIVE", "BACK", "POWER"]) {
  test(`CASIO releases or suspends on ${destination} without leaking into another destination`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    startCasio(h)
    const audio = h.audios[0]
    h.click("BACK"); h.click("BACK")
    assert.equal(audio.paused, false)
    h.click(destination)
    if (destination === "POWER") {
      h.flush(); assert.equal(h.api().tvPoweredOn, false)
      assert.equal(h.api().owner, "off")
      h.api().resume(); h.api().toggle(); assert.equal(audio.paused, true)
      h.leaveHome(); h.screen(); assert.equal(audio.paused, true)
      h.click("POWER"); h.flush()
      assert.equal(h.api().playbackMode, "station")
    } else {
      assert.equal(h.api().playbackMode, "station")
      assert.notEqual(h.api().current.id, "danoot-casio")
      assert.equal(audio.paused, destination === "VIDEOS" || destination === "ARCHIVE")
    }
    assert.equal(h.api().stationArtistSlug, "moxli")
    assert.equal(h.audios.length, 1)
  })
}

test("EXCLUSIVE reopening retains exclusive audio and BACK preserves an explicit pause", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  startCasio(h)
  const audio = h.audios[0], loads = audio.loads
  h.click("EXCLUSIVE")
  assert.equal(exclusiveRows(h)[0], ">  Danoot")
  assert.equal(audio.loads, loads)
  assert.equal(audio.paused, false)
  h.click("OK"); h.click("OK")
  h.api().pause()
  audio.currentTime = 18
  h.click("BACK"); h.click("BACK"); h.click("Menu down"); h.click("Next track")
  assert.equal(audio.currentTime, 18)
  assert.equal(audio.paused, true)
  assert.equal(h.api().current.id, "danoot-casio")
  const skip = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Next track")[0]
  assert.equal(skip.props.disabled, true)
})

test("BACK leaving EXCLUSIVE restores the prior VIDEO destination without resuming music", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("VIDEOS")
  startCasio(h)
  h.click("BACK"); h.click("BACK")
  assert.equal(h.audios[0].paused, false)
  h.click("BACK")
  assert.equal(h.api().owner, "video")
  assert.equal(h.api().playbackMode, "station")
  assert.equal(h.audios[0].paused, true)
  assert.match(h.text(h.screen()), /MoxLi \/ VIDEOS/)
})

test("exclusive audio survives route departure and is released when the console returns to normal MUSIC", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const stationId = h.api().current.id
  h.audios[0].currentTime = 39
  startCasio(h)
  h.leaveHome()
  assert.equal(h.api().current.id, "danoot-casio")
  assert.equal(h.audios[0].paused, false)
  h.screen()
  assert.equal(h.api().current.id, stationId)
  assert.equal(h.audios[0].currentTime, 39)
  assert.equal(h.audios[0].paused, true)
  assert.equal(h.api().tvPoweredOn, true)
})

test("HOME after browsing archive exclusives retains the last official artist from an archive station", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("ARCHIVE"); h.click("OK")
  startCasio(h)
  h.click("BACK"); h.click("BACK"); h.click("Menu down"); h.click("Next track"); h.click("OK")
  h.click("HOME")
  assert.equal(h.api().tvArtistContext.slug, "moxli")
  assert.equal(h.api().stationArtistSlug, "moxli")
  assert.equal(h.api().playbackMode, "station")
  assert.equal(h.audios[0].paused, false)
})

for (const mode of ["MUSIC", "OPTIONS", "CASIO"]) {
  test(`Space toggles ${mode} without changing track, time, queue, shuffle, repeat, or TV screen`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen()
    if (mode === "OPTIONS") {
      h.click("OPTIONS"); h.click("Menu down"); h.click("OK"); h.click("OK"); h.click("OK")
    }
    if (mode === "CASIO") startCasio(h)
    const audio = h.audios[0]
    audio.currentTime = 37; audio.ontimeupdate()
    h.api().cycleRepeat()
    const snapshot = () => ({ id: h.api().current.id, time: audio.currentTime, loads: audio.loads,
      length: h.api().queueLength, shuffle: h.api().shuffle, repeat: h.api().repeatMode,
      owner: h.api().owner, mode: h.api().playbackMode, screen: h.text(h.screen()) })
    const before = snapshot()
    assert.equal(audio.paused, false)
    assert.equal(h.keydown().defaultPrevented, true)
    assert.equal(audio.paused, true)
    assert.deepEqual(snapshot(), before)
    assert.equal(h.keydown().defaultPrevented, true)
    assert.equal(audio.paused, false)
    assert.deepEqual(snapshot(), before)
    // The visible player remains independently keyboard/click operable.
    const button = (label) => h.nodes(h.player(), (node) => node.props?.["aria-label"] === label)[0]
    button("Pause").props.onClick(); assert.equal(audio.paused, true)
    button("Play").props.onClick(); assert.equal(audio.paused, false)
    assert.deepEqual(snapshot(), before)
  })
}

test("Space controls CASIO throughout EXCLUSIVE browsing and across route departure with one listener", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  startCasio(h)
  const audio = h.audios[0]
  audio.currentTime = 21
  for (const navigate of [() => h.click("BACK"), () => h.click("BACK"), () => { h.click("Next track"); h.click("OK") }, () => h.leaveHome()]) {
    navigate()
    assert.equal(h.keyListenerCount(), 1)
    h.keydown(); assert.equal(audio.paused, true)
    h.keydown(); assert.equal(audio.paused, false)
    assert.equal(audio.currentTime, 21)
    assert.equal(h.api().current.id, "danoot-casio")
  }
  h.unmountProvider()
  assert.equal(h.keyListenerCount(), 0)
  assert.equal(h.keydown().defaultPrevented, false)
})

test("Space ignores silent destinations, video ownership, TV power-off, and missing tracks", async () => {
  for (const destination of ["ARCHIVE", "VIDEOS", "YouTube", "EXCLUSIVE", "exclusive-list", "POWER"]) {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen()
    let youtube
    if (destination === "YouTube") {
      h.click("ARCHIVE"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
      h.click("VIDEOS"); h.click("OK")
      const node = h.nodes(h.screen(), (item) => item.type?.name === "YouTubePlayer")[0]
      youtube = await h.youtube(node.props)
    } else if (destination === "exclusive-list") {
      h.click("EXCLUSIVE"); h.click("OK")
    } else h.click(destination)
    const audio = h.audios[0], loads = audio.loads, owner = h.api().owner
    const calls = youtube?.player.calls.length
    const before = h.text(h.screen())
    const remoteButtons = h.nodes(h.screen(), (node) => node.type === "button")
    for (const button of remoteButtons) {
      const result = h.pressButton(button)
      assert.equal(result.event.defaultPrevented, true)
      assert.equal(result.activated, false)
      assert.equal(result.targetReceivedKey, false)
    }
    assert.equal(h.text(h.screen()), before)
    assert.equal(audio.paused, true)
    assert.equal(audio.loads, loads)
    assert.equal(h.api().owner, owner)
    if (youtube) assert.equal(youtube.player.calls.length, calls)
  }
  const empty = harness()
  empty.api()
  assert.equal(empty.keydown().defaultPrevented, true)
  assert.equal(empty.audios.length, 0)
})

test("Space ignores repeat, handled events, other keys, and modified shortcuts", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  h.keydown(); assert.equal(h.audios[0].paused, true)
  for (const overrides of [{ repeat: true }, { code: "Enter" }, { defaultPrevented: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
    const event = h.keydown(overrides)
    assert.equal(event.defaultPrevented, overrides.code !== "Enter")
    assert.equal(h.audios[0].paused, true)
  }
  h.keydown(); assert.equal(h.audios[0].paused, false)
})

test("Space leaves typing and editable ancestors alone but reserves non-editing controls for audio", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  // Minimal DOM target double evaluates the handler's actual simple selector list.
  const element = (tag, attrs = {}, parent = null) => ({
    isContentEditable: attrs.contenteditable === "true" || parent?.isContentEditable || false,
    closest(selector) {
      const matches = selector.split(",").some((part) => {
        const [, name, attr] = part.trim().match(/^(\w+)?(?:\[([\w-]+)\])?$/) ?? []
        return (name || attr) && (!name || name === tag) && (!attr || attr in attrs)
      })
      return matches ? this : parent?.closest(selector) ?? null
    },
  })
  const targets = [
    element("input"), element("textarea"), element("select"),
    element("div", { contenteditable: "true" }), element("span", {}, element("div", { contenteditable: "" })),
  ]
  for (const target of targets) {
    assert.equal(h.keydown({ target }).defaultPrevented, false)
    assert.equal(h.audios[0].paused, false)
  }
  assert.equal(h.keydown({ target: element("div") }).defaultPrevented, true)
  assert.equal(h.audios[0].paused, true)
  for (const target of [element("button"), element("span", {}, element("button")), element("div", { role: "button" }), element("div", { tabindex: "0" }), element("a", { href: "/about" })]) {
    const paused = h.audios[0].paused
    const event = h.keydown({ target })
    assert.equal(event.defaultPrevented, true)
    assert.equal(event.propagationStopped, true)
    assert.equal(h.audios[0].paused, !paused)
  }
})

for (const mode of ["MUSIC", "CASIO"]) {
  test(`Space on every focused remote button only toggles ${mode}; no target key handler or native click runs`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen()
    if (mode === "CASIO") startCasio(h)
    const audio = h.audios[0]
    audio.currentTime = 32
    const before = { text: h.text(h.screen()), id: h.api().current.id, loads: audio.loads, channel: h.api().tvChannel }
    const buttons = h.nodes(h.screen(), (node) => node.type === "button")
    for (const button of buttons) {
      for (const paused of [true, false]) {
        const result = h.pressButton(button)
        assert.equal(result.event.defaultPrevented, true)
        assert.equal(result.activated, false)
        assert.equal(result.targetReceivedKey, false, "window capture must intercept before target handlers")
        assert.equal(audio.paused, paused)
        assert.equal(audio.currentTime, 32)
        assert.equal(h.text(h.screen()), before.text)
        assert.equal(h.api().current.id, before.id)
        assert.equal(audio.loads, before.loads)
        assert.equal(h.api().tvChannel, before.channel)
        assert.equal(h.api().tvPoweredOn, true)
      }
      const repeated = h.pressButton(button, "Space", { repeat: true })
      assert.equal(repeated.event.defaultPrevented, true)
      assert.equal(repeated.activated, false)
      assert.equal(audio.paused, false)
    }
  })
}

test("Space on every bottom-player button only toggles audio without skipping or changing queue settings", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const audio = h.audios[0]
  audio.currentTime = 42
  const before = { id: h.api().current.id, shuffle: h.api().shuffle, repeat: h.api().repeatMode, loads: audio.loads, length: h.api().queueLength }
  for (const button of h.nodes(h.player(), (node) => node.type === "button")) {
    const paused = audio.paused
    const result = h.pressButton(button)
    assert.equal(result.activated, false)
    assert.equal(result.targetReceivedKey, false)
    assert.equal(audio.paused, !paused)
    assert.equal(audio.currentTime, 42)
    assert.deepEqual({ id: h.api().current.id, shuffle: h.api().shuffle, repeat: h.api().repeatMode, loads: audio.loads, length: h.api().queueLength }, before)
  }
})

test("Enter keeps native remote activation, including destinations, BACK, channels, and power", () => {
  for (const label of ["MUSIC", "VIDEOS", "ARCHIVE", "HOME", "BACK", "POWER", "Channel up", "Channel down", "EXCLUSIVE", "OPTIONS", "OK", "Menu up", "Menu down", "Next track", "Previous track"]) {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen()
    const button = h.nodes(h.screen(), (node) => node.type === "button" && (node.props["aria-label"] === label || h.text(node).trim() === label))[0]
    assert.ok(button, label)
    const result = h.pressButton(button, "Enter")
    assert.equal(result.event.defaultPrevented, false)
    assert.equal(result.targetReceivedKey, true)
    assert.equal(result.activated, true)
    if (label === "VIDEOS") assert.equal(h.api().owner, "video")
    if (label === "ARCHIVE") assert.equal(h.api().owner, "browsing")
    if (label === "POWER") assert.equal(h.api().tvPoweredOn, false)
  }
})

for (const destination of ["MUSIC", "VIDEOS", "OPTIONS", "ARCHIVE", "EXCLUSIVE", "CASIO"]) {
  test(`Space clears only remote button focus in ${destination} while preserving destination styling`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen()
    if (destination === "CASIO") startCasio(h)
    else h.click(destination)
    const remote = h.nodes(h.screen(), (node) => node.props?.["data-tv-remote"] === true)[0]
    assert.ok(remote, "physical remote has a shared scope marker")
    const activeDestinations = () => h.nodes(h.screen(), (node) => node.type === "button" && node.props.className?.split(" ").includes("remote-destination-active")).map((node) => h.text(node).trim())
    const expected = [destination === "CASIO" ? "EXCLUSIVE" : destination]
    assert.deepEqual(activeDestinations(), expected)
    const before = h.text(h.screen()), audio = h.audios[0], track = h.api().current?.id
    const eligible = h.api().owner === "music"
    for (const button of h.nodes(remote, (node) => node.type === "button")) {
      const paused = audio.paused
      const result = h.pressButton(button, "Space", {}, "data-tv-remote")
      assert.equal(result.blurred, true)
      assert.equal(h.activeElement(), null)
      assert.equal(result.activated, false)
      assert.equal(audio.paused, eligible ? !paused : paused)
      assert.equal(h.api().current?.id, track)
      assert.equal(h.text(h.screen()), before)
      assert.deepEqual(activeDestinations(), expected)
    }
    const videos = h.nodes(remote, (node) => node.type === "button" && h.text(node).trim() === "VIDEOS")[0]
    const enter = h.pressButton(videos, "Enter", {}, "data-tv-remote")
    assert.equal(enter.blurred, false)
    assert.notEqual(h.activeElement(), null)
    assert.equal(enter.activated, true)
    assert.equal(h.api().owner, "video")
  })
}

test("Space clears bottom-player button focus without changing shuffle/repeat active states", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.api().cycleRepeat()
  assert.equal(h.api().shuffle, true)
  assert.equal(h.api().repeatMode, "one")
  const player = h.player()
  assert.equal(player.props["data-audio-player"], true)
  const audio = h.audios[0], track = h.api().current.id, loads = audio.loads
  audio.currentTime = 34
  for (const button of h.nodes(player, (node) => node.type === "button")) {
    const paused = audio.paused
    const result = h.pressButton(button, "Space", {}, "data-audio-player")
    assert.equal(result.blurred, true)
    assert.equal(result.activated, false)
    assert.equal(audio.paused, !paused)
    assert.equal(h.api().current.id, track)
    assert.equal(audio.currentTime, 34)
    assert.equal(audio.loads, loads)
    assert.equal(h.api().shuffle, true)
    assert.equal(h.api().repeatMode, "one")
    for (const label of ["Shuffle", "Repeat one"]) {
      const control = h.nodes(h.player(), (node) => node.props?.["aria-label"] === label)[0]
      assert.equal(control.props["aria-pressed"], true)
    }
  }
})

test("Space preserves editing focus and does not blur unrelated website buttons", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  for (const tag of ["input", "textarea", "select", "contenteditable"]) {
    let blurred = false
    const field = {
      isContentEditable: tag === "contenteditable",
      closest: (selector) => selector.split(",").some((part) => part.trim() === tag) ? field : null,
      matches: () => false,
      blur: () => { blurred = true },
    }
    h.focus(field)
    const result = h.keydown({ target: field })
    assert.equal(result.defaultPrevented, false)
    assert.equal(result.propagationStopped, false)
    assert.equal(blurred, false)
    assert.equal(h.activeElement(), field)
    assert.equal(h.audios[0].paused, false)
  }
  const unrelated = { props: { onClick: () => assert.fail("Space must not click") } }
  const result = h.pressButton(unrelated)
  assert.equal(result.blurred, false)
  assert.notEqual(h.activeElement(), null)
  assert.equal(h.audios[0].paused, true)
})

test("station playback exposes seeking and player controls", () => {
  const h = harness(), tracks = realMusic(h)
  h.api().startStation("moxli", tracks, tracks[0].id)
  const audio = h.audios[0]
  const seekControl = () => h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Seek")[0]
  audio.currentTime = 30; audio.ontimeupdate()
  const bar = seekControl()
  assert.equal(bar.props.disabled, false)
  assert.equal(bar.props.children.props.style.width, "25%")
  h.api().seek(0.9)
  assert.equal(audio.currentTime, 108)
  const shuffle = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Shuffle")[0]
  const repeat = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Repeat")[0]
  const playerNext = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Next track")[0]
  const playerPrevious = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Previous track")[0]
  assert.equal(playerNext.props.disabled, false); assert.equal(playerPrevious.props.disabled, false)
  assert.equal(shuffle.props.disabled, false); assert.equal(repeat.props.disabled, false)
  const stationTrack = h.api().current.id, stationTime = audio.currentTime, stationLoads = audio.loads
  shuffle.props.onClick(); assert.equal(h.api().shuffle, false)
  assert.equal(h.api().current.id, stationTrack); assert.equal(audio.currentTime, stationTime); assert.equal(audio.loads, stationLoads)
  repeat.props.onClick(); assert.equal(h.api().repeatMode, "one")
  h.api().nextTrack(); assert.equal(h.api().current.id, tracks[1].id)
  h.api().previousTrack(); assert.equal(h.api().current.id, tracks[0].id)
})

test("OPTIONS opens the current artist library and starts the selected release queue", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("OPTIONS")
  assert.match(h.text(h.screen()), /MoxLi \/ MUSIC OPTIONS/)
  assert.deepEqual(h.nodes(h.screen(), (node) => node.key === "SINGLES" || node.key === "PROJECTS").map((node) => h.text(node).trim()), [">  SINGLES", "PROJECTS"])
  h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /nostalgia omoara progresul/)
  h.click("OK")
  assert.match(h.text(h.screen()), /printul persiei/)
  h.click("Menu down"); h.click("OK")
  assert.equal(h.api().current.id, "moxli-nop-grabba")
  assert.equal(h.api().playbackMode, "queue")
  assert.deepEqual(h.api().current?.releaseSlug, "moxli-nostalgia-omoara-progresul")
  const playerPrevious = h.nodes(h.player(), (node) => node.props?.["aria-label"] === "Previous track")[0]
  assert.equal(playerPrevious.props.disabled, false)
  assert.equal(h.api().queueLength, 2)
  const shuffleButton = () => h.nodes(h.player(), (node) => node.type === "button" && node.props["aria-label"] === "Shuffle")[0]
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, true); assert.equal(shuffleButton().props["aria-pressed"], true)
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, false); assert.equal(shuffleButton().props["aria-pressed"], false)
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, true); assert.equal(shuffleButton().props["aria-pressed"], true)
  h.api().toggleShuffle(); assert.equal(h.api().shuffle, false); assert.equal(shuffleButton().props["aria-pressed"], false)
  playerPrevious.props.onClick(); assert.equal(h.api().current.id, "moxli-nop-printul-persiei")
  h.api().cycleRepeat(); assert.equal(h.api().repeatMode, "all")
  h.audios[0].end(); assert.equal(h.api().current.id, "moxli-nop-grabba")
  h.click("BACK"); h.click("BACK"); h.click("BACK")
  assert.equal(h.api().playbackMode, "station")
  assert.equal(h.api().stationArtistSlug, "moxli")
})

test("OPTIONS is inert while TV is off and LEFT/RIGHT skip music", () => {
  const h = harness()
  h.screen(); h.click("OPTIONS")
  assert.equal(h.api().owner, "music")
  assert.doesNotMatch(h.text(h.screen()), /MUSIC OPTIONS/)
  h.click("POWER"); h.flush()
  h.click("Channel down"); h.click("Channel down")
  const before = h.api().current?.id
  h.click("Next track")
  assert.notEqual(h.api().current?.id, before)
  h.click("Previous track")
  assert.equal(h.api().current?.id, before)
})

for (const target of ["archive-list", "exclusive-artists", "exclusive-list", "exclusive-item", "video-list", "video-player"]) {
  test(`OPTIONS leaves ${target} unchanged without touching suspended playback`, () => {
    const h = harness("?tv=1&artist=moxli&mode=music")
    const artist = h.load("lib/data.ts").artists.find((item) => item.slug === "moxli")
    if (target === "exclusive-list" || target === "exclusive-item") artist.exclusives.push({ id: "test-image", title: "Test image", kind: "image", imageUrl: "/test.jpg", alt: "test" })
    if (target.startsWith("video-")) artist.videos.push({ id: "test-video", title: "Test video", youtubeUrl: "https://youtube.com/watch?v=test" })
    h.screen()
    const audio = h.audios[0]
    audio.currentTime = 26; audio.ontimeupdate()
    if (target === "archive-list") {
      h.click("ARCHIVE")
    } else if (target.startsWith("exclusive")) {
      h.click("EXCLUSIVE")
      h.click("Next track") // MoxLi's test image, independently of the official station.
      if (target !== "exclusive-artists") h.click("OK")
      if (target === "exclusive-item") h.click("OK")
    } else {
      h.click("VIDEOS")
      if (target === "video-player") h.click("OK")
    }
    const priorText = h.text(h.screen())
    const priorOwner = h.api().owner
    const priorTrack = h.api().current?.id
    const priorTime = h.api().currentTime
    const priorLoads = audio.loads
    h.click("OPTIONS")
    assert.equal(h.text(h.screen()), priorText)
    assert.equal(h.api().owner, priorOwner)
    assert.equal(h.api().current?.id, priorTrack)
    assert.equal(h.api().currentTime, priorTime)
    assert.equal(audio.loads, priorLoads)
    assert.equal(audio.paused, true)
  })
}

test("HOME from ARCHIVE and MUSIC from EXCLUSIVE enable OPTIONS again", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("ARCHIVE"); h.click("HOME"); h.click("OPTIONS")
  assert.match(h.text(h.screen()), /MoxLi \/ MUSIC OPTIONS/)
  const other = harness("?tv=1&artist=moxli&mode=music")
  other.screen(); other.click("EXCLUSIVE"); other.click("MUSIC"); other.click("OPTIONS")
  assert.match(other.text(other.screen()), /MoxLi \/ MUSIC OPTIONS/)
})

test("archive artist enters MUSIC directly and moise6969 video is selected from VIDEOS", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const audio = h.audios[0]
  audio.currentTime = 32; audio.ontimeupdate()
  h.click("ARCHIVE")
  const archiveRows = h.nodes(h.screen(), (node) => ["andreas-shinso", "cyupercah", "moise6969", "2007"].includes(node.key))
  assert.deepEqual(archiveRows.map((node) => h.text(node).trim()), [">  Andreas Shinso", "Cyupercah", "moise6969", "2007"])
  h.click("Menu down"); h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  assert.match(h.text(h.screen()), /ARCHIVE \/ MOISE6969/i)
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  h.click("OPTIONS")
  assert.match(h.text(h.screen()), /MOISE6969 \/ MUSIC OPTIONS/i)
  h.click("BACK")
  h.click("VIDEOS")
  const content = h.screen()
  assert.match(h.text(content), /STONER/)
  assert.equal(h.nodes(content, (node) => node.type?.name === "YouTubePlayer").length, 0)
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
  const beforeOptions = h.text(content), time = h.api().currentTime, loads = audio.loads
  h.click("OPTIONS")
  assert.equal(h.text(h.screen()), beforeOptions)
  assert.equal(h.api().owner, "video"); assert.equal(h.api().currentTime, time); assert.equal(audio.loads, loads)
  h.click("OK")
  const player = h.screen()
  const youtube = h.nodes(player, (node) => node.type?.name === "YouTubePlayer")[0]
  assert.ok(youtube)
  assert.equal(youtube.props.url, "https://www.youtube.com/watch?v=rk_jlzKdxc8")
  assert.equal(youtube.props.title, "STONER")
  assert.equal(audio.paused, true); assert.equal(h.api().owner, "video")
  h.click("OPTIONS")
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 1)
  assert.equal(h.api().owner, "video"); assert.equal(h.api().currentTime, time); assert.equal(audio.loads, loads)
  h.click("BACK")
  const returned = h.screen()
  assert.match(h.text(returned), /STONER/)
  assert.match(h.text(returned), />\s+STONER/)
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
  h.click("BACK")
  assert.match(h.text(h.screen()), /moise6969/)
  h.click("BACK")
  const list = h.screen()
  assert.match(h.text(list), />\s+moise6969/)
  assert.equal(h.api().owner, "browsing"); assert.equal(audio.paused, true)
  h.click("OK")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  h.click("OPTIONS")
  assert.match(h.text(h.screen()), /MUSIC OPTIONS/)
  h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO\s+PROJECTS\s+YET/)
})

test("YouTube player exposes native controls and remote-style API controls", async () => {
  const h = harness()
  const mounted = await h.youtube({ url: "https://youtu.be/rk_jlzKdxc8", title: "STONER", volume: 0.6 })
  assert.ok(mounted.player)
  assert.equal(mounted.player.options.videoId, "rk_jlzKdxc8")
  assert.equal(mounted.player.options.playerVars.controls, 1)
  assert.equal(mounted.player.options.playerVars.enablejsapi, 1)
  assert.equal(mounted.player.options.playerVars.origin, "http://localhost")
  assert.match(mounted.tree.props.className, /pointer-events-auto/)
  assert.match(h.nodes(mounted.tree, (node) => node.props?.ref)[0].props.className, /pointer-events-auto/)
  mounted.controls.toggle()
  assert.deepEqual(mounted.player.calls.at(-1), ["pauseVideo"])
  mounted.controls.toggle()
  assert.deepEqual(mounted.player.calls.at(-1), ["playVideo"])
  mounted.controls.seekBy(10)
  assert.deepEqual(mounted.player.calls.at(-1), ["seekTo", 60, true])
  mounted.player.currentTime = 95
  mounted.controls.seekBy(10)
  assert.deepEqual(mounted.player.calls.at(-1), ["seekTo", 100, true])
  mounted.player.currentTime = 5
  mounted.controls.seekBy(-10)
  assert.deepEqual(mounted.player.calls.at(-1), ["seekTo", 0, true])
  mounted.controls.setVolume(0.27)
  assert.deepEqual(mounted.player.calls.at(-1), ["setVolume", 27])
  const playerSource = fs.readFileSync("components/audio/audio-player.tsx", "utf8")
  assert.match(playerSource, /seek\(\(e\.clientX - rect\.left\) \/ rect\.width\)/)
  assert.doesNotMatch(playerSource, /YouTube|youtubeRef/)
  const consoleSource = fs.readFileSync("components/music/broadcast-console.tsx", "utf8")
  assert.match(consoleSource, /youtubeRef\.current\?\.setVolume\(next\)/)
  assert.match(consoleSource, /seekBy\(direction \* 10\)/)
})

for (const from of ["MUSIC", "OPTIONS", "VIDEOS", "ARCHIVE", "EXCLUSIVE"]) {
  for (const to of ["MUSIC", "OPTIONS", "VIDEOS", "ARCHIVE", "EXCLUSIVE", "HOME"]) {
    test(`${from} → ${to} follows destination audio ownership without rebuilding station`, () => {
      const h = harness("?tv=1&artist=moxli&mode=music")
      h.screen()
      const audio = h.audios[0]
      audio.currentTime = 21; audio.ontimeupdate()
      const id = h.api().current.id, loads = audio.loads
      h.click(from); h.click(to)
      const audible = ["MUSIC", "HOME"].includes(to) || (to === "OPTIONS" && ["MUSIC", "OPTIONS"].includes(from))
      assert.equal(audio.paused, !audible)
      assert.equal(h.api().current.id, id)
      assert.equal(audio.currentTime, 21)
      assert.equal(audio.loads, loads)
      assert.equal(h.api().shuffle, true)
      assert.equal(h.api().repeatMode, "all")
      if (!audible) {
        h.click("Previous track"); h.click("Next track")
        h.api().toggle(); h.api().resume(); h.api().nextTrack(); h.api().previousTrack()
        h.api().setVolume(0); h.api().setVolume(0.8)
        assert.equal(audio.paused, true)
        assert.equal(h.api().current.id, id)
        assert.equal(audio.currentTime, 21)
        assert.equal(audio.loads, loads)
      } else {
        h.click("Next track")
        assert.notEqual(h.api().current.id, id)
      }
    })
  }
}

test("VIDEOS pauses music, shows a selectable list, and BACK resumes station", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); const audio = h.audios[0]; audio.currentTime = 18; audio.ontimeupdate()
  h.click("VIDEOS")
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
  assert.match(h.text(h.screen()), /NO VIDEOS YET/)
  h.click("BACK")
  assert.equal(h.api().owner, "music"); assert.equal(h.api().currentTime, 18)
})

test("turntable experiment is absent from active source", () => {
  for (const file of ["app/releases/page.tsx", "components/audio/audio-provider.tsx", "components/music/broadcast-console.tsx"]) {
    assert.doesNotMatch(fs.readFileSync(path.resolve(file), "utf8"), /turntable|directReleaseSlug|playRelease|ABOUT THE SONG\/PROJECT/)
  }
  assert.equal(fs.existsSync(path.resolve("components/releases/releases-turntable.tsx")), false)
  assert.equal(fs.existsSync(path.resolve("lib/turntable.ts")), false)
})

test("TV power, channel, and station session survive console remounts", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  const first = h.screen()
  assert.match(h.text(first), /CH 02/)
  assert.equal(h.api().tvPoweredOn, true)
  assert.equal(h.api().stationArtistSlug, "moxli")
  const audio = h.audios[0]
  audio.currentTime = 37
  const currentId = h.api().current.id
  const loads = audio.loads
  h.leaveHome()
  h.screen()
  const remounted = h.screen()
  assert.match(h.text(remounted), /CH 02/)
  assert.match(h.text(remounted), /MUSIC/)
  assert.equal(h.api().tvPoweredOn, true)
  assert.equal(h.api().current.id, currentId)
  assert.equal(audio.currentTime, 37)
  assert.equal(audio.loads, loads)
})

test("paused and explicitly powered-off TV state survive remounts", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  h.screen()
  const audio = h.audios[0]
  audio.currentTime = 19
  h.api().pause()
  h.leaveHome()
  assert.match(h.text(h.screen()), /CH 02/)
  assert.equal(h.api().tvPoweredOn, true)
  assert.equal(h.api().isPlaying, false)
  h.click("POWER")
  h.flush()
  h.leaveHome()
  assert.equal(h.api().tvPoweredOn, false)
  assert.match(h.text(h.screen()), /transmission ended/)
  assert.equal(h.api().isPlaying, false)
})

test("archive artist context survives route remount and keeps its MUSIC screen", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen()
  h.click("ARCHIVE"); h.click("Menu down"); h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  assert.equal(h.api().tvArtistContext.kind, "archive")
  assert.equal(h.api().tvArtistContext.id, "moise6969")
  assert.equal(h.api().lastOfficialArtistSlug, "moxli")
  assert.equal(h.api().stationArtistSlug, "moise6969")
  const loads = h.audios[0].loads
  h.leaveHome()
  const restored = h.screen()
  assert.match(h.text(restored), /ARCHIVE \/ moise6969/i)
  assert.match(h.text(restored), /NO MUSIC YET/)
  assert.equal(h.api().tvPoweredOn, true)
  assert.equal(h.api().tvArtistContext.id, "moise6969")
  assert.equal(h.api().lastOfficialArtistSlug, "moxli")
  assert.equal(h.api().stationArtistSlug, "moise6969")
  assert.equal(h.audios[0].loads, loads)
  h.click("HOME")
  assert.equal(h.api().tvArtistContext.kind, "official")
  assert.equal(h.api().tvArtistContext.slug, "moxli")
})

test("every archive directory entry has honest MUSIC and VIDEOS empty states when unconfigured", () => {
  const entries = ["Andreas Shinso", "Cyupercah", "moise6969", "2007"]
  for (const [index, name] of entries.entries()) {
    const h = harness("?tv=1&artist=moxli&mode=music")
    h.screen(); h.click("ARCHIVE")
    for (let step = 0; step < index; step++) h.click("Menu down")
    h.click("OK")
    assert.match(h.text(h.screen()), /NO MUSIC YET/, `${name} MUSIC`)
    h.click("VIDEOS")
    const expectedVideos = name === "moise6969" ? /STONER/
      : name === "Cyupercah" ? /Break\.[\s\S]*ARDE![\s\S]*Male Starter Pack/
      : name === "2007" ? /IX/ : /NO VIDEOS YET/
    assert.match(h.text(h.screen()), expectedVideos, `${name} VIDEOS`)
  }
})

test("Cyupercah archive VIDEOS lists, plays, and restores all three real YouTube entries", async () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); const audio = h.audios[0]
  h.click("ARCHIVE"); h.click("Menu down"); h.click("OK")
  assert.match(h.text(h.screen()), /NO MUSIC YET/)
  h.click("VIDEOS")
  const titles = ["Break.", "ARDE!", "Male Starter Pack"]
  const urls = [
    "https://www.youtube.com/watch?v=hFYJ_h8PRtE",
    "https://www.youtube.com/watch?v=gC6nCbfu6Fk",
    "https://www.youtube.com/watch?v=cfxJMHoYDmc",
  ]
  const list = h.text(h.screen())
  let prior = -1
  for (const title of titles) {
    const index = list.indexOf(title)
    assert.ok(index > prior, `${title} appears in selectable order`)
    prior = index
  }
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
  h.click("Menu down"); assert.match(h.text(h.screen()), />\s+ARDE!/)
  h.click("Menu up"); assert.match(h.text(h.screen()), />\s+Break\./)
  h.click("Menu down"); h.click("OK")
  const selected = h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer")[0]
  assert.ok(selected)
  assert.equal(selected.props.title, "ARDE!")
  assert.equal(selected.props.url, urls[1])
  h.click("BACK")
  assert.match(h.text(h.screen()), />\s+ARDE!/)
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
  const mounted = await h.youtube({ url: selected.props.url, title: selected.props.title, volume: 0.8 })
  assert.equal(mounted.player.options.videoId, "gC6nCbfu6Fk")
  mounted.controls.toggle(); assert.deepEqual(mounted.player.calls.at(-1), ["pauseVideo"])
  mounted.controls.seekBy(-10); assert.deepEqual(mounted.player.calls.at(-1), ["seekTo", 40, true])
  mounted.controls.seekBy(10); assert.deepEqual(mounted.player.calls.at(-1), ["seekTo", 50, true])
  h.click("OK")
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 1)
  h.click("Channel up")
  assert.match(h.text(h.screen()), /STONER/)
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  assert.equal(h.api().owner, "video"); assert.equal(audio.paused, true)
})

test("2007 video uses the shared YouTube player and archive video cycling stays in VIDEOS", async () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  h.screen(); h.click("ARCHIVE")
  for (let step = 0; step < 3; step++) h.click("Menu down")
  h.click("OK"); assert.match(h.text(h.screen()), /NO MUSIC YET/)
  h.click("VIDEOS"); assert.match(h.text(h.screen()), /IX/)
  assert.equal(h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer").length, 0)
  h.click("OK")
  const selected = h.nodes(h.screen(), (node) => node.type?.name === "YouTubePlayer")[0]
  assert.equal(selected.props.title, "IX")
  assert.equal(selected.props.url, "https://www.youtube.com/watch?v=2CSbxDDbfzo")
  const mounted = await h.youtube({ url: selected.props.url, title: selected.props.title, volume: 0.8 })
  assert.equal(mounted.player.options.videoId, "2CSbxDDbfzo")
  h.click("BACK"); assert.match(h.text(h.screen()), />\s+IX/)

  h.click("Channel up")
  assert.match(h.text(h.screen()), /NO VIDEOS YET/)
  h.click("Channel up")
  assert.match(h.text(h.screen()), /Break\.[\s\S]*ARDE![\s\S]*Male Starter Pack/)
  h.click("Channel up")
  assert.match(h.text(h.screen()), /STONER/)
  h.click("Channel up")
  assert.match(h.text(h.screen()), /IX/)
  h.click("Channel down")
  assert.match(h.text(h.screen()), /STONER/)
})

test("archive video data retains STONER and Andreas Shinso remains empty", () => {
  const { archiveArtists } = harness().load("lib/archive.ts")
  const moise = archiveArtists.find((artist) => artist.id === "moise6969")
  const andreas = archiveArtists.find((artist) => artist.id === "andreas-shinso")
  const cyupercah = archiveArtists.find((artist) => artist.id === "cyupercah")
  const year2007 = archiveArtists.find((artist) => artist.id === "2007")
  assert.deepEqual(moise.videos.map(({ title, youtubeUrl }) => [title, youtubeUrl]), [["STONER", "https://www.youtube.com/watch?v=rk_jlzKdxc8"]])
  assert.deepEqual(andreas.videos, [])
  assert.deepEqual(cyupercah.videos.map((video) => video.id), ["cyupercah-break", "cyupercah-arde", "cyupercah-male-starter-pack"])
  assert.deepEqual(year2007.videos.map((video) => video.id), ["2007-ix"])
})

test("remote destination active treatment follows the TV screen and never sticks to HOME or BACK", () => {
  const h = harness("?tv=1&artist=moxli&mode=music")
  const active = () => h.nodes(h.screen(), (node) => node.type === "button" && String(node.props.className).includes("remote-destination-active"))
    .map((node) => h.text(node).trim())
  const assertActive = (name) => assert.deepEqual(active(), [name])
  const assertNoActionHighlight = () => {
    const buttons = h.nodes(h.screen(), (node) => node.type === "button")
    for (const name of ["HOME", "BACK"]) {
      const button = buttons.find((node) => h.text(node).trim() === name)
      assert.ok(button)
      assert.doesNotMatch(String(button.props.className), /remote-destination-active/)
    }
  }

  h.screen(); assertActive("MUSIC")
  h.click("ARCHIVE"); assertActive("ARCHIVE")
  h.click("Menu down"); h.click("OK") // Cyupercah MUSIC
  assertActive("MUSIC")
  assert.doesNotMatch(active().join(" "), /ARCHIVE/)
  h.click("VIDEOS"); assertActive("VIDEOS")
  h.click("OK"); assertActive("VIDEOS") // video player retains VIDEOS highlight
  h.click("BACK"); assertActive("VIDEOS")
  h.click("BACK"); assertActive("MUSIC")
  h.click("OPTIONS"); assertActive("OPTIONS")
  h.click("Menu down"); h.click("OK"); assertActive("OPTIONS")
  assert.doesNotMatch(active().join(" "), /MUSIC/)

  const data = h.load("lib/data.ts")
  const cyupercah = h.load("lib/archive.ts").archiveArtists.find((artist) => artist.id === "cyupercah")
  const project = { ...data.releases.find((release) => release.slug === "moxli-nostalgia-omoara-progresul"), slug: "cyupercah-test-project", artistSlug: "cyupercah" }
  data.releases.push(project); cyupercah.releaseSlugs.push(project.slug)
  h.click("BACK"); h.click("OK"); h.click("OK")
  assertActive("OPTIONS") // options-tracks

  const moxli = data.artists.find((artist) => artist.slug === "moxli")
  moxli.exclusives.push({ id: "active-state-test-image", title: "Test image", kind: "image", imageUrl: "/test.jpg", alt: "test" })
  h.click("EXCLUSIVE"); assertActive("EXCLUSIVE")
  h.click("Next track")
  h.click("OK"); assertActive("EXCLUSIVE") // exclusive content list
  h.click("OK"); assertActive("EXCLUSIVE") // exclusive item
  h.click("BACK"); assertActive("EXCLUSIVE")
  h.click("HOME"); assertActive("MUSIC")
  assertNoActionHighlight()
})
