// FloatingHearts.jsx
// Full-screen ambient background: a layer of twinkling sparkles behind gently
// floating hearts. Fixed to the viewport, sits behind all page content,
// and never intercepts pointer events.
//
// Performance: all random values are generated exactly once with useMemo.
// Animations only touch transform + opacity (GPU-friendly), loop infinitely,
// and are fully desynchronized (independent durations, delays, sway cycles).

import { useMemo } from 'react'
import { motion } from 'framer-motion'

const EMOJIS = ['❤️', '💕', '💖', '💘', '💗', '🥺']
const HEART_COUNT = 80
const SPARKLE_COUNT = 40

const random = (min, max) => Math.random() * (max - min) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// `heartCount` / `sparkleCount` let pages thin out the atmosphere (e.g. the
// Story Book's autumn chapter reduces the floating hearts). Defaults match
// the original densities.
function FloatingHearts({ heartCount = HEART_COUNT, sparkleCount = SPARKLE_COUNT }) {
  // Random values generated once per density — never regenerated, no timers.
  const hearts = useMemo(
    () =>
      Array.from({ length: heartCount }, (_, i) => ({
        id: i,
        emoji: pick(EMOJIS),
        left: random(0, 100), // horizontal position (% of viewport width)
        startY: random(105, 135), // start below the viewport (vh)
        size: random(16, 42), // px
        opacity: random(0.35, 0.9),
        duration: random(8, 20), // seconds per full ascent
        delay: random(0, 9), // desync the loop start
        drift: random(-28, 28), // sway distance (px)
        sway: random(3, 7), // sway cycle duration (s)
        tilt: random(-14, 14), // subtle rotation (deg)
      })),
    [heartCount]
  )

  const sparkles = useMemo(
    () =>
      Array.from({ length: sparkleCount }, (_, i) => ({
        id: i,
        left: random(0, 100),
        top: random(0, 100),
        size: random(2, 5), // px
        peak: random(0.15, 0.5), // peak opacity — kept subtle
        duration: random(2.5, 6), // twinkle cycle (s)
        delay: random(0, 5),
      })),
    [sparkleCount]
  )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      data-hearts-count={hearts.length}
    >
      {/* Sparkle layer (behind hearts) */}
      <div className="absolute inset-0">
        {sparkles.map((sparkle) => (
          <motion.span
            key={sparkle.id}
            className="absolute rounded-full bg-pink-300"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: sparkle.size,
              height: sparkle.size,
              boxShadow: '0 0 6px 2px rgba(253, 164, 175, 0.55)',
              willChange: 'opacity',
            }}
            animate={{ opacity: [0, sparkle.peak, 0] }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating hearts layer (above sparkles, below page content) */}
      <div className="absolute inset-0">
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            className="absolute select-none"
            style={{
              top: 0,
              left: `${heart.left}%`,
              fontSize: heart.size,
              lineHeight: 1,
              willChange: 'transform',
            }}
            initial={{ y: `${heart.startY}vh` }}
            animate={{ y: '-110vh', opacity: [heart.opacity, heart.opacity, 0] }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Inner sway + tilt (independent timing keeps motion organic) */}
            <motion.span
              className="inline-block"
              animate={{ x: [0, heart.drift, 0], rotate: [0, heart.tilt, 0] }}
              transition={{
                duration: heart.sway,
                delay: heart.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {heart.emoji}
            </motion.span>
          </motion.span>
        ))}
      </div>
    </div>
  )
}

export default FloatingHearts
