import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import StoryBookPage from './pages/StoryBookPage.jsx'
import WorldPage from './pages/WorldPage.jsx'
import BirthdaySurprise from './pages/BirthdaySurprise.jsx'
import FinalEndingPage from './pages/FinalEndingPage.jsx'

// Each page opens at the top — without this, returning to a long page
// (like the Memory Album) can land mid-scroll.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/story" element={<StoryBookPage />} />
      <Route path="/world" element={<WorldPage />} />
      {/* Navigation order: Storybook → Memory Album → Birthday Surprise → Final Ending */}
      <Route path="/birthday-surprise" element={<BirthdaySurprise />} />
      <Route path="/ending" element={<FinalEndingPage />} />
      </Routes>
    </>
  )
}

export default App
