import { classifyHeroSwitch } from '../../desafioRanked.js'

export interface RankInfo {
  name: string
  min: number
  color: string
  glow: string
}

export const RANKS: RankInfo[] = [
  { name: 'Ferro', min: 0, color: '#9aa0a6', glow: '#c7ccd1' },
  { name: 'Bronze', min: 10, color: '#c3793f', glow: '#e6a86a' },
  { name: 'Prata', min: 21, color: '#cdd6df', glow: '#f2f6f9' },
  { name: 'Ouro', min: 51, color: '#f0b90b', glow: '#ffd966' },
  { name: 'Diamante', min: 81, color: '#5fd8e6', glow: '#a8f0f7' },
  { name: 'Lendário', min: 91, color: '#b083f0', glow: '#ddc4ff' },
  { name: 'Imortal', min: 101, color: '#ff5470', glow: '#ffb1c1' }
]

export interface RankProgress {
  balance: number
  level: string
  rankIndex: number
  winsToNext: number | null
  nextRankName: string | null
}

export function evaluateRank(wins: number, losses: number): RankProgress {
  const { balance, level } = classifyHeroSwitch(wins, losses)
  const rankIndex = RANKS.findIndex((rank) => rank.name === level)
  const next = RANKS[rankIndex + 1]
  return {
    balance,
    level,
    rankIndex: rankIndex === -1 ? 0 : rankIndex,
    winsToNext: next ? Math.max(next.min - wins, 0) : null,
    nextRankName: next ? next.name : null
  }
}
