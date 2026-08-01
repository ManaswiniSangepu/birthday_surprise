// GalleryGrid.jsx
// Responsive masonry gallery grid (CSS columns). Cards are glass-styled with
// a hover zoom, images are lazy-loaded, and a deterministic aspect ratio per
// card keeps the masonry looking full even if the source photos are uniform.

import { motion } from 'framer-motion'

const ASPECTS = ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[4/3]']

function GalleryGrid({ images = [], onImageClick }) {
  if (images.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/60 bg-white/50 p-10 text-center shadow-[0_25px_60px_-15px_rgba(236,72,153,0.3)] backdrop-blur-xl">
        <p className="text-4xl" aria-hidden="true">
          💌
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-rose-900">
          Your memories are on the way
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-rose-950/70">
          Add your photos as{' '}
          <code className="rounded bg-pink-100 px-1.5 py-0.5 text-xs font-semibold text-rose-600">1.jpg</code>{' '}
          through{' '}
          <code className="rounded bg-pink-100 px-1.5 py-0.5 text-xs font-semibold text-rose-600">50.jpg</code>{' '}
          inside{' '}
          <code className="rounded bg-pink-100 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
            src/assets/images/
          </code>{' '}
          and rebuild — they&apos;ll appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
      {images.map((image, index) => (
        <motion.button
          key={image.id}
          type="button"
          onClick={() => onImageClick(index)}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: (index % 8) * 0.05 }}
          className={`group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-white/50 bg-white/40 p-2 shadow-[0_10px_30px_-12px_rgba(236,72,153,0.35)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_18px_45px_-12px_rgba(236,72,153,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60 ${ASPECTS[index % ASPECTS.length]}`}
        >
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </motion.button>
      ))}
    </div>
  )
}

export default GalleryGrid
