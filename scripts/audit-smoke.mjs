// scripts/audit-smoke.mjs
// One-pass smoke test across every route: collects page console errors,
// checks for the leftover "Current Chapter" debug badge, notes the page
// <title>, whether body text rendered, and horizontal overflow.
// Usage: node scripts/audit-smoke.mjs [baseUrl]

import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:5199').replace(/\/$/, '')
const ROUTES = ['/', '/story', '/gallery', '/world', '/birthday-surprise', '/ending']

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

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--window-size=1440,900', '--disable-background-timer-throttling'],
})

for (const route of ROUTES) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
  })
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 30000 }).catch((e) => errors.push(`goto: ${e.message}`))
  await new Promise((r) => setTimeout(r, 1500))

  const info = await page.evaluate(() => ({
    title: document.title,
    textLen: document.body.innerText.length,
    debugBadge: document.body.innerText.includes('Current Chapter:'),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    imgs: [...document.images].map((i) => ({
      loaded: i.complete && i.naturalWidth > 0,
      src: (i.src || '').split('/').pop().slice(0, 24),
    })),
  }))
  const loaded = info.imgs.filter((i) => i.loaded).length
  const broken = info.imgs.filter((i) => !i.loaded)
  console.log(
    `[${route}] title="${info.title}" text=${info.textLen} debugBadge=${info.debugBadge} overflow=${info.overflow} (${info.scrollWidth}/${info.innerWidth}) imgs=${loaded}/${info.imgs.length} errors=${errors.length}`
  )
  if (broken.length) {
    console.log('    broken images:')
    broken.forEach((b) => console.log(`      ✖ ${b.src}`))
  }
  errors.forEach((e) => console.log(`    ✖ ${e}`))
  await page.close()
}

await browser.close()
console.log('smoke audit done')
