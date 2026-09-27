import type { Difficulty, Foe } from './foes.ts'
import type { HeroStats } from './gear.ts'

export type Grade = 'perfeito' | 'bom' | 'errou'
export type Turn = 'ataque' | 'defesa' | 'vitoria' | 'derrota'

export const PERFECT_SHARE = 0.22
export const ATTACK_CENTER = 0.5
export const BLOCK_CENTER = 0.82
export const MAX_ATTACK_SWEEPS = 3

export interface Fighter {
  hp: number
  maxHp: number
}

export interface Duel {
  hero: Fighter
  foe: Fighter
  foeAttack: number
  turn: Turn
  exchanges: number
  perfects: number
}

export interface Exchange {
  duel: Duel
  grade: Grade
  damage: number
  healed: number
}

export interface Timing {
  sweepsPerSecond: number
  zoneWidth: number
  strikeSeconds: number
}

export function timingFor(difficulty: Difficulty, stats: HeroStats): Timing {
  return {
    sweepsPerSecond: difficulty.sweepsPerSecond * (1 - stats.calm),
    zoneWidth: Math.min(0.6, difficulty.zoneWidth + stats.aim),
    strikeSeconds: difficulty.strikeSeconds * (1 + stats.calm)
  }
}

export function pingPong(elapsedSeconds: number, sweepsPerSecond: number): number {
  const travelled = (Math.max(0, elapsedSeconds) * sweepsPerSecond) % 2
  return travelled <= 1 ? travelled : 2 - travelled
}

export function sweep(elapsedSeconds: number, durationSeconds: number): number {
  return Math.min(1, Math.max(0, elapsedSeconds / durationSeconds))
}

export function attackTimedOut(elapsedSeconds: number, sweepsPerSecond: number): boolean {
  return elapsedSeconds * sweepsPerSecond >= MAX_ATTACK_SWEEPS * 2
}

export function gradeTiming(position: number, center: number, zoneWidth: number): Grade {
  const distance = Math.abs(position - center)
  if (distance <= (zoneWidth * PERFECT_SHARE) / 2) return 'perfeito'
  if (distance <= zoneWidth / 2) return 'bom'
  return 'errou'
}

export function startDuel(foe: Foe, stats: HeroStats): Duel {
  return {
    hero: { hp: stats.maxHp, maxHp: stats.maxHp },
    foe: { hp: foe.maxHp, maxHp: foe.maxHp },
    foeAttack: foe.attack,
    turn: 'ataque',
    exchanges: 0,
    perfects: 0
  }
}

export function strikeDamage(grade: Grade, stats: HeroStats): number {
  if (grade === 'perfeito') return stats.attack * 2
  if (grade === 'bom') return stats.attack
  return 0
}

export function blockDamage(grade: Grade, foeAttack: number, stats: HeroStats): number {
  if (grade === 'perfeito') return 0
  const incoming = grade === 'bom' ? Math.ceil(foeAttack / 2) : foeAttack
  return Math.max(1, incoming - stats.defense)
}

export function resolveAttack(duel: Duel, grade: Grade, stats: HeroStats): Exchange {
  if (duel.turn !== 'ataque') return { duel, grade, damage: 0, healed: 0 }
  const damage = Math.min(duel.foe.hp, strikeDamage(grade, stats))
  const healed = grade === 'perfeito' ? Math.min(stats.perfectHeal, duel.hero.maxHp - duel.hero.hp) : 0
  const foeHp = duel.foe.hp - damage
  return {
    grade,
    damage,
    healed,
    duel: {
      ...duel,
      hero: { ...duel.hero, hp: duel.hero.hp + healed },
      foe: { ...duel.foe, hp: foeHp },
      turn: foeHp === 0 ? 'vitoria' : 'defesa',
      perfects: duel.perfects + (grade === 'perfeito' ? 1 : 0)
    }
  }
}

export function resolveDefense(duel: Duel, grade: Grade, stats: HeroStats): Exchange {
  if (duel.turn !== 'defesa') return { duel, grade, damage: 0, healed: 0 }
  const damage = Math.min(duel.hero.hp, blockDamage(grade, duel.foeAttack, stats))
  const heroHp = duel.hero.hp - damage
  return {
    grade,
    damage,
    healed: 0,
    duel: {
      ...duel,
      hero: { ...duel.hero, hp: heroHp },
      turn: heroHp === 0 ? 'derrota' : 'ataque',
      exchanges: duel.exchanges + 1,
      perfects: duel.perfects + (grade === 'perfeito' ? 1 : 0)
    }
  }
}

export function isOver(duel: Duel): boolean {
  return duel.turn === 'vitoria' || duel.turn === 'derrota'
}
