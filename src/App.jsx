import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import StoryBookPage from './pages/StoryBookPage.jsx'
import WorldPage from './pages/WorldPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/story" element={<StoryBookPage />} />
      <Route path="/world" element={<WorldPage />} />
    </Routes>
  )
}

export default App
