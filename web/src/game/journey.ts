import { evaluateRank, RANKS, type RankProgress } from '../rankTier.ts'
import { CHAPTER_FOES, FOES, scaledFoe, type Foe } from './foes.ts'
import { GEAR, unlockedGear, type GearId, type GearItem } from './gear.ts'

export type Outcome = 'vitoria' | 'derrota'
export type SceneId = 'prologo' | `capitulo-${number}`

export const WINS_PER_DUEL = [5, 6, 10, 10, 5, 5, 5]
export const MAX_COUNT = 9999

export interface Journey {
  wins: number
  losses: number
  duelsWon: number
  duelsLost: number
  stored: GearId[]
  scenesSeen: SceneId[]
}

export interface DuelReport {
  journey: Journey
  outcome: Outcome
  amount: number
  rankBefore: number
  rankAfter: number
  unlocked: GearItem[]
}

export function newJourney(): Journey {
  return { wins: 0, losses: 0, duelsWon: 0, duelsLost: 0, stored: [], scenesSeen: [] }
}

export function journeyRank(journey: Journey): RankProgress {
  return evaluateRank(journey.wins, journey.losses)
}

export function rewardFor(rankIndex: number): number {
  return WINS_PER_DUEL[Math.min(WINS_PER_DUEL.length - 1, Math.max(0, rankIndex))]
}

export function chapterSize(rankIndex: number): number | null {
  const next = RANKS[rankIndex + 1]
  if (!next) return null
  return Math.ceil((next.min - RANKS[rankIndex].min) / rewardFor(rankIndex))
}

export function duelNumber(journey: Journey): number {
  const progress = journeyRank(journey)
  const size = chapterSize(progress.rankIndex)
  if (size === null || progress.winsToNext === null) return journey.duelsWon + 1
  const remaining = Math.ceil(progress.winsToNext / rewardFor(progress.rankIndex))
  return Math.min(size, Math.max(1, size - remaining + 1))
}

export function nextFoe(journey: Journey): Foe {
  const { rankIndex } = journeyRank(journey)
  const roster = CHAPTER_FOES[rankIndex]
  const size = chapterSize(rankIndex)
  const slot = size === null ? journey.duelsWon % roster.length : Math.min(roster.length - 1, duelNumber(journey) - 1)
  return scaledFoe(FOES[roster[slot]], rankIndex)
}

export function recordDuel(journey: Journey, outcome: Outcome): DuelReport {
  const rankBefore = journeyRank(journey).rankIndex
  const amount = rewardFor(rankBefore)
  const next: Journey =
    outcome === 'vitoria'
      ? { ...journey, wins: Math.min(MAX_COUNT, journey.wins + amount), duelsWon: journey.duelsWon + 1 }
      : { ...journey, losses: Math.min(MAX_COUNT, journey.losses + amount), duelsLost: journey.duelsLost + 1 }
  const rankAfter = journeyRank(next).rankIndex
  const unlocked = GEAR.filter((item) => item.rankIndex > rankBefore && item.rankIndex <= rankAfter)
  return { journey: next, outcome, amount, rankBefore, rankAfter, unlocked }
}

export function isUnlocked(journey: Journey, id: GearId): boolean {
  return unlockedGear(journeyRank(journey).rankIndex).some((item) => item.id === id)
}

export function equippedGear(journey: Journey): GearId[] {
  return unlockedGear(journeyRank(journey).rankIndex)
    .map((item) => item.id)
    .filter((id) => !journey.stored.includes(id))
}

export function toggleGear(journey: Journey, id: GearId): Journey {
  if (!isUnlocked(journey, id)) return journey
  const stored = journey.stored.includes(id) ? journey.stored.filter((item) => item !== id) : [...journey.stored, id]
  return { ...journey, stored }
}

export function chapterScene(rankIndex: number): SceneId {
  return `capitulo-${rankIndex}`
}

export function pendingScenes(journey: Journey): SceneId[] {
  const { rankIndex } = journeyRank(journey)
  const due: SceneId[] = ['prologo', ...RANKS.slice(0, rankIndex + 1).map((_, index) => chapterScene(index))]
  const unseen = due.filter((scene) => !journey.scenesSeen.includes(scene))
  const latestChapter = chapterScene(rankIndex)
  return unseen.filter((scene) => scene === 'prologo' || scene === latestChapter)
}

export function markSeen(journey: Journey, scene: SceneId): Journey {
  if (journey.scenesSeen.includes(scene)) return journey
  return { ...journey, scenesSeen: [...journey.scenesSeen, scene] }
}

export function isComplete(journey: Journey): boolean {
  return journeyRank(journey).rankIndex === RANKS.length - 1
}

function count(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? Math.min(value, MAX_COUNT) : null
}

function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && /^(prologo|capitulo-[0-6])$/.test(value)
}

function isGearId(value: unknown): value is GearId {
  return GEAR.some((item) => item.id === value)
}

export function parseJourney(raw: string | null): Journey | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    const wins = count(data?.wins)
    const losses = count(data?.losses)
    if (wins === null || losses === null) return null
    return {
      wins,
      losses,
      duelsWon: count(data.duelsWon) ?? 0,
      duelsLost: count(data.duelsLost) ?? 0,
      stored: Array.isArray(data.stored) ? data.stored.filter(isGearId) : [],
      scenesSeen: Array.isArray(data.scenesSeen) ? data.scenesSeen.filter(isSceneId) : []
    }
  } catch {
    return null
  }
}
