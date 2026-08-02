// Home.jsx
// "A Letter Across the Distance" — the cinematic landing experience.
// Four sentences appear one by one in the night sky → a handwritten envelope
// floats down → clicking it opens the letter → the stationery is revealed
// line by line as if being written, ending with one elegant button.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import NightSky from '../components/NightSky.jsx'
import LetterEnvelope from '../components/LetterEnvelope.jsx'
import MusicPlayer from '../components/MusicPlayer.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

// Reserved IDs for future interactivity:
//   #home-page, #letter-envelope, #letter-paper, #next-page-button

// --- Cinematic intro --------------------------------------------------------
const INTRO_LINES = [
  "Some gifts can't be wrapped...",
  "Some hugs can't travel...",
  'But love...',
  '...always finds a way.',
]

// Calm cinematic pace: each sentence fades in (~0.9s), stays fully visible
// for ~2s, fades out gently (~1.1s), then a brief pause before the next one.
// After the final line fades away, the envelope descends immediately.
const INTRO_CYCLE = 4.6 // seconds between sentence starts
const INTRO_SENTENCE_DURATION = 4.0
const INTRO_TOTAL_MS = (INTRO_LINES.length - 1) * INTRO_CYCLE * 1000 + INTRO_SENTENCE_DURATION * 1000

// --- The letter -------------------------------------------------------------
const LETTER_TEXT = `I wanted this letter to reach you with me standing beside you.

But life had different plans.

Today is one of the most special days of my life,
because it's the day my favorite person was born.

If I were there,
I'd probably annoy you,
steal a piece of your cake,
make you laugh,
and remind you a hundred times how much I love you.

Since I can't be there today...

I decided to send you something different.

This isn't just a birthday gift.

It's every feeling I couldn't wrap in a box.

Every page after this one
holds a memory,
a smile,
a lesson,
and a tiny piece of my heart.

So...

take my hand,

and let me tell you why
you mean so much to me.

Happy Birthday,
My Love. ❤️

Now...
let me tell you our story.`

const LETTER_LINES = LETTER_TEXT.split('\n')

const isSignatureLine = (line) => line.startsWith('Happy Birthday') || line === 'My Love. ❤️'

// --- Writing animation variants (line-by-line reveal) -----------------------
const paperContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.22, delayChildren: 0.9 } },
}
const paperLineVariants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } },
}
// Invisible spacer that still consumes a stagger step → a natural pause
// between paragraphs while the letter "is being written".
const paperSpacerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0, transition: { duration: 0.01 } },
}

function LetterPaper({ onNext }) {
  return (
    <motion.article
      id="letter-paper"
      initial={{ opacity: 0, y: 30, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[620px] rounded-[1.75rem] border border-amber-200/70 bg-[#fdf6e8] p-8 shadow-[0_45px_90px_-35px_rgba(0,0,0,0.55)] sm:p-12"
    >
      {/* Soft paper texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(146,96,49,0.05), transparent 45%), radial-gradient(circle at 82% 78%, rgba(146,96,49,0.06), transparent 45%), linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 21%, transparent 22%)',
        }}
      />

      <div className="relative">
        {/* Top heart */}
        <div className="text-center text-2xl" aria-hidden="true">
          ❤️
        </div>

        {/* Salutation */}
        <h1 className="mt-3 font-script text-4xl leading-snug text-rose-800 sm:text-5xl">
          Dear Love,
        </h1>

        {/* Body — revealed line by line */}
        <motion.div
          variants={paperContainerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 flex flex-col"
        >
          {LETTER_LINES.map((line, i) =>
            line.trim() === '' ? (
              <motion.div key={i} variants={paperSpacerVariants} className="h-3.5" />
            ) : (
              <motion.p
                key={i}
                variants={paperLineVariants}
                className={
                  isSignatureLine(line)
                    ? 'font-script text-right text-2xl leading-relaxed text-rose-800 sm:text-3xl'
                    : 'font-serif text-base font-normal leading-relaxed text-stone-800/90 sm:text-lg'
                }
              >
                {line}
              </motion.p>
            )
          )}

          {/* Button — only after the writing animation finishes */}
          <motion.div variants={paperLineVariants} className="mt-10 flex justify-center">              <motion.button
              id="next-page-button"
              type="button"
              onClick={onNext}
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
              <span className="relative">❤️ Turn The Next Page</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.article>
  )
}

function Home() {
  // 'intro' → 'envelope' → 'opening' → 'letter'
  const [phase, setPhase] = useState('intro')
  const [flipping, setFlipping] = useState(false)
  const navigate = useNavigate()
  usePageTitle('For My Love ❤️')

  // Immediately after the final sentence fades away, the envelope descends.
  useEffect(() => {
    if (phase !== 'intro') return
    const timer = setTimeout(() => setPhase('envelope'), INTRO_TOTAL_MS)
    return () => clearTimeout(timer)
  }, [phase])

  // '❤️ Turn The Next Page' — the whole letter page flips like the first page
  // of a book, then the storybook page is revealed.
  const handleNext = () => setFlipping(true)

  return (
    <motion.div
      id="home-page"
      className="relative min-h-screen overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Calm night sky backdrop */}
      <NightSky />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:py-16">
        {phase === 'intro' && (
          <div className="relative flex h-[55vh] w-full items-center justify-center">
            {/* Skip the cinematic intro — jump straight to the letter */}
            <motion.button
              type="button"
              onClick={() => setPhase('letter')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute bottom-2 right-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-rose-100/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/50 sm:text-sm"
            >
              Skip intro ⏭
            </motion.button>
            {INTRO_LINES.map((line, i) => (
              <motion.p
                key={line}
                className="absolute max-w-3xl px-6 text-center font-display text-2xl font-semibold tracking-wide text-rose-100/95 sm:text-3xl md:text-4xl"
                style={{ textShadow: '0 0 22px rgba(244,63,94,0.45)' }}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [14, 0, 0, -10],
                  filter: ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'],
                }}
                transition={{
                  duration: INTRO_SENTENCE_DURATION,
                  delay: i * INTRO_CYCLE,
                  times: [0, 0.225, 0.725, 1],
                  ease: 'easeInOut',
                }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        )}

        {(phase === 'envelope' || phase === 'opening') && (
          <LetterEnvelope
            isOpening={phase === 'opening'}
            onOpen={() => setPhase('opening')}
            onOpened={() => setPhase('letter')}
          />
        )}

        {phase === 'letter' && <LetterPaper onNext={handleNext} />}
      </main>

      {/* Page-flip transition into the storybook */}
      {flipping && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          style={{ perspective: 1600 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="relative h-[min(72vh,600px)] w-[min(88vw,760px)]"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0, scale: 0.96 }}
            animate={{ rotateY: -180, scale: 1 }}
            transition={{
              rotateY: { duration: 1.15, ease: [0.65, 0, 0.35, 1], delay: 2 },
              scale: { duration: 0.4, ease: 'easeOut' },
            }}
            onAnimationComplete={() => navigate('/story')}
          >
            {/* FRONT face — the letter's closing page */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[#fdf6e8] shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 25%, rgba(146,96,49,0.05), transparent 40%), radial-gradient(circle at 80% 75%, rgba(146,96,49,0.05), transparent 40%)',
                }}
              />
              <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="text-3xl" aria-hidden="true">
                  ❤️
                </div>
                <p className="mt-5 font-serif text-lg italic leading-relaxed text-stone-800/90 sm:text-xl">
                  &ldquo;Now... let me tell you our story.&rdquo;
                </p>
                <div className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" />
              </div>
              {/* Sweeping shadow while the page turns */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.06) 55%, transparent)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.12] }}
                transition={{ duration: 1.15, times: [0, 0.5, 1], ease: 'easeInOut', delay: 2 }}
              />
            </div>

            {/* BACK face — 'Our Story' */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[#fdf6e8] shadow-2xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 80% 75%, rgba(146,96,49,0.05), transparent 40%)',
                }}
              />
              <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="font-script text-5xl text-rose-800 sm:text-6xl">Our Story</p>
                <p className="mt-3 font-serif text-sm italic text-stone-500">a little book of us</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Placeholder music control — implemented in a later step */}
      <MusicPlayer />
    </motion.div>
  )
}

export default Home
