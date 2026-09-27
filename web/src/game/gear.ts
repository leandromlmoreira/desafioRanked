export type GearId = 'espada' | 'escudo' | 'elmo' | 'capa' | 'botas' | 'asas' | 'coroa'

export interface GearBonus {
  attack: number
  defense: number
  maxHp: number
  aim: number
  calm: number
  perfectHeal: number
}

export interface GearItem {
  id: GearId
  rankIndex: number
  name: string
  slot: string
  lore: string
  perk: string
  bonus: Partial<GearBonus>
}

export const GEAR: GearItem[] = [
  {
    id: 'espada',
    rankIndex: 0,
    name: 'Espada do Aprendiz',
    slot: 'Arma',
    lore: 'Presente da Mestra Coruja. Leve, honesta e sempre afiada.',
    perk: '+3 de ataque',
    bonus: { attack: 3 }
  },
  {
    id: 'escudo',
    rankIndex: 1,
    name: 'Escudo de Bronze',
    slot: 'Escudo',
    lore: 'Forjado na vila com o sino velho da praça. Ainda faz dim-dom.',
    perk: '+2 de defesa',
    bonus: { defense: 2 }
  },
  {
    id: 'elmo',
    rankIndex: 2,
    name: 'Elmo de Prata',
    slot: 'Cabeça',
    lore: 'Tem um penacho vermelho que ninguém sabe explicar. Combina com tudo.',
    perk: '+15 de vida',
    bonus: { maxHp: 15 }
  },
  {
    id: 'capa',
    rankIndex: 3,
    name: 'Capa Dourada',
    slot: 'Costas',
    lore: 'Tecida com o vento dourado do planalto. Mostra onde mirar.',
    perk: 'Alvo de acerto maior',
    bonus: { aim: 0.06 }
  },
  {
    id: 'botas',
    rankIndex: 4,
    name: 'Botas de Diamante',
    slot: 'Pés',
    lore: 'Pisam leve como neve. O tempo parece andar mais devagar.',
    perk: 'Ponteiro 15% mais lento',
    bonus: { calm: 0.15 }
  },
  {
    id: 'asas',
    rankIndex: 5,
    name: 'Asas Lendárias',
    slot: 'Costas',
    lore: 'Penas de estrela cadente. Cada golpe perfeito aquece o coração.',
    perk: 'Golpe perfeito cura 5',
    bonus: { perfectHeal: 5 }
  },
  {
    id: 'coroa',
    rankIndex: 6,
    name: 'Coroa Imortal',
    slot: 'Cabeça',
    lore: 'Brilha com a Chama do Topo. Pesa pouco, significa muito.',
    perk: '+3 de ataque e +10 de vida',
    bonus: { attack: 3, maxHp: 10 }
  }
]

export interface HeroStats {
  maxHp: number
  attack: number
  defense: number
  aim: number
  calm: number
  perfectHeal: number
}

export const BASE_STATS: HeroStats = { maxHp: 60, attack: 6, defense: 0, aim: 0, calm: 0, perfectHeal: 0 }

export function gearById(id: GearId): GearItem {
  const item = GEAR.find((gear) => gear.id === id)
  if (!item) throw new Error(`Equipamento desconhecido: ${id}`)
  return item
}

export function unlockedGear(rankIndex: number): GearItem[] {
  return GEAR.filter((item) => item.rankIndex <= rankIndex)
}

export function heroStats(equipped: GearId[]): HeroStats {
  return equipped.map(gearById).reduce<HeroStats>(
    (stats, item) => ({
      maxHp: stats.maxHp + (item.bonus.maxHp ?? 0),
      attack: stats.attack + (item.bonus.attack ?? 0),
      defense: stats.defense + (item.bonus.defense ?? 0),
      aim: stats.aim + (item.bonus.aim ?? 0),
      calm: stats.calm + (item.bonus.calm ?? 0),
      perfectHeal: stats.perfectHeal + (item.bonus.perfectHeal ?? 0)
    }),
    { ...BASE_STATS }
  )
}
