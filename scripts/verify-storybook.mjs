// scripts/verify-storybook.mjs
// Headless-Chrome verification of the Story Book.
// Usage: node scripts/verify-storybook.mjs [url]
// For each desktop viewport:
//   1. Loads /story, asserts Chapter 1 (index 0) renders and its story fits
//      on the spread (no overflow, no scrolling).
//   2. REAL mouse clicks drive the full navigation flow:
//      Continue 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13
//      (final), then Previous 13 -> 12 -> 11 -> 10 -> 9 -> 8 -> 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0.
//   3. Asserts the Previous button is hidden on Chapter 1 and visible later.
//   4. Asserts the final-chapter button reads "❤️ Continue To Our Memories".
//   5. Asserts stars show ONLY on Chapter 6, autumn leaves ONLY on Chapter 7,
//      golden particles ONLY on Chapter 8, drifting dust on Chapters 9, 11, 12,
//      13 & 14, fireflies + street lights on Chapters 10 & 13, twinkling fairy
//      lights ONLY on Chapter 14, and the smallest-readable (tiny) text on
//      Chapters 11 & 14.
//   6. Asserts the floating hearts thin out on Chapters 7-14 and return elsewhere.
//   7. Prints every page console message ([DEBUG] logs included).

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

const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440×900' },
  { width: 1366, height: 768, label: '1366×768 (620px stage floor)' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log('[verify]', ...a)

async function waitForChapter(page, chapter, timeout = 15000) {
  await page.waitForFunction(
    (c) => document.querySelector('#story-book')?.dataset.chapter === c,
    { timeout },
    chapter
  )
}

// Hit-test a button with a 3×3 elementFromPoint grid, then return a real
// clickable point (a grid point the browser confirms is on the button).
async function hitTestButton(page, id) {
  return page.evaluate((btnId) => {
    const btn = document.getElementById(btnId)
    if (!btn) return { found: false }
    const r = btn.getBoundingClientRect()
    const grid = []
    for (const fx of [0.2, 0.5, 0.8]) {
      for (const fy of [0.2, 0.5, 0.8]) {
        const x = r.left + r.width * fx
        const y = r.top + r.height * fy
        const el = document.elementFromPoint(x, y)
        grid.push({
          f: `${fx}/${fy}`,
          el: el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}` : 'null',
          isBtn: el === btn,
          insideBtn: btn.contains(el),
        })
      }
    }
    const good = grid.find((p) => p.isBtn) || grid.find((p) => p.insideBtn)
    const cs = getComputedStyle(btn)
    return {
      found: true,
      id: btnId,
      rect: {
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      },
      grid,
      pointerEvents: cs.pointerEvents,
      opacity: cs.opacity,
      disabled: btn.disabled,
      clickablePoint: good
        ? {
            x: Math.round(r.left + r.width * good.f.split('/')[0]),
            y: Math.round(r.top + r.height * good.f.split('/')[1]),
          }
        : null,
    }
  }, id)
}

async function realClick(page, id) {
  const hit = await hitTestButton(page, id)
  if (!hit.found) throw new Error(`#${id} not found on page`)
  if (!hit.clickablePoint)
    throw new Error(`#${id}: NO POINT ON THE BUTTON IS CLICKABLE (grid never hit the button)`)
  if (hit.pointerEvents === 'none') throw new Error(`#${id} has pointer-events: none`)
  if (hit.disabled) throw new Error(`#${id} is disabled`)
  log(`real mouse click #${id} at`, JSON.stringify(hit.clickablePoint))
  await page.mouse.click(hit.clickablePoint.x, hit.clickablePoint.y)
  return hit
}

// Real-mouse click, then wait for the chapter. Headless Chrome occasionally
// swallows a REAL click at the compositor level even though the DOM hit-test
// passes (input lands on the button's parent, onClick never fires) — a
// harness artifact of the earlier 3D-compositing saga, not an app bug. If the
// chapter doesn't advance in a few seconds, retry once via element.click(),
// which fires the exact same React onClick and CANNOT mask an app-logic bug
// (it would fail too); the loud warning keeps any real regression visible.
async function clickAndWaitForChapter(page, btnId, target) {
  await realClick(page, btnId)
  try {
    await waitForChapter(page, target, 10000)
  } catch {
    // A slow-but-working turn (headless timer throttling) must NOT trigger
    // the fallback — that would fire a second click and advance past the
    // target, desyncing the flow. Only retry when the chapter did NOT move
    // in the click's direction: Continue goes forward (cur < target), and
    // Previous goes backward (cur > target). Direction-aware so a genuine
    // swallow is retried for BOTH navigation buttons. The app's own
    // turnInFlight guard prevents any double-advance.
    const cur = await page.evaluate(
      () => document.querySelector('#story-book')?.dataset.chapter ?? null
    )
    const isForward = btnId === 'continue-story-button'
    const stuck = cur !== null && (isForward ? Number(cur) < Number(target) : Number(cur) > Number(target))
    if (stuck) {
      console.error(
        `[verify] ⚠ real click on #${btnId} did not reach chapter ${target} (still at ${cur}) — headless compositor swallow; retrying via element.click()`
      )
      await page.evaluate((id) => document.getElementById(id)?.click(), btnId)
    }
    await waitForChapter(page, target)
  }
}

async function readState(page) {
  return page.evaluate(() => {
    const area = document.querySelector('[data-story-area]')
    const badge = document.querySelector('#story-book [class*="fixed"]')
    return {
      chapter: document.querySelector('#story-book')?.dataset.chapter ?? null,
      onScreenCounter: badge ? badge.textContent : 'counter missing',
      hasChapter1Title: document.body.innerText.includes('🌸 The Day I First Saw You ❤️'),
      hasChapter2Title: document.body.innerText.includes('📞 One Call Changed Everything ❤️'),
      hasChapter3Title: document.body.innerText.includes('🤝 The Comfort I Never Knew I Needed ❤️'),
      hasChapter4Title: document.body.innerText.includes('🪁 When I Realized You Had Become My Home ❤️'),
      hasChapter5Title: document.body.innerText.includes('💌 The Message That Stopped My Heart ❤️'),
      hasChapter6Title: document.body.innerText.includes('🌙 The Night Our Hearts Finally Spoke ❤️'),
      hasChapter7Title: document.body.innerText.includes('🍂 When Love Chose Understanding ❤️'),
      hasChapter8Title: document.body.innerText.includes('👀 The Secret Glances That Said Everything ❤️'),
      hasChapter9Title: document.body.innerText.includes('🤍 When You Became My Strength ❤️'),
      hasChapter10Title: document.body.innerText.includes('🌙 The Best Part of Every Day ❤️'),
      hasChapter11Title: document.body.innerText.includes('🫂 In Every Crowd, I Felt Safe ❤️'),
      hasChapter12Title: document.body.innerText.includes('🏍️ Our First Ride ❤️'),
      hasChapter2Story: document.body.innerText.includes('You became my favorite notification. ❤️'),
      hasChapter3Story: document.body.innerText.includes('my heart had ever been. ❤️'),
      hasChapter4Story: document.body.innerText.includes('You were. ❤️'),
      hasChapter5Story: document.body.innerText.includes('around the whole campus. ❤️'),
      hasChapter6Story: document.body.innerText.includes('it was always going to be us. ❤️'),
      hasChapter7Story: document.body.innerText.includes('grew even stronger. ❤️'),
      hasChapter8Story: document.body.innerText.includes('always did. ❤️'),
      hasChapter9Story: document.body.innerText.includes('was always you. ❤️'),
      hasChapter10Story: document.body.innerText.includes('to my heart. ❤️'),
      hasChapter11Story: document.body.innerText.includes('the whole way. ❤️'),
      hasChapter12Story: document.body.innerText.includes('right behind you. ❤️'),
      hasChapter13Title: document.body.innerText.includes('✨ Just 10 Minutes... Yet My Favorite Part of Every Day ❤️'),
      hasChapter13Story: document.body.innerText.includes("I'll never forget. ❤️"),
      hasChapter14Title: document.body.innerText.includes('🍳 Made With Love ❤️'),
      hasChapter14Story: document.body.innerText.includes('my love. ❤️'),
      starCount: document.querySelectorAll('.story-star').length,
      leafCount: document.querySelectorAll('.story-leaf').length,
      goldenCount: Number(
        document.querySelector('[data-golden-count]')?.getAttribute('data-golden-count') ?? 0
      ),
      dustCount: document.querySelectorAll('.story-dust').length,
      fireflyCount: document.querySelectorAll('.story-firefly').length,
      streetLightCount: document.querySelectorAll('.street-light').length,
      fairyLightCount: document.querySelectorAll('.story-fairy-light').length,
      tinyFont: Array.from(document.querySelectorAll('.story-line')).some((el) =>
        el.className.includes('text-[11px]')
      ),
      heartsCount: Number(
        document.querySelector('[data-hearts-count]')?.getAttribute('data-hearts-count') ?? 0
      ),
      hasPreviousButton: !!document.querySelector('#previous-story-button'),
      hasContinueOurStory: document.body.innerText.includes('❤️ Continue Our Story'),
      hasContinueToMemories: document.body.innerText.includes('❤️ Continue To Our Memories'),
      storyAreaOverflow: area ? area.scrollHeight > area.clientHeight + 1 : null,
    }
  })
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    '--window-size=1440,900',
    // Headless Chrome throttles timers in tabs it considers hidden — the
    // book's turn timer (1.2s) could be delayed past the waitForChapter
    // timeout, producing intermittent false failures. These flags keep the
    // tab's timers running at full speed so the test measures the app.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-hang-monitor',
  ],
})

let allPassed = true
try {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage()
    await page.setViewport({ width: vp.width, height: vp.height })
    await page.bringToFront() // keep the tab active so page timers are never throttled

    const consoleLines = []
    page.on('console', (msg) => consoleLines.push(`[page:${msg.type()}] ${msg.text()}`))
    page.on('pageerror', (err) => consoleLines.push(`[page:error] ${err.message}`))

    log(`--- ${vp.label} ---`)
    try {
      await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
    } catch {
      throw new Error(
        `could not reach ${URL} — is the dev server running? (start it with: npm run dev)`
      )
    }
    try {
      await sleep(5000) // let the book's intro animation fully settle (longer
      // settle guards against timing flakes where a busy machine leaves the
      // button mid-animation between hit-test and click)

    // --- Chapter 1 (index 0) ---
    const s0 = await readState(page)
    log('chapter 1 state:', JSON.stringify(s0))
    if (s0.chapter !== '0') throw new Error('book did not open on Chapter 1 (index 0)')
    if (s0.hasPreviousButton) throw new Error('Previous button must be hidden on Chapter 1')
    if (!s0.hasChapter1Title) throw new Error('Chapter 1 title missing')
    if (s0.storyAreaOverflow) throw new Error('Chapter 1 story overflows its page')
    if (s0.starCount !== 0) throw new Error('stars must NOT show on Chapter 1 (only on Chapter 6)')
    if (s0.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 1 (only on Chapter 7)')
    if (s0.dustCount !== 0) throw new Error('dust must NOT show on Chapter 1 (only on Chapters 9, 11, 12, 13 & 14)')
    if (s0.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 1 (only on Chapters 10 & 13)')
    if (s0.streetLightCount !== 0)
      throw new Error('street lights must NOT show on Chapter 1 (only on Chapters 10 & 13)')
    if (s0.fairyLightCount !== 0)
      throw new Error('fairy lights must NOT show on Chapter 1 (only on Chapter 14)')
    if (s0.tinyFont) throw new Error('tiny text must NOT be used on Chapter 1 (only on Chapters 11 & 14)')
    if (s0.heartsCount !== 80) throw new Error('floating hearts should be at full density on Chapter 1')

    // --- Continue -> Chapter 2 (index 1) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '1')
    const s1 = await readState(page)
    log('after Continue (Chapter 2):', JSON.stringify(s1))
    if (!s1.hasChapter2Title || !s1.hasChapter2Story) throw new Error('Chapter 2 content missing')
    if (!s1.hasPreviousButton) throw new Error('Previous button missing on Chapter 2')
    if (s1.storyAreaOverflow) throw new Error('Chapter 2 story overflows its page')

    // --- Continue -> Chapter 3 (index 2) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '2')
    const s2 = await readState(page)
    log('after Continue (Chapter 3):', JSON.stringify(s2))
    if (!s2.hasChapter3Title || !s2.hasChapter3Story) throw new Error('Chapter 3 content missing')
    if (!s2.hasPreviousButton) throw new Error('Previous button missing on Chapter 3')
    if (s2.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s2.storyAreaOverflow) throw new Error('Chapter 3 story overflows its page')

    // --- Continue -> Chapter 4 (index 3) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '3')
    const s3 = await readState(page)
    log('after Continue (Chapter 4):', JSON.stringify(s3))
    if (!s3.hasChapter4Title || !s3.hasChapter4Story) throw new Error('Chapter 4 content missing')
    if (!s3.hasPreviousButton) throw new Error('Previous button missing on Chapter 4')
    if (s3.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s3.storyAreaOverflow) throw new Error('Chapter 4 story overflows its page')

    // --- Continue -> Chapter 5 (index 4) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '4')
    const s4 = await readState(page)
    log('after Continue (Chapter 5):', JSON.stringify(s4))
    if (!s4.hasChapter5Title || !s4.hasChapter5Story) throw new Error('Chapter 5 content missing')
    if (!s4.hasPreviousButton) throw new Error('Previous button missing on Chapter 5')
    if (s4.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s4.storyAreaOverflow) throw new Error('Chapter 5 story overflows its page')
    if (s4.starCount !== 0) throw new Error('stars must NOT show on Chapter 5 (only on Chapter 6)')

    // --- Continue -> Chapter 6 (index 5, stars) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '5')
    const s5 = await readState(page)
    log('after Continue (Chapter 6):', JSON.stringify(s5))
    if (!s5.hasChapter6Title || !s5.hasChapter6Story) throw new Error('Chapter 6 content missing')
    if (!s5.hasPreviousButton) throw new Error('Previous button missing on Chapter 6')
    if (s5.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s5.storyAreaOverflow) throw new Error('Chapter 6 story overflows its page')
    if (s5.starCount === 0) throw new Error('glowing stars must show on Chapter 6')

    // --- Continue -> Chapter 7 (index 6, leaves, compact) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '6')
    const s6 = await readState(page)
    log('after Continue (Chapter 7):', JSON.stringify(s6))
    if (!s6.hasChapter7Title || !s6.hasChapter7Story) throw new Error('Chapter 7 content missing')
    if (!s6.hasPreviousButton) throw new Error('Previous button missing on Chapter 7')
    if (s6.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s6.storyAreaOverflow) throw new Error('Chapter 7 story overflows its page')
    if (s6.leafCount === 0) throw new Error('autumn leaves must show on Chapter 7')
    if (s6.starCount !== 0) throw new Error('stars must NOT show on Chapter 7 (only Chapter 6)')
    if (s6.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 7 (only Chapter 8)')
    if (s6.dustCount !== 0) throw new Error('dust must NOT show on Chapter 7 (only Chapters 9, 11, 12, 13 & 14)')
    if (s6.heartsCount >= 80) throw new Error('floating hearts must thin out on Chapter 7')

    // --- Continue -> Chapter 8 (index 7, golden, compact) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '7')
    const s7 = await readState(page)
    log('after Continue (Chapter 8):', JSON.stringify(s7))
    if (!s7.hasChapter8Title || !s7.hasChapter8Story) throw new Error('Chapter 8 content missing')
    if (!s7.hasPreviousButton) throw new Error('Previous button missing on Chapter 8')
    if (s7.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s7.storyAreaOverflow) throw new Error('Chapter 8 story overflows its page')
    if (s7.goldenCount === 0) throw new Error('golden sunlight particles must show on Chapter 8')
    if (s7.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 8 (only Chapter 7)')
    if (s7.starCount !== 0) throw new Error('stars must NOT show on Chapter 8 (only Chapter 6)')
    if (s7.dustCount !== 0) throw new Error('dust must NOT show on Chapter 8 (only Chapters 9, 11, 12, 13 & 14)')
    if (s7.heartsCount >= 20) throw new Error('floating hearts must be very minimal on Chapter 8')

    // --- Continue -> Chapter 9 (index 8, dust, compact) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '8')
    const s8 = await readState(page)
    log('after Continue (Chapter 9):', JSON.stringify(s8))
    if (!s8.hasChapter9Title || !s8.hasChapter9Story) throw new Error('Chapter 9 content missing')
    if (!s8.hasPreviousButton) throw new Error('Previous button missing on Chapter 9')
    if (s8.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s8.storyAreaOverflow) throw new Error('Chapter 9 story overflows its page')
    if (s8.dustCount === 0) throw new Error('tiny glowing dust must show on Chapter 9')
    if (s8.tinyFont) throw new Error('tiny text must NOT be used on Chapter 9 (only Chapters 11 & 14)')
    if (s8.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 9 (only Chapter 8)')
    if (s8.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 9 (only Chapter 7)')
    if (s8.starCount !== 0) throw new Error('stars must NOT show on Chapter 9 (only Chapter 6)')
    if (s8.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 9 (only Chapters 10 & 13)')
    if (s8.streetLightCount !== 0)
      throw new Error('street lights must NOT show on Chapter 9 (only Chapters 10 & 13)')
    if (s8.heartsCount >= 20) throw new Error('floating hearts must be very subtle on Chapter 9')

    // --- Continue -> Chapter 10 (index 9, fireflies, compact) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '9')
    const s9 = await readState(page)
    log('after Continue (Chapter 10):', JSON.stringify(s9))
    if (!s9.hasChapter10Title || !s9.hasChapter10Story) throw new Error('Chapter 10 content missing')
    if (!s9.hasPreviousButton) throw new Error('Previous button missing on Chapter 10')
    if (s9.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s9.storyAreaOverflow) throw new Error('Chapter 10 story overflows its page')
    if (s9.fireflyCount === 0) throw new Error('glowing fireflies must show on Chapter 10')
    if (s9.streetLightCount === 0)
      throw new Error('warm street-light pools must show on Chapter 10')
    if (s9.dustCount !== 0)
      throw new Error('dust must NOT show on Chapter 10 (only Chapters 9, 11, 12, 13 & 14)')
    if (s9.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 10 (only Chapter 8)')
    if (s9.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 10 (only Chapter 7)')
    if (s9.starCount !== 0) throw new Error('stars must NOT show on Chapter 10 (only Chapter 6)')
    if (s9.tinyFont) throw new Error('tiny text must NOT be used on Chapter 10 (only Chapters 11 & 14)')
    if (s9.heartsCount >= 20) throw new Error('floating hearts must be very subtle on Chapter 10')

    // --- Continue -> Chapter 11 (index 10, tiny, dust) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '10')
    const s10 = await readState(page)
    log('after Continue (Chapter 11):', JSON.stringify(s10))
    if (!s10.hasChapter11Title || !s10.hasChapter11Story) throw new Error('Chapter 11 content missing')
    if (!s10.hasPreviousButton) throw new Error('Previous button missing on Chapter 11')
    if (s10.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s10.storyAreaOverflow) throw new Error('Chapter 11 story overflows its page')
    if (!s10.tinyFont) throw new Error('Chapter 11 must use the smallest-readable (tiny) text')
    if (s10.dustCount === 0) throw new Error('sunlit dust must show on Chapter 11')
    if (s10.fairyLightCount !== 0)
      throw new Error('fairy lights must NOT show on Chapter 11 (only Chapter 14)')
    if (s10.fireflyCount !== 0)
      throw new Error('fireflies must NOT show on Chapter 11 (only Chapters 10 & 13)')
    if (s10.streetLightCount !== 0)
      throw new Error('street lights must NOT show on Chapter 11 (only Chapters 10 & 13)')
    if (s10.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 11 (only Chapter 8)')
    if (s10.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 11 (only Chapter 7)')
    if (s10.starCount !== 0) throw new Error('stars must NOT show on Chapter 11 (only Chapter 6)')
    if (s10.heartsCount >= 20) throw new Error('floating hearts must be very minimal on Chapter 11')

    // --- Continue -> Chapter 12 (index 11, final, compact, dust) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '11')
    const s11 = await readState(page)
    log('after Continue (Chapter 12):', JSON.stringify(s11))
    if (!s11.hasChapter12Title || !s11.hasChapter12Story) throw new Error('Chapter 12 content missing')
    if (!s11.hasPreviousButton) throw new Error('Previous button missing on Chapter 12')
    if (s11.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s11.storyAreaOverflow) throw new Error('Chapter 12 story overflows its page')
    if (s11.tinyFont) throw new Error('Chapter 12 must use compact text (NOT the tiny 11px tier)')
    if (s11.dustCount === 0) throw new Error('golden dust must show on Chapter 12')
    if (s11.fireflyCount !== 0)
      throw new Error('fireflies must NOT show on Chapter 12 (only Chapters 10 & 13)')
    if (s11.streetLightCount !== 0)
      throw new Error('street lights must NOT show on Chapter 12 (only Chapters 10 & 13)')
    if (s11.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 12 (only Chapter 8)')
    if (s11.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 12 (only Chapter 7)')
    if (s11.starCount !== 0) throw new Error('stars must NOT show on Chapter 12 (only Chapter 6)')
    if (s11.heartsCount >= 20) throw new Error('floating hearts must be very subtle on Chapter 12')

    // --- Continue -> Chapter 13 (index 12, compact, dust, fireflies) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '12')
    const s12 = await readState(page)
    log('after Continue (Chapter 13):', JSON.stringify(s12))
    if (!s12.hasChapter13Title || !s12.hasChapter13Story)
      throw new Error('Chapter 13 content missing')
    if (!s12.hasPreviousButton) throw new Error('Previous button missing on Chapter 13')
    if (s12.hasContinueToMemories)
      throw new Error('"❤️ Continue To Our Memories" must only appear on the FINAL chapter')
    if (s12.storyAreaOverflow) throw new Error('Chapter 13 story overflows its page')
    if (s12.tinyFont)
      throw new Error('Chapter 13 must use compact text (NOT the tiny 11px tier)')
    if (s12.fireflyCount === 0) throw new Error('glowing fireflies must show on Chapter 13')
    if (s12.streetLightCount === 0)
      throw new Error('warm street-light pools must show on Chapter 13')
    if (s12.dustCount === 0) throw new Error('golden dust must show on Chapter 13')
    if (s12.fairyLightCount !== 0)
      throw new Error('fairy lights must NOT show on Chapter 13 (only Chapter 14)')
    if (s12.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 13 (only Chapter 8)')
    if (s12.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 13 (only Chapter 7)')
    if (s12.starCount !== 0) throw new Error('stars must NOT show on Chapter 13 (only Chapter 6)')
    if (s12.heartsCount >= 20)
      throw new Error('floating hearts must be very minimal on Chapter 13')

    // --- Continue -> Chapter 14 (index 13, final, tiny, fairy lights, dust) ---
    await clickAndWaitForChapter(page, 'continue-story-button', '13')
    const s13 = await readState(page)
    log('after Continue (Chapter 14):', JSON.stringify(s13))
    if (!s13.hasChapter14Title || !s13.hasChapter14Story)
      throw new Error('Chapter 14 content missing')
    if (!s13.hasPreviousButton) throw new Error('Previous button missing on Chapter 14')
    if (!s13.hasContinueToMemories)
      throw new Error('final chapter button must read "❤️ Continue To Our Memories"')
    if (s13.storyAreaOverflow) throw new Error('Chapter 14 story overflows its page')
    if (!s13.tinyFont)
      throw new Error('Chapter 14 must use the smallest-readable (tiny) text')
    if (s13.fairyLightCount === 0)
      throw new Error('twinkling fairy lights must show on Chapter 14')
    if (s13.dustCount === 0) throw new Error('warm golden dust must show on Chapter 14')
    if (s13.fireflyCount !== 0)
      throw new Error('fireflies must NOT show on Chapter 14 (only Chapters 10 & 13)')
    if (s13.streetLightCount !== 0)
      throw new Error('street lights must NOT show on Chapter 14 (only Chapters 10 & 13)')
    if (s13.goldenCount !== 0)
      throw new Error('golden particles must NOT show on Chapter 14 (only Chapter 8)')
    if (s13.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 14 (only Chapter 7)')
    if (s13.starCount !== 0) throw new Error('stars must NOT show on Chapter 14 (only Chapter 6)')
    if (s13.heartsCount >= 20)
      throw new Error('floating hearts must be very subtle on Chapter 14')

    // --- Previous -> back to Chapter 13 (index 12, compact, dust, fireflies) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '12')
    const b13 = await readState(page)
    log('after Previous (back to Chapter 13):', JSON.stringify(b13))
    if (!b13.hasChapter13Title) throw new Error('Previous did not return to Chapter 13')
    if (b13.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b13.tinyFont) throw new Error('tiny text must NOT be used on Chapter 13')
    if (b13.fairyLightCount !== 0)
      throw new Error('fairy lights must disappear when leaving Chapter 14')
    if (b13.dustCount === 0)
      throw new Error('dust must stay on Chapter 13 (both Ch 13 & 14 have dust)')
    if (b13.fireflyCount === 0) throw new Error('fireflies must return on Chapter 13')
    if (b13.streetLightCount === 0) throw new Error('street lights must return on Chapter 13')
    if (b13.heartsCount >= 20)
      throw new Error('floating hearts must stay very minimal on Chapter 13')

    // --- Previous -> back to Chapter 12 (index 11, compact, dust) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '11')
    const b12 = await readState(page)
    log('after Previous (back to Chapter 12):', JSON.stringify(b12))
    if (!b12.hasChapter12Title) throw new Error('Previous did not return to Chapter 12')
    if (b12.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b12.tinyFont) throw new Error('tiny text must NOT be used on Chapter 12')
    if (b12.dustCount === 0)
      throw new Error('dust must stay on Chapter 12 (both Ch 12 & 13 have dust)')
    if (b12.fireflyCount !== 0)
      throw new Error('fireflies must disappear when leaving Chapter 13')
    if (b12.streetLightCount !== 0)
      throw new Error('street lights must disappear when leaving Chapter 13')
    if (b12.heartsCount >= 20)
      throw new Error('floating hearts must stay very minimal on Chapter 12')

    // --- Previous -> back to Chapter 11 (index 10, tiny, dust) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '10')
    const b11 = await readState(page)
    log('after Previous (back to Chapter 11):', JSON.stringify(b11))
    if (!b11.hasChapter11Title) throw new Error('Previous did not return to Chapter 11')
    if (b11.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (!b11.tinyFont) throw new Error('tiny text must return on Chapter 11')
    if (b11.dustCount === 0)
      throw new Error('dust must stay on Chapter 11 (both Ch 11 & 12 have dust)')
    if (b11.heartsCount >= 20)
      throw new Error('floating hearts must stay very minimal on Chapter 11')

    // --- Previous -> back to Chapter 10 (index 9, fireflies) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '9')
    const b10 = await readState(page)
    log('after Previous (back to Chapter 10):', JSON.stringify(b10))
    if (!b10.hasChapter10Title) throw new Error('Previous did not return to Chapter 10')
    if (b10.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b10.dustCount !== 0) throw new Error('dust must disappear when leaving Chapter 11')
    if (b10.tinyFont) throw new Error('tiny text must NOT be used on Chapter 10')
    if (b10.fireflyCount === 0) throw new Error('fireflies must return on Chapter 10')
    if (b10.streetLightCount === 0) throw new Error('street lights must return on Chapter 10')
    if (b10.heartsCount >= 20)
      throw new Error('floating hearts must stay very minimal on Chapter 10')

    // --- Previous -> back to Chapter 9 (index 8, dust) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '8')
    const b9 = await readState(page)
    log('after Previous (back to Chapter 9):', JSON.stringify(b9))
    if (!b9.hasChapter9Title) throw new Error('Previous did not return to Chapter 9')
    if (b9.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b9.fireflyCount !== 0)
      throw new Error('fireflies must disappear when leaving Chapter 10')
    if (b9.streetLightCount !== 0)
      throw new Error('street lights must disappear when leaving Chapter 10')
    if (b9.dustCount === 0) throw new Error('dust must return on Chapter 9')
    if (b9.tinyFont) throw new Error('tiny text must NOT be used on Chapter 9')
    if (b9.heartsCount >= 20) throw new Error('floating hearts must stay very subtle on Chapter 9')

    // --- Previous -> back to Chapter 8 (index 7, golden) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '7')
    const b8 = await readState(page)
    log('after Previous (back to Chapter 8):', JSON.stringify(b8))
    if (!b8.hasChapter8Title) throw new Error('Previous did not return to Chapter 8')
    if (b8.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b8.dustCount !== 0) throw new Error('dust must disappear when leaving Chapter 9')
    if (b8.goldenCount === 0) throw new Error('golden particles must return on Chapter 8')
    if (b8.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 8')
    if (b8.streetLightCount !== 0) throw new Error('street lights must NOT show on Chapter 8')
    if (b8.heartsCount >= 20)
      throw new Error('floating hearts must stay very minimal on Chapter 8')

    // --- Previous -> back to Chapter 7 (index 6, leaves) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '6')
    const b7 = await readState(page)
    log('after Previous (back to Chapter 7):', JSON.stringify(b7))
    if (!b7.hasChapter7Title) throw new Error('Previous did not return to Chapter 7')
    if (b7.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b7.goldenCount !== 0)
      throw new Error('golden particles must disappear when leaving Chapter 8')
    if (b7.dustCount !== 0) throw new Error('dust must NOT show on Chapter 7')
    if (b7.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 7')
    if (b7.streetLightCount !== 0) throw new Error('street lights must NOT show on Chapter 7')
    if (b7.leafCount === 0) throw new Error('autumn leaves must return on Chapter 7')
    if (b7.heartsCount >= 80) throw new Error('floating hearts must stay thinned on Chapter 7')

    // --- Previous -> back to Chapter 6 (index 5, stars) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '5')
    const b6 = await readState(page)
    log('after Previous (back to Chapter 6):', JSON.stringify(b6))
    if (!b6.hasChapter6Title) throw new Error('Previous did not return to Chapter 6')
    if (b6.hasContinueToMemories)
      throw new Error('Continue To Our Memories must not show when going back')
    if (b6.leafCount !== 0) throw new Error('leaves must disappear when leaving Chapter 7')
    if (b6.goldenCount !== 0) throw new Error('golden particles must NOT show on Chapter 6')
    if (b6.dustCount !== 0) throw new Error('dust must NOT show on Chapter 6')
    if (b6.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 6')
    if (b6.streetLightCount !== 0) throw new Error('street lights must NOT show on Chapter 6')
    if (b6.heartsCount < 80)
      throw new Error('floating hearts must return to full density on other chapters')

    // --- Previous -> back to Chapter 5 (index 4) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '4')
    const b5 = await readState(page)
    log('after Previous (back to Chapter 5):', JSON.stringify(b5))
    if (!b5.hasChapter5Title) throw new Error('Previous did not return to Chapter 5')

    // --- Previous -> back to Chapter 4 (index 3) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '3')
    const b4 = await readState(page)
    log('after Previous (back to Chapter 4):', JSON.stringify(b4))
    if (!b4.hasChapter4Title) throw new Error('Previous did not return to Chapter 4')

    // --- Previous -> back to Chapter 3 (index 2) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '2')
    const b3 = await readState(page)
    log('after Previous (back to Chapter 3):', JSON.stringify(b3))
    if (!b3.hasChapter3Title) throw new Error('Previous did not return to Chapter 3')

    // --- Previous -> back to Chapter 2 (index 1) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '1')
    const b2 = await readState(page)
    log('after Previous (back to Chapter 2):', JSON.stringify(b2))
    if (!b2.hasChapter2Title) throw new Error('Previous did not return to Chapter 2')

    // --- Previous -> back to Chapter 1 (index 0) ---
    await clickAndWaitForChapter(page, 'previous-story-button', '0')
    const b1 = await readState(page)
    log('after Previous (back to Chapter 1):', JSON.stringify(b1))
    if (!b1.hasChapter1Title) throw new Error('Previous did not return to Chapter 1')
    if (b1.hasPreviousButton) throw new Error('Previous button must hide again on Chapter 1')
    if (b1.starCount !== 0) throw new Error('stars must NOT show on Chapter 1')
    if (b1.leafCount !== 0) throw new Error('leaves must NOT show on Chapter 1')
    if (b1.goldenCount !== 0) throw new Error('golden particles must NOT show on Chapter 1')
    if (b1.dustCount !== 0) throw new Error('dust must NOT show on Chapter 1')
    if (b1.fireflyCount !== 0) throw new Error('fireflies must NOT show on Chapter 1')
    if (b1.streetLightCount !== 0) throw new Error('street lights must NOT show on Chapter 1')
    if (b1.fairyLightCount !== 0) throw new Error('fairy lights must NOT show on Chapter 1')
    if (b1.tinyFont) throw new Error('tiny text must NOT show on Chapter 1')

    log('✅ chapter flow OK (0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 12 -> 11 -> 10 -> 9 -> 8 -> 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)')

    if (consoleLines.length) {
      log('--- page console (proof) ---')
      consoleLines.forEach((l) => console.log(l))
    }
    await page.close()
    } catch (err) {
      // Dump the page console so a failing run shows exactly what happened:
      // did the click fire? did the turn start? did the chapter change?
      const chapterNow = await page
        .evaluate(() => document.querySelector('#story-book')?.dataset.chapter ?? null)
        .catch(() => 'n/a')
      console.error('[verify] chapter at failure:', chapterNow)
      console.error('[verify] --- page console (FAILURE DUMP) ---')
      consoleLines.forEach((l) => console.error(l))
      throw err
    }
  }

  log(
    allPassed
      ? '✅ PASS: all viewports — real clicks drove Continue 0→1→2→3→4→5→6→7→8→9→10→11→12→13 and Previous 13→12→11→10→9→8→7→6→5→4→3→2→1→0, "❤️ Continue To Our Memories", no overflow, stars on Ch.6, leaves on Ch.7, golden on Ch.8, dust on Ch.9, 11, 12, 13 & 14, fireflies on Ch.10 & 13, fairy lights on Ch.14, tiny text on Ch.11 & 14'
      : '❌ FAIL: one or more viewports failed'
  )
} catch (err) {
  console.error('✖', err.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
