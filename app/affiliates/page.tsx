import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Affiliates — no.holds.barred.",
}

export default function AffiliatesPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030403] px-4 text-[#d8ccb4]">
      <div className="pointer-events-none absolute h-[450px] w-[650px] rounded-full bg-[#697653]/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,.48)_68%,rgba(0,0,0,.9)_100%)]" />
      <div className="relative z-10 text-center">
        <p className="mb-6 font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-[#c2b294]/80">
          AFFILIATES
        </p>
        <h1 className="font-display text-[16vw] leading-[0.74] tracking-[-0.06em] text-[#b2a794] md:text-[10vw]">
          TO BE
          <br />
          ANNOUNCED
        </h1>
      </div>
    </main>
  )
}