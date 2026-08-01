// useEscapingButton.js
// Playful "dodge" behavior for a button:
//  - Desktop: escapes when the cursor gets within `radius` px (before it lands).
//  - Touch/pen: dodges attempted taps via pointerdown.
//  - Only escapes the first `maxEscapes` times, then behaves like a normal button.
//  - Always lands fully inside the viewport (safe margins), never overlapping edges.
//
// Keyboard activation (Enter/Space) never fires pointer events, so keyboard
// users can always focus and activate the button normally.

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_MAX_ESCAPES = 8
const DEFAULT_RADIUS = 120
const DEFAULT_MARGIN = 24

export default function useEscapingButton({
  maxEscapes = DEFAULT_MAX_ESCAPES,
  radius = DEFAULT_RADIUS,
  margin = DEFAULT_MARGIN,
  disabled = false,
} = {}) {
  const ref = useRef(null)

  // When `disabled` flips on (e.g. the user accepted), the button stops
  // dodging entirely and behaves like a normal (disabled) button.
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  // State mirrored to render
  const [escapeCount, setEscapeCount] = useState(0)
  const [isEscaping, setIsEscaping] = useState(false) // fixed-overlay mode active
  const [isMoving, setIsMoving] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  // Refs so window listeners never read stale closures
  const escapeCountRef = useRef(0)
  const isEscapingRef = useRef(false)
  const movingRef = useRef(false)
  const posRef = useRef({ x: 0, y: 0 })

  const movementEnabled = escapeCount < maxEscapes

  // Spring to a new random location, always fully inside the viewport.
  const moveToRandomSpot = useCallback(
    (buttonWidth, buttonHeight) => {
      const maxX = window.innerWidth - buttonWidth - margin
      const maxY = window.innerHeight - buttonHeight - margin
      const x = Math.max(margin, margin + Math.random() * Math.max(0, maxX - margin))
      const y = Math.max(margin, margin + Math.random() * Math.max(0, maxY - margin))

      posRef.current = { x, y }
      setPos({ x, y })
      setEscapeCount((c) => {
        const next = c + 1
        escapeCountRef.current = next
        return next
      })
      movingRef.current = true
      setIsMoving(true)
    },
    [margin]
  )

  const escapeToNewLocation = useCallback(() => {
    if (disabledRef.current) return
    const btn = ref.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()

    if (!isEscapingRef.current) {
      // Enter fixed mode at the exact current spot (no visual jump),
      // then spring away on the next frame.
      isEscapingRef.current = true
      posRef.current = { x: rect.left, y: rect.top }
      setPos(posRef.current)
      setIsEscaping(true)
      requestAnimationFrame(() => moveToRandomSpot(rect.width, rect.height))
    } else {
      moveToRandomSpot(rect.width, rect.height)
    }
  }, [moveToRandomSpot])

  // Desktop: dodge when the cursor gets within `radius` px of the button.
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (disabledRef.current) return
      if (escapeCountRef.current >= maxEscapes) return
      if (movingRef.current) return
      const btn = ref.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < radius) {
        escapeToNewLocation()
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [escapeToNewLocation, maxEscapes, radius])

  // Keep the button inside the viewport if the window is resized.
  useEffect(() => {
    const clamp = () => {
      if (!isEscapingRef.current) return
      const btn = ref.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width - margin
      const maxY = window.innerHeight - rect.height - margin
      const x = Math.min(Math.max(posRef.current.x, margin), Math.max(margin, maxX))
      const y = Math.min(Math.max(posRef.current.y, margin), Math.max(margin, maxY))
      posRef.current = { x, y }
      setPos({ x, y })
    }
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [margin])

  // Attempted tap (touch/pen) or direct click attempt on the button itself:
  // dodge before the tap/click can land.
  const handlePointerDown = useCallback(() => {
    if (disabledRef.current) return
    if (escapeCountRef.current >= maxEscapes) return
    if (movingRef.current) return
    escapeToNewLocation()
  }, [escapeToNewLocation, maxEscapes])

  // Called when the move animation settles — return the button to rest.
  const handleMoveComplete = useCallback(() => {
    movingRef.current = false
    setIsMoving(false)
  }, [])

  return {
    ref,
    escapeCount,
    movementEnabled,
    isEscaping,
    isMoving,
    pos,
    handlePointerDown,
    handleMoveComplete,
  }
}
