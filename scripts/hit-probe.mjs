// scripts/hit-probe.mjs
// Root-cause probe for "Continue Our Story button does nothing on real clicks".
// Usage: node scripts/hit-probe.mjs [url]
// 1. Installs pointerdown/click CAPTURE listeners that record the exact target.
// 2. Dumps the FULL elementsFromPoint hit-stack (top 8 layers, with class,
//    pointer-events, opacity, z-index, position, transform, filter) at the
//    button center + several grid points.
// 3. Real-clicks each grid point and reports what event target the browser
//    actually delivered the click to, whether data-chapter advanced, and
//    whether the page's [DEBUG] "Button clicked" log fired.

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
  await new Promise((r) => setTimeout(r, 5000)) // settle past all reveals

  // Capture REAL pointer events (capture phase) so nothing can swallow them.
  await page.evaluate(() => {
    window.__lastPointer = null
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      document.addEventListener(
        type,
        (e) => {
          const t = e.target
          window.__lastPointer = {
            type,
            target: `${t.tagName.toLowerCase()}${t.id ? '#' + t.id : ''}${t.className && typeof t.className === 'string' ? '.' + t.className.split(' ').slice(0, 2).join('.') : ''}`,
            isButton: t.id === 'continue-story-button',
            x: Math.round(e.clientX),
            y: Math.round(e.clientY),
          }
        },
        true // capture: fires even if another listener stops propagation
      )
    }
  })

  async function stackAt(fx, fy) {
    return page.evaluate(([a, b]) => {
      const btn = document.querySelector('#continue-story-button')
      const r = btn.getBoundingClientRect()
      const x = r.left + r.width * a
      const y = r.top + r.height * b
      const stack = document
        .elementsFromPoint(x, y)
        .slice(0, 8)
        .map((el) => {
          const s = getComputedStyle(el)
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            cls: String(el.className).slice(0, 42),
            pe: s.pointerEvents,
            opacity: s.opacity,
            z: s.zIndex,
            pos: s.position,
            transform: s.transform.slice(0, 40),
            filter: s.filter.slice(0, 26),
          }
        })
      return { x: Math.round(x), y: Math.round(y), stack }
    }, [fx, fy])
  }

  const points = [
    ['center', 0.5, 0.5],
    ['top-left', 0.2, 0.2],
    ['bottom-right', 0.8, 0.8],
    ['mid-left', 0.2, 0.5],
    ['mid-right', 0.8, 0.5],
  ]

  for (const [name, fx, fy] of points) {
    const info = await stackAt(fx, fy)
    console.log(`\n===== hit-stack @ ${name} (${info.x}, ${info.y}) =====`)
    console.log(JSON.stringify(info.stack, null, 1))
  }

  // Now real-click each point and see what actually happens.
  for (const [name, fx, fy] of points) {
    const btnInfo = await page.evaluate(() => {
      const b = document.querySelector('#continue-story-button')
      const r = b.getBoundingClientRect()
      return { left: r.left, top: r.top, w: r.width, h: r.height }
    })
    const x = Math.round(btnInfo.left + btnInfo.w * fx)
    const y = Math.round(btnInfo.top + btnInfo.h * fy)

    await page.evaluate(() => {
      window.__lastPointer = null
      window.__chapterBefore = document.querySelector('#story-book')?.dataset.chapter
    })
    const logLenBefore = pageLogs.length
    await page.mouse.click(x, y)
    await new Promise((r) => setTimeout(r, 400))

    const after = await page.evaluate(() => ({
      chapter: document.querySelector('#story-book')?.dataset.chapter,
      lastPointer: window.__lastPointer,
    }))
    const newLogs = pageLogs.slice(logLenBefore)
    const clickedLog = newLogs.find((l) => l.includes('Button clicked'))
    console.log(
      `\n[click @ ${name}] (${x}, ${y}) → eventTarget=${after.lastPointer ? after.lastPointer.target : 'NONE'} ` +
        `isButton=${after.lastPointer ? after.lastPointer.isButton : false} ` +
        `chapter=${after.chapter} clickedLog=${clickedLog ? 'YES' : 'no'}`
    )
    if (after.chapter === '1') {
      console.log('  ✅ CHAPTER ADVANCED — this point works!')
      break
    }
  }

  console.log('\n--- page console ---')
  pageLogs.forEach((l) => console.log(l))
} finally {
  await browser.close()
}
