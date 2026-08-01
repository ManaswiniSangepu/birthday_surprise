// scripts/click-loop-probe.mjs
// Loops fresh page loads replicating the verifier's exact FIRST click
// (Chapter 1 -> 2) to CATCH the intermittent failing run live, then dumps:
// button rect, 3x3 hit grid, elementsFromPoint stack at the click point,
// the real event targets (pointerdown/up, mousedown/up, click), the chapter
// after the click, the [DEBUG] console logs, and — on failure — retries the
// CENTER of the button as a discriminator (point-specific vs all-blocked).
// Usage: node scripts/click-loop-probe.mjs [url] [iterations]

import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5173/story'
const ITERATIONS = Number(process.argv[3] ?? 8)

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--window-size=1440,900'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

let failures = 0
try {
  for (let i = 1; i <= ITERATIONS; i++) {
    const consoleLines = []
    page.on('console', (msg) => consoleLines.push(`[page:${msg.type()}] ${msg.text()}`))
    page.on('pageerror', (err) => consoleLines.push(`[page:error] ${err.message}`))

    console.log(`\n=== iteration ${i}/${ITERATIONS} ===`)
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(5000)

    // Capture-phase listeners for every relevant event type.
    await page.evaluate(() => {
      window.__evt = []
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

    // Exact verifier hit-test logic (grid, then first isBtn/insideBtn point)
    // PLUS the elementsFromPoint stack and computed styles at that point.
    const hit = await page.evaluate(() => {
      const btn = document.getElementById('continue-story-button')
      const r = btn.getBoundingClientRect()
      const grid = []
      for (const fx of [0.2, 0.5, 0.8]) {
        for (const fy of [0.2, 0.5, 0.8]) {
          const x = r.left + r.width * fx
          const y = r.top + r.height * fy
          const el = document.elementFromPoint(x, y)
          grid.push({
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
      const good = grid.find((p) => p.isBtn) || grid.find((p) => p.insideBtn)
      let stack = null
      if (good) {
        const cx = r.left + r.width * good.fx
        const cy = r.top + r.height * good.fy
        stack = document.elementsFromPoint(cx, cy).slice(0, 8).map((el) => {
          const cs = getComputedStyle(el)
          return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} pe=${cs.pointerEvents} op=${cs.opacity} z=${cs.zIndex} pos=${cs.position} t=${cs.transform} f=${cs.filter}`
        })
      }
      const cs = getComputedStyle(btn)
      return {
        rect: { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
        grid,
        clickablePoint: good ? { x: Math.round(r.left + r.width * good.fx), y: Math.round(r.top + r.height * good.fy) } : null,
        stack,
        btnPointerEvents: cs.pointerEvents,
        btnOpacity: cs.opacity,
        btnDisabled: btn.disabled,
      }
    })

    console.log('[probe] rect:', JSON.stringify(hit.rect))
    console.log('[probe] grid:', JSON.stringify(hit.grid))
    console.log('[probe] clickablePoint:', JSON.stringify(hit.clickablePoint))
    console.log('[probe] btn: pe =', hit.btnPointerEvents, '| opacity =', hit.btnOpacity, '| disabled =', hit.btnDisabled)
    if (hit.stack) {
      console.log('[probe] elementsFromPoint stack at click point:')
      hit.stack.forEach((s) => console.log('   ', s))
    }

    if (!hit.clickablePoint) {
      console.log('[probe] ✖ NO CLICKABLE POINT — nothing hit-testable on the button')
      failures++
      console.log('[probe] --- page console ---')
      consoleLines.forEach((l) => console.log(l))
      page.removeAllListeners('console')
      page.removeAllListeners('pageerror')
      continue
    }

    console.log('[probe] real click at', hit.clickablePoint.x, hit.clickablePoint.y)
    await page.mouse.click(hit.clickablePoint.x, hit.clickablePoint.y)
    await sleep(3000)

    const res = await page.evaluate(() => ({
      chapter: document.querySelector('#story-book')?.dataset.chapter ?? null,
      evt: window.__evt,
    }))
    console.log('[probe] chapter after click:', res.chapter)
    console.log('[probe] events:', JSON.stringify(res.evt))
    console.log(
      '[probe] Button-clicked log:',
      consoleLines.filter((l) => l.includes('Button clicked')).join(' | ') || 'ABSENT'
    )
    console.log(
      '[probe] mounted log:',
      consoleLines.filter((l) => l.includes('chapters.length')).join(' | ') || 'ABSENT'
    )

    if (res.chapter !== '1') {
      console.log('[probe] ✖✖ FAILURE — chapter did not advance')
      // Discriminator: retry at the CENTER of the button.
      const cx = Math.round(hit.rect.left + hit.rect.width * 0.5)
      const cy = Math.round(hit.rect.top + hit.rect.height * 0.5)
      console.log('[probe] retrying at CENTER', cx, cy)
      await page.mouse.click(cx, cy)
      await sleep(3000)
      const res2 = await page.evaluate(() => ({
        chapter: document.querySelector('#story-book')?.dataset.chapter ?? null,
        evt: window.__evt,
      }))
      console.log('[probe] chapter after CENTER retry:', res2.chapter)
      console.log('[probe] events after retry:', JSON.stringify(res2.evt))
      console.log('[probe] --- page console ---')
      consoleLines.forEach((l) => console.log(l))
      failures++
      break // failure captured — stop looping
    }
    console.log('[probe] ✓ pass (chapter advanced)')
    page.removeAllListeners('console')
    page.removeAllListeners('pageerror')
  }
  console.log(`\n[probe] RESULT: ${failures === 0 ? 'ALL ' + ITERATIONS + ' ITERATIONS PASSED' : 'FAILURE CAPTURED (' + failures + ')'}`)
} catch (err) {
  console.error('✖', err.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
