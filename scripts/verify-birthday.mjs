// scripts/verify-birthday.mjs
// Headless-Chrome verification of the Birthday Surprise page (Wish Tree flow).
// Usage: node scripts/verify-birthday.mjs [url]
//   1. Loads /birthday-surprise, asserts the welcome card (heading + Continue).
//   2. REAL mouse click on "✨ Continue" → asserts the "Make A Birthday Wish"
//      moonlit tree section appears: the SVG wish tree, hanging wish note,
//      stars, fireflies, petals and floating hearts.
//   3. REAL mouse click on the hanging note → the letter unfolds, then the
//      night phase begins: the dark overlay fades in, lanterns rise, golden
//      particles float, the tree fades away.
//   4. The birthday message then fades in one paragraph at a time (with the
//      faster ~1s stagger), ending with the final promise revealed line by
//      line and the golden "Together." closing — with no buttons, still on
//      the same page. Fireworks burst once the reveal completes.
//   5. Checks the mobile viewport for horizontal overflow, and prints every
//      page console message (errors included).

import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5199/birthday-surprise'

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log('[verify]', ...a)

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    '--window-size=1440,900',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-hang-monitor',
  ],
})

let allPassed = true
const fail = (msg) => {
  allPassed = false
  throw new Error(msg)
}

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.bringToFront()

  const consoleLines = []
  page.on('console', (m) => consoleLines.push(`[page:${m.type()}] ${m.text()}`))
  page.on('pageerror', (err) => consoleLines.push(`[page:error] ${err.message}`))

  log(`loading ${URL} …`)
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1600)

  // --- 1. Welcome card ---
  const welcome = await page.evaluate(() => ({
    heading: document.body.innerText.includes('Happy Birthday,'),
    loveLine: document.body.innerText.includes('My Love'),
    continueBtn: [...document.querySelectorAll('button')].some((b) =>
      b.textContent.includes('✨ Continue')
    ),
    treeBefore: !!document.querySelector('[data-testid="wish-tree-section"]'),
  }))
  log('welcome card:', JSON.stringify(welcome))
  if (!welcome.heading || !welcome.loveLine || !welcome.continueBtn)
    fail('welcome card incomplete')
  if (welcome.treeBefore) fail('tree section must NOT be visible before Continue')

  // --- 2. Click Continue → Wish Tree section ---
  const btnPoint = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent.includes('✨ Continue')
    )
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  })
  if (!btnPoint) fail('Continue button not found')
  await page.mouse.click(btnPoint.x, btnPoint.y)
  await sleep(2600)

  const tree = await page.evaluate(() => {
    const count = (id) => document.querySelectorAll(`[data-testid="${id}"] span`).length
    return {
      section: !!document.querySelector('[data-testid="wish-tree-section"]'),
      title: document.body.innerText.includes('Make A Birthday Wish'),
      subtitle: document.body.innerText.includes('Close your eyes'),
      treeSvg: !!document.querySelector('svg[aria-label*="wish tree"]'),
      note: !!document.querySelector('[data-testid="hanging-note"]'),
      noteText: document.body.innerText.includes('One Last Wish'),
      stars: count('scene-stars'),
      fireflies: count('scene-fireflies'),
      petals: count('scene-petals'),
      hearts: count('scene-hearts'),
      letterBefore: !!document.querySelector('[data-testid="unfolded-letter"]'),
      messageBefore: !!document.querySelector('[data-testid="birthday-message"]'),
      nightBefore: (() => {
        const o = document.querySelector('[data-testid="night-overlay"]')
        return o ? parseFloat(getComputedStyle(o).opacity) > 0.1 : false
      })(),
    }
  })
  log('tree section:', JSON.stringify(tree))
  if (!tree.section || !tree.title || !tree.subtitle || !tree.treeSvg || !tree.note || !tree.noteText)
    fail('wish tree section incomplete')
  if (tree.stars < 15) fail('stars should be present in the night scene')
  if (tree.fireflies < 5) fail('fireflies should be present around the tree')
  if (tree.petals < 6) fail('rose petals should be drifting in the scene')
  if (tree.hearts < 4) fail('floating hearts should be present in the scene')
  if (tree.letterBefore || tree.messageBefore) fail('letter/message must NOT be visible before the note is opened')
  if (tree.nightBefore) fail('night phase must NOT be active before the note is opened')

  // --- 3. Click the hanging note → letter unfolds ---
  // Scroll it into view first (the smooth auto-scroll may still be settling
  // under heavy CPU load) so the real mouse click always lands on it.
  const noteFound = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="hanging-note"]')
    if (!n) return false
    n.scrollIntoView({ block: 'center' })
    return true
  })
  if (!noteFound) fail('hanging note not found')
  await sleep(700)
  const notePoint = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="hanging-note"]')
    if (!n) return null
    const r = n.getBoundingClientRect()
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  })
  if (!notePoint) fail('hanging note not found')
  if (notePoint.y < 0 || notePoint.y > 900) fail(`note outside viewport (${notePoint.y})`)
  log('clicking hanging note at', JSON.stringify(notePoint))
  await page.mouse.click(notePoint.x, notePoint.y)

  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="unfolded-letter"]'),
    { timeout: 5000 }
  )
  // Wait for the note's exit animation to finish (AnimatePresence keeps it
  // in the DOM while it swings away) instead of a fixed sleep.
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="hanging-note"]'),
    { timeout: 5000 }
  )
  await sleep(300)
  const unfolded = await page.evaluate(() => ({
    letter: !!document.querySelector('[data-testid="unfolded-letter"]'),
    noteGone: !document.querySelector('[data-testid="hanging-note"]'),
    treeStillThere: !!document.querySelector('svg[aria-label*="wish tree"]'),
    stillOnPage: location.pathname === '/birthday-surprise',
  }))
  log('after opening the note:', JSON.stringify(unfolded))
  if (!unfolded.letter) fail('the unfolded letter should appear after opening the note')
  if (!unfolded.noteGone) fail('the hanging note should swing away once opened')
  if (!unfolded.treeStillThere) fail('the tree should still be visible at this point')
  if (!unfolded.stillOnPage) fail('must NOT navigate away — stay on /birthday-surprise')

  // --- 4. Night phase: overlay, lanterns, gold particles; tree fades away ---
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="scene-lanterns"]'),
    { timeout: 6000 }
  )
  // Let the dark overlay finish fading in (1.6s) before measuring it.
  await page.waitForFunction(
    () => {
      const o = document.querySelector('[data-testid="night-overlay"]')
      return o ? parseFloat(getComputedStyle(o).opacity) > 0.7 : false
    },
    { timeout: 4000 }
  )
  const night = await page.evaluate(() => ({
    overlay: (() => {
      const o = document.querySelector('[data-testid="night-overlay"]')
      return o ? parseFloat(getComputedStyle(o).opacity) > 0.7 : false
    })(),
    lanterns: document.querySelectorAll('[data-testid="scene-lanterns"] div').length,
    gold: document.querySelectorAll('[data-testid="scene-gold"] span').length,
    nightStars: document.querySelectorAll('[data-testid="night-stars"] span').length,
    firefliesStill: document.querySelectorAll('[data-testid="scene-fireflies"] span').length,
  }))
  log('night phase:', JSON.stringify(night))
  if (!night.overlay) fail('dark overlay should appear in the night phase')
  if (night.lanterns < 6) fail('lanterns should rise into the sky')
  if (night.gold < 10) fail('soft golden particles should float in the night')
  if (night.nightStars < 20) fail('the starry sky should deepen with more stars')
  if (night.firefliesStill < 5) fail('fireflies should keep flying through the night')

  // The tree fades away as the wish is released.
  await page.waitForFunction(
    () => !document.querySelector('svg[aria-label*="wish tree"]'),
    { timeout: 6000 }
  )
  log('✅ tree faded away during the night phase')

  // --- 5. The birthday message fades in, one paragraph at a time ---
  await page.waitForFunction(
    () => !!document.querySelector('[data-testid="birthday-message"]'),
    { timeout: 8000 }
  )
  const msgEarly = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="birthday-message"]')
    return {
      heading: document.body.innerText.includes('Happy Birthday, My Love'),
      firstPara: document.body.innerText.includes('every happiness in the world'),
      noButtons: el ? el.querySelectorAll('button').length === 0 : null,
    }
  })
  log('message (early):', JSON.stringify(msgEarly))
  if (!msgEarly.heading) fail('birthday message heading should appear')
  if (!msgEarly.firstPara) fail('first paragraph should fade in first')
  if (!msgEarly.noButtons) fail('no buttons should appear while the message is showing')

  // A later paragraph fades in after the stagger — proves one-at-a-time reveal.
  await sleep(6000)
  const msgLater = await page.evaluate(() => ({
    thirdPara: document.body.innerText.includes('I only have one wish'),
    stillOnPage: location.pathname === '/birthday-surprise',
  }))
  log('message (later):', JSON.stringify(msgLater))
  if (!msgLater.thirdPara) fail('later paragraphs should appear one at a time')
  if (!msgLater.stillOnPage) fail('must stay on /birthday-surprise after the message')

  // --- 6. The final promise reveals line by line, ending on the golden closing ---
  await page.waitForFunction(
    () => document.body.innerText.includes('One more wish'),
    { timeout: 10000 }
  )
  const promise = await page.evaluate(() => ({
    opener: document.body.innerText.includes('One more wish'),
    lastLine: document.body.innerText.includes('Happy Next Birthday'),
    together: document.body.innerText.includes('Together.'),
    golden: !!document.querySelector('[data-testid="final-promise"]'),
    noButtons:
      document.querySelectorAll('[data-testid="birthday-message"] button').length === 0,
    stillOnPage: location.pathname === '/birthday-surprise',
  }))
  log('final promise:', JSON.stringify(promise))
  if (!promise.opener || !promise.golden) fail('final promise should reveal after the message')
  if (!promise.lastLine || !promise.together)
    fail("the promise should end on 'Happy Next Birthday... Together.'")
  if (!promise.noButtons) fail('no buttons should appear while the message is showing')
  if (!promise.stillOnPage) fail('must stay on /birthday-surprise for the final promise')

  // --- 7. Fireworks burst once the message finishes revealing ---
  await page.waitForFunction(
    () => {
      const fw = document.querySelector('[data-testid="fireworks"]')
      return fw && fw.querySelectorAll('div').length > 0
    },
    { timeout: 30000 }
  )
  await sleep(1200) // let a burst populate its particles
  const fireworks = await page.evaluate(() => {
    const fw = document.querySelector('[data-testid="fireworks"]')
    if (!fw) return { present: false, bursts: 0, particles: 0 }
    return {
      present: true,
      bursts: fw.querySelectorAll('div').length,
      particles: fw.querySelectorAll('span').length,
    }
  })
  log('fireworks:', JSON.stringify(fireworks))
  if (!fireworks.present) fail('fireworks should appear once the message finishes')
  if (fireworks.bursts < 1) fail('at least one firework burst should be visible')
  if (fireworks.particles < 10) fail('firework bursts should have radiating particles')

  // --- The flow's final hop: a gentle CTA to /ending appears once the
  // fireworks are underway (never while the message is still revealing).
  await page.waitForFunction(
    () => !!document.querySelector('a[href="/ending"]'),
    { timeout: 20000 }
  )
  const endingCta = await page.evaluate(() => ({
    link: !!document.querySelector('a[href="/ending"]'),
    text: document.body.innerText.includes('To Be Continued'),
    stillOnPage: location.pathname === '/birthday-surprise',
  }))
  log('ending CTA:', JSON.stringify(endingCta))
  if (!endingCta.link || !endingCta.text) fail('the To Be Continued CTA should lead to /ending')
  if (!endingCta.stillOnPage) fail('must stay on /birthday-surprise until the CTA is clicked')

  log('✅ desktop flow OK')

  // --- 8. Mobile: no horizontal overflow ---
  await page.setViewport({ width: 375, height: 812 })
  await sleep(900)
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    messageVisible: !!document.querySelector('[data-testid="birthday-message"]'),
  }))
  log('mobile:', JSON.stringify(mobile))
  if (mobile.overflow) fail('horizontal overflow on mobile viewport')
  if (!mobile.messageVisible) fail('birthday message missing on mobile')

  log('✅ mobile overflow check OK')

  const errors = consoleLines.filter((l) => l.includes('[page:error]'))
  if (errors.length) {
    log('❌ page errors found:')
    errors.forEach((l) => console.log(l))
    process.exitCode = 1
  } else {
    log('✅ no page errors')
  }

  log('--- page console (proof) ---')
  consoleLines.forEach((l) => console.log(l))

  log(allPassed ? '✅ PASS: wish-tree + message flow works end-to-end' : '❌ FAIL')
} catch (err) {
  console.error('✖', err.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
