// scripts/click-probe.mjs
// One-off diagnostic for the intermittent "first click does nothing" failure.
// Loads /story, captures real pointer/click events on the document, hit-tests
// the Continue button with a grid, performs a real mouse click on a confirmed
// point, and reports which element actually received the events + whether the
// chapter advanced + all page console lines (incl. chapters.length debug log).
// Usage: node scripts/click-probe.mjs [url]

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
  console.error('✖ Chrome not found. Set CHROME_PATH.')
  process.exit(1)
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--window-size=1440,900'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const consoleLines = []
page.on('console', (msg) => consoleLines.push(`[page:${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => consoleLines.push(`[page:error] ${err.message}`))

try {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 5000))

  // Install capture-phase listeners for every relevant event type.
  await page.evaluate(() => {
    window.__evt = []
    const btn = document.getElementById('continue-story-button')
    const r = btn.getBoundingClientRect()
    window.__btnRect = { left: r.left, top: r.top, width: r.width, height: r.height }
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click']) {
      document.addEventListener(
        type,
        (e) => {
          window.__evt.push({
            type: e.type,
            target: `${e.target.tagName.toLowerCase()}${e.target.id ? '#' + e.target.id : ''}`,
            x: Math.round(e.clientX),
            y: Math.round(e.clientY),
          })
        },
        true
      )
    }
  })

  // DOM hit-test grid over the button's rect.
  const grid = await page.evaluate(() => {
    const btn = document.getElementById('continue-story-button')
    const r = window.__btnRect
    const pts = []
    for (const fx of [0.2, 0.5, 0.8]) {
      for (const fy of [0.2, 0.5, 0.8]) {
        const x = r.left + r.width * fx
        const y = r.top + r.height * fy
        const el = document.elementFromPoint(x, y)
        pts.push({
          fx,
          fy,
          x: Math.round(x),
          y: Math.round(y),
          el: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`,
          isBtn: el === btn,
          insideBtn: btn.contains(el),
        })
      }
    }
    return pts
  })
  console.log('[probe] hit grid:', JSON.stringify(grid))

  const good = grid.find((p) => p.isBtn)
  console.log('[probe] clickable point:', good ? JSON.stringify({ x: good.x, y: good.y }) : 'NONE FOUND')

  if (good) {
    console.log('[probe] performing REAL mouse click at', good.x, good.y)
    await page.mouse.click(good.x, good.y)
  }
  await new Promise((r) => setTimeout(r, 3000))

  const result = await page.evaluate(() => ({
    chapter: document.querySelector('#story-book')?.dataset.chapter ?? null,
    evt: window.__evt,
  }))
  console.log('[probe] chapter after click:', result.chapter)
  console.log('[probe] events received:', JSON.stringify(result.evt))

  console.log('[probe] --- page console ---')
  consoleLines.forEach((l) => console.log(l))
} catch (err) {
  console.error('✖', err.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
