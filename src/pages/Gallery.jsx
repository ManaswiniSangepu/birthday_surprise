// Gallery.jsx
// The memory album: "Our Little World ❤️" header + subtitle over the
// FloatingHearts backdrop, a scattered scrapbook of Polaroids from
// src/assets/images/gallery/, a fullscreen lightbox, and a softly glowing
// Polaroid reserved for the next adventure. No routing changes — same page,
// same navigation, same ambience.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import GalleryGrid from '../components/GalleryGrid.jsx'
import ImageModal from '../components/ImageModal.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

// A motion-enhanced router Link so the CTA can float and react to hover while
// still performing a normal client-side navigation — the destination page's
// own fade-in is the same page transition used everywhere on the site.
const MotionLink = motion.create(Link)

// Small filled heart glyph used as the CTA's leading icon.
function HeartIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

// Auto-discover images in src/assets/images/gallery/ (01.jpg, 02.jpg, …).
// import.meta.glob is resolved at build time, so no manual imports are needed —
// just drop files into the folder and rebuild (they display in filename
// order). .gitkeep is not an image, so it is never picked up.
const imageModules = import.meta.glob('/src/assets/images/gallery/*.{jpg,jpeg,png,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Optional captions — the "metadata" for each photo, keyed by filename. Add an
// entry here and it appears under that Polaroid; images without an entry fall
// back to "Our Favorite Memory ❤️". The examples below follow the album's
// story order (01.jpg → 06.jpg).
const CAPTIONS = {
  '01.jpg': '❤️ Our Beginning',
  '02.jpg': '🌙 Night Walk',
  '03.jpg': '🚌 Bus Journey',
  '04.jpg': '📚 Exam Days',
  '05.jpg': '🍳 Chef of My Heart',
  '06.jpg': '🎓 Graduation',
}

const galleryImages = Object.entries(imageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
  .map(([path, src]) => {
    const fileName = path.split('/').pop()
    const numberMatch = path.match(/(\d+)/)
    return {
      id: path,
      src,
      caption: CAPTIONS[fileName],
      alt: numberMatch ? `Memory ${Number(numberMatch[1])}` : 'Memory',
    }
  })

function Gallery() {
  usePageTitle('Our Little World ❤️')
  const [selectedIndex, setSelectedIndex] = useState(null)

  const handleNavigate = (nextIndex) => setSelectedIndex(nextIndex)
  const handleClose = () => setSelectedIndex(null)

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-pink-100 via-rose-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Shared ambient hearts background */}
      <FloatingHearts />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/60 px-5 py-2 text-sm font-medium text-rose-500 backdrop-blur-md transition hover:border-pink-300 hover:bg-white/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60"
          >
            ← Back home
          </Link>

          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            <span aria-hidden="true">🌍</span>{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 bg-clip-text text-transparent">
              Our Little World
            </span>{' '}
            <span aria-hidden="true">❤️</span>
          </h1>

          <p className="max-w-xl font-script text-xl leading-relaxed text-rose-800/80 sm:text-2xl">
            Every picture isn't just a memory...
            <br />
            <br />
            It's another page
            <br />
            of the beautiful world
            <br />
            we built together.
          </p>
        </motion.header>

        {/* Scattered Polaroid scrapbook — starts right after the subtitle */}
        <div className="mt-8 sm:mt-10">
          <GalleryGrid images={galleryImages} onImageClick={setSelectedIndex} />
        </div>

        {/* Birthday CTA — one last invitation below the album's final card */}
        <div className="mt-12 flex justify-center sm:mt-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <MotionLink
              to="/birthday-surprise"
              animate={{ y: [0, -7, 0] }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 18px 48px -12px rgba(217, 70, 239, 0.65)',
              }}
              whileTap={{ scale: 0.96 }}
              transition={{
                y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                scale: { type: 'spring', stiffness: 400, damping: 17 },
                boxShadow: { duration: 0.35, ease: 'easeOut' },
              }}
              className="relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-pink-400 via-rose-300 to-purple-400 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_34px_-8px_rgba(244,114,182,0.55)] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/60 sm:px-10 sm:text-lg"
            >
              {/* Glass reflection, same style as the site's other CTA */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-white/10"
              />
              <HeartIcon className="relative h-4 w-4 shrink-0" />
              <span className="relative">🎂 Your Birthday Awaits...</span>
            </MotionLink>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {selectedIndex !== null && (
        <ImageModal
          images={galleryImages}
          currentIndex={selectedIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}
    </motion.div>
  )
}

export default Gallery
