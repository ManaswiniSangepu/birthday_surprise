// scripts/optimize-images.mjs
// Optimizes the site's images so pages load fast on phones:
//   - Gallery photos (src/assets/images/gallery/) → JPEG, max 1400px, q0.82
//   - Story chapters (src/assets/images/story/)   → JPEG, max 1200px, q0.82
//
// Originals are kept in an `_originals/` subfolder (never deleted, never
// bundled — Vite's gallery glob only matches files directly in the folder,
// and storyData imports the new .jpg paths explicitly).
//
//  01.jpeg is normalized to 01.jpg (its caption key in the code is '01.jpg',
//  so it picks up "❤️ Our Beginning" instead of the fallback).
//
// Self-healing: run it any time. Pass 1 optimizes photos you dropped into the
// folders that aren't backed up yet (new story chapters also get their
// storyData.js import rewritten from .png to .jpg). Pass 2 RESTORES any
// optimized image that is missing (e.g. lost to a sync glitch) straight from
// _originals. Ordering is always: encode to a temp file → archive the
// original → publish — so a failure at any step can never destroy an original
// or leave the main folder without a visible photo.
//
// Usage: node scripts/optimize-images.mjs

import puppeteer from 'puppeteer-core'
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GALLERY = path.join(ROOT, 'src', 'assets', 'images', 'gallery')
const STORY = path.join(ROOT, 'src', 'assets', 'images', 'story')
const STORY_DATA = path.join(ROOT, 'src', 'data', 'storyData.js')

const MAX_GALLERY = 1400
const MAX_STORY = 1200
const QUALITY = 0.82

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

const isImage = (name) => /\.(jpe?g|png)$/i.test(name)
const kb = (n) => `${Math.round(n / 1024)}KB`

// The optimized output name for an original file.
const targetName = (name) => {
  const lower = name.toLowerCase()
  if (lower === '01.jpeg') return '01.jpg'
  if (/\.png$/i.test(name)) return name.replace(/\.png$/i, '.jpg')
  return name
}

// True if an original (or its optimized counterpart) is already backed up.
const hasBackup = (originalsDir, name) => {
  const base = name.replace(/\.(jpe?g|png)$/i, '')
  return (
    existsSync(path.join(originalsDir, `${base}.png`)) ||
    existsSync(path.join(originalsDir, `${base}.jpg`)) ||
    existsSync(path.join(originalsDir, `${base}.jpeg`))
  )
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--window-size=1600,1200', '--disable-background-timer-throttling'],
})

async function reencode(filePath, maxDim, quality = QUALITY) {
  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${readFileSync(filePath).toString('base64')}`
  const page = await browser.newPage()
  try {
    const out = await page.evaluate(
      async ({ dataUrl, maxDim, quality }) => {
        const img = new Image()
        img.decoding = 'async'
        await new Promise((res, rej) => {
          img.onload = res
          img.onerror = rej
          img.src = dataUrl
        })
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // White base — safe for any transparent PNG artwork.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        return canvas.toDataURL('image/jpeg', quality)
      },
      { dataUrl, maxDim, quality }
    )
    return Buffer.from(out.split(',')[1], 'base64')
  } finally {
    await page.close()
  }
}

let storyChanged = false

for (const dir of [GALLERY, STORY]) {
  const originalsDir = path.join(dir, '_originals')
  const maxDim = dir === GALLERY ? MAX_GALLERY : MAX_STORY
  const label = dir === GALLERY ? 'Gallery photos' : 'Story chapters'
  mkdirSync(originalsDir, { recursive: true })

  // --- Pass 1: newly dropped photos (not backed up yet) → optimize them. ---
  let pass1 = 0
  for (const file of readdirSync(dir).filter(isImage)) {
    if (hasBackup(originalsDir, file)) continue
    const src = path.join(dir, file)
    const target = path.join(dir, targetName(file))
    // 1. Encode FIRST (to a temp name) — the original stays put until the
    //    optimized bytes are safely on disk, so a failure at any earlier
    //    point leaves the original visible in the main folder.
    const out = await reencode(src, maxDim)
    const tmp = `${target}.tmp-${Date.now()}`
    writeFileSync(tmp, out)
    // 2. Archive the original, then 3. publish the optimized file.
    renameSync(src, path.join(originalsDir, file))
    renameSync(tmp, target)
    console.log(`  ${file} → ${path.basename(target)}: ${kb(out.length)}`)
    if (dir === STORY) storyChanged = true
    pass1++
  }
  if (pass1) console.log(`— ${label} (new, optimized) —`)

  // --- Pass 2: restore any optimized image that went missing. ---
  let restored = 0
  for (const file of readdirSync(originalsDir).filter(isImage)) {
    const target = path.join(dir, targetName(file))
    if (existsSync(target)) continue
    const out = await reencode(path.join(originalsDir, file), maxDim)
    const tmp = `${target}.tmp-${Date.now()}`
    writeFileSync(tmp, out)
    renameSync(tmp, target)
    console.log(`  ${file} → ${path.basename(target)} (restored): ${kb(out.length)}`)
    restored++
  }
  if (restored) console.log(`— ${label} (restored from _originals) —`)
}

// New story chapters are emitted as .jpg — point their storyData.js imports
// at the optimized files (only ever touches chapterN.png references).
if (storyChanged) {
  const data = readFileSync(STORY_DATA, 'utf8')
  const updated = data.replace(/\.png'/g, ".jpg'")
  if (updated !== data) {
    writeFileSync(STORY_DATA, updated)
    console.log('  storyData.js imports updated → .jpg')
  }
}

await browser.close()
console.log('\nDone — optimized + restored files regenerated.')
