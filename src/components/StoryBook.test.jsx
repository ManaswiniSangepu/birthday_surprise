// StoryBook.test.jsx
// Regression tests for the clean chapter system: the book renders
// chapters[chapterIndex] (image, title, story), "Continue Our Story"
// advances the index via a page-turn, "← Previous" turns back, and the final
// chapter finishes via "❤️ Continue To Our Memories".

// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import StoryBook from './StoryBook.jsx'
import FinalEnding from './FinalEnding.jsx'
import { chapters as REAL_CHAPTERS } from '../data/storyData.js'

// jsdom lacks window.matchMedia — stub a "desktop viewport".
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }
})

const MOCK_CHAPTERS = [
  { id: 'c1', image: 'c1.png', title: '🌸 The Day I First Saw You ❤️', story: ['First line.'] },
  { id: 'c2', image: 'c2.png', title: '📞 One Call Changed Everything ❤️', story: ['Second line.'] },
  { id: 'c3', image: 'c3.png', title: '🤝 The Comfort I Never Knew I Needed ❤️', story: ['Third line.'] },
]

// chapterIndex (state) is mirrored on the book root as data-chapter.
const bookChapter = () => document.querySelector('#story-book')?.dataset.chapter

describe('StoryBook chapter navigation', () => {
  beforeEach(() => cleanup())

  it('renders chapters[0] (image, title, story) on first load with Previous hidden', () => {
    render(<StoryBook chapters={MOCK_CHAPTERS} onFinish={() => {}} />)
    expect(bookChapter()).toBe('0')
    expect(screen.getByText('🌸 The Day I First Saw You ❤️')).toBeTruthy()
    expect(screen.getByText('First line.')).toBeTruthy()
    expect(screen.getByAltText('🌸 The Day I First Saw You ❤️')).toBeTruthy()
    // Part 1: Previous is hidden on the first chapter (chapterIndex === 0).
    expect(screen.queryByText('← Previous')).toBeNull()
  })

  it('Continue advances Chapter 1 -> Chapter 2 and swaps image, title and story', async () => {
    render(<StoryBook chapters={MOCK_CHAPTERS} onFinish={() => {}} />)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(screen.getByText('📞 One Call Changed Everything ❤️')).toBeTruthy()
        expect(screen.getByText('Second line.')).toBeTruthy()
        expect(screen.getByAltText('📞 One Call Changed Everything ❤️')).toBeTruthy()
        expect(screen.queryByAltText('🌸 The Day I First Saw You ❤️')).toBeNull()
        // Previous now appears (not the first chapter anymore).
        expect(screen.getByText('← Previous')).toBeTruthy()
      },
      { timeout: 5000 }
    )
  })

  it('Previous turns back from Chapter 2 to Chapter 1 and hides itself again', async () => {
    render(<StoryBook chapters={MOCK_CHAPTERS} onFinish={() => {}} />)
    // Advance 0 -> 1
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(() => expect(bookChapter()).toBe('1'), { timeout: 5000 })
    expect(screen.getByText('📞 One Call Changed Everything ❤️')).toBeTruthy()

    // Turn back 1 -> 0
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(screen.getByText('🌸 The Day I First Saw You ❤️')).toBeTruthy()
        expect(screen.getByText('First line.')).toBeTruthy()
        // Previous hides itself again on chapter 1 (index 0).
        expect(screen.queryByText('← Previous')).toBeNull()
      },
      { timeout: 5000 }
    )
  })

  it('final chapter: button becomes "❤️ Continue To Our Memories" and calls onFinish', async () => {
    const onFinish = vi.fn()
    render(<StoryBook chapters={MOCK_CHAPTERS} onFinish={onFinish} />)
    // Advance 0 -> 1 -> 2 (the last chapter)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(() => expect(bookChapter()).toBe('1'), { timeout: 5000 })
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(() => expect(bookChapter()).toBe('2'), { timeout: 5000 })
    expect(screen.getByText('🤝 The Comfort I Never Knew I Needed ❤️')).toBeTruthy()
    expect(screen.getByText('Third line.')).toBeTruthy()
    expect(screen.getByText('❤️ Continue To Our Memories')).toBeTruthy()
    fireEvent.click(screen.getByText('❤️ Continue To Our Memories'))
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('shows the glowing star field only for chapters flagged stars', async () => {
    const STAR_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['One.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Two.'], stars: true },
    ]
    render(<StoryBook chapters={STAR_CHAPTERS} onFinish={() => {}} />)
    // Chapter 1 is not flagged — no stars.
    expect(document.querySelectorAll('.story-star').length).toBe(0)
    // Advance to Chapter 2 (stars: true) — the star field appears.
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(document.querySelectorAll('.story-star').length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    // Turn back to Chapter 1 — stars disappear.
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(document.querySelectorAll('.story-star').length).toBe(0)
      },
      { timeout: 5000 }
    )
  })

  it('shows the falling autumn leaves only for chapters flagged leaves', async () => {
    const LEAF_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['One.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Two.'], leaves: true },
    ]
    render(<StoryBook chapters={LEAF_CHAPTERS} onFinish={() => {}} />)
    expect(document.querySelectorAll('.story-leaf').length).toBe(0)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(document.querySelectorAll('.story-leaf').length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(document.querySelectorAll('.story-leaf').length).toBe(0)
      },
      { timeout: 5000 }
    )
  })

  it('shows the drifting golden dust only for chapters flagged dust', async () => {
    const DUST_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['One.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Two.'], dust: true },
    ]
    render(<StoryBook chapters={DUST_CHAPTERS} onFinish={() => {}} />)
    expect(document.querySelectorAll('.story-dust').length).toBe(0)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(document.querySelectorAll('.story-dust').length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(document.querySelectorAll('.story-dust').length).toBe(0)
      },
      { timeout: 5000 }
    )
  })

  it('shows the blinking fireflies only for chapters flagged fireflies', async () => {
    const FIREFLY_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['One.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Two.'], fireflies: true },
    ]
    render(<StoryBook chapters={FIREFLY_CHAPTERS} onFinish={() => {}} />)
    expect(document.querySelectorAll('.story-firefly').length).toBe(0)
    expect(document.querySelectorAll('.street-light').length).toBe(0)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(document.querySelectorAll('.story-firefly').length).toBeGreaterThan(0)
        expect(document.querySelectorAll('.street-light').length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(document.querySelectorAll('.story-firefly').length).toBe(0)
        expect(document.querySelectorAll('.street-light').length).toBe(0)
      },
      { timeout: 5000 }
    )
  })

  it('shows the twinkling fairy lights only for chapters flagged fairyLights', async () => {
    const FAIRY_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['One.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Two.'], fairyLights: true },
    ]
    render(<StoryBook chapters={FAIRY_CHAPTERS} onFinish={() => {}} />)
    expect(document.querySelectorAll('.story-fairy-light').length).toBe(0)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(document.querySelectorAll('.story-fairy-light').length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    fireEvent.click(screen.getByText('← Previous'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('0')
        expect(document.querySelectorAll('.story-fairy-light').length).toBe(0)
      },
      { timeout: 5000 }
    )
  })

  it('renders compact story text only for chapters flagged compact', async () => {
    const COMPACT_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['Normal line.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Compact line.'], compact: true },
    ]
    render(<StoryBook chapters={COMPACT_CHAPTERS} onFinish={() => {}} />)
    // Chapter 1 uses the normal, larger story styling.
    expect(screen.getByText('Normal line.').className).toContain('sm:text-base')
    // Advance to Chapter 2 (compact: true) — smaller font, no sm:text-base.
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        const line = screen.getByText('Compact line.')
        expect(line.className).toContain('text-xs')
        expect(line.className).not.toContain('sm:text-base')
      },
      { timeout: 5000 }
    )
  })

  it('renders the smallest-readable (tiny) text only for chapters flagged tiny', async () => {
    const TINY_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['Normal line.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Tiny line.'], tiny: true },
    ]
    render(<StoryBook chapters={TINY_CHAPTERS} onFinish={() => {}} />)
    // Chapter 1 uses the normal, larger story styling.
    expect(screen.getByText('Normal line.').className).toContain('sm:text-base')
    // Advance to Chapter 2 (tiny: true) — smallest readable font, no sm:text-base.
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        const line = screen.getByText('Tiny line.')
        expect(line.className).toContain('text-[11px]')
        expect(line.className).not.toContain('sm:text-base')
      },
      { timeout: 5000 }
    )
  })

  it('reports the active chapter through onChapterChange', async () => {
    const cb = vi.fn()
    render(<StoryBook chapters={MOCK_CHAPTERS} onFinish={() => {}} onChapterChange={cb} />)
    // Fires with the initial chapter when the book mounts.
    expect(cb).toHaveBeenCalledWith(0)
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        expect(cb).toHaveBeenCalledWith(1)
      },
      { timeout: 5000 }
    )
  })

  it('slows the line reveal for chapters flagged revealStep', async () => {
    const SLOW_CHAPTERS = [
      { id: 'c1', image: 'c1.png', title: 'Ch 1', story: ['Normal line.'] },
      { id: 'c2', image: 'c2.png', title: 'Ch 2', story: ['Slow line.'], revealStep: 0.22 },
    ]
    render(<StoryBook chapters={SLOW_CHAPTERS} onFinish={() => {}} />)
    // Default reveal step: line 0 starts at 1.15s + 2 × 0.12s.
    expect(screen.getByText('Normal line.').style.animationDelay).toBe('1.39s')
    fireEvent.click(screen.getByText('❤️ Continue Our Story'))
    await waitFor(
      () => {
        expect(bookChapter()).toBe('1')
        // Slower step: line 0 starts at 1.15s + 2 × 0.22s.
        expect(screen.getByText('Slow line.').style.animationDelay).toBe('1.59s')
      },
      { timeout: 5000 }
    )
  })
})

describe('storyData.js — the real source of truth', () => {
  it('contains all twenty chapters with id, image, title and story', () => {
    expect(REAL_CHAPTERS).toHaveLength(20)
    expect(REAL_CHAPTERS[0]).toMatchObject({
      id: 'the-day-i-first-saw-you',
      title: '🌸 The Day I First Saw You ❤️',
    })
    expect(REAL_CHAPTERS[1]).toMatchObject({
      id: 'one-call-changed-everything',
      title: '📞 One Call Changed Everything ❤️',
    })
    expect(REAL_CHAPTERS[2]).toMatchObject({
      id: 'the-comfort-i-never-knew-i-needed',
      title: '🤝 The Comfort I Never Knew I Needed ❤️',
    })
    expect(REAL_CHAPTERS[3]).toMatchObject({
      id: 'when-i-realized-you-had-become-my-home',
      title: '🪁 When I Realized You Had Become My Home ❤️',
    })
    expect(REAL_CHAPTERS[4]).toMatchObject({
      id: 'the-message-that-stopped-my-heart',
      title: '💌 The Message That Stopped My Heart ❤️',
    })
    expect(REAL_CHAPTERS[5]).toMatchObject({
      id: 'the-night-our-hearts-finally-spoke',
      title: '🌙 The Night Our Hearts Finally Spoke ❤️',
      stars: true,
    })
    expect(REAL_CHAPTERS[6]).toMatchObject({
      id: 'when-love-chose-understanding',
      title: '🍂 When Love Chose Understanding ❤️',
      leaves: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[7]).toMatchObject({
      id: 'the-secret-glances-that-said-everything',
      title: '👀 The Secret Glances That Said Everything ❤️',
      golden: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[8]).toMatchObject({
      id: 'when-you-became-my-strength',
      title: '🤍 When You Became My Strength ❤️',
      dust: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[9]).toMatchObject({
      id: 'the-best-part-of-every-day',
      title: '🌙 The Best Part of Every Day ❤️',
      fireflies: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[10]).toMatchObject({
      id: 'in-every-crowd-i-felt-safe',
      title: '🫂 In Every Crowd, I Felt Safe ❤️',
      dust: true,
      tiny: true,
    })
    expect(REAL_CHAPTERS[11]).toMatchObject({
      id: 'our-first-ride',
      title: '🏍️ Our First Ride ❤️',
      dust: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[12]).toMatchObject({
      id: 'just-ten-minutes-yet-my-favorite-part-of-every-day',
      title: '✨ Just 10 Minutes... Yet My Favorite Part of Every Day ❤️',
      fireflies: true,
      dust: true,
      compact: true,
    })
    expect(REAL_CHAPTERS[13]).toMatchObject({
      id: 'made-with-love',
      title: '🍳 Made With Love ❤️',
      fairyLights: true,
      dust: true,
      tiny: true,
    })
    expect(REAL_CHAPTERS[14]).toMatchObject({
      id: 'my-calm-in-every-exam',
      title: '📖 My Calm in Every Exam ❤️',
      compact: true,
    })
    expect(REAL_CHAPTERS[15]).toMatchObject({
      id: 'love-in-the-little-things',
      title: '🍫 Love in the Little Things ❤️',
      tiny: true,
    })
    expect(REAL_CHAPTERS[16]).toMatchObject({
      id: 'the-goodbye-i-was-never-ready-for',
      title: '🚌 The Goodbye I Was Never Ready For ❤️',
    })
    expect(REAL_CHAPTERS[17]).toMatchObject({
      id: 'until-we-meet-again',
      title: '💐 Until We Meet Again ❤️',
      compact: true,
    })
    expect(REAL_CHAPTERS[18]).toMatchObject({
      id: 'a-new-beginning',
      title: '🎓 A New Beginning ❤️',
    })
    expect(REAL_CHAPTERS[19]).toMatchObject({
      id: 'ill-always-be-waiting-for-you',
      title: '❤️ I\'ll Always Be Waiting For You',
      revealStep: 0.22,
      compact: true,
    })
    for (const c of REAL_CHAPTERS) {
      expect(typeof c.image).toBe('string')
      expect(c.image.length).toBeGreaterThan(0)
      expect(Array.isArray(c.story)).toBe(true)
      expect(c.story.length).toBeGreaterThan(0)
    }
    // Exactly one stars chapter (Ch. 6), one leaves chapter (Ch. 7), one
    // golden-particles chapter (Ch. 8), five dust chapters (Ch. 9, 11, 12, 13,
    // 14), two fireflies chapters (Ch. 10, 13), one fairy-lights chapter
    // (Ch. 14), nine compact chapters (Ch. 7-10, 12, 13, 15, 18, 20) and three
    // tiny chapters (Ch. 11, 14, 16).
    expect(REAL_CHAPTERS.filter((c) => c.stars).map((c) => c.id)).toEqual([
      'the-night-our-hearts-finally-spoke',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.leaves).map((c) => c.id)).toEqual([
      'when-love-chose-understanding',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.golden).map((c) => c.id)).toEqual([
      'the-secret-glances-that-said-everything',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.dust).map((c) => c.id)).toEqual([
      'when-you-became-my-strength',
      'in-every-crowd-i-felt-safe',
      'our-first-ride',
      'just-ten-minutes-yet-my-favorite-part-of-every-day',
      'made-with-love',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.fairyLights).map((c) => c.id)).toEqual([
      'made-with-love',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.fireflies).map((c) => c.id)).toEqual([
      'the-best-part-of-every-day',
      'just-ten-minutes-yet-my-favorite-part-of-every-day',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.tiny).map((c) => c.id)).toEqual([
      'in-every-crowd-i-felt-safe',
      'made-with-love',
      'love-in-the-little-things',
    ])
    expect(REAL_CHAPTERS.filter((c) => c.compact).map((c) => c.id)).toEqual([
      'when-love-chose-understanding',
      'the-secret-glances-that-said-everything',
      'when-you-became-my-strength',
      'the-best-part-of-every-day',
      'our-first-ride',
      'just-ten-minutes-yet-my-favorite-part-of-every-day',
      'my-calm-in-every-exam',
      'until-we-meet-again',
      'ill-always-be-waiting-for-you',
    ])
    const images = new Set(REAL_CHAPTERS.map((c) => c.image))
    expect(images.size).toBe(20)
  })
})

describe('FinalEnding — the closing page', () => {
  beforeEach(() => cleanup())

  it('renders the closing message, italic subtitle and animated heart', () => {
    render(<FinalEnding />)
    expect(screen.getByText('The End?')).toBeTruthy()
    expect(screen.getByText('No...')).toBeTruthy()
    expect(screen.getByText('To Be Continued...')).toBeTruthy()
    expect(screen.getByText(/haven't been written yet/)).toBeTruthy()
    expect(screen.getByText('"Forever begins after this story."')).toBeTruthy()
    // The small animated heart at the bottom is present.
    expect(screen.getByTestId('ending-heart')).toBeTruthy()
    // No navigation buttons on the closing page.
    expect(screen.queryByText('← Previous')).toBeNull()
    expect(screen.queryByText('❤️ Continue Our Story')).toBeNull()
    expect(screen.queryByText('❤️ Continue To Our Memories')).toBeNull()
  })
})
