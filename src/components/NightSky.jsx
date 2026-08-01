// NightSky.jsx
// Premium full-screen black background: pure black, a very subtle dark red
// radial glow in the center, ~80 small glowing heart particles floating
// upward (❤️ 💖 💕), and tiny soft glowing red particles behind them.
// Everything is slow, subtle, and GPU-friendly (transform + opacity only) —
// it quietly surrounds the content without ever distracting from it.

import { useMemo } from 'react'
import { motion } from 'framer-motion'

const HEART_COUNT = 80
const PARTICLE_COUNT = 30
const HEART_EMOJIS = ['❤️', '💖', '💕']

const random = (min, max) => Math.random() * (max - min) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function NightSky() {
  // Random values generated once — continuous upward flow, no timers.
  const hearts = useMemo(
    () =>
      Array.from({ length: HEART_COUNT }, (_, i) => ({
        id: i,
        emoji: pick(HEART_EMOJIS),
        left: random(0, 100), // horizontal position (% of viewport)
        startY: random(105, 135), // start below the viewport (vh)
        size: random(10, 22), // px
        opacity: random(0.15, 0.45), // kept subtle
        duration: random(12, 24), // seconds per full ascent (slow)
        delay: random(0, 16), // desync the loops
        drift: random(-24, 24), // sway distance (px)
        sway: random(3, 7), // sway cycle duration (s)
      })),
    []
  )

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: random(0, 100),
        top: random(0, 100),
        size: random(2, 4), // px
        peak: random(0.15, 0.4), // very soft
        duration: random(8, 16),
        delay: random(0, 8),
        drift: random(-30, 30),
      })),
    []
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Pure black base */}
      <div className="absolute inset-0 bg-black" />

      {/* Very subtle dark red radial glow in the center */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(153,27,27,0.22) 0%, rgba(80,10,15,0.10) 40%, transparent 70%)',
        }}
      />

      {/* Soft glowing red particles (behind the hearts) */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute rounded-full bg-red-400"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              boxShadow: '0 0 8px 3px rgba(239,68,68,0.35)',
              willChange: 'transform, opacity',
            }}
            animate={{ y: [0, -60], x: [0, particle.drift], opacity: [0, particle.peak, 0] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating glowing hearts */}
      <div className="absolute inset-0">
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            className="absolute select-none"
            style={{
              left: `${heart.left}%`,
              fontSize: heart.size,
              lineHeight: 1,
              textShadow: '0 0 10px rgba(255,60,80,0.55)',
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
            {/* Inner sway on its own timing keeps the motion organic */}
            <motion.span
              className="inline-block"
              animate={{ x: [0, heart.drift, 0] }}
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

export default NightSky
