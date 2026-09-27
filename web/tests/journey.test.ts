import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  chapterSize,
  duelNumber,
  equippedGear,
  isComplete,
  journeyRank,
  markSeen,
  newJourney,
  nextFoe,
  parseJourney,
  pendingScenes,
  recordDuel,
  toggleGear,
  type Journey
} from '../src/game/journey.ts'
import { STORY, sceneById } from '../src/game/story.ts'
import { GEAR } from '../src/game/gear.ts'
import { RANKS } from '../src/rankTier.ts'

function winUntilComplete(): { journey: Journey; duels: number } {
  let journey = newJourney()
  let duels = 0
  while (!isComplete(journey)) {
    journey = recordDuel(journey, 'vitoria').journey
    duels++
  }
  return { journey, duels }
}

test('uma jornada nova começa no Ferro, com a espada e sem cenas vistas', () => {
  const journey = newJourney()
  assert.equal(journeyRank(journey).level, 'Ferro')
  assert.deepEqual(equippedGear(journey), ['espada'])
  assert.deepEqual(pendingScenes(journey), ['prologo', 'capitulo-0'])
  assert.equal(nextFoe(journey).id, 'gosmo')
})

test('a patente vem de classifyHeroSwitch e sobe com as vitórias dos duelos', () => {
  let journey = newJourney()
  journey = recordDuel(journey, 'vitoria').journey
  assert.equal(journey.wins, 5)
  const report = recordDuel(journey, 'vitoria')
  assert.equal(report.journey.wins, 10)
  assert.equal(report.rankBefore, 0)
  assert.equal(report.rankAfter, 1)
  assert.deepEqual(report.unlocked.map((item) => item.id), ['escudo'])
  assert.equal(journeyRank(report.journey).level, 'Bronze')
})

test('derrota soma derrotas, mexe no saldo e não derruba a patente', () => {
  const start: Journey = { ...newJourney(), wins: 22 }
  const report = recordDuel(start, 'derrota')
  assert.equal(report.journey.losses, 10)
  assert.equal(report.journey.duelsLost, 1)
  assert.equal(journeyRank(report.journey).balance, 12)
  assert.equal(report.rankAfter, report.rankBefore)
  assert.deepEqual(report.unlocked, [])
})

test('a história inteira cabe em 14 duelos vencidos, um capítulo por patente', () => {
  const { journey, duels } = winUntilComplete()
  assert.equal(duels, 14)
  assert.equal(journeyRank(journey).level, 'Imortal')
  assert.deepEqual(equippedGear(journey), GEAR.map((item) => item.id))
})

test('cada capítulo tem o tamanho certo e numera os duelos', () => {
  assert.deepEqual(RANKS.map((_, index) => chapterSize(index)), [2, 2, 3, 3, 2, 2, null])
  const prata: Journey = { ...newJourney(), wins: 22 }
  assert.equal(duelNumber(prata), 1)
  assert.equal(duelNumber({ ...prata, wins: 32 }), 2)
  assert.equal(duelNumber({ ...prata, wins: 42 }), 3)
})

test('o Lendário termina contra o Rei Corvo depois da Sentinela', () => {
  const lendario: Journey = { ...newJourney(), wins: 92 }
  assert.equal(nextFoe(lendario).id, 'sentinela')
  assert.equal(nextFoe({ ...lendario, wins: 97 }).id, 'reiCorvo')
})

test('no Imortal os desafios giram por todos os inimigos, mais fortes', () => {
  const imortal: Journey = { ...newJourney(), wins: 102 }
  const first = nextFoe(imortal)
  const second = nextFoe({ ...imortal, duelsWon: 1 })
  assert.notEqual(first.id, second.id)
  assert.ok(first.maxHp > 42)
})

test('equipamentos podem ser guardados e voltam a ser usados', () => {
  const journey: Journey = { ...newJourney(), wins: 30 }
  assert.deepEqual(equippedGear(journey), ['espada', 'escudo', 'elmo'])
  const stored = toggleGear(journey, 'escudo')
  assert.deepEqual(equippedGear(stored), ['espada', 'elmo'])
  assert.deepEqual(equippedGear(toggleGear(stored, 'escudo')), ['espada', 'escudo', 'elmo'])
  assert.equal(toggleGear(journey, 'coroa'), journey)
})

test('só a cena do capítulo atual fica pendente depois de subir', () => {
  let journey = markSeen(markSeen(newJourney(), 'prologo'), 'capitulo-0')
  assert.deepEqual(pendingScenes(journey), [])
  journey = { ...journey, wins: 55 }
  assert.deepEqual(pendingScenes(journey), ['capitulo-3'])
})

test('toda patente tem uma cena e a história começa pelo prólogo', () => {
  assert.equal(STORY[0].id, 'prologo')
  RANKS.forEach((_, index) => assert.ok(sceneById(`capitulo-${index}`).lines.length >= 2))
})

test('parseJourney aceita um save válido e rejeita lixo', () => {
  const saved = JSON.stringify({ wins: 12, losses: 3, duelsWon: 2, duelsLost: 1, stored: ['escudo', 'foo'], scenesSeen: ['prologo', 'x'] })
  assert.deepEqual(parseJourney(saved), { wins: 12, losses: 3, duelsWon: 2, duelsLost: 1, stored: ['escudo'], scenesSeen: ['prologo'] })
  assert.equal(parseJourney(null), null)
  assert.equal(parseJourney('{'), null)
  assert.equal(parseJourney(JSON.stringify({ wins: -1, losses: 0 })), null)
})
