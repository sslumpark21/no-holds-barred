import Image from "next/image"

export function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-ink text-paper">
      <Image
        src="/images/hero.png"
        alt="no.holds.barred"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40" />

      <div className="relative z-10 flex h-full flex-col justify-between px-4 md:px-6 py-8">
        <div className="flex justify-between items-start eyebrow text-paper/80">
          <span>Est. 2024</span>
          <span className="hidden sm:block">Independent · Worldwide</span>
          <span>Vol. 01</span>
        </div>

        <div>
          <h1 className="font-display display-huge text-[18vw] leading-[0.8] md:text-[13vw]">
            no.holds
            <br />
            .barred
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="font-display text-xl md:text-3xl uppercase tracking-tight">Music / Art / Culture</p>
            <p className="text-sm text-paper/70 max-w-sm leading-relaxed">
              An independent music label and multidisciplinary creative collective. A scene, not a
              catalogue.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between eyebrow text-paper/70">
          <span>Scroll</span>
          <span aria-hidden="true" className="h-px w-16 bg-paper/40" />
          <span>Transmission in progress</span>
        </div>
      </div>
    </section>
  )
}
