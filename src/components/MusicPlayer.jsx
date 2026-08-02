// MusicPlayer.jsx
// Background music for the experience — a small floating pill (bottom right)
// with play/pause. Drop an audio file into src/assets/music/ (mp3, ogg, wav
// or m4a) and it is picked up automatically at build time; if the folder is
// empty the player hides itself entirely.
//
// Browsers block autoplay with sound, so the track starts paused and the pill
// pulses softly to invite the first tap. It loops, keeps a gentle volume, and
// cleans up on unmount. The pill sits above the page content but never blocks
// clicks on the rest of the screen.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const musicModules = import.meta.glob('/src/assets/music/*.{mp3,ogg,wav,m4a,opus}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const tracks = Object.values(musicModules)

function MusicPlayer() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  // Build the audio element once.
  useEffect(() => {
    if (tracks.length === 0) return
    const audio = new Audio(tracks[0])
    audio.loop = true
    audio.volume = 0.35
    audio.preload = 'metadata'
    audioRef.current = audio

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.src = ''
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      // Browsers block autoplay — if the play is refused, the pill simply
      // stays paused and the user can tap again.
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  if (tracks.length === 0) return null

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Pause the music' : 'Play our song'}
      aria-pressed={playing}
      animate={{ boxShadow: playing ? ['0 0 18px 4px rgba(244,114,182,0.45)', '0 0 30px 10px rgba(244,114,182,0.6)', '0 0 18px 4px rgba(244,114,182,0.45)'] : undefined }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      transition={{ boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, scale: { type: 'spring', stiffness: 400, damping: 17 } }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/80 px-4 py-2.5 text-sm font-medium text-rose-600 shadow-lg shadow-pink-500/20 backdrop-blur-md focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {playing ? '🎵' : '🎶'}
      </span>
      <span className="hidden sm:inline">{playing ? 'Pause' : 'Play our song'}</span>
    </motion.button>
  )
}

export default MusicPlayer
