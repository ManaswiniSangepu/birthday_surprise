// scripts/measure-ch5.mjs
// One-off diagnostic: drives the Story Book to Chapter 5 (index 4) via real
// clicks and measures the story area's exact overflow on both desktop
// viewports, plus the contributing metrics (line-height, gaps, separators).
// Usage: node scripts/measure-ch5.mjs [url]

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

const VIEWPORTS = [
  { width: 1440, height: 900, label: '1440×900' },
  { width: 1366, height: 768, label: '1366×768 (620px floor)' },
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--window-size=1440,900'] })
try {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage()
    await page.setViewport({ width: vp.width, height: vp.height })
    console.log(`\n=== ${vp.label} ===`)
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)

    // Drive to Chapter 5 (index 4): 4 real clicks with settle waits.
    for (let target = 1; target <= 4; target++) {
      const r = await page.evaluate(() => {
        const btn = document.getElementById('continue-story-button')
        const b = btn.getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
      })
      await page.mouse.click(r.x, r.y)
      await page.waitForFunction(
        (c) => document.querySelector('#story-book')?.dataset.chapter === String(c),
        { timeout: 8000 },
        target
      )
      await sleep(1400) // let the text stagger reveal settle
    }

    const m = await page.evaluate(() => {
      const area = document.querySelector('[data-story-area]')
      const lines = [...area.querySelectorAll('p.story-line')]
      const blanks = [...area.querySelectorAll('div[aria-hidden="true"]')]
      const stage = area.closest('.rounded-lg')
      const rightInner = area.closest('[class*="px-5"]')
      const buttons = document.querySelector('#continue-story-button')
      const btnRow = buttons.closest('div.flex')
      const cs = (el) => (el ? getComputedStyle(el) : null)
      return {
        area: { clientHeight: area.clientHeight, scrollHeight: area.scrollHeight, overflow: area.scrollHeight - area.clientHeight },
        lines: lines.length,
        blanks: blanks.length,
        lineHeightPx: cs(lines[0])?.lineHeight,
        fontSizePx: cs(lines[0])?.fontSize,
        lineMargin: cs(lines[0])?.marginTop,
        blankHeightPx: blanks[0] ? blanks[0].getBoundingClientRect().height : null,
        stageHeight: stage ? stage.getBoundingClientRect().height : null,
        rightInnerHeight: rightInner ? rightInner.getBoundingClientRect().height : null,
        btnRowHeight: btnRow ? btnRow.getBoundingClientRect().height : null,
        titleHeight: area.previousElementSibling?.previousElementSibling
          ? area.previousElementSibling.previousElementSibling.getBoundingClientRect().height
          : null,
      }
    })
    console.log(JSON.stringify(m, null, 2))
    await page.close()
  }
} catch (err) {
  console.error('✖', err.message)
  process.exitCode = 1
} finally {
  await browser.close()
}
