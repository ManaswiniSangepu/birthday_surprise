// BirthdaySurprise.jsx
// "/birthday-surprise" — the birthday experience on one page.
//
// Section 1 (unchanged): the welcome card with the slow line-by-line message
// and the "✨ Continue" button.
//
// Section 2 (below, revealed by Continue): "Make A Birthday Wish" — a
// peaceful moonlit Wish Tree scene (glowing tree with fairy lights, stars,
// fireflies, drifting petals, floating hearts, warm golden under-glow) and a
// single glowing paper note — "🍃 One Last Wish..." — hanging from a lower
// branch, gently swinging.
//
// Clicking the note starts a quiet night-time sequence: the paper unfolds
// like a handwritten letter, warm golden light shines from inside it, the
// paper floats upward, the glowing tree fades away, lanterns rise into a
// darker starry sky and soft golden particles float — then, after a pause,
// the birthday message fades in, one paragraph at a time, with elegant
// centered typography. It ends with a final promise revealed line by line,
// closing on a golden "Together." that lingers while fireworks burst
// across the night sky. No buttons appear while the message is showing.
//
// The page shell (pastel gradient, floating hearts, Back pill, fade-in page
// transition) is shared with the rest of the site and stays untouched.
//
// Flow: Storybook → Memory Album → Birthday Surprise → Final Ending.

import { forwardRef, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

// The pill used for back navigation — same visual language as the Memory
// Album's "← Back home" pill, kept small and reusable.
function BackPill({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/60 px-5 py-2 text-sm font-medium text-rose-500 backdrop-blur-md transition hover:border-pink-300 hover:bg-white/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60"
    >
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Section 1 — the welcome card (unchanged)
// ---------------------------------------------------------------------------

const WELCOME_LINES = [
  "I've been waiting",
  'for this moment...',
  '',
  'Because today',
  "isn't just another day.",
  '',
  'Today...',
  '',
  'the most special person',
  'in my life',
  'was born.',
]

const messageContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.5, delayChildren: 0.5 } },
}
const messageLineVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: 'easeOut' },
  },
}
const messageSpacerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0, transition: { duration: 0.01 } },
}

// The elegant pink "Continue" pill — same language as the site's other CTAs.
function ContinueButton({ onContinue }) {
  return (
    <motion.div variants={messageLineVariants} className="mt-10 flex justify-center">
      <motion.button
        type="button"
        onClick={onContinue}
        animate={{ y: [0, -6, 0] }}
        whileHover={{ scale: 1.05, boxShadow: '0 14px 38px -8px rgba(236, 72, 153, 0.6)' }}
        whileTap={{ scale: 0.95 }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 400, damping: 17 },
          boxShadow: { duration: 0.3, ease: 'easeOut' },
        }}
        className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-9 py-3.5 text-base font-semibold text-white shadow-lg shadow-pink-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60 sm:text-lg"
      >
        {/* Glass reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10"
        />
        <span className="relative">✨ Continue</span>
      </motion.button>
    </motion.div>
  )
}

function WelcomeCard({ onContinue }) {
  return (
    <motion.section
      data-testid="birthday-welcome-card"
      className="w-full max-w-xl rounded-[2rem] border border-pink-200/70 bg-white/70 px-6 py-10 text-center shadow-[0_30px_60px_-24px_rgba(190,24,93,0.35)] backdrop-blur-md sm:px-10 sm:py-14"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Cake */}
      <motion.div
        aria-hidden="true"
        className="text-5xl sm:text-6xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
      >
        🎂
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="mt-5 font-script text-4xl leading-snug text-rose-700 sm:text-5xl md:text-6xl"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
      >
        Happy Birthday,
        <br />
        <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 bg-clip-text text-transparent">
          My Love ❤️
        </span>
      </motion.h1>

      {/* Message — revealed line by line, slowly */}
      <motion.div
        variants={messageContainerVariants}
        initial="hidden"
        animate="visible"
        className="mt-7 flex flex-col"
      >
        {WELCOME_LINES.map((line, i) =>
          line.trim() === '' ? (
            <motion.div key={i} variants={messageSpacerVariants} className="h-4" />
          ) : (
            <motion.p
              key={i}
              variants={messageLineVariants}
              className="font-serif text-lg leading-relaxed text-rose-900/80 sm:text-xl"
            >
              {line}
            </motion.p>
          )
        )}

        <ContinueButton onContinue={onContinue} />
      </motion.div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — the moonlit Wish Tree scene (unchanged design)
// ---------------------------------------------------------------------------

// Tiny twinkling stars scattered across the night sky.
const STARS = Array.from({ length: 22 }, (_, i) => ({
  left: `${((i * 37) % 96) + 2}%`,
  top: `${((i * 53) % 38) + 2}%`,
  size: i % 3 === 0 ? 2 : 1.4,
  dur: 2.2 + (i % 5) * 0.7,
  delay: (i % 6) * 0.5,
}))

function Stars() {
  return (
    <div data-testid="scene-stars" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4]">
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.9, 0.25] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  )
}

// Glowing fireflies drifting lazily around the tree.
const FIREFLIES = [
  { left: '14%', top: '30%', dur: 8, delay: 0 },
  { left: '72%', top: '22%', dur: 9.5, delay: 1.4 },
  { left: '86%', top: '46%', dur: 8.5, delay: 2.8 },
  { left: '28%', top: '60%', dur: 10, delay: 0.9 },
  { left: '56%', top: '36%', dur: 7.5, delay: 2.1 },
  { left: '10%', top: '74%', dur: 9, delay: 3.4 },
]

function Fireflies() {
  return (
    <div data-testid="scene-fireflies" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
      {FIREFLIES.map((f, i) => (
        <motion.span
          key={i}
          className="absolute h-[5px] w-[5px] rounded-full"
          style={{
            left: f.left,
            top: f.top,
            background: '#ffe9a8',
            boxShadow: '0 0 8px 3px rgba(255,220,130,0.8), 0 0 18px 8px rgba(255,190,90,0.4)',
          }}
          animate={{
            x: [0, 26, -12, 18, 0],
            y: [0, -20, 16, -12, 0],
            opacity: [0.2, 1, 0.5, 1, 0.2],
          }}
          transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        />
      ))}
    </div>
  )
}

// Rose petals drifting slowly through the night air.
const SCENE_PETALS = [
  { left: '6%', dur: 17, start: -2, sway: 70, w: 12, h: 14, shade: '#f6a8c3' },
  { left: '18%', dur: 21, start: -9, sway: -60, w: 10, h: 12, shade: '#f9c2d4' },
  { left: '31%', dur: 19, start: -14, sway: 80, w: 12, h: 12, shade: '#f49bb6' },
  { left: '47%', dur: 23, start: -4, sway: -70, w: 10, h: 14, shade: '#fbd1de' },
  { left: '62%', dur: 18, start: -11, sway: 60, w: 12, h: 12, shade: '#f7aec8' },
  { left: '76%', dur: 22, start: -16, sway: -80, w: 14, h: 12, shade: '#f3a0bc' },
  { left: '90%', dur: 20, start: -6, sway: 65, w: 10, h: 12, shade: '#f9c9d9' },
  { left: '38%', dur: 25, start: -19, sway: -55, w: 8, h: 10, shade: '#f8b6cd' },
]

function ScenePetals() {
  return (
    <div data-testid="scene-petals" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {SCENE_PETALS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{
            left: p.left,
            width: p.w,
            height: p.h,
            background: `linear-gradient(135deg, ${p.shade}, ${p.shade} 55%, #f088a9)`,
            borderRadius: '62% 0 62% 0',
            boxShadow: '0 0 6px rgba(255,180,200,0.35)',
          }}
          animate={{
            y: ['-4vh', '104vh'],
            x: [0, p.sway, -p.sway * 0.5, p.sway * 0.6],
            rotate: [0, 240],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            y: { duration: p.dur, repeat: Infinity, ease: 'linear', delay: p.start },
            x: { duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.start },
            rotate: { duration: p.dur, repeat: Infinity, ease: 'linear', delay: p.start },
            opacity: { duration: p.dur, repeat: Infinity, ease: 'linear', delay: p.start, times: [0, 0.08, 0.88, 1] },
          }}
        />
      ))}
    </div>
  )
}

// Gentle hearts floating up through the scene.
const SCENE_HEARTS = [
  { left: '12%', dur: 9, delay: -2, sway: 30, size: 'text-sm' },
  { left: '28%', dur: 11, delay: -5, sway: -24, size: 'text-xs' },
  { left: '47%', dur: 10, delay: -8, sway: 20, size: 'text-sm' },
  { left: '64%', dur: 12, delay: -3, sway: -28, size: 'text-xs' },
  { left: '80%', dur: 9.5, delay: -7, sway: 22, size: 'text-sm' },
  { left: '90%', dur: 11, delay: -1, sway: -18, size: 'text-xs' },
]

function SceneHearts() {
  return (
    <div data-testid="scene-hearts" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {SCENE_HEARTS.map((h, i) => (
        <motion.span
          key={i}
          className={`absolute text-rose-300/80 ${h.size}`}
          style={{ left: h.left, top: '62%', textShadow: '0 0 10px rgba(244,114,182,0.6)' }}
          animate={{ y: ['0vh', '-46vh'], x: [0, h.sway, 0], opacity: [0, 0.9, 0.9, 0] }}
          transition={{
            y: { duration: h.dur, repeat: Infinity, ease: 'linear', delay: h.delay },
            x: { duration: h.dur, repeat: Infinity, ease: 'easeInOut', delay: h.delay },
            opacity: { duration: h.dur, repeat: Infinity, ease: 'linear', delay: h.delay, times: [0, 0.15, 0.8, 1] },
          }}
        >
          ❤
        </motion.span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The night phase — darker sky, extra stars, rising lanterns, gold particles
// ---------------------------------------------------------------------------

// Deepens the scene when the wish is released.
function NightOverlay({ night }) {
  return (
    <motion.div
      data-testid="night-overlay"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[3]"
      initial={false}
      animate={{ opacity: night ? 1 : 0 }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      style={{ background: 'linear-gradient(180deg, rgba(8,4,24,0.62), rgba(14,7,30,0.78))' }}
    />
  )
}

// A denser, brighter star field that appears as the night deepens.
const NIGHT_STARS = Array.from({ length: 26 }, (_, i) => ({
  left: `${((i * 31) % 97) + 1}%`,
  top: `${((i * 47) % 55) + 2}%`,
  size: i % 3 === 0 ? 2.2 : 1.6,
  dur: 1.8 + (i % 4) * 0.6,
  delay: (i % 7) * 0.4,
}))

function NightStars({ night }) {
  return (
    <motion.div
      data-testid="night-stars"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[4]"
      initial={false}
      animate={{ opacity: night ? 1 : 0 }}
      transition={{ duration: 1.8, ease: 'easeInOut' }}
    >
      {NIGHT_STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.5)',
          }}
          animate={{ opacity: [0.2, 1, 0.3] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </motion.div>
  )
}

// A single warm paper lantern rising through the sky.
function LanternGlyph({ size }) {
  return (
    <div className="relative" style={{ width: size, height: size * 1.25 }}>
      <div
        className="absolute inset-x-0 top-0 h-[82%] rounded-t-full rounded-b-[5px]"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #ffe9b8, #ffb35c 70%, #e8843a)',
          boxShadow: '0 0 16px 6px rgba(255,170,90,0.45), 0 0 34px 14px rgba(255,160,80,0.22)',
        }}
      />
      <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-amber-200/70" />
    </div>
  )
}

// Floating lanterns drifting up into the night sky.
const LANTERNS = [
  { left: '10%', dur: 13, delay: -2, sway: 60, size: 18 },
  { left: '26%', dur: 15, delay: -7, sway: -70, size: 14 },
  { left: '42%', dur: 12, delay: -4, sway: 50, size: 20 },
  { left: '58%', dur: 14, delay: -9, sway: -55, size: 15 },
  { left: '72%', dur: 13.5, delay: -5, sway: 65, size: 18 },
  { left: '86%', dur: 15.5, delay: -11, sway: -60, size: 14 },
  { left: '33%', dur: 16, delay: -1, sway: 70, size: 16 },
  { left: '66%', dur: 14.5, delay: -3, sway: -65, size: 17 },
]

function Lanterns() {
  return (
    <div data-testid="scene-lanterns" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {LANTERNS.map((l, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: l.left, bottom: '-8%' }}
          animate={{
            y: ['0vh', '-130vh'],
            x: [0, l.sway, -l.sway * 0.4, l.sway * 0.5],
            opacity: [0, 0.95, 0.95, 0],
            rotate: [0, 9, -7, 5],
          }}
          transition={{
            y: { duration: l.dur, repeat: Infinity, ease: 'linear', delay: l.delay },
            x: { duration: l.dur, repeat: Infinity, ease: 'easeInOut', delay: l.delay },
            opacity: { duration: l.dur, repeat: Infinity, ease: 'linear', delay: l.delay, times: [0, 0.12, 0.85, 1] },
            rotate: { duration: l.dur, repeat: Infinity, ease: 'easeInOut', delay: l.delay },
          }}
        >
          <LanternGlyph size={l.size} />
        </motion.div>
      ))}
    </div>
  )
}

// Soft golden particles floating gently in the night air.
const GOLD_MOTES = [
  { left: '8%', top: '30%', size: 5, dur: 5.5, delay: 0 },
  { left: '18%', top: '64%', size: 4, dur: 6.5, delay: 1.2 },
  { left: '27%', top: '42%', size: 5, dur: 5, delay: 2.4 },
  { left: '38%', top: '78%', size: 4, dur: 7, delay: 0.6 },
  { left: '46%', top: '26%', size: 6, dur: 6, delay: 3.1 },
  { left: '55%', top: '58%', size: 4, dur: 5.5, delay: 1.8 },
  { left: '63%', top: '34%', size: 5, dur: 6.8, delay: 0.3 },
  { left: '72%', top: '70%', size: 4, dur: 5.2, delay: 2.7 },
  { left: '80%', top: '44%', size: 5, dur: 6.2, delay: 1.5 },
  { left: '90%', top: '62%', size: 4, dur: 5.8, delay: 3.4 },
  { left: '13%', top: '52%', size: 3, dur: 6.6, delay: 4.2 },
  { left: '68%', top: '20%', size: 3, dur: 7.2, delay: 2.1 },
  { left: '35%', top: '16%', size: 4, dur: 6.4, delay: 4.8 },
  { left: '85%', top: '28%', size: 5, dur: 5.4, delay: 3.8 },
]

function GoldParticles() {
  return (
    <div data-testid="scene-gold" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
      {GOLD_MOTES.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            background: 'radial-gradient(circle, rgba(255,226,150,0.95), rgba(255,190,90,0.25) 60%, transparent 78%)',
            boxShadow: '0 0 8px 2px rgba(255,200,110,0.45)',
          }}
          animate={{ y: [0, -16, 0], x: [0, 9, 0], opacity: [0.2, 0.85, 0.2] }}
          transition={{ duration: m.dur, repeat: Infinity, ease: 'easeInOut', delay: m.delay }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fireworks — bursting across the night sky once the message is revealed
// ---------------------------------------------------------------------------

// Pastel firework palettes: pink & gold, golden & mint, rose & sky blue.
const FIREWORK_PALETTES = [
  ['#ff8fb1', '#ffd98a', '#c3b0f0', '#fffdf4'],
  ['#ffd166', '#f49bb6', '#9ad7c4', '#fffdf4'],
  ['#f2a0c9', '#ffe9a8', '#aacff4', '#fffdf4'],
]

let fireworkId = 0

// One explosion: a bright center flash plus a ring of glowing particles
// radiating outward and fading.
function Burst({ x, y, palette, angleOffset }) {
  const COUNT = 18
  const particles = Array.from({ length: COUNT }, (_, i) => {
    const angle = angleOffset + (i / COUNT) * Math.PI * 2
    const dist = 55 + (i % 5) * 16
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.9,
      color: palette[i % palette.length],
      size: 3 + (i % 3) * 1.5,
      dur: 1.5 + (i % 4) * 0.28,
    }
  })

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      transition={{ duration: 0.1 }}
    >
      {/* center flash */}
      <motion.span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 12,
          height: 12,
          background: '#fffdf4',
          boxShadow: '0 0 20px 10px rgba(255,240,200,0.95), 0 0 44px 22px rgba(255,210,150,0.5)',
        }}
        initial={{ opacity: 1, scale: 0.4 }}
        animate={{ opacity: 0, scale: 2.6 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* radiating particles */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 8px 3px ${p.color}` }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], x: p.dx, y: p.dy, scale: [0.5, 1.1, 0.15] }}
          transition={{ duration: p.dur, ease: 'easeOut', delay: 0.06 }}
        />
      ))}
    </motion.div>
  )
}

// Repeats bursts across the sky on a gentle random schedule.
function Fireworks() {
  const [bursts, setBursts] = useState([])

  useEffect(() => {
    let alive = true
    let timer
    const launch = () => {
      if (!alive) return
      const id = fireworkId++
      const burst = {
        id,
        x: 14 + Math.random() * 72,
        y: 8 + Math.random() * 42,
        palette: FIREWORK_PALETTES[id % FIREWORK_PALETTES.length],
        angleOffset: Math.random() * Math.PI,
      }
      setBursts((b) => [...b.slice(-4), burst])
      // Remove the burst once its particles have faded.
      setTimeout(() => {
        if (alive) setBursts((b) => b.filter((x) => x.id !== id))
      }, 3400)
      timer = setTimeout(launch, 1400 + Math.random() * 1000)
    }
    timer = setTimeout(launch, 200)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  return (
    <div data-testid="fireworks" aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      <AnimatePresence>
        {bursts.map((b) => (
          <Burst key={b.id} {...b} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The Wish Tree itself (unchanged) + the hanging note (unchanged)
// ---------------------------------------------------------------------------

// The canopy of the tree, drawn as layered leafy blobs.
const CANOPY = [
  { cx: 210, cy: 188, r: 92 },
  { cx: 152, cy: 214, r: 66 },
  { cx: 268, cy: 208, r: 68 },
  { cx: 192, cy: 142, r: 56 },
  { cx: 248, cy: 142, r: 48 },
  { cx: 132, cy: 172, r: 42 },
  { cx: 288, cy: 170, r: 42 },
]

const BRANCHES = [
  'M200 242 C 182 226 158 220 136 214',
  'M200 240 C 220 224 244 216 268 210',
  'M199 248 C 178 244 162 234 150 224',
  'M201 246 C 224 240 240 230 256 220',
  'M197 236 C 178 218 156 196 142 176',
  'M203 234 C 224 214 246 194 262 174',
]

const FAIRY_DOTS = [
  [184, 236], [168, 230], [150, 222],
  [218, 233], [238, 226], [254, 219],
  [186, 245], [170, 240], [156, 232],
  [218, 242], [234, 236], [246, 228],
  [182, 229], [164, 214], [150, 196],
  [220, 225], [238, 208], [252, 190],
  [160, 150], [196, 128], [244, 126], [282, 148], [300, 180], [312, 216],
  [296, 250], [266, 274], [224, 282], [176, 276], [134, 252], [118, 212],
  [120, 174], [162, 120], [258, 124],
]

function WishTree() {
  return (
    <svg
      viewBox="0 0 420 480"
      className="w-[300px] drop-shadow-[0_30px_50px_-20px_rgba(0,0,0,0.7)] sm:w-[400px] md:w-[460px]"
      role="img"
      aria-label="A glowing wish tree wrapped in warm fairy lights beneath a moonlit sky"
    >
      <defs>
        <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6e0" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#fff1cf" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fff1cf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="goldPool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#ffc06a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffc06a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b2c1e" />
          <stop offset="100%" stopColor="#2a1710" />
        </linearGradient>
        <radialGradient id="canopyGrad" cx="42%" cy="36%" r="75%">
          <stop offset="0%" stopColor="#1f5c49" />
          <stop offset="70%" stopColor="#143d30" />
          <stop offset="100%" stopColor="#0e2c22" />
        </radialGradient>
      </defs>

      {/* moon with soft halo */}
      <circle cx="336" cy="84" r="66" fill="url(#moonHalo)" />
      <circle cx="336" cy="84" r="30" fill="#fff6e4" />
      <circle cx="328" cy="76" r="5" fill="#f3e0c0" opacity="0.7" />
      <circle cx="345" cy="93" r="4" fill="#f3e0c0" opacity="0.6" />
      <circle cx="342" cy="71" r="3" fill="#f3e0c0" opacity="0.5" />

      {/* warm golden glow beneath the tree */}
      <ellipse cx="210" cy="430" rx="160" ry="38" fill="url(#goldPool)" />

      {/* trunk */}
      <path
        d="M188 430 C 190 382 192 342 196 302 C 199 268 197 252 200 240 C 203 252 205 268 210 302 C 216 342 216 382 214 430 Z"
        fill="url(#trunkGrad)"
      />

      {/* branches */}
      {BRANCHES.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#3a2419"
          strokeWidth={i < 2 ? 9 : i < 4 ? 7 : 6}
          strokeLinecap="round"
        />
      ))}

      {/* canopy — layered leafy blobs */}
      {CANOPY.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="url(#canopyGrad)" />
      ))}
      {/* moonlit highlight on the canopy's top-left */}
      <circle cx="168" cy="160" r="30" fill="#2a6b55" opacity="0.55" />
      <circle cx="200" cy="140" r="24" fill="#2c705a" opacity="0.45" />
      <circle cx="140" cy="185" r="22" fill="#28705a" opacity="0.4" />

      {/* warm fairy lights wrapped around the branches + canopy */}
      {FAIRY_DOTS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.6" fill="#ffd98a" opacity="0.35" />
          <motion.circle
            cx={x}
            cy={y}
            r="1.9"
            fill="#fff3d0"
            animate={{ opacity: [0.35, 1, 0.55, 1, 0.35] }}
            transition={{ duration: 2.6 + (i % 5) * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
          />
        </g>
      ))}
    </svg>
  )
}

// The glowing paper wish note, hanging from a lower branch and gently
// swinging in the wind.
function HangingNote({ onOpenNote }) {
  return (
    <motion.div
      data-testid="hanging-note"
      className="absolute"
      style={{ left: '61%', top: '45%', transformOrigin: 'top center' }}
      animate={{ rotate: [-3.5, 3.5, -3.5] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      exit={{ opacity: 0, y: 24, rotate: 18, scale: 0.9, transition: { duration: 0.55, ease: 'easeIn' } }}
    >
      {/* string + knot */}
      <div className="mx-auto h-9 w-px bg-white/40" />
      <div className="mx-auto h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-amber-200/80" />

      {/* the note itself — soft pulsing glow */}
      <motion.button
        type="button"
        onClick={onOpenNote}
        className="relative rounded-lg bg-[#fdf3e3] px-4 py-3 text-center shadow-[0_14px_30px_-10px_rgba(0,0,0,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
        animate={{
          boxShadow: [
            '0 0 14px 2px rgba(255,205,120,0.35), 0 14px 30px -10px rgba(0,0,0,0.6)',
            '0 0 32px 12px rgba(255,190,110,0.55), 0 14px 30px -10px rgba(0,0,0,0.6)',
            '0 0 14px 2px rgba(255,205,120,0.35), 0 14px 30px -10px rgba(0,0,0,0.6)',
          ],
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        transition={{
          boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 400, damping: 17 },
        }}
      >
        {/* faint paper texture */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 25%, rgba(146,96,49,0.06), transparent 45%), radial-gradient(circle at 80% 75%, rgba(146,96,49,0.05), transparent 40%)',
          }}
        />
        <span className="relative font-script text-base leading-snug text-rose-700 sm:text-lg">
          🍃 One Last Wish...
        </span>
      </motion.button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// The unfolding letter + the birthday message
// ---------------------------------------------------------------------------

// The letter paper that unfolds after the note is opened. It glows with warm
// golden light and floats upward as the wish is released.
const UnfoldedLetter = forwardRef(function UnfoldedLetter({ night }, ref) {
  return (
    <motion.section
      ref={ref}
      data-testid="unfolded-letter"
      className="relative mx-auto w-full max-w-xl rounded-[1.75rem] border border-amber-200/60 bg-[#fdf6e8] px-6 py-12 text-center sm:px-10"
      initial={{ opacity: 0, rotateX: 88, y: 40, scale: 0.94 }}
      animate={
        night
          ? {
              opacity: 0,
              y: -120,
              scale: 1,
              rotateX: 0,
              boxShadow: '0 0 90px 30px rgba(255,190,90,0.6), 0 40px 90px -34px rgba(0,0,0,0.6)',
            }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              boxShadow: '0 44px 90px -34px rgba(0,0,0,0.65)',
            }
      }
      transition={
        night
          ? {
              // The golden light shines first; the paper rises a moment later.
              opacity: { duration: 2.6, ease: 'easeInOut', delay: 0.15 },
              y: { duration: 2.6, ease: 'easeInOut', delay: 0.6 },
              scale: { duration: 2.6, ease: 'easeInOut', delay: 0.15 },
              rotateX: { duration: 2.6, ease: 'easeInOut', delay: 0.15 },
              boxShadow: { duration: 2.6, ease: 'easeInOut', delay: 0.15 },
            }
          : { duration: 1.15, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {/* soft paper texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(146,96,49,0.05), transparent 45%), radial-gradient(circle at 82% 78%, rgba(146,96,49,0.06), transparent 45%), linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.35) 21%, transparent 22%)',
        }}
      />
      {/* warm golden light shining from inside */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(255,214,130,0.8), rgba(255,180,90,0.2) 55%, transparent 75%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: night ? 1 : 0 }}
        transition={{ duration: 1.3, delay: 0.15 }}
      />
      {/* fold crease, like a letter opened down the middle */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-900/10 to-transparent"
      />
      {/* unfolding shadow sweep */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.04) 45%, transparent)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.15, times: [0, 0.4, 1] }}
      />

      <div className="relative flex min-h-[30vh] flex-col items-center justify-center">
        {/* The wish rides upward on this paper. */}
      </div>
    </motion.section>
  )
})

// The birthday message — one paragraph at a time, slow fade, no typing.
const BIRTHDAY_PARAGRAPHS = [
  ['If I could give you every happiness in the world,', 'I would.'],
  ['If I could make every one of your dreams come true,', 'I would.'],
  ['But today...', 'I only have one wish.'],
  ['Keep smiling.', 'Keep chasing your dreams.', 'Keep becoming the amazing person you already are.'],
  ['Because watching you grow', 'has been one of the greatest blessings of my life.'],
  ['Thank you...', 'for loving me,', 'believing in me,', 'standing beside me,', 'and becoming my favorite place in this world.'],
  ['No matter where life takes us...', "I'll always celebrate you."],
]

const birthdayMessageContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 1.0, delayChildren: 0.3 } },
}
const messageItemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

function BirthdayMessage({ onRevealComplete }) {
  return (
    <motion.div
      data-testid="birthday-message"
      className="mx-auto w-full max-w-2xl px-2 py-10 text-center sm:py-14"
      variants={birthdayMessageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3
        variants={messageItemVariants}
        className="font-script text-4xl leading-snug text-rose-100 sm:text-5xl"
        style={{ textShadow: '0 0 26px rgba(244,114,182,0.5)' }}
      >
        ❤️ Happy Birthday, My Love ❤️
      </motion.h3>

      {BIRTHDAY_PARAGRAPHS.map((lines, i) => (
        <motion.p
          key={i}
          variants={messageItemVariants}
          className="mt-9 font-serif text-base leading-loose text-rose-50/90 sm:text-lg"
        >
          {lines.map((line, j) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 && <br />}
            </span>
          ))}
        </motion.p>
      ))}

      {/* The final promise — revealed line by line after the last paragraph */}
      <FinalPromise onRevealComplete={onRevealComplete} />
    </motion.div>
  )
}

// The final promise — revealed line by line after the last paragraph, ending
// on a golden closing line that lingers as the fireworks burst.
const FINAL_PROMISE_LINES = [
  'One more wish...',
  '❤️',
  'I hope',
  'this is the last birthday',
  'we celebrate',
  'from miles apart.',
  '❤️',
  'Because next year...',
  'I want to celebrate',
  'your birthday',
  'right beside you.',
  '✨',
  'Blowing out the candles together.',
  'Laughing together.',
  'Making another beautiful memory.',
  '❤️',
  'Until then...',
  "I'll keep waiting",
  'for that day.',
  '❤️',
  'Happy Next Birthday...',
  'Together.',
]

const finalPromiseContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.5, delayChildren: 0.3 } },
}
const finalPromiseLineVariants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

function FinalPromise({ onRevealComplete }) {
  const closingIndex = FINAL_PROMISE_LINES.length - 2 // 'Happy Next Birthday...'
  // No own initial/animate here — the root inherits the parent's stagger so
  // the promise begins only after the final paragraph has faded in.
  return (
    <motion.div
      data-testid="final-promise"
      className="mx-auto mt-12 w-full max-w-xl"
      variants={finalPromiseContainerVariants}
    >
      {FINAL_PROMISE_LINES.map((line, i) => {
        // Decorative emoji separators between the stanzas of the promise.
        if (line === '❤️' || line === '✨') {
          return (
            <motion.div
              key={i}
              variants={finalPromiseLineVariants}
              aria-hidden="true"
              className="mt-8 font-script text-3xl text-rose-200/90 sm:text-4xl"
              style={{ textShadow: '0 0 18px rgba(244,114,182,0.5)' }}
            >
              {line}
            </motion.div>
          )
        }
        // The closing line — slightly larger, with a soft golden glow.
        if (i === closingIndex) {
          return (
            <motion.p
              key={i}
              variants={finalPromiseLineVariants}
              className="mt-10 font-script text-3xl leading-snug text-amber-200 sm:text-4xl"
              style={{ textShadow: '0 0 26px rgba(251,191,36,0.55)' }}
            >
              {line}
            </motion.p>
          )
        }
        if (i === FINAL_PROMISE_LINES.length - 1) {
          return (
            <motion.p
              key={i}
              variants={finalPromiseLineVariants}
              onAnimationComplete={onRevealComplete}
              className="mt-3 font-script text-5xl leading-tight text-amber-100 sm:text-6xl"
              style={{
                textShadow:
                  '0 0 34px rgba(251,191,36,0.7), 0 0 70px rgba(255,190,90,0.4)',
              }}
            >
              {line}
            </motion.p>
          )
        }
        return (
          <motion.p
            key={i}
            variants={finalPromiseLineVariants}
            className="mt-3 font-serif text-base leading-relaxed text-rose-50/90 sm:text-lg"
          >
            {line}
          </motion.p>
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// The Wish Tree scene section
// ---------------------------------------------------------------------------

const WishTreeSection = forwardRef(function WishTreeSection(
  {
    noteOpened,
    onOpenNote,
    night,
    showMessage,
    fireworks,
    onRevealComplete,
    letterRef,
    showEndingCta,
  },
  ref
) {
  return (
    <motion.section
      ref={ref}
      data-testid="wish-tree-section"
      className="relative mt-12 w-full overflow-hidden rounded-[2.5rem] border border-indigo-300/30 shadow-[0_34px_80px_-36px_rgba(76,29,149,0.6)]"
      initial={{ opacity: 0, y: 44 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background:
          'radial-gradient(circle at 72% 14%, rgba(255,214,165,0.16), transparent 42%), radial-gradient(circle at 16% 28%, rgba(190,140,255,0.18), transparent 46%), radial-gradient(circle at 50% 112%, rgba(255,180,110,0.3), transparent 58%), linear-gradient(180deg, #251a4a 0%, #3a2456 58%, #52305a 100%)',
      }}
    >
      {/* night ambience — always-on layers */}
      <NightOverlay night={night} />
      <Stars />
      <NightStars night={night} />
      <Fireflies />
      <ScenePetals />
      <SceneHearts />

      {/* night phase layers — lanterns + golden particles once the wish is released */}
      {night && <Lanterns />}
      {night && <GoldParticles />}

      {/* fireworks burst across the sky once the message has finished revealing */}
      {fireworks && <Fireworks />}

      <div className="relative z-10 flex flex-col items-center px-4 pb-16 pt-14 text-center sm:px-8 sm:pt-20">
        {/* Title */}
        <motion.h2
          className="font-display text-3xl font-extrabold text-rose-50 sm:text-4xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          style={{ textShadow: '0 0 24px rgba(244,114,182,0.45)' }}
        >
          <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 bg-clip-text text-transparent">
            🌳 Make A Birthday Wish
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="mt-4 max-w-md font-serif text-lg italic leading-relaxed text-rose-100/85 sm:text-xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          Close your eyes...
          <br />
          Take one deep breath...
          <br />
          Think of your happiest dream.
          <br />
          Then open my little wish.
        </motion.p>

        {/* The tree — fades away slowly once the wish is released */}
        <div className="mt-6 w-full sm:mt-8">
          <AnimatePresence>
            {!night && (
              <motion.div
                key="tree-area"
                className="relative mx-auto w-[300px] sm:w-[400px] md:w-[460px]"
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 2.4, ease: 'easeInOut' } }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 44 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <WishTree />
                </motion.div>

                <AnimatePresence>{!noteOpened && <HangingNote onOpenNote={onOpenNote} />}</AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The unfolded letter — glows, then floats upward */}
        {noteOpened && !showMessage && (
          <div className="mx-auto mt-4 w-full max-w-xl" style={{ perspective: 1400 }}>
            <UnfoldedLetter night={night} />
          </div>
        )}

        {/* The birthday message — fades in after the pause; fireworks follow it */}
        {showMessage && <BirthdayMessage onRevealComplete={onRevealComplete} />}

        {/* The final hop — appears once the fireworks are underway, guiding
            the flow to the Final Ending page. Deliberately never shown while
            the message is still revealing. */}
        {showEndingCta && (
          <motion.div
            className="mt-10 flex justify-center pb-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Link
              to="/ending"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-white/10 px-7 py-3 text-sm font-medium text-amber-100 backdrop-blur-md transition hover:scale-105 hover:bg-white/20 hover:text-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50 sm:text-base"
              style={{ boxShadow: '0 0 26px 6px rgba(251,191,36,0.25)' }}
            >
              💌 To Be Continued...
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
})

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// Sequence timing (ms) after the note is clicked:
const NIGHT_STARTS_MS = 1700 // golden light + letter floats up, tree fades, sky deepens
const MESSAGE_STARTS_MS = 4800 // after the ~2s pause, the message fades in

function BirthdaySurprise() {
  usePageTitle('A Birthday Wish ❤️')
  const [showTree, setShowTree] = useState(false) // after "✨ Continue"
  const [noteOpened, setNoteOpened] = useState(false) // after the note is clicked
  const [night, setNight] = useState(false) // the deeper night phase
  const [showMessage, setShowMessage] = useState(false) // the birthday message
  const [fireworks, setFireworks] = useState(false) // fireworks after the reveal
  const [showEndingCta, setShowEndingCta] = useState(false) // the hop to /ending

  const timersRef = useRef([])
  const treeRef = useRef(null)
  const letterRef = useRef(null)

  // Clear any pending timers if the page unmounts mid-sequence.
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  // Gently scroll each new section into view as it appears.
  useEffect(() => {
    if (!showTree) return
    const t = setTimeout(() => treeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 380)
    timersRef.current.push(t)
  }, [showTree])

  useEffect(() => {
    if (!noteOpened) return
    const t = setTimeout(() => letterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700)
    timersRef.current.push(t)
  }, [noteOpened])

  const handleOpenNote = () => {
    if (noteOpened) return
    setNoteOpened(true)
    timersRef.current.push(setTimeout(() => setNight(true), NIGHT_STARTS_MS))
    timersRef.current.push(setTimeout(() => setShowMessage(true), MESSAGE_STARTS_MS))
  }

  // When the final line has finished revealing: fireworks burst, and a few
  // seconds later the gentle "To Be Continued..." hop to /ending appears.
  const handleRevealComplete = () => {
    setFireworks(true)
    timersRef.current.push(setTimeout(() => setShowEndingCta(true), 6500))
  }

  return (
    <motion.div
      id="birthday-surprise-page"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-pink-100 via-rose-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Shared ambient hearts background — keeps floating through everything */}
      <FloatingHearts />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <BackPill to="/gallery">← Back to our memories</BackPill>

        {/* Section 1 — welcome card */}
        <div className="flex justify-center pt-10 sm:pt-14">
          <WelcomeCard onContinue={() => setShowTree(true)} />
        </div>

        {/* Section 2 — the Wish Tree, revealed below the welcome card */}
        {showTree && (
          <WishTreeSection
            ref={treeRef}
            noteOpened={noteOpened}
            onOpenNote={handleOpenNote}
            night={night}
            showMessage={showMessage}
            fireworks={fireworks}
            onRevealComplete={handleRevealComplete}
            letterRef={letterRef}
            showEndingCta={showEndingCta}
          />
        )}
      </main>
    </motion.div>
  )
}

export default BirthdaySurprise
