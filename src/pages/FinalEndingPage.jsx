// FinalEndingPage.jsx
// "/ending" — the closing page of the whole experience. The "The End? No...
// To Be Continued..." page that used to appear at the end of the storybook
// now lives after the Birthday Surprise as its own page, using the site's
// standard fade-in page transition and floating hearts ambience.
//
// Flow: Storybook → Memory Album → Birthday Surprise → Final Ending.

import { motion } from 'framer-motion'
import FloatingHearts from '../components/FloatingHearts.jsx'
import FinalEnding from '../components/FinalEnding.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

function FinalEndingPage() {
  usePageTitle('To Be Continued... ❤️')
  return (
    <motion.div
      id="ending-page"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fff9f1] via-[#ffeef0] to-[#ffe3ea]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Shared ambient hearts background */}
      <FloatingHearts heartCount={40} sparkleCount={20} />

      <main className="relative z-10 flex min-h-screen flex-col px-4 py-12 sm:px-6">
        <FinalEnding />
      </main>
    </motion.div>
  )
}

export default FinalEndingPage
