export type FoeId = 'gosmo' | 'uivo' | 'pedrusco' | 'plumaria' | 'lumen' | 'sentinela' | 'reiCorvo'

export interface Foe {
  id: FoeId
  name: string
  epithet: string
  maxHp: number
  attack: number
  taunt: string
}

export const FOES: Record<FoeId, Foe> = {
  gosmo: {
    id: 'gosmo',
    name: 'Gosmo',
    epithet: 'o lodo resmungão',
    maxHp: 80,
    attack: 6,
    taunt: 'Blurp! Ninguém passa pela minha poça sem pedir licença!'
  },
  uivo: {
    id: 'uivo',
    name: 'Uivo',
    epithet: 'o lobo da neblina',
    maxHp: 92,
    attack: 8,
    taunt: 'Auuu! Na neblina, quem enxerga sou eu.'
  },
  pedrusco: {
    id: 'pedrusco',
    name: 'Pedrusco',
    epithet: 'o golem de musgo',
    maxHp: 104,
    attack: 10,
    taunt: 'Eu... estava... dormindo. Agora... estou... bravo.'
  },
  plumaria: {
    id: 'plumaria',
    name: 'Plumária',
    epithet: 'a harpia dourada',
    maxHp: 116,
    attack: 12,
    taunt: 'O vento dourado é meu! Tente acompanhar minhas penas.'
  },
  lumen: {
    id: 'lumen',
    name: 'Lúmen',
    epithet: 'o espectro de cristal',
    maxHp: 126,
    attack: 13,
    taunt: 'Tudo aqui reflete. Até o seu medo.'
  },
  sentinela: {
    id: 'sentinela',
    name: 'Sentinela',
    epithet: 'a guarda das penas negras',
    maxHp: 132,
    attack: 14,
    taunt: 'Crá! O Rei não recebe visitas depois do pôr do sol.'
  },
  reiCorvo: {
    id: 'reiCorvo',
    name: 'Rei Corvo',
    epithet: 'senhor das noites compridas',
    maxHp: 160,
    attack: 14,
    taunt: 'A Chama do Topo é minha. Venha buscar, se tiver coragem.'
  }
}

export const CHAPTER_FOES: FoeId[][] = [
  ['gosmo'],
  ['uivo'],
  ['pedrusco'],
  ['plumaria'],
  ['lumen'],
  ['sentinela', 'reiCorvo'],
  ['gosmo', 'uivo', 'pedrusco', 'plumaria', 'lumen', 'sentinela', 'reiCorvo']
]

export const IMMORTAL_BOOST = 1.25

export interface Difficulty {
  sweepsPerSecond: number
  zoneWidth: number
  strikeSeconds: number
}

export function difficultyFor(rankIndex: number): Difficulty {
  const tier = Math.min(6, Math.max(0, rankIndex))
  return {
    sweepsPerSecond: round(0.62 + tier * 0.11),
    zoneWidth: round(0.34 - tier * 0.028),
    strikeSeconds: round(1.35 - tier * 0.08)
  }
}

export function scaledFoe(foe: Foe, rankIndex: number): Foe {
  if (rankIndex < 6) return foe
  return { ...foe, maxHp: Math.round(foe.maxHp * IMMORTAL_BOOST), attack: Math.round(foe.attack * IMMORTAL_BOOST) }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
