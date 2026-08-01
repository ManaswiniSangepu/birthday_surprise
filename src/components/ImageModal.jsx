// ImageModal.jsx
// Fullscreen lightbox rendered through a portal to <body>:
// dark blurred backdrop, centered image with fade + scale, prev/next via
// arrow buttons, keyboard (← → Esc) and touch swipe, an "Image X of N"
// counter, body scroll lock, and a basic focus trap with focus restore.

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

function ImageModal({ images = [], currentIndex = 0, onClose, onNavigate }) {
  const total = images.length
  const image = images[currentIndex]
  const dialogRef = useRef(null)
  const touchStartX = useRef(null)
  // The element that opened the modal — captured once and restored on close.
  const previouslyFocusedRef = useRef(null)

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + total) % total)
  }, [currentIndex, total, onNavigate])

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % total)
  }, [currentIndex, total, onNavigate])

  // Lock background scrolling while the modal is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Capture the opening trigger once and focus the dialog on mount;
  // restore focus to the trigger on close.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement
    dialogRef.current?.focus()
    return () => {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [])

  // Keyboard navigation + focus trap (never steals focus from nav buttons).
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goPrev, goNext])

  // Touch swipe to navigate (pan-y lets vertical scroll through, keeps
  // horizontal swipes for the modal).
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (!image) return null

  const navButtonClasses =
    'flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60'

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-rose-950/70 p-4 backdrop-blur-xl sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => {
        // Close only when clicking the backdrop itself.
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer — image ${currentIndex + 1} of ${total}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center gap-5 touch-pan-y outline-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar: counter + close */}
        <div className="flex w-full items-center justify-between gap-4">
          <p
            aria-live="polite"
            className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md"
          >
            Image {currentIndex + 1} of {total}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-lg text-white backdrop-blur-md transition hover:rotate-90 hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60"
          >
            ✕
          </button>
        </div>

        {/* Image + side arrows */}
        <div className="relative flex w-full flex-1 items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className={`${navButtonClasses} shrink-0`}
          >
            ←
          </button>

          <motion.img
            key={currentIndex}
            src={image.src}
            alt={image.alt}
            draggable={false}
            className="max-h-full max-w-full flex-1 rounded-2xl object-contain shadow-2xl"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />

          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className={`${navButtonClasses} shrink-0`}
          >
            →
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

export default ImageModal
