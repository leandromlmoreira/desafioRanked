import { classifyHeroSwitch } from '../../desafioRanked.js'

export interface RankInfo {
  name: string
  min: number
  color: string
  glow: string
}

export const RANKS: RankInfo[] = [
  { name: 'Ferro', min: 0, color: '#9aa0a6', glow: '#d4d9de' },
  { name: 'Bronze', min: 10, color: '#c3793f', glow: '#f0b27a' },
  { name: 'Prata', min: 21, color: '#b8c4d2', glow: '#f2f6f9' },
  { name: 'Ouro', min: 51, color: '#f0b90b', glow: '#ffe07a' },
  { name: 'Diamante', min: 81, color: '#45c6dc', glow: '#b5f4ff' },
  { name: 'Lendário', min: 91, color: '#9b6bf0', glow: '#dcc6ff' },
  { name: 'Imortal', min: 101, color: '#e8435e', glow: '#ffb1c1' }
]

export interface RankProgress {
  balance: number
  level: string
  rankIndex: number
  winsToNext: number | null
  nextRankName: string | null
  fractionToNext: number
}

export function rankRangeLabel(index: number): string {
  const next = RANKS[index + 1]
  return next ? `${RANKS[index].min}–${next.min - 1}` : `${RANKS[index].min}+`
}

export function evaluateRank(wins: number, losses: number): RankProgress {
  const { balance, level } = classifyHeroSwitch(wins, losses)
  const found = RANKS.findIndex((rank) => rank.name === level)
  const rankIndex = found === -1 ? 0 : found
  const current = RANKS[rankIndex]
  const next = RANKS[rankIndex + 1]
  return {
    balance,
    level,
    rankIndex,
    winsToNext: next ? Math.max(next.min - wins, 0) : null,
    nextRankName: next ? next.name : null,
    fractionToNext: next ? Math.min(1, Math.max(0, (wins - current.min) / (next.min - current.min))) : 1
  }
}
