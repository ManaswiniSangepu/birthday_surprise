// FinalEnding.jsx
// The elegant closing page shown after the final chapter (Ch. 20). Pressing
// Continue on the last chapter calls the StoryBook's onFinish, and the story
// page swaps the book for this page: a soft cream paper backdrop with a subtle
// golden texture, the centered closing message revealed with a gentle staggered
// fade-in, a smaller italic line, and a single small animated heart at the
// bottom. No Previous / Continue buttons — the story simply ends here.

import { motion } from 'framer-motion'

const fade = (delay) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: 'easeOut' },
})

function FinalEnding() {
  return (
    <motion.div
      id="final-ending"
      className="relative flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-16 text-center md:min-h-0 md:flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 18%, rgba(251, 191, 36, 0.1), transparent 45%), radial-gradient(circle at 82% 78%, rgba(217, 119, 6, 0.08), transparent 45%), radial-gradient(circle at 50% 50%, rgba(255, 240, 214, 0.45), transparent 70%), repeating-linear-gradient(0deg, rgba(146, 96, 49, 0.03) 0 1px, transparent 1px 3px)',
      }}
    >
      <motion.p {...fade(0.3)} className="font-serif text-4xl sm:text-5xl">
        ❤️
      </motion.p>

      <motion.h2
        {...fade(0.6)}
        className="mt-6 font-display text-2xl font-bold text-rose-900 sm:text-3xl"
      >
        The End?
      </motion.h2>

      <motion.p
        {...fade(0.9)}
        className="mt-2 font-serif text-2xl italic text-rose-700 sm:text-3xl"
      >
        No...
      </motion.p>

      <motion.p
        {...fade(1.2)}
        className="mt-4 font-display text-xl font-bold text-rose-900 sm:text-2xl"
      >
        To Be Continued...
      </motion.p>

      <motion.p {...fade(1.5)} className="mt-4 font-serif text-lg text-stone-700 sm:text-xl">
        Because our best chapters
        <br />
        haven't been written yet.
      </motion.p>

      <motion.p {...fade(1.9)} className="mt-8 font-serif text-4xl sm:text-5xl">
        ❤️
      </motion.p>

      <motion.p
        {...fade(2.3)}
        className="mt-8 font-script text-lg italic text-amber-800/90 sm:text-xl"
      >
        "Forever begins after this story."
      </motion.p>

      {/* Small animated heart at the bottom */}
      <motion.div
        data-testid="ending-heart"
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-xl text-rose-600 sm:text-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.25, 1] }}
        transition={{
          opacity: { delay: 3, duration: 0.8 },
          scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 3 },
        }}
      >
        ❤️
      </motion.div>
    </motion.div>
  )
}

export default FinalEnding
