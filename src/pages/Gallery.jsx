// Gallery.jsx
// Gallery page: romantic heading + subtitle over the FloatingHearts backdrop,
// a responsive masonry photo grid, and a fullscreen lightbox.
// No slideshow / music player / popup yet — grid + lightbox only.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import GalleryGrid from '../components/GalleryGrid.jsx'
import ImageModal from '../components/ImageModal.jsx'

// Auto-discover images in src/assets/images (1.jpg … 50.jpg, etc.).
// import.meta.glob is resolved at build time, so no 50 manual imports are
// needed — just drop files into the folder and rebuild.
const imageModules = import.meta.glob('/src/assets/images/*.{jpg,jpeg,png,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const galleryImages = Object.entries(imageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
  .map(([path, src]) => {
    const numberMatch = path.match(/(\d+)/)
    return {
      id: path,
      src,
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
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 bg-clip-text text-transparent">
              Every Moment With You Is Precious
            </span>{' '}
            <span aria-hidden="true">❤️</span>
          </h1>

          <p className="max-w-xl text-base font-light leading-relaxed text-rose-950/70 sm:text-lg">
            Take a walk down memory lane — every photo here is a little piece of our story. 💞
          </p>
        </motion.header>

        {/* Masonry gallery */}
        <div className="mt-12 sm:mt-16">
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
