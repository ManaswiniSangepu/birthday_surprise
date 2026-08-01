// WorldPage.jsx
// "/world" — "We Created Our World". A warm, nostalgic page where memories
// appear as printed Polaroids scattered on a table. Each photo drops in from
// above, lands with a soft bounce, and opens into a premium fullscreen viewer.
// This should feel handcrafted and emotional — never like a standard gallery.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'

// Reserved IDs for future interactivity:
//   #world-page, #another-page-button

const random = (min, max) => Math.random() * (max - min) + min

// Hand-tuned anchors (left%, top%, width%, rotation) — the "random" feel comes
// from rotation, size, and a small position jitter, while the base layout stays
// beautifully balanced on every screen.
const ANCHORS = [
  { left: 2, top: 0, size: 22, rotate: -5 },
  { left: 25, top: 5, size: 17, rotate: 3 },
  { left: 43, top: 1, size: 21, rotate: -2 },
  { left: 65, top: 4, size: 18, rotate: 4 },
  { left: 84, top: 0, size: 15, rotate: -6 },
  { left: 6, top: 27, size: 20, rotate: 4 },
  { left: 27, top: 31, size: 16, rotate: -4 },
  { left: 44, top: 25, size: 22, rotate: 2 },
  { left: 67, top: 30, size: 17, rotate: -3 },
  { left: 86, top: 26, size: 13, rotate: 5 },
  { left: 3, top: 53, size: 18, rotate: -3 },
  { left: 23, top: 57, size: 20, rotate: 6 },
  { left: 45, top: 51, size: 17, rotate: -5 },
  { left: 63, top: 55, size: 22, rotate: 2 },
]

const HEADER_LINES = [
  'Every picture here isn\'t just a memory...',
  'It\'s a tiny piece of the beautiful world we built together.',
  'Each photo holds a smile,',
  'a laugh,',
  'a memory,',
  'and a little piece of my heart.',
]

// --- Polaroid wall ----------------------------------------------------------

function buildPolaroids() {
  return ANCHORS.map((a, i) => ({
    id: i,
    left: a.left + random(-1.2, 1.2),
    top: a.top + random(-1.5, 1.5),
    size: a.size + random(-1, 1),
    rotate: a.rotate + random(-1.5, 1.5),
  }))
}

function Polaroid({ photo, index, total, onSelect }) {
  // Memories appear one after another — each drops in with its own delay.
  const landingDelay = 0.3 + index * 0.16

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`Open photo ${index + 1} of ${total}`}
      className="absolute cursor-pointer rounded-lg bg-white p-2 pb-10 shadow-[0_10px_30px_-8px_rgba(80,30,50,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/70 sm:p-2.5 sm:pb-12"
      style={{
        left: `${photo.left}%`,
        top: `${photo.top}%`,
        width: `${photo.size}%`,
        zIndex: 20 + index,
        willChange: 'transform',
      }}
      initial={{ opacity: 0, y: -90, rotate: photo.rotate * 2.2, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: photo.rotate,
        scale: 1,
        boxShadow: '0 10px 30px -8px rgba(80,30,50,0.35)',
        transition: {
          opacity: { duration: 0.4, delay: landingDelay },
          y: { type: 'spring', stiffness: 190, damping: 13, delay: landingDelay },
          rotate: { type: 'spring', stiffness: 130, damping: 14, delay: landingDelay },
          scale: { type: 'spring', stiffness: 230, damping: 16, delay: landingDelay },
          boxShadow: { duration: 0.3, ease: 'easeOut' },
        },
      }}
      whileHover={{
        scale: 1.07,
        rotate: 0,
        zIndex: 60,
        boxShadow: '0 28px 55px -15px rgba(190,24,93,0.45)',
        transition: {
          scale: { type: 'spring', stiffness: 320, damping: 15 },
          rotate: { type: 'spring', stiffness: 220, damping: 18 },
          boxShadow: { duration: 0.3, ease: 'easeOut' },
        },
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Tiny heart particles that pop out when the photo lands */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
        {[0, 1, 2].map((h) => (
          <motion.span
            key={h}
            className="absolute left-1/2 top-1/3 text-xs"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 1, 0],
              x: [0, (h - 1) * 30],
              y: [0, -38 - h * 12],
              scale: [0.3, 1.15, 0.8],
            }}
            transition={{ delay: landingDelay + 0.12, duration: 1.15, ease: 'easeOut' }}
          >
            {h % 2 ? '💕' : '💖'}
          </motion.span>
        ))}
      </span>

      {/* Placeholder photo area */}
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="text-xl sm:text-2xl" aria-hidden="true">
            📷
          </div>
          <p className="mt-1 font-serif text-xs font-medium text-rose-800/80 sm:text-sm">
            Photo {index + 1}
          </p>
        </div>
      </div>

      {/* Polaroid caption */}
      <p className="absolute inset-x-0 bottom-2 text-center font-script text-sm text-rose-500/80 sm:text-base">
        our little world • {index + 1}
      </p>
    </motion.button>
  )
}

function PhotoWall({ polaroids, onSelect }) {
  return (
    <div className="relative mx-auto mt-10 aspect-[4/3] w-full max-w-5xl sm:mt-14 sm:aspect-[16/10]">
      {polaroids.map((photo, i) => (
        <Polaroid key={photo.id} photo={photo} index={i} total={polaroids.length} onSelect={onSelect} />
      ))}
    </div>
  )
}

// --- Fullscreen photo modal --------------------------------------------------

function WorldModal({ polaroids, index, onClose, onNavigate }) {
  const count = polaroids.length
  const dialogRef = useRef(null)
  const restoreRef = useRef(null)

  const prev = () => onNavigate((index - 1 + count) % count)
  const next = () => onNavigate((index + 1) % count)

  // Prevent background scrolling while open
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Capture focus on open, restore it on close
  useEffect(() => {
    restoreRef.current = document.activeElement
    dialogRef.current?.focus()
    return () => {
      restoreRef.current?.focus?.()
    }
  }, [])

  // Keyboard: Escape close, ← → navigate, Tab trap
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count, onClose, onNavigate])

  const glassButton =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60'

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-rose-950/70 p-4 backdrop-blur-xl sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer — photo ${index + 1} of ${count}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-3xl flex-col items-center justify-center gap-5 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: counter + close */}
        <div className="flex w-full items-center justify-between gap-4">
          <p
            aria-live="polite"
            className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md"
          >
            Photo {index + 1} of {count}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg text-white backdrop-blur-md transition hover:rotate-90 hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60"
          >
            ✕
          </button>
        </div>

        {/* Polaroid + navigation */}
        <div className="flex w-full flex-1 items-center justify-center gap-3 sm:gap-6">
          <button type="button" onClick={prev} aria-label="Previous photo" className={glassButton}>
            ←
          </button>

          <motion.div
            key={index}
            className="w-full max-w-xs rounded-lg bg-white p-2.5 pb-12 shadow-2xl sm:max-w-sm"
            initial={{ opacity: 0, scale: 0.92, rotate: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
              <div className="text-center">
                <div className="text-3xl" aria-hidden="true">
                  📷
                </div>
                <p className="mt-1 font-serif text-sm font-medium text-rose-800/80">
                  Photo {index + 1}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center font-script text-lg text-rose-500/80">
              our little world • {index + 1}
            </p>
          </motion.div>

          <button type="button" onClick={next} aria-label="Next photo" className={glassButton}>
            →
          </button>
        </div>

        {/* Reserved space: photo title + description (added later) */}
        <div className="w-full max-w-sm text-center">
          <p className="font-display text-lg font-semibold italic text-white/90">Photo Title</p>
          <p className="mt-1 font-serif text-sm italic text-white/60">Photo Description</p>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

// --- Bottom section ----------------------------------------------------------

function BottomSection() {
  return (
    <section className="relative mx-auto mt-16 max-w-2xl text-center sm:mt-20">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="font-serif text-lg italic leading-relaxed text-rose-950/80 sm:text-xl"
      >
        Some moments lasted only a few seconds...
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="mt-2 font-serif text-lg italic leading-relaxed text-rose-950/80 sm:text-xl"
      >
        But they&apos;ll stay in my heart forever.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 1.0 }}
        className="mt-10 flex justify-center"
      >
        <motion.button
          id="another-page-button"
          type="button"
          animate={{ y: [0, -6, 0] }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            scale: { type: 'spring', stiffness: 400, damping: 17 },
            boxShadow: { duration: 0.3, ease: 'easeOut' },
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 14px 38px -8px rgba(236,72,153,0.6)' }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-pink-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60 sm:text-lg"
        >
          {/* Glass reflection */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10"
          />
          <span className="relative">❤️ Let&apos;s Turn Another Page</span>
        </motion.button>
      </motion.div>
    </section>
  )
}

// --- The page ----------------------------------------------------------------

function WorldPage() {
  const polaroids = useMemo(buildPolaroids, [])
  const [selected, setSelected] = useState(null)

  return (
    <motion.div
      id="world-page"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fffaf3] via-[#ffecef] to-[#ffe0e8]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
    >
      {/* Subtle paper texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(146,96,49,0.045), transparent 45%), radial-gradient(circle at 82% 80%, rgba(146,96,49,0.05), transparent 45%), repeating-linear-gradient(0deg, rgba(146,96,49,0.02) 0 1px, transparent 1px 3px)',
        }}
      />

      {/* Gentle ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-rose-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-40 h-[32rem] w-[32rem] rounded-full bg-amber-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-200/35 blur-3xl"
      />

      {/* Tiny floating pink hearts + glowing particles */}
      <FloatingHearts />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            <span className="mr-2" aria-hidden="true">
              🌍
            </span>
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              We Created Our World
            </span>
            <span className="ml-2" aria-hidden="true">
              ❤️
            </span>
          </h1>

          <div className="mt-6 max-w-xl space-y-1.5">
            {HEADER_LINES.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 + i * 0.14, ease: 'easeOut' }}
                className={
                  i === 0
                    ? 'font-serif text-base font-medium leading-relaxed text-rose-900/85 sm:text-lg'
                    : 'font-serif text-base font-light leading-relaxed text-rose-950/70 sm:text-lg'
                }
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.header>

        {/* The scattered polaroid wall */}
        <PhotoWall polaroids={polaroids} onSelect={setSelected} />

        {/* Bottom quote + button */}
        <BottomSection />
      </main>

      {selected !== null && (
        <WorldModal
          polaroids={polaroids}
          index={selected}
          onClose={() => setSelected(null)}
          onNavigate={setSelected}
        />
      )}
    </motion.div>
  )
}

export default WorldPage
