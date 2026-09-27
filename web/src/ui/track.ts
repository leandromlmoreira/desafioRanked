import { RANKS, type RankProgress } from '../rankTier'

const SEGMENTS = 12

export function buildTrack(track: HTMLElement): void {
  track.innerHTML = Array.from({ length: SEGMENTS }, () => '<span class="segment"></span>').join('')
}

export function paintTrack(track: HTMLElement, progress: RankProgress): void {
  const rank = RANKS[progress.rankIndex]
  const filled = Math.round(progress.fractionToNext * SEGMENTS)
  track.style.setProperty('--rank-color', rank.color)
  track.style.setProperty('--rank-glow', rank.glow)
  track.querySelectorAll('.segment').forEach((segment, index) => segment.classList.toggle('is-filled', index < filled))
  track.setAttribute('aria-valuenow', String(Math.round(progress.fractionToNext * 100)))
}
