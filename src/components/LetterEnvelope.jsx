// LetterEnvelope.jsx
// A handwritten envelope floats down from the top of the screen as if carried
// by the wind, lands with a soft bounce, sparkles and a warm glow, and waits.
// Clicking it plays the opening sequence — the wax seal cracks, the flap
// swings open, the folded letter rises, tiny hearts and sparkles escape, and
// the camera zooms in — then calls `onOpened`.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const OPENING_MS = 2100
const HEART_EMOJIS = ['❤️', '💖', '💗', '💕']
const random = (min, max) => Math.random() * (max - min) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// --- Opening variants (idle → opening) ---
const sealVariants = {
  idle: { scale: 1, opacity: 1, rotate: 0 },
  opening: {
    scale: [1, 1.18, 0.8],
    opacity: [1, 0.9, 0],
    rotate: 7,
    transition: { duration: 0.55, times: [0, 0.45, 1], ease: 'easeIn' },
  },
}
const flapVariants = {
  idle: { rotateX: 0 },
  opening: { rotateX: -180, transition: { duration: 0.9, ease: 'easeInOut', delay: 0.4 } },
}
const innerLetterVariants = {
  idle: { y: 0, opacity: 0 },
  opening: { y: -170, opacity: 1, transition: { duration: 0.7, ease: 'easeOut', delay: 0.55 } },
}

function LetterEnvelope({ isOpening = false, onOpen, onOpened }) {
  const [landed, setLanded] = useState(false)

  // Sparkles that appear on landing — generated once when the envelope lands.
  const landingSparkles = useMemo(
    () =>
      landed
        ? Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: random(-90, 90),
            top: random(-35, 20),
            size: random(2, 4),
            delay: random(0, 0.5),
            duration: random(0.9, 1.5),
          }))
        : [],
    [landed]
  )

  // Hearts + sparkles that escape during the opening — generated once.
  const escaped = useMemo(() => {
    if (!isOpening) return { hearts: [], sparkles: [] }
    return {
      hearts: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        emoji: pick(HEART_EMOJIS),
        left: random(-64, 64),
        drift: random(-30, 30),
        size: random(14, 26),
        rise: random(-270, -170),
        duration: random(1.3, 1.9),
        delay: random(0.45, 0.95),
        rotate: random(-140, 140),
      })),
      sparkles: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: random(-85, 85),
        top: random(-55, 20),
        size: random(2, 4),
        duration: random(0.9, 1.6),
        delay: random(0.4, 0.9),
      })),
    }
  }, [isOpening])

  // Tell the parent when the whole opening sequence has finished.
  // onOpened is read via a ref so the timer is never reset by parent re-renders.
  const onOpenedRef = useRef(onOpened)
  onOpenedRef.current = onOpened
  useEffect(() => {
    if (!isOpening) return
    const timer = setTimeout(() => onOpenedRef.current?.(), OPENING_MS)
    return () => clearTimeout(timer)
  }, [isOpening])

  const canOpen = landed && !isOpening

  return (
    <motion.div
      initial={{ y: '-135vh' }}
      animate={{ y: ['-135vh', '0vh', '-1.2vh', '0vh'], x: [0, 22, -12, 8, 0], rotate: [0, 2, -1.5, 1, 0] }}
      transition={{
        y: { duration: 5.2, times: [0, 0.85, 0.93, 1], ease: ['easeInOut', 'easeOut', 'easeInOut'] },
        x: { duration: 5.2, ease: 'easeInOut' },
        rotate: { duration: 5.2, ease: 'easeInOut' },
      }}
      onAnimationComplete={() => setLanded(true)}
      className="relative"
    >
      {/* Camera zoom + fade wrapper */}
      <motion.div
        animate={
          isOpening
            ? { scale: 1.14, opacity: 0, filter: 'blur(10px)' }
            : { scale: 1, opacity: 1, filter: 'blur(0px)' }
        }
        transition={
          isOpening
            ? { duration: 0.9, ease: 'easeInOut', delay: 1.15 }
            : { duration: 0.4 }
        }
        className="relative"
      >
        {/* Warm glow underneath */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-12 rounded-full bg-amber-300/25 blur-3xl"
          animate={landed && !isOpening ? { opacity: [0.35, 0.6, 0.35] } : { opacity: 0 }}
          transition={
            landed && !isOpening
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
        />

        {/* Landing sparkles */}
        {landingSparkles.map((s) => (
          <motion.span
            key={`land-${s.id}`}
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 rounded-full bg-amber-200"
            style={{
              width: s.size,
              height: s.size,
              left: `calc(50% + ${s.left}px)`,
              top: `calc(50% + ${s.top}px)`,
              boxShadow: '0 0 8px 2px rgba(253,230,138,0.8)',
            }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.3, 0.5] }}
            transition={{ duration: s.duration, delay: s.delay, ease: 'easeOut' }}
          />
        ))}

        <motion.button
          id="letter-envelope"
          type="button"
          onClick={onOpen}
          disabled={!canOpen}
          aria-label="Open the letter"
          whileHover={canOpen ? { scale: 1.03, y: -4 } : undefined}
          whileTap={canOpen ? { scale: 0.98 } : undefined}
          className="relative block cursor-pointer rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
        >
          <div className="relative h-52 w-72 sm:h-56 sm:w-80" style={{ perspective: '1200px' }}>
            {/* Envelope body */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-[#f7ecd8] shadow-[0_25px_55px_-18px_rgba(0,0,0,0.65)]">
              {/* side pockets */}
              <div className="absolute left-0 top-0 h-full w-1/2 bg-[#efe0c2]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[#efe0c2]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
              {/* bottom front pocket */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#f0e3c6]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              {/* floral corner details */}
              <span className="absolute left-2 top-1.5 text-xs text-amber-600/50" aria-hidden="true">✿</span>
              <span className="absolute right-2 top-1.5 text-xs text-amber-600/50" aria-hidden="true">✿</span>
              <span className="absolute bottom-1.5 left-2 text-xs text-amber-600/50" aria-hidden="true">✿</span>
              <span className="absolute bottom-1.5 right-2 text-xs text-amber-600/50" aria-hidden="true">✿</span>
            </div>

            {/* Front text */}
            <div className="absolute inset-x-0 bottom-4 z-10 flex flex-col items-center px-4 text-center">
              <p className="font-script text-xl text-stone-700 sm:text-2xl">To My Favorite Person ❤️</p>
              <p className="mt-1 font-serif text-[11px] italic tracking-[0.22em] text-stone-500 sm:text-xs">
                Open when you&apos;re ready.
              </p>
            </div>

            {/* Inner folded letter (rises during the opening) */}
            <motion.div
              variants={innerLetterVariants}
              animate={isOpening ? 'opening' : 'idle'}
              className="absolute inset-x-4 bottom-0 z-[15] h-[62%] rounded-t-xl border border-amber-200/70 bg-[#fbf4e3] shadow-inner"
            >
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-amber-300/70" />
            </motion.div>

            {/* Top flap */}
            <div className="absolute inset-x-0 top-0 z-20 h-[52%] origin-top" style={{ perspective: '1200px' }}>
              <motion.div
                variants={flapVariants}
                animate={isOpening ? 'opening' : 'idle'}
                className="h-full w-full origin-top"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backgroundColor: '#f3e7cc', boxShadow: '0 -4px 14px rgba(0,0,0,0.14)' }}
              />
            </div>

            {/* Wax seal */}
            <div className="absolute left-1/2 top-[46%] z-30 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                variants={sealVariants}
                animate={isOpening ? 'opening' : 'idle'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d64545] to-[#8f1d1d] shadow-[0_6px_16px_rgba(0,0,0,0.4)] ring-2 ring-[#7c1818]/40 sm:h-16 sm:w-16"
              >
                <span className="text-lg sm:text-xl" aria-hidden="true">❤️</span>
              </motion.div>
            </div>

            {/* Escaping hearts + sparkles (opening only) */}
            {isOpening && (
              <>
                {escaped.hearts.map((h) => (
                  <motion.span
                    key={`eh-${h.id}`}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-40 select-none"
                    style={{ fontSize: h.size, lineHeight: 1 }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{ y: h.rise, x: h.drift, opacity: [0, 1, 0], scale: [0.4, 1, 0.8], rotate: h.rotate }}
                    transition={{ duration: h.duration, delay: h.delay, ease: 'easeOut' }}
                  >
                    {h.emoji}
                  </motion.span>
                ))}
                {escaped.sparkles.map((s) => (
                  <motion.span
                    key={`es-${s.id}`}
                    className="pointer-events-none absolute z-30 rounded-full bg-amber-200"
                    style={{
                      width: s.size,
                      height: s.size,
                      left: `calc(50% + ${s.left}px)`,
                      top: `calc(50% + ${s.top}px)`,
                      boxShadow: '0 0 8px 2px rgba(253,230,138,0.8)',
                    }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.3, 0.6] }}
                    transition={{ duration: s.duration, delay: s.delay, ease: 'easeOut' }}
                  />
                ))}
              </>
            )}
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default LetterEnvelope
