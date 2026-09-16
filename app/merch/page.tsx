export default function MerchPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030403] px-4 text-[#d8ccb4]">

      <style>
        {`
          @keyframes merchGlow {
            0%, 100% {
              opacity: .28;
              transform: scale(1);
            }

            50% {
              opacity: .5;
              transform: scale(1.08);
            }
          }

          .merch-glow {
            animation:
              merchGlow
              7s
              ease-in-out
              infinite;
          }

          .merch-outline {
            -webkit-text-stroke:
              1px rgba(0,0,0,.9);

            text-shadow:
              -1px -1px 0 rgba(0,0,0,.8),
              1px -1px 0 rgba(0,0,0,.8),
              -1px 1px 0 rgba(0,0,0,.8),
              1px 1px 0 rgba(0,0,0,.8),
              0 12px 35px rgba(0,0,0,.85);
          }
        `}
      </style>

      <div className="merch-glow pointer-events-none absolute h-[450px] w-[650px] rounded-full bg-[#697653]/20 blur-[130px]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,.48)_68%,rgba(0,0,0,.9)_100%)]" />

      <div className="relative z-10 text-center">

        <p className="mb-6 font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-[#c2b294]/60">
          no.holds.barred. / merch
        </p>

        <h1 className="merch-outline font-display text-[16vw] leading-[0.74] tracking-[-0.06em] text-[#b2a794] md:text-[10vw]">
          TO BE
          <br />
          ANNOUNCED
        </h1>

        <div className="mx-auto mt-10 flex max-w-sm items-center gap-4">

          <span className="h-px flex-1 bg-[#c7aa73]/20" />

          <span className="h-2 w-2 rounded-full bg-[#9e2e25] shadow-[0_0_10px_rgba(180,45,35,.7)]" />

          <span className="h-px flex-1 bg-[#c7aa73]/20" />

        </div>

      </div>

    </main>
  )
}