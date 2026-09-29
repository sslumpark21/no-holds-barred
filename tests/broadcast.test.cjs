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
      if (name === "next/image") return "image"
      if (name === "next/link") return "link"
      if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
      if (name === "lucide-react") return { Repeat: "repeat-icon", Repeat1: "repeat-one-icon", Shuffle: "shuffle-icon" }
      let target = name.startsWith("@/") ? path.resolve(name.slice(2)) : path.resolve(path.dirname(full), name)
      target += fs.existsSync(target + ".tsx") ? ".tsx" : ".ts"
      return load(target)
    }
    new Function("require", "module", "exports", "Audio", "window", output)(req, module, module.exports, Audio, window)
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
  return { api, audios, ytPlayers, load, screen, text, nodes, click, video, youtube, player, leaveHome, flush: () => timers.splice(0).forEach((fn) => fn?.()) }
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
  assert.equal(artistPlaylist(artists[0], releases).length, 0)
  assert.equal(artistPlaylist(artists[2], releases).length, 0)
  const tracks = realMusic(h)
  assert.deepEqual(tracks.map((t) => t.title), ["printul persiei", "grabba"])
  tracks.forEach((track) => { assert.equal(track.artwork, releases[0].artwork); assert.equal(track.releaseSlug, releases[0].slug); assert.ok(fs.existsSync(`public${track.audioUrl}`)) })
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
  h.api().toggleShuffle(); h.api().cycleRepeat()
  assert.equal(h.api().shuffle, false); assert.equal(h.api().repeatMode, "one")
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
  h.click("EXCLUSIVE"); h.click("OK"); assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
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

const exclusiveOrder = ["moxli", "danoot", "matei"]
function exclusiveRows(h) {
  return h.nodes(h.screen(), (node) => exclusiveOrder.includes(node.key)).map((node) => h.text(node).trim())
}
for (const [index, name] of ["MoxLi", "Danoot", "Matei!"].entries()) {
  test(`EXCLUSIVE selects ${name} independently, locks channels, and preserves BACK highlight`, () => {
    const original = name === "Danoot" ? "moxli" : "danoot"
    const h = harness(`?tv=1&artist=${original}&mode=music`)
    h.screen()
    const audio = h.audios[0], loads = audio.loads
    h.click("EXCLUSIVE")
    assert.deepEqual(exclusiveRows(h), [">  MoxLi", "Danoot", "Matei!"])
    assert.doesNotMatch(h.text(h.screen()), /NO EXCLUSIVES YET/)
    for (const button of ["Channel up", "Channel down"]) {
      h.click(button)
      assert.equal(h.api().stationArtistSlug, original)
      assert.equal(audio.loads, loads)
      assert.equal(exclusiveRows(h).length, 3)
    }
    for (let n = 0; n < index; n++) h.click("Menu down")
    h.click("OK")
    assert.match(h.text(h.screen()), new RegExp(`${name.replace("!", "\\!")} / EXCLUSIVE`))
    assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
    assert.equal(h.api().stationArtistSlug, original)
    for (const button of ["Channel up", "Channel down"]) {
      h.click(button)
      assert.match(h.text(h.screen()), /NO EXCLUSIVES YET/)
      assert.equal(h.api().stationArtistSlug, original)
      assert.equal(audio.loads, loads)
    }
    h.click("BACK")
    const rows = exclusiveRows(h)
    assert.equal(rows[index], `>  ${name}`)
    h.click("BACK")
    assert.equal(exclusiveRows(h).length, 0)
    assert.equal(h.api().owner, "music")
    assert.equal(h.api().stationArtistSlug, original)
    h.click("Channel up")
    assert.notEqual(h.api().stationArtistSlug, original)
  })
}

test("EXCLUSIVE always reopens the artist list and BACK restores VIDEO mode", () => {
  const h = harness()
  h.screen(); h.click("POWER"); h.flush(); h.click("VIDEOS"); h.click("EXCLUSIVE")
  h.click("Menu up") // Wrap from MoxLi to Matei!.
  h.click("OK")
  assert.match(h.text(h.screen()), /Matei! \/ EXCLUSIVE/)
  h.click("EXCLUSIVE")
  assert.deepEqual(exclusiveRows(h), [">  MoxLi", "Danoot", "Matei!"])
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
  h.click("EXCLUSIVE"); h.click("Menu up"); h.click("OK"); h.click("OK")
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
  assert.equal(h.api().current.id, track)
  assert.equal(h.audios[0].currentTime, 24)
  assert.match(h.text(h.screen()), /Matei! \/ EXCLUSIVE/)
  h.click("BACK")
  assert.equal(exclusiveRows(h)[2], ">  Matei!")
  h.click("BACK")
  assert.match(h.text(h.screen()), /CH 02 \/ MoxLi \/ MUSIC/)
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
  shuffle.props.onClick(); assert.equal(h.api().shuffle, false)
  repeat.props.onClick(); assert.equal(h.api().repeatMode, "one")
  h.api().nextTrack(); assert.equal(h.api().current.id, tracks[1].id)
  h.api().previousTrack(); assert.equal(h.api().current.id, tracks[0].id)
})

test("OPTIONS opens the current artist library and selects a station track", () => {
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
  assert.equal(h.api().playbackMode, "station")
  h.click("BACK"); h.click("BACK"); h.click("BACK")
  assert.match(h.text(h.screen()), /printul persiei|grabba/)
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
  h.click("OK"); assertActive("EXCLUSIVE") // exclusive content list
  h.click("OK"); assertActive("EXCLUSIVE") // exclusive item
  h.click("BACK"); assertActive("EXCLUSIVE")
  h.click("HOME"); assertActive("MUSIC")
  assertNoActionHighlight()
})
