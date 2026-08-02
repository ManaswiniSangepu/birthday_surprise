// scripts/verify-gallery.mjs
// Focused check that every Memory Album photo loads: loads /gallery, waits
// for the grid, scrolls the whole page (which triggers lazy loading), then
// counts loaded vs total <img> and reports any that never load.
// Usage: node scripts/verify-gallery.mjs [url]

import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5199/gallery'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe` : null,
].filter(Boolean)
const executablePath = CANDIDATES.find((p) => p && existsSync(p))
if (!executablePath) {
  console.error('✖ Chrome not found')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--window-size=1440,900', '--disable-background-timer-throttling'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2000)

  const initial = await page.evaluate(() => ({
    total: document.images.length,
    loaded: [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length,
  }))
  console.log('initial:', JSON.stringify(initial))

  // Scroll in steps so lazy images are fetched.
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y)
    await sleep(120)
  }
  // Back to top, then down once more, and let the last fetches settle.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await sleep(2500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(2500)

  const after = await page.evaluate(() => {
    const imgs = [...document.images]
    return {
      total: imgs.length,
      loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      broken: imgs
        .filter((i) => !(i.complete && i.naturalWidth > 0))
        .map((i) => (i.src || '').split('/').pop()),
    }
  })
  console.log('after scroll:', JSON.stringify({ total: after.total, loaded: after.loaded, brokenCount: after.broken.length }))
  if (after.broken.length) console.log('still broken:', after.broken.join(', '))
  if (errors.length) {
    console.log('page errors:')
    errors.forEach((e) => console.log('  ✖', e))
  }

  const ok = after.total === 26 && after.loaded === 26 && errors.length === 0
  console.log(ok ? '✅ PASS: all 26 Memory Album photos load' : '❌ FAIL')
  process.exitCode = ok ? 0 : 1
} finally {
  await browser.close()
}
