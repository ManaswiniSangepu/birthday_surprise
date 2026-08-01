// GalleryGrid.jsx
// A scattered scrapbook of Polaroids — like printed memories laid out on a
// table. Photos are NOT in a perfect grid: each has its own rotation (about
// -8° to +8°), size, vertical offset and aspect ratio, with a white border,
// paper texture, and a soft realistic shadow. Each Polaroid shows ONLY the
// image inside the white frame — no caption text beneath. The flow still
// resolves to a reliable 2 across on mobile, 3 on tablet and 5 on desktop —
// the width classes are sized so any five cards fit one row — while every row
// stays visually scattered.
//
// Cards fade in one by one with a small rise + rotation as they enter, and on
// hover they lift, straighten, scale up and deepen their shadow. Clicking a
// photo opens the lightbox. After the final photo sits one empty, softly
// glowing Polaroid reserved for the next adventure.

import { motion } from 'framer-motion'

// The scattered recipe, cycled per photo: rotation (deg), responsive size,
// vertical offset (a mild negative value pulls the card up over the row above
// for a hint of overlap — never enough to hide a photo), and photo aspect.
// Widths are full Tailwind classes so every one is generated at build time;
// they stay in ranges that keep 2 across on mobile, 3 on tablet (sm) and 5 on
// desktop (lg).
const SCATTER = [
  { tilt: -6, size: 'w-[46%] sm:w-[29%] lg:w-[17%]', offset: 'mt-8', aspect: 'aspect-[4/5]' },
  { tilt: 4, size: 'w-[48%] sm:w-[31%] lg:w-[19%]', offset: 'mt-1', aspect: 'aspect-square' },
  { tilt: -3, size: 'w-[44%] sm:w-[28%] lg:w-[16%]', offset: 'mt-5', aspect: 'aspect-[4/3]' },
  { tilt: 7, size: 'w-[47%] sm:w-[30%] lg:w-[18%]', offset: 'mt-9', aspect: 'aspect-[3/4]' },
  { tilt: -7, size: 'w-[45%] sm:w-[27%] lg:w-[15%]', offset: '-mt-2', aspect: 'aspect-[4/5]' },
  { tilt: 3, size: 'w-[49%] sm:w-[32%] lg:w-[20%]', offset: 'mt-6', aspect: 'aspect-square' },
]

const FRAME =
  'relative flex flex-col overflow-hidden rounded-2xl bg-white p-2.5 pb-3 ring-1 ring-rose-100/80 shadow-[0_12px_28px_-12px_rgba(120,53,45,0.45)]'

// A whisper of cream-paper texture over the white Polaroid border.
const paperTextureStyle = {
  backgroundImage:
    'radial-gradient(circle at 25% 20%, rgba(146, 96, 49, 0.05), transparent 45%), radial-gradient(circle at 80% 75%, rgba(146, 96, 49, 0.04), transparent 40%), repeating-linear-gradient(0deg, rgba(146, 96, 49, 0.025) 0 1px, transparent 1px 3px)',
}

function PaperTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={paperTextureStyle}
    />
  )
}

function GalleryGrid({ images = [], onImageClick }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">
      {images.map((image, index) => {
        const recipe = SCATTER[index % SCATTER.length]
        return (
          <motion.button
            key={image.id}
            type="button"
            onClick={() => onImageClick(index)}
            initial={{ opacity: 0, y: 34, rotate: recipe.tilt * 1.6 }}
            whileInView={{ opacity: 1, y: 0, rotate: recipe.tilt }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{
              y: -12,
              rotate: 0,
              scale: 1.08,
              boxShadow: '0 28px 60px -14px rgba(120, 53, 45, 0.6)',
              transition: { duration: 0.35, ease: 'easeOut' },
            }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: (index % 10) * 0.05 }}
            className={`${FRAME} ${recipe.size} ${recipe.offset} cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/60`}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className={`w-full ${recipe.aspect} rounded-md object-cover`}
            />
            <PaperTexture />
          </motion.button>
        )
      })}

      {/* Reserved-for-the-next-adventure Polaroid — the softly glowing card
          that ends the album. */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 5 }}
        viewport={{ once: true, margin: '-40px' }}
        animate={{
          boxShadow: [
            '0 0 22px 4px rgba(244, 114, 182, 0.25)',
            '0 0 42px 12px rgba(244, 114, 182, 0.5)',
            '0 0 22px 4px rgba(244, 114, 182, 0.25)',
          ],
        }}
        transition={{
          opacity: { duration: 0.6, ease: 'easeOut' },
          y: { duration: 0.6, ease: 'easeOut' },
          rotate: { duration: 0.6, ease: 'easeOut' },
          boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
        className={`${FRAME} w-[47%] sm:w-[30%] lg:w-[17%] mt-6 aspect-[4/5] items-center justify-center p-4 text-center`}
      >
        <p className="font-serif text-sm italic text-rose-500/80 sm:text-base">Reserved for...</p>
        <p className="mt-2 font-script text-lg leading-snug text-rose-800 sm:text-xl">
          ❤️ Our Next Adventure ❤️
        </p>
        <p className="mt-3 font-serif text-[10px] leading-relaxed text-rose-950/60 sm:text-xs">
          Because our best memories
          <br />
          are still waiting
          <br />
          to be created.
        </p>
        <PaperTexture />
      </motion.div>
    </div>
  )
}

export default GalleryGrid
