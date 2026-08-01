// StoryBookPage.jsx
// "/story" — a warm, romantic room for the storybook: soft cream + blush
// gradients, floating pink hearts and glowing particles behind a realistic
// open book. The book opens on Chapter One, and "❤️ Our First Meet" turns
// the page to the image frame + first-meeting spread.

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import StoryBook from '../components/StoryBook.jsx'

// --- Chapter One (left page of the first spread) ----------------------------
const CHAPTER_ONE_LINES = [
  'There was a boy...',
  'A boy I met during college.',
  'At first,',
  'he was just another person among hundreds.',
  'Little did I know,',
  'he would slowly become the most important person in my life.',
  'And this...',
  'is our story.',
]

const lineVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.35 } },
}

function ChapterOne() {
  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col"
    >
      <motion.p
        variants={lineVariants}
        className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-rose-500 sm:text-xs"
      >
        Chapter One ❤️
      </motion.p>
      <motion.h2
        variants={lineVariants}
        className="mt-2 font-display text-lg font-bold leading-snug text-rose-900 sm:text-2xl"
      >
        I Want To Tell You A Story...
      </motion.h2>
      <motion.div variants={lineVariants} className="mt-2 h-px w-16 bg-gradient-to-r from-rose-400 to-transparent" />
      <div className="mt-4 space-y-3">
        {CHAPTER_ONE_LINES.map((line, i) => (
          <motion.p
            key={i}
            variants={lineVariants}
            className="font-serif text-sm leading-relaxed text-stone-800/90 sm:text-base"
          >
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  )
}

// --- Flyleaf (right page of the first spread) ------------------------------
function Flyleaf() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="rounded-xl border border-amber-300/60 px-6 py-10 sm:px-10">
        <div className="text-4xl sm:text-5xl" aria-hidden="true">
          ❤️
        </div>
        <p className="mt-4 font-script text-3xl leading-snug text-rose-700 sm:text-4xl">our story</p>
        <p className="mt-2 font-serif text-xs italic text-stone-500 sm:text-sm">
          begins on the next page...
        </p>
      </div>
    </div>
  )
}

// --- Image placeholder (left page of the second spread) ---------------------
function ImageFrame() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-300/70 bg-rose-100/30">
        <div className="text-3xl" aria-hidden="true">
          🖼️
        </div>
        <p className="mt-3 px-4 text-center font-serif text-sm italic text-stone-500 sm:text-base">
          Image will be added later
        </p>
        <p className="mt-1 px-6 text-center font-sans text-[0.62rem] uppercase tracking-[0.2em] text-rose-400/80 sm:text-xs">
          Our First Meet
        </p>
      </div>
    </div>
  )
}

// --- Story text (right page of the second spread) ---------------------------
function OurFirstMeet() {
  return (
    <div className="flex h-full flex-col">
      <h2 className="font-display text-lg font-bold leading-snug text-rose-900 sm:text-2xl">
        Our First Meet ❤️
      </h2>
      <div className="mt-2 h-px w-16 bg-gradient-to-r from-rose-400 to-transparent" />
      <div className="mt-4 flex-1 space-y-3 overflow-hidden">
        <p className="font-serif text-sm italic text-stone-500 sm:text-base">(Placeholder)</p>
        <p className="font-serif text-sm leading-relaxed text-stone-800/90 sm:text-base">
          This is where our first meeting story will be written later.
        </p>
        {/* Quiet skeleton lines — space reserved for the long paragraph */}
        <div className="space-y-2.5 pt-2">
          <p className="h-3 w-full rounded bg-stone-300/40" />
          <p className="h-3 w-11/12 rounded bg-stone-300/40" />
          <p className="h-3 w-4/5 rounded bg-stone-300/40" />
          <p className="h-3 w-3/4 rounded bg-stone-300/40" />
          <p className="h-3 w-5/6 rounded bg-stone-300/40" />
        </div>
      </div>
    </div>
  )
}

// --- The page ---------------------------------------------------------------
function StoryBookPage() {
  const navigate = useNavigate()
  const spreads = [
    { left: <ChapterOne />, right: <Flyleaf />, turnLabel: '❤️ Our First Meet' },
    { left: <ImageFrame />, right: <OurFirstMeet /> },
  ]

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

      {/* Floating pink hearts + glowing particles behind everything */}
      <FloatingHearts />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-14">
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
          className="mt-8 flex w-full justify-center"
        >
          <StoryBook
            spreads={spreads}
            finishLabel="❤️ We Created Our World"
            onFinish={() => navigate('/world')}
          />
        </motion.div>
      </main>
    </motion.div>
  )
}

export default StoryBookPage
