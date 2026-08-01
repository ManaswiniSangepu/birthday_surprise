// StoryBookPage.jsx
// "/story" — the single story page. It renders the ambient romantic backdrop
// and the one StoryBook component, feeding it the chapters from storyData.js.
// The book owns the chapter index internally (chapterIndex state); this page
// only supplies the data, the finish action (which lands on the Gallery) and
// the per-chapter atmosphere (heart density + special particle layers).

import { useState } from 'react'
import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import GoldenParticles from '../components/GoldenParticles.jsx'
import StoryBook from '../components/StoryBook.jsx'
import FinalEnding from '../components/FinalEnding.jsx'
import { chapters } from '../data/storyData.js'

// Ambient density per active chapter: [hearts, sparkles]. The autumn chapter
// and the golden-afternoon chapter thin out the pink floating hearts so their
// own atmosphere (falling leaves / golden motes) can breathe.
const HEART_DENSITY = {
  6: [20, 12], // 🍂 Chapter 7 — calm autumn
  7: [10, 12], // 👀 Chapter 8 — very minimal, golden classroom afternoon
  8: [10, 8], // 🤍 Chapter 9 — very subtle, warm golden evening
  9: [10, 8], // 🌙 Chapter 10 — very subtle, cozy night walk
  10: [10, 8], // 🫂 Chapter 11 — very minimal, morning bus sunlight
  11: [10, 8], // 🏍️ Chapter 12 — very subtle, golden-hour first ride
  12: [10, 8], // ✨ Chapter 13 — very minimal, peaceful night ride
  13: [10, 8], // 🍳 Chapter 14 — very subtle, cozy kitchen fairy lights
  15: [10, 8], // 🍫 Chapter 16 — very subtle, warm & playful little things
  16: [10, 8], // 🚌 Chapter 17 — very subtle, bittersweet goodbye
}
const GOLDEN_CHAPTER = 7
const EVENING_GLOW_CHAPTER = 8
const NIGHT_AMBIANCE_CHAPTER = 9
const MORNING_GLOW_CHAPTER = 10
const GOLDEN_HOUR_CHAPTER = 11
const MOONLIGHT_CHAPTER = 12
const COZY_KITCHEN_CHAPTER = 13

function StoryBookPage() {
  const [activeChapter, setActiveChapter] = useState(0)
  // Pressing Continue on the final chapter (Ch. 20) calls onFinish — instead
  // of navigating away, the story swaps the book for the Final Ending page.
  const [showEnding, setShowEnding] = useState(false)
  const [hearts, sparkles] = HEART_DENSITY[activeChapter] ?? [80, 40]
  const showGolden = activeChapter === GOLDEN_CHAPTER
  const showEveningGlow = activeChapter === EVENING_GLOW_CHAPTER
  const showNightAmbiance = activeChapter === NIGHT_AMBIANCE_CHAPTER
  const showMorningGlow = activeChapter === MORNING_GLOW_CHAPTER
  const showGoldenHour = activeChapter === GOLDEN_HOUR_CHAPTER
  const showMoonlight = activeChapter === MOONLIGHT_CHAPTER
  const showCozyKitchen = activeChapter === COZY_KITCHEN_CHAPTER

  return (
    <motion.div
      id="story-page"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fff9f1] via-[#ffeef0] to-[#ffe3ea]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Soft ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-amber-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-pink-200/40 blur-3xl"
      />

      {/* Soft golden evening lighting — only while the strength chapter is
          open (Ch. 9). Warm, comforting, hopeful. */}
      {showEveningGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 72% 28%, rgba(251, 191, 36, 0.22), transparent 55%), radial-gradient(circle at 18% 82%, rgba(245, 158, 11, 0.16), transparent 55%), radial-gradient(circle at 50% 50%, rgba(253, 230, 138, 0.18), transparent 70%)',
          }}
        />
      )}

      {/* Soft night ambiance — only while the night-walk chapter is open
          (Ch. 10). Deep-blue wash with warm street-light pools; peaceful,
          cozy, romantic. */}
      {showNightAmbiance && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 65% 25%, rgba(30, 58, 138, 0.22), transparent 55%), radial-gradient(circle at 20% 80%, rgba(30, 27, 75, 0.25), transparent 60%), radial-gradient(circle at 85% 70%, rgba(251, 191, 36, 0.14), transparent 45%), radial-gradient(circle at 12% 30%, rgba(251, 191, 36, 0.1), transparent 40%)',
          }}
        />
      )}

      {/* Soft morning sunlight through bus windows — only while the crowded
          bus chapter is open (Ch. 11). Warm, protective, comforting. */}
      {showMorningGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(253, 230, 138, 0.3), transparent 50%), radial-gradient(circle at 75% 35%, rgba(254, 240, 138, 0.2), transparent 45%), radial-gradient(circle at 50% 65%, rgba(255, 251, 235, 0.18), transparent 60%)',
          }}
        />
      )}

      {/* Golden-hour sunset — only while the first-ride chapter is open
          (Ch. 12). Exciting, warm, romantic. */}
      {showGoldenHour && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 25% 75%, rgba(251, 146, 60, 0.2), transparent 55%), radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.22), transparent 50%), radial-gradient(circle at 55% 55%, rgba(253, 186, 116, 0.16), transparent 65%)',
          }}
        />
      )}

      {/* Peaceful night ride — only while the ten-minute-ride chapter is open
          (Ch. 13). Warm street lights mixed with cool moonlight; dreamy,
          peaceful, romantic. */}
      {showMoonlight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 70% 20%, rgba(165, 180, 252, 0.2), transparent 55%), radial-gradient(circle at 20% 80%, rgba(30, 58, 138, 0.22), transparent 60%), radial-gradient(circle at 85% 72%, rgba(251, 191, 36, 0.16), transparent 45%), radial-gradient(circle at 10% 30%, rgba(251, 146, 60, 0.12), transparent 40%)',
          }}
        />
      )}

      {/* Soft warm indoor lighting — only while the made-with-love chapter is
          open (Ch. 14). Warm, cozy, playful — like a kitchen lit by fairy
          lights. */}
      {showCozyKitchen && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 45% 30%, rgba(253, 230, 138, 0.28), transparent 55%), radial-gradient(circle at 75% 75%, rgba(254, 215, 170, 0.2), transparent 50%), radial-gradient(circle at 15% 70%, rgba(255, 237, 213, 0.18), transparent 55%)',
          }}
        />
      )}

      {/* Floating pink hearts + glowing particles behind everything — density
          reacts to the active chapter (thinned on the autumn & afternoon
          chapters). */}
      <FloatingHearts heartCount={hearts} sparkleCount={sparkles} />
      {/* Golden sunlight motes — only while the classroom chapter is open. */}
      {showGolden && <GoldenParticles />}

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:py-8">
        {showEnding ? (
          <FinalEnding />
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-script text-2xl text-rose-600/90 sm:text-3xl"
            >
              ~ our story book ~
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex w-full justify-center"
            >
              <StoryBook
                chapters={chapters}
                onFinish={() => setShowEnding(true)}
                onChapterChange={setActiveChapter}
              />
            </motion.div>
          </>
        )}
      </main>
    </motion.div>
  )
}

export default StoryBookPage
