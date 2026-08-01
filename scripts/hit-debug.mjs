// scripts/hit-debug.mjs
// Focused hit-testing diagnostic for the Continue button.
// Usage: node scripts/hit-debug.mjs [url]
// Dumps, at t=3s (mid text-reveal) and t=5s (settled), the FULL
// elementsFromPoint stack at the button's center with each layer's
// pointer-events / opacity / z-index / position / transform / filter, plus
// the button and its wrapper's inline styles. Shows exactly what a real
// click hits and whether the button is in the hit stack at all.

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
  page.on('console', (m) => console.log('[page]', m.text()))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })

  async function dump(label) {
    const info = await page.evaluate(() => {
      const btn = document.querySelector('#continue-story-button')
      if (!btn) return { found: false }
      const r = btn.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const stack = document
        .elementsFromPoint(cx, cy)
        .slice(0, 12)
        .map((el) => {
          const s = getComputedStyle(el)
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            cls: String(el.className).slice(0, 45),
            pe: s.pointerEvents,
            opacity: s.opacity,
            z: s.zIndex,
            pos: s.position,
            transform: s.transform.slice(0, 45),
            filter: s.filter.slice(0, 30),
          }
        })
      const wrapper = btn.parentElement
      return {
        rect: {
          left: Math.round(r.left),
          top: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height),
        },
        center: { x: Math.round(cx), y: Math.round(cy) },
        btnInlineStyle: btn.getAttribute('style'),
        wrapperTag: wrapper ? wrapper.tagName : null,
        wrapperInlineStyle: wrapper ? wrapper.getAttribute('style') : null,
        wrapperPE: wrapper ? getComputedStyle(wrapper).pointerEvents : null,
        stack,
        btnInStack: stack.some((s) => s.tag === 'button'),
        stackHasText: stack.some((s) => s.cls.includes('justify-center')),
      }
    })
    console.log(`\n===== ${label} =====`)
    console.log(JSON.stringify(info, null, 1))
  }

  await dump('t≈3s (mid text-reveal)')
  await new Promise((r) => setTimeout(r, 2000))
  await dump('t≈5s (settled)')
} finally {
  await browser.close()
}
