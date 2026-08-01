// StoryBook.jsx
// A reusable, realistic open storybook with a 3D page-turn engine.
//
// Pass `spreads` — an array of `{ left, right, turnLabel }` where `left` and
// `right` are React nodes. Clicking a spread's turn button flips its right
// page over the left, revealing the next spread. The back of the turning page
// shows the NEXT spread's left content (and the pages underneath swap to the
// next spread while turning), so the reveal is seamless and realistic —
// exactly like a real paper page being turned.
//
// To add a chapter later: append another spread object. The engine handles
// the turn automatically.

import { useState } from 'react'
import { motion } from 'framer-motion'

const TURN_DURATION = 1.15
const EASE = [0.65, 0, 0.35, 1]

// Subtle cream-paper texture shared by every page surface.
function PaperTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 25%, rgba(146,96,49,0.05), transparent 40%), radial-gradient(circle at 80% 75%, rgba(146,96,49,0.05), transparent 40%), repeating-linear-gradient(0deg, rgba(146,96,49,0.028) 0 1px, transparent 1px 3px)',
      }}
    />
  )
}

function StoryBook({ spreads, finishLabel, onFinish }) {
  const [index, setIndex] = useState(0)
  const [turning, setTurning] = useState(false)

  const current = spreads[Math.min(index, spreads.length - 1)]
  const next = spreads[index + 1]
  const isLast = index >= spreads.length - 1

  // While turning, the pages underneath show the NEXT spread — so the peeled
  // area reveals the incoming page instead of the old one.
  const underlying = turning && next ? next : current

  const handleTurn = () => {
    if (turning || isLast) return
    setTurning(true)
  }

  const finishTurn = () => {
    setIndex((i) => Math.min(i + 1, spreads.length - 1))
    setTurning(false)
  }

  return (
    <div id="story-book" className="relative w-[min(94vw,960px)]" style={{ perspective: 2400 }}>
      {/* Soft ambient glow behind the book */}
      <div aria-hidden="true" className="absolute -inset-10 rounded-[4rem] bg-rose-200/40 blur-3xl" />

      {/* Slight 3D perspective on the whole book */}
      <div className="relative" style={{ transform: 'rotateX(4deg)', transformStyle: 'preserve-3d' }}>
        {/* Elegant hardcover */}
        <div className="rounded-[1.4rem] bg-gradient-to-br from-rose-900 via-[#5c1024] to-[#2c0710] p-2.5 shadow-[0_40px_90px_-25px_rgba(88,28,50,0.55)] sm:p-3">
          {/* Cover trim */}
          <div className="rounded-[1rem] border border-amber-200/25 bg-gradient-to-br from-rose-800/60 to-rose-950/80 p-1.5">
            {/* Open pages */}
            <div className="relative flex h-[min(70vh,636px)] overflow-hidden rounded-lg bg-[#fbf2df]">
              {/* LEFT PAGE */}
              <div className="relative w-1/2 overflow-hidden bg-[#fbf2df]">
                {/* Fold shading toward the spine */}
                <div aria-hidden="true" className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/10 to-transparent" />
                <div className="relative h-full overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                  {underlying.left}
                </div>
                <PaperTexture />
              </div>

              {/* Spine gutter */}
              <div aria-hidden="true" className="relative z-10 w-2.5 shrink-0 sm:w-3.5">
                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-[#e9d9b8] to-black/25" />
                <div className="absolute inset-x-0 top-0 h-2 rounded-b-full bg-black/30" />
                <div className="absolute inset-x-0 bottom-0 h-2 rounded-t-full bg-black/30" />
              </div>

              {/* RIGHT PAGE */}
              <div className="relative w-1/2 overflow-hidden bg-[#fbf2df]">
                <div aria-hidden="true" className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/10 to-transparent" />
                <div className="relative h-full overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                  {underlying.right}
                </div>
                <PaperTexture />
              </div>

              {/* Turning page — the old right page flips over the left */}
              {turning && next && (
                <div className="absolute inset-0 z-20" style={{ perspective: 2000 }}>
                  <motion.div
                    className="absolute bottom-0 right-0 top-0 w-1/2"
                    style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: -180 }}
                    transition={{ duration: TURN_DURATION, ease: EASE }}
                    onAnimationComplete={finishTurn}
                  >
                    {/* FRONT face — the page being turned away (old right content) */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="absolute inset-0 overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                        {current.right}
                      </div>
                      <PaperTexture />
                      {/* Page-lift shadow sweeping across as it turns */}
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: TURN_DURATION, times: [0, 0.5, 1], ease: 'easeInOut' }}
                        style={{
                          background:
                            'linear-gradient(to right, rgba(0,0,0,0.32), rgba(0,0,0,0.05) 60%, transparent)',
                        }}
                      />
                    </div>

                    {/* BACK face — the next spread's left page, revealed on landing */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="absolute inset-0 overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                        {next.left}
                      </div>
                      <PaperTexture />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Turn button (while spreads remain) or finish button (on the last page) */}
      {(current.turnLabel || finishLabel) && (
        <div className="mt-8 flex justify-center">
          <motion.button
            id={current.turnLabel ? 'turn-page-button' : 'finish-book-button'}
            type="button"
            onClick={current.turnLabel ? handleTurn : onFinish}
            disabled={current.turnLabel ? turning : false}
            animate={{ y: [0, -6, 0] }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              scale: { type: 'spring', stiffness: 400, damping: 17 },
              boxShadow: { duration: 0.3, ease: 'easeOut' },
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 14px 38px -8px rgba(236,72,153,0.55)' }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-9 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60 sm:text-lg"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10"
            />
            <span className="relative">{current.turnLabel ?? finishLabel}</span>
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default StoryBook
