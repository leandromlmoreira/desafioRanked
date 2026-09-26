import type { RankProgress } from '../rankTier'

const ARRIVAL_LINES = [
  'Todo herói começa no Ferro. A fogueira é quentinha e a trilha te espera.',
  'Bronze! Os aldeões já comentam seu nome na praça.',
  'Prata! Daqui de cima já dá para ver a vila inteira.',
  'Ouro! O vento da montanha sopra a seu favor.',
  'Diamante! Pouca gente chega tão alto.',
  'Lendário! As estrelas parecem logo ali.',
  'Imortal! O templo do topo é todo seu. Descanse, campeão.'
]

const CHEERS = ['Boa!', 'Mandou bem!', 'Isso aí!', 'Mais um degrau!']

export function pluralWins(count: number): string {
  return `${count} vitória${count === 1 ? '' : 's'}`
}

export function formatBalance(balance: number): string {
  if (balance > 0) return `+${balance}`
  if (balance < 0) return `−${Math.abs(balance)}`
  return '0'
}

export function remainingLine(progress: RankProgress): string {
  if (progress.winsToNext === null) return 'Você está no topo da montanha.'
  return `Faltam ${pluralWins(progress.winsToNext)} para ${progress.nextRankName}!`
}

export type ChangeKind = 'intro' | 'rankUp' | 'rankDown' | 'win' | 'loss' | 'lossUndo' | 'winUndo'

export function composeMessage(kind: ChangeKind, progress: RankProgress, wins: number): string {
  const remaining = remainingLine(progress)
  switch (kind) {
    case 'intro':
      return wins === 0
        ? 'Bem-vindo à Trilha das Patentes! Cada vitória te leva um passo montanha acima.'
        : `Que bom te ver de volta! Você segue na patente ${progress.level}. ${remaining}`
    case 'rankUp':
      return `${ARRIVAL_LINES[progress.rankIndex]} ${progress.winsToNext === null ? '' : remaining}`.trim()
    case 'rankDown':
      return `Ih, você desceu para ${progress.level}. Respira fundo: ${remaining.toLowerCase()}`
    case 'win':
      return `${CHEERS[wins % CHEERS.length]} ${remaining}`
    case 'loss':
      return `Derrota anotada. Saldo em ${formatBalance(progress.balance)}, mas a patente só olha as vitórias. ${remaining}`
    case 'lossUndo':
      return `Derrota apagada do diário. Saldo em ${formatBalance(progress.balance)}.`
    case 'winUndo':
      return `Vitória removida. ${remaining}`
  }
}
