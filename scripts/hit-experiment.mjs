// scripts/hit-experiment.mjs
// Controlled experiment: is the static book's 3D transform context
// (perspective + rotateX + preserve-3d) what breaks real-click hit-testing
// on the Continue button?
// Phase A: baseline real click at the button center (expect: hits wrapper).
// Phase B: flatten ALL 3D on the static shell via JS (no source change),
//          re-measure the button rect, real-click again.
// Phase C: if B fails, also flatten every descendant with preserve-3d
//          (incl. the turning overlay's parents) and try again.
// The page logs whether the click target was the button.

import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5173/story'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe` : null,
].filter(Boolean)

const executablePath = CANDIDATES.find((p) => p && existsSync(p))
if (!executablePath) {
  console.error('✖ Chrome not found. Set CHROME_PATH to the chrome.exe location.')
  process.exit(1)
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--window-size=1440,900'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  const pageLogs = []
  page.on('console', (m) => pageLogs.push(`[page] ${m.text()}`))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 5000)) // settle

  // Capture-phase listener records the true click target.
  await page.evaluate(() => {
    window.__clickTarget = null
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      document.addEventListener(type, (e) => {
        const t = e.target
        window.__clickTarget = `${type}→${t.tagName.toLowerCase()}${t.id ? '#' + t.id : ''}`
      }, true)
    }
  })

  async function clickButtonCenter(label) {
    const rect = await page.evaluate(() => {
      const b = document.querySelector('#continue-story-button')
      const r = b.getBoundingClientRect()
      return { left: r.left, top: r.top, w: r.width, h: r.height }
    })
    const x = Math.round(rect.left + rect.w / 2)
    const y = Math.round(rect.top + rect.h / 2)
    await page.evaluate(() => {
      window.__clickTarget = null
      window.__chapterBefore = document.querySelector('#story-book')?.dataset.chapter
    })
    const logsBefore = pageLogs.length
    await page.mouse.click(x, y)
    await new Promise((r) => setTimeout(r, 500))
    const after = await page.evaluate(() => ({
      chapter: document.querySelector('#story-book')?.dataset.chapter,
      target: window.__clickTarget,
    }))
    const newLogs = pageLogs.slice(logsBefore)
    const btnClicked = newLogs.find((l) => l.includes('Button clicked'))
    console.log(
      `\n[${label}] clicked (${x}, ${y}) → target=${after.target} chapter=${after.chapter} ` +
        `onClickFired=${btnClicked ? 'YES' : 'no'}`
    )
    return { chapter: after.chapter, target: after.target }
  }

  // Phase A — baseline
  await clickButtonCenter('A: baseline (3D intact)')

  // Phase B — flatten the static book shell's 3D
  await page.evaluate(() => {
    const root = document.querySelector('#story-book')
    if (root) root.style.perspective = 'none'
    document.querySelectorAll('#story-book [style*="rotateX"]').forEach((el) => {
      el.style.transform = 'none'
      el.style.transformStyle = 'flat'
    })
  })
  await new Promise((r) => setTimeout(r, 300))
  await clickButtonCenter('B: 3D shell flattened')

  // Phase C — flatten EVERY preserve-3d in the whole book
  if (true) {
    await page.evaluate(() => {
      document.querySelectorAll('#story-book *').forEach((el) => {
        const s = getComputedStyle(el)
        if (s.transformStyle === 'preserve-3d') el.style.transformStyle = 'flat'
        if (s.transform && s.transform !== 'none' && s.transform.includes('matrix3d')) {
          // leave frame-motion turn overlays alone (not mounted at rest)
        }
      })
    })
    await new Promise((r) => setTimeout(r, 300))
    await clickButtonCenter('C: all preserve-3d flattened')
  }

  console.log('\n--- page console ---')
  pageLogs.forEach((l) => console.log(l))
} finally {
  await browser.close()
}
