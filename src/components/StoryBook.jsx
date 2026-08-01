// StoryBook.jsx
// A single, reusable storybook component.
//
// Pass `chapters` — an array of `{ id, image, title, story }` — and an
// `onFinish` callback. The component owns exactly one piece of state,
// `chapterIndex`, and renders `chapters[chapterIndex]`: the chapter image on
// the LEFT page and the title + story on the RIGHT page. "Continue Our Story"
// plays a page-turn animation, then increments `chapterIndex` — no routing
// between chapters, no extra pages. On the final chapter the button becomes
// "❤️ Continue To Our Memories" and calls `onFinish`.
//
// Chapters are unlimited — append an object to storyData.js and it renders
// automatically. Every spread is sized to fit completely on one book page:
// the book never scrolls.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const TURN_DURATION = 1.15
const EASE = [0.65, 0, 0.35, 1]

// Tailwind's `md` breakpoint is 768px — match it in JS so we render the right
// turn overlay for the active layout (side-by-side vs stacked).
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

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

// One open spread — side-by-side pages on desktop, stacked (illustration over
// story) on mobile, joined by a slim spine that runs vertically on desktop
// and horizontally on mobile.
function Spread({ left, right, tiny }) {
  return (
    <div className="flex min-h-[70vh] w-full flex-col md:min-h-0 md:h-full md:flex-row">
      {/* LEFT PAGE (top on mobile) */}
      <div className="relative h-[32vh] min-h-[220px] w-full shrink-0 overflow-hidden bg-[#fbf2df] md:h-full md:min-h-0 md:w-1/2">
        {/* Fold shading toward the spine (bottom on mobile / right on desktop) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent md:inset-y-0 md:right-0 md:h-auto md:w-10 md:bg-gradient-to-l"
        />
        {/* Left page keeps standard padding for ALL chapters: the illustration
            is max-h-[85%] centered and needs no extra room, and the desktop
            turn overlays render it with this exact padding — so slimming it
            for tiny chapters would make the illustration jump on landing. */}
        <div className="relative h-full overflow-hidden px-5 py-6 sm:px-8 sm:py-8">{left}</div>
        <PaperTexture />
      </div>

      {/* Spine gutter (horizontal on mobile / vertical on desktop) */}
      <div aria-hidden="true" className="relative z-10 h-2 w-full shrink-0 md:h-full md:w-3">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#e9d9b8] to-black/25 md:bg-gradient-to-r" />
        <div className="absolute inset-y-0 left-0 w-1.5 rounded-r-full bg-black/30 md:inset-x-0 md:top-0 md:h-1.5 md:w-auto md:rounded-b-full" />
        <div className="absolute inset-y-0 right-0 w-1.5 rounded-l-full bg-black/30 md:inset-x-0 md:bottom-0 md:h-1.5 md:w-auto md:rounded-t-full" />
      </div>

      {/* RIGHT PAGE (bottom on mobile) — generous padding, never scrolls */}
      <div className="relative w-full flex-1 overflow-hidden bg-[#fbf2df] md:h-full md:w-1/2">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/10 to-transparent md:inset-y-0 md:left-0 md:h-auto md:w-10 md:bg-gradient-to-r"
        />
        <div
          className={`relative h-full overflow-hidden ${
            tiny ? 'px-4 py-4 sm:px-5' : 'px-5 py-6 sm:px-8 sm:py-9'
          }`}
        >
          {right}
        </div>
        <PaperTexture />
      </div>
    </div>
  )
}

// --- Chapter illustration (left page) ---------------------------------------
// A printed-illustration look: the matte frame hugs the artwork and is
// centered on the page (~85% of the page height, equal margins, aspect-ratio
// safe). Fades in + Ken Burns zoom via CSS (compositor-safe — reveals even
// when requestAnimationFrame is throttled).
function ChapterIllustration({ src, alt }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="story-illustration relative w-fit max-w-full overflow-hidden rounded-xl bg-white p-2 shadow-[0_20px_45px_-20px_rgba(88,28,50,0.5)] ring-1 ring-amber-200/60 sm:p-3">
        <img
          src={src}
          alt={alt}
          className="ken-burns h-auto max-h-[85%] w-auto max-w-full rounded-lg object-contain"
        />
      </div>
    </div>
  )
}

// --- Chapter text (right page) ----------------------------------------------
// Title + story revealed line by line via CSS animation delays (compositor-
// safe: the reveal runs even when JS animation frames are throttled, so the
// content is never stuck invisible). The Continue button is plain HTML —
// always visible and clickable, fully independent of any animation state.
function ChapterText({ title, story, isLast, canGoBack, compact, tiny, revealStep = 0.12, onContinue, onBack }) {
  // Line i starts writing after the 1.15s page turn lands, one stagger slot
  // at a time (mirrors the previous framer-motion rhythm). Chapters can slow
  // the cascade via `revealStep` in storyData.js (the final chapter uses a
  // slower step so every line lingers a little longer before the next one).
  const lineDelay = (i) => `${Math.round((1.15 + (i + 2) * revealStep) * 100) / 100}s`

  // `tiny` (the longest chapter, Ch. 11) uses the smallest readable font with
  // slimmer margins and buttons so every line still fits one spread.
  const btnSize = tiny ? 'px-6 py-2 text-xs sm:text-sm' : 'px-7 py-3 text-sm sm:text-base'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2
        className={`story-title shrink-0 font-display font-bold leading-snug text-rose-900 ${
          tiny ? 'text-sm' : 'text-base sm:text-[1.35rem]'
        }`}
        style={{ animationDelay: '1.15s' }}
      >
        {title}
      </h2>
      <div
        className={`story-divider h-px w-16 shrink-0 bg-gradient-to-r from-rose-400 to-transparent ${
          tiny ? 'mt-1' : 'mt-1.5'
        }`}
        style={{ animationDelay: '1.27s' }}
      />

      {/* Story — sized to fit the spread; overflow is hidden (never scrolls).
          `data-story-area` lets the verification script assert no overflow.
          Fitting is done with LINE SPACING ONLY (never font size): the
          sm: leading re-asserts snugness that sm:text-base would otherwise
          override, gaps are zeroed, and blank separators are slimmed — so
          even the longest chapter (Ch. 11, 64 lines) fits one spread at the
          620px stage floor. The very longest chapters (7, 8 & 9) opt into
          `compact` in storyData.js, and the longest of all (Ch. 11) opts
          into `tiny` — the smallest readable font with slimmer margins. */}
      <div
        data-story-area
        className={`flex-1 md:min-h-0 md:overflow-hidden ${tiny ? 'mt-1' : 'mt-2'}`}
      >
        {story.map((line, i) =>
          line.trim() === '' ? (
            <div key={i} className={compact || tiny ? 'h-px' : 'h-[2px]'} aria-hidden="true" />
          ) : (
            <p
              key={i}
              className={
                tiny
                  ? 'story-line font-serif text-[11px] leading-[1] text-stone-800/90'
                  : compact
                    ? 'story-line font-serif text-xs leading-[1] text-stone-800/90'
                    : 'story-line font-serif text-sm leading-relaxed text-stone-800/90 sm:text-base sm:leading-snug'
              }
              style={{ animationDelay: lineDelay(i) }}
            >
              {line}
            </p>
          )
        )}
      </div>

      {/* Buttons — always visible and clickable (no animation dependency). */}
      <div
        className={`flex shrink-0 items-center justify-center gap-3 ${tiny ? 'mt-3' : 'mt-6'}`}
      >
        {canGoBack && (
          <button
            id="previous-story-button"
            type="button"
            onClick={onBack}
            className={`relative overflow-hidden rounded-full border border-rose-200/70 bg-gradient-to-r from-rose-50 to-amber-50/80 ${btnSize} font-semibold text-rose-950 shadow-md shadow-rose-200/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_38px_-8px_rgba(190,24,93,0.4)] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/50`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-transparent to-white/10"
            />
            <span className="relative">← Previous</span>
          </button>
        )}
        <button
          id="continue-story-button"
          type="button"
          onClick={onContinue}
          className={`relative overflow-hidden rounded-full border border-white/50 bg-gradient-to-r from-pink-400/90 to-rose-400/90 ${btnSize} font-semibold text-white shadow-lg shadow-pink-500/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_38px_-8px_rgba(236,72,153,0.55)] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10"
          />
          <span className="relative">
            {isLast ? '❤️ Continue To Our Memories' : '❤️ Continue Our Story'}
          </span>
        </button>
      </div>
    </div>
  )
}

// --- Glowing drifting stars (special touch for select chapters) --------------
// A subtle field of tiny glowing stars that drift slowly around the book.
// Rendered only for chapters flagged `stars: true` in storyData.js — future
// chapters opt in with one field, no component changes. Pure CSS animation
// (compositor-safe, matching the book's other reveals) and pointer-events-none
// so it can never block the book's buttons.
const STAR_CONFIG = [
  { left: '4%', top: '-6%', size: 3, dur: 11, delay: 0, glow: 6, color: '#fff6df' },
  { left: '26%', top: '-2%', size: 2, dur: 13, delay: 2.1, glow: 4, color: '#ffdcef' },
  { left: '52%', top: '-7%', size: 3.5, dur: 9, delay: 0.8, glow: 7, color: '#fff6df' },
  { left: '78%', top: '-3%', size: 2, dur: 12, delay: 3.4, glow: 5, color: '#ffe9b8' },
  { left: '98%', top: '10%', size: 2.5, dur: 10, delay: 1.6, glow: 5, color: '#ffdcef' },
  { left: '104%', top: '38%', size: 3, dur: 14, delay: 0.2, glow: 6, color: '#fff6df' },
  { left: '100%', top: '64%', size: 2, dur: 11, delay: 4.2, glow: 4, color: '#ffe9b8' },
  { left: '95%', top: '88%', size: 3, dur: 9, delay: 2.8, glow: 6, color: '#ffdcef' },
  { left: '70%', top: '104%', size: 2.5, dur: 12, delay: 1.1, glow: 5, color: '#fff6df' },
  { left: '44%', top: '106%', size: 2, dur: 10, delay: 5, glow: 4, color: '#ffe9b8' },
  { left: '16%', top: '102%', size: 3, dur: 13, delay: 0.5, glow: 6, color: '#ffdcef' },
  { left: '-4%', top: '80%', size: 2.5, dur: 11, delay: 3.1, glow: 5, color: '#fff6df' },
  { left: '-8%', top: '46%', size: 3, dur: 14, delay: 1.9, glow: 6, color: '#ffe9b8' },
  { left: '2%', top: '18%', size: 2, dur: 9, delay: 4.6, glow: 4, color: '#ffdcef' },
]

function ChapterStars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-10 z-[5]">
      {STAR_CONFIG.map((s, i) => (
        <span
          key={i}
          className="story-star"
          style={{
            left: s.left,
            top: s.top,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.glow}px 1px ${s.color}`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// --- Slow-falling autumn leaves (special touch for select chapters) ----------
// A few leaves drift gently down around the book, mirroring ChapterStars: only
// chapters flagged `leaves: true` in storyData.js get them, pure CSS animation
// (compositor-safe), pointer-events-none so they never block the book.
const LEAF_CONFIG = [
  { left: '6%', size: 22, dur: 14, delay: 0, sway: 18, spin: 120, emoji: '🍂' },
  { left: '20%', size: 18, dur: 17, delay: 3, sway: 26, spin: -150, emoji: '🍁' },
  { left: '34%', size: 24, dur: 15, delay: 6, sway: 20, spin: 90, emoji: '🍂' },
  { left: '48%', size: 16, dur: 18, delay: 1.5, sway: 30, spin: -110, emoji: '🍁' },
  { left: '62%', size: 20, dur: 13, delay: 4.5, sway: 22, spin: 140, emoji: '🍂' },
  { left: '76%', size: 17, dur: 16, delay: 7, sway: 28, spin: -130, emoji: '🍁' },
  { left: '90%', size: 23, dur: 14, delay: 2, sway: 18, spin: 100, emoji: '🍂' },
  { left: '104%', size: 19, dur: 17, delay: 5, sway: 24, spin: -160, emoji: '🍁' },
]

function ChapterLeaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-[5] overflow-hidden">
      {LEAF_CONFIG.map((l, i) => (
        <span
          key={i}
          className="story-leaf"
          style={{
            left: l.left,
            width: l.size,
            height: l.size,
            fontSize: l.size,
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
            '--sway': `${l.sway}px`,
            '--spin': `${l.spin}deg`,
          }}
        >
          {l.emoji}
        </span>
      ))}
    </div>
  )
}

// --- Tiny glowing dust motes (special touch for select chapters) ------------
// A few warm golden motes drift slowly around the book like memories floating
// in golden evening light. Same pattern as ChapterStars/ChapterLeaves: only
// chapters flagged `dust: true` in storyData.js get them, pure CSS animation
// (compositor-safe), pointer-events-none so they never block the book.
const DUST_CONFIG = [
  { left: '3%', top: '-5%', size: 2.5, dur: 13, delay: 0, glow: 5, color: '#fff7e0' },
  { left: '22%', top: '-2%', size: 2, dur: 15, delay: 2.5, glow: 4, color: '#ffe9b8' },
  { left: '48%', top: '-6%', size: 3, dur: 11, delay: 1.2, glow: 6, color: '#ffdf9e' },
  { left: '76%', top: '-3%', size: 2, dur: 14, delay: 3.8, glow: 4, color: '#fff7e0' },
  { left: '97%', top: '8%', size: 2.5, dur: 12, delay: 2, glow: 5, color: '#ffe9b8' },
  { left: '103%', top: '35%', size: 2, dur: 16, delay: 0.8, glow: 4, color: '#ffdf9e' },
  { left: '99%', top: '60%', size: 3, dur: 13, delay: 4.5, glow: 6, color: '#fff7e0' },
  { left: '94%', top: '86%', size: 2, dur: 12, delay: 3, glow: 4, color: '#ffe9b8' },
  { left: '68%', top: '103%', size: 2.5, dur: 14, delay: 1.5, glow: 5, color: '#ffdf9e' },
  { left: '42%', top: '105%', size: 2, dur: 15, delay: 5.5, glow: 4, color: '#fff7e0' },
  { left: '15%', top: '101%', size: 3, dur: 12, delay: 0.6, glow: 6, color: '#ffe9b8' },
  { left: '-3%', top: '78%', size: 2, dur: 13, delay: 3.6, glow: 4, color: '#fff7e0' },
]

function ChapterDust() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-10 z-[5]">
      {DUST_CONFIG.map((d, i) => (
        <span
          key={i}
          className="story-dust"
          style={{
            left: d.left,
            top: d.top,
            width: `${d.size}px`,
            height: `${d.size}px`,
            backgroundColor: d.color,
            boxShadow: `0 0 ${d.glow}px 1px ${d.color}`,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// --- Blinking fireflies + warm street-light pools (special touch for select
// chapters) ---
// A cozy night-walk atmosphere: a few tiny fireflies blink and drift around
// the book while soft warm pools of street light glow gently at its edges.
// Same pattern as the other special touches: only chapters flagged
// `fireflies: true` in storyData.js get them, pure CSS animation
// (compositor-safe), pointer-events-none so they never block the book.
const FIREFLY_CONFIG = [
  { left: '4%', top: '-5%', size: 3, dur: 9, delay: 0, color: '#fef08a' },
  { left: '20%', top: '-2%', size: 2.5, dur: 11, delay: 2.2, color: '#fde047' },
  { left: '45%', top: '-6%', size: 3, dur: 8, delay: 1.1, color: '#d9f99d' },
  { left: '70%', top: '-3%', size: 2.5, dur: 10, delay: 3.6, color: '#fef08a' },
  { left: '95%', top: '6%', size: 3, dur: 9, delay: 1.8, color: '#fde047' },
  { left: '102%', top: '34%', size: 2.5, dur: 12, delay: 0.5, color: '#d9f99d' },
  { left: '98%', top: '62%', size: 3, dur: 8, delay: 4.1, color: '#fef08a' },
  { left: '93%', top: '88%', size: 2.5, dur: 10, delay: 2.7, color: '#fde047' },
  { left: '66%', top: '103%', size: 3, dur: 9, delay: 1.4, color: '#d9f99d' },
  { left: '40%', top: '105%', size: 2.5, dur: 11, delay: 4.8, color: '#fef08a' },
  { left: '14%', top: '101%', size: 3, dur: 8, delay: 0.9, color: '#fde047' },
  { left: '-3%', top: '76%', size: 2.5, dur: 10, delay: 3.2, color: '#d9f99d' },
]

const STREETLIGHT_CONFIG = [
  { left: '0%', top: '10%', size: 110, dur: 5, delay: 0 },
  { left: '88%', top: '72%', size: 100, dur: 6, delay: 1.5 },
  { left: '46%', top: '98%', size: 120, dur: 7, delay: 0.8 },
]

function ChapterFireflies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-10 z-[5]">
      {/* Warm street-light pools glowing at the book's edges */}
      {STREETLIGHT_CONFIG.map((s, i) => (
        <span
          key={`light-${i}`}
          className="street-light"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            // Center the glow pool on its declared position (unlike the tiny
            // dot effects, a 100-120px pool anchored top-left would sit
            // ~50-60px off-center and clip at the container edge).
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(251, 191, 36, 0.35), rgba(251, 191, 36, 0.12) 45%, transparent 70%)',
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {/* Tiny blinking fireflies drifting around the book */}
      {FIREFLY_CONFIG.map((f, i) => (
        <span
          key={`fly-${i}`}
          className="story-firefly"
          style={{
            left: f.left,
            top: f.top,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.color,
            boxShadow: `0 0 ${f.size * 2}px 1px ${f.color}`,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// --- Twinkling fairy lights (special touch for select chapters) ------------
// A few tiny warm fairy lights twinkle softly around the book like string
// lights glowing in a cozy kitchen. Same pattern as the other special
// touches: only chapters flagged `fairyLights: true` in storyData.js get
// them, pure CSS animation (compositor-safe), pointer-events-none.
const FAIRY_CONFIG = [
  { left: '4%', top: '-5%', size: 3, dur: 3, delay: 0, color: '#fff7e0' },
  { left: '12%', top: '-2%', size: 2.5, dur: 2.6, delay: 0.6, color: '#ffe9a8' },
  { left: '20%', top: '-6%', size: 3, dur: 3.4, delay: 1.3, color: '#ffd98e' },
  { left: '30%', top: '-1%', size: 2.5, dur: 2.8, delay: 0.3, color: '#fff3c4' },
  { left: '42%', top: '-5%', size: 3, dur: 3.2, delay: 1.8, color: '#ffe9a8' },
  { left: '55%', top: '-3%', size: 2.5, dur: 2.5, delay: 0.9, color: '#ffd98e' },
  { left: '68%', top: '-6%', size: 3, dur: 3.6, delay: 2.1, color: '#fff7e0' },
  { left: '80%', top: '-2%', size: 2.5, dur: 2.9, delay: 1.1, color: '#ffe9a8' },
  { left: '93%', top: '-5%', size: 3, dur: 3.1, delay: 0.5, color: '#ffd98e' },
  { left: '102%', top: '14%', size: 2.5, dur: 2.7, delay: 1.6, color: '#fff3c4' },
  { left: '104%', top: '42%', size: 3, dur: 3.3, delay: 0.2, color: '#ffe9a8' },
  { left: '101%', top: '70%', size: 2.5, dur: 2.8, delay: 2.3, color: '#ffd98e' },
  { left: '95%', top: '92%', size: 3, dur: 3.5, delay: 1.4, color: '#fff7e0' },
  { left: '72%', top: '103%', size: 2.5, dur: 2.6, delay: 0.7, color: '#ffe9a8' },
  { left: '50%', top: '105%', size: 3, dur: 3, delay: 1.9, color: '#ffd98e' },
  { left: '26%', top: '103%', size: 2.5, dur: 2.9, delay: 0.4, color: '#fff3c4' },
  { left: '8%', top: '100%', size: 3, dur: 3.2, delay: 2.5, color: '#ffe9a8' },
  { left: '-3%', top: '76%', size: 2.5, dur: 2.7, delay: 1.2, color: '#ffd98e' },
]

function ChapterFairyLights() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-10 z-[5]">
      {FAIRY_CONFIG.map((f, i) => (
        <span
          key={i}
          className="story-fairy-light"
          style={{
            left: f.left,
            top: f.top,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.color,
            boxShadow: `0 0 ${f.size * 2}px 1px ${f.color}`,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// --- The book ----------------------------------------------------------------
function StoryBook({ chapters, onFinish, onChapterChange }) {
  const [chapterIndex, setChapterIndex] = useState(0)
  const [turning, setTurning] = useState(false)
  const [turnDir, setTurnDir] = useState(1) // 1 = forward, -1 = backward
  const isDesktop = useIsDesktop()

  const chapter = chapters[chapterIndex]
  const isLastChapter = chapterIndex >= chapters.length - 1
  const nextChapter =
    turning && turnDir === 1 ? chapters[Math.min(chapterIndex + 1, chapters.length - 1)] : null
  const prevChapter =
    turning && turnDir === -1 ? chapters[Math.max(chapterIndex - 1, 0)] : null

  // --- TEMP DEBUG (remove once the user confirms the button works) ---
  useEffect(() => {
    console.log('[DEBUG] StoryBook mounted — chapters.length =', chapters.length)
  }, [])
  useEffect(() => {
    console.log('[DEBUG] chapterIndex changed →', chapterIndex)
    // Let the page react to the active chapter (e.g. thin out the floating
    // hearts on the autumn chapter).
    onChapterChange?.(chapterIndex)
  }, [chapterIndex, onChapterChange])

  // Turn engine — deterministic. A browser timer aligned with the page-turn
  // animation advances the index (browser timers always fire), so the book
  // always moves forward. The ref makes the advance idempotent.
  const turnInFlight = useRef(false)
  const turnTimer = useRef(null)
  useEffect(() => () => clearTimeout(turnTimer.current), [])

  const startTurn = (dir) => {
    if (turnInFlight.current) return
    console.log('[DEBUG] startTurn — chapterIndex before turn =', chapterIndex, '| dir =', dir)
    turnInFlight.current = true
    setTurnDir(dir)
    setTurning(true)
    turnTimer.current = window.setTimeout(() => {
      turnInFlight.current = false
      setTurning(false)
      setChapterIndex((i) => Math.min(Math.max(i + dir, 0), chapters.length - 1))
    }, TURN_DURATION * 1000 + 60)
  }

  // "Continue Our Story": play the page-turn animation, then (via the timer
  // above) render the next chapter. The final chapter finishes the book.
  const handleContinue = () => {
    console.log(
      '[DEBUG] Button clicked — chapterIndex =',
      chapterIndex,
      '| isLastChapter =',
      isLastChapter
    )
    if (turnInFlight.current) {
      console.log('[DEBUG] click ignored — a turn is already in flight')
      return
    }
    if (isLastChapter) onFinish?.()
    else startTurn(1)
  }

  // "← Previous": reverse page-turn back to the previous chapter.
  const handleBack = () => {
    console.log('[DEBUG] Previous clicked — chapterIndex =', chapterIndex)
    if (turnInFlight.current) {
      console.log('[DEBUG] click ignored — a turn is already in flight')
      return
    }
    if (chapterIndex === 0) return
    startTurn(-1)
  }

  const spreadFor = (c, index) => ({
    tiny: !!c.tiny,
    left: <ChapterIllustration src={c.image} alt={c.title} />,
    right: (
      <ChapterText
        title={c.title}
        story={c.story}
        compact={c.compact}
        tiny={c.tiny}
        revealStep={c.revealStep}
        isLast={index >= chapters.length - 1}
        canGoBack={index > 0}
        onContinue={handleContinue}
        onBack={handleBack}
      />
    ),
  })

  const currentSpread = spreadFor(chapter, chapterIndex)
  const nextSpread =
    nextChapter && spreadFor(nextChapter, Math.min(chapterIndex + 1, chapters.length - 1))
  const prevSpread =
    prevChapter && spreadFor(prevChapter, Math.max(chapterIndex - 1, 0))

  // While turning, the pages underneath show the INCOMING spread — the next
  // chapter when going forward, the previous when going back — so the peeled
  // page reveals the correct spread on landing.
  let underlying = currentSpread
  if (turning && turnDir === 1 && nextSpread) underlying = nextSpread
  else if (turning && turnDir === -1 && prevSpread) underlying = prevSpread

  return (
    <div id="story-book" className="relative w-[min(88vw,1500px)]" data-chapter={chapterIndex}>
      {/* TEMP DEBUG — live chapter index on screen; remove once confirmed */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-full bg-black/70 px-3 py-1.5 font-mono text-xs text-white">
        Current Chapter: {chapterIndex}
      </div>
      {/* Soft ambient glow behind the book */}
      <div aria-hidden="true" className="absolute -inset-10 rounded-[4rem] bg-rose-200/40 blur-3xl" />

      {/* Special touches — only for chapters flagged in storyData.js:
          drifting stars (Ch. 6), slow-falling autumn leaves (Ch. 7), tiny
          glowing dust motes (Ch. 9, 11, 12, 13 & 14), blinking fireflies +
          warm street lights (Ch. 10 & 13) and twinkling fairy lights
          (Ch. 14). */}
      {chapter.stars && <ChapterStars />}
      {chapter.leaves && <ChapterLeaves />}
      {chapter.dust && <ChapterDust />}
      {chapter.fireflies && <ChapterFireflies />}
      {chapter.fairyLights && <ChapterFairyLights />}

      {/* NOTE: NO 3D perspective/preserve-3d on this static shell. A 3D
          transform context (perspective + rotateX + preserve-3d) on an
          ancestor breaks the compositor's hit-testing — real pointer events
          on the Continue button land on its parent wrapper and onClick never
          fires. The page-turn overlay below has its own perspective: 2000,
          so the turn animation keeps its full 3D depth. */}
      <div className="relative">
        {/* Elegant hardcover */}
        <div className="rounded-[1.4rem] bg-gradient-to-br from-rose-900 via-[#5c1024] to-[#2c0710] p-2.5 shadow-[0_40px_90px_-25px_rgba(88,28,50,0.55)] sm:p-3">
          {/* Cover trim */}
          <div className="rounded-[1rem] border border-amber-200/25 bg-gradient-to-br from-rose-800/60 to-rose-950/80 p-1.5">
            {/* Open pages — desktop gets a tall fixed stage, mobile grows with content */}
            <div className="relative overflow-hidden rounded-lg bg-[#fbf2df] md:h-[min(max(72vh,620px),920px)]">
              <Spread left={underlying.left} right={underlying.right} tiny={underlying.tiny} />

              {/* DESKTOP forward turn — the old right page flips over the left */}
              {isDesktop && turning && turnDir === 1 && nextSpread && (
                <div className="absolute inset-0 z-20" style={{ perspective: 2000 }}>
                  <motion.div
                    className="absolute bottom-0 right-0 top-0 w-1/2"
                    style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: -180 }}
                    transition={{ duration: TURN_DURATION, ease: EASE }}
                  >
                    {/* FRONT face — the page being turned away (current chapter's text) */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div
                        className={`absolute inset-0 overflow-hidden ${
                          currentSpread.tiny ? 'px-4 py-4 sm:px-5' : 'px-5 py-6 sm:px-8 sm:py-9'
                        }`}
                      >
                        {currentSpread.right}
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

                    {/* BACK face — the next chapter's illustration, revealed on landing */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="absolute inset-0 overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                        {nextSpread.left}
                      </div>
                      <PaperTexture />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* DESKTOP backward turn — the left page flips back to the right */}
              {isDesktop && turning && turnDir === -1 && prevSpread && (
                <div className="absolute inset-0 z-20" style={{ perspective: 2000 }}>
                  <motion.div
                    className="absolute bottom-0 left-0 top-0 w-1/2"
                    style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 180 }}
                    transition={{ duration: TURN_DURATION, ease: EASE }}
                  >
                    {/* FRONT face — the page being turned back (current illustration) */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-r-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="absolute inset-0 overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                        {currentSpread.left}
                      </div>
                      <PaperTexture />
                      {/* Page-lift shadow sweeping across as it turns back */}
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: TURN_DURATION, times: [0, 0.5, 1], ease: 'easeInOut' }}
                        style={{
                          background:
                            'linear-gradient(to left, rgba(0,0,0,0.32), rgba(0,0,0,0.05) 60%, transparent)',
                        }}
                      />
                    </div>

                    {/* BACK face — the previous chapter's text, revealed on landing */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-r-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div
                        className={`absolute inset-0 overflow-hidden ${
                          prevSpread.tiny ? 'px-4 py-4 sm:px-5' : 'px-5 py-6 sm:px-8 sm:py-9'
                        }`}
                      >
                        {prevSpread.right}
                      </div>
                      <PaperTexture />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* MOBILE forward turn — the whole spread flips up like a page */}
              {!isDesktop && turning && turnDir === 1 && nextSpread && (
                <div className="absolute inset-0 z-20" style={{ perspective: 1800 }}>
                  <motion.div
                    className="absolute inset-0"
                    style={{ transformOrigin: 'center', transformStyle: 'preserve-3d' }}
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: -180 }}
                    transition={{ duration: TURN_DURATION, ease: EASE }}
                  >
                    {/* FRONT face — the spread being turned away */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Spread
                        left={currentSpread.left}
                        right={currentSpread.right}
                        tiny={currentSpread.tiny}
                      />
                      {/* Sweeping shadow while the spread turns */}
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: TURN_DURATION, times: [0, 0.5, 1], ease: 'easeInOut' }}
                        style={{
                          background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.05) 60%, transparent)',
                        }}
                      />
                    </div>

                    {/* BACK face — the next spread, revealed on landing */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                    >
                      <Spread
                        left={nextSpread.left}
                        right={nextSpread.right}
                        tiny={nextSpread.tiny}
                      />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* MOBILE backward turn — the whole spread flips back down */}
              {!isDesktop && turning && turnDir === -1 && prevSpread && (
                <div className="absolute inset-0 z-20" style={{ perspective: 1800 }}>
                  <motion.div
                    className="absolute inset-0"
                    style={{ transformOrigin: 'center', transformStyle: 'preserve-3d' }}
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: 180 }}
                    transition={{ duration: TURN_DURATION, ease: EASE }}
                  >
                    {/* FRONT face — the spread being turned away */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Spread
                        left={currentSpread.left}
                        right={currentSpread.right}
                        tiny={currentSpread.tiny}
                      />
                      {/* Sweeping shadow while the spread turns back */}
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: TURN_DURATION, times: [0, 0.5, 1], ease: 'easeInOut' }}
                        style={{
                          background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.32), rgba(0,0,0,0.05) 60%, transparent)',
                        }}
                      />
                    </div>

                    {/* BACK face — the previous spread, revealed on landing */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-lg bg-[#fbf2df]"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                    >
                      <Spread
                        left={prevSpread.left}
                        right={prevSpread.right}
                        tiny={prevSpread.tiny}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryBook
