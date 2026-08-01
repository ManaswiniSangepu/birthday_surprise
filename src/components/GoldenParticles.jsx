// GoldenParticles.jsx
// A quiet classroom-afternoon atmosphere: warm golden sunlight motes that
// drift slowly across the page like dust in sunbeams. Rendered only for the
// chapter flagged `golden: true` in storyData.js (wired up by the page).
// Fixed to the viewport, sits behind all content, never intercepts pointer
// events.
//
// Performance: all random values are generated exactly once with useMemo.
// The animation is pure CSS (compositor-safe — same approach as the book's
// stars and leaves) and fully desynchronized per particle.

import { useMemo } from 'react'

const GOLDEN_COLORS = ['#fde68a', '#fcd34d', '#fbbf24', '#fff3c4']

const random = (min, max) => Math.random() * (max - min) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function GoldenParticles({ count = 26 }) {
  // Random values generated once per count — never regenerated, no timers.
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: random(0, 100), // horizontal position (% of viewport width)
        top: random(0, 100), // starting vertical position (% of viewport)
        size: random(2, 5), // px — tiny dust motes
        color: pick(GOLDEN_COLORS),
        peak: random(0.25, 0.6), // peak opacity — kept subtle
        duration: random(14, 26), // seconds per slow drift
        delay: random(0, 12), // desync the loop start
        dx: random(-40, 40), // horizontal drift (px)
        dy: random(-60, -20), // slow upward drift (px)
      })),
    [count]
  )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      data-golden-count={particles.length}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="golden-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px 2px ${p.color}55`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--peak': p.peak,
          }}
        />
      ))}
    </div>
  )
}

export default GoldenParticles
