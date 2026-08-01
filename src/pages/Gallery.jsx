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
