import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  attackTimedOut,
  blockDamage,
  gradeTiming,
  pingPong,
  resolveAttack,
  resolveDefense,
  startDuel,
  strikeDamage,
  sweep,
  timingFor,
  type Duel,
  type Grade
} from '../src/game/combat.ts'
import { difficultyFor, FOES } from '../src/game/foes.ts'
import { BASE_STATS, heroStats } from '../src/game/gear.ts'

test('pingPong vai de 0 a 1 e volta sem sair da faixa', () => {
  assert.equal(pingPong(0, 1), 0)
  assert.equal(pingPong(0.5, 1), 0.5)
  assert.equal(pingPong(1, 1), 1)
  assert.equal(pingPong(1.5, 1), 0.5)
  assert.equal(pingPong(2, 1), 0)
  for (let t = 0; t < 10; t += 0.137) {
    const value = pingPong(t, 0.9)
    assert.ok(value >= 0 && value <= 1)
  }
})

test('sweep avança linearmente e trava em 1', () => {
  assert.equal(sweep(0, 2), 0)
  assert.equal(sweep(1, 2), 0.5)
  assert.equal(sweep(5, 2), 1)
})

test('gradeTiming separa perfeito, bom e errou pela distância do centro', () => {
  assert.equal(gradeTiming(0.5, 0.5, 0.3), 'perfeito')
  assert.equal(gradeTiming(0.53, 0.5, 0.3), 'perfeito')
  assert.equal(gradeTiming(0.6, 0.5, 0.3), 'bom')
  assert.equal(gradeTiming(0.4, 0.5, 0.3), 'bom')
  assert.equal(gradeTiming(0.7, 0.5, 0.3), 'errou')
})

test('ataque perfeito dobra o dano e bom causa o ataque base', () => {
  const stats = heroStats(['espada'])
  assert.equal(strikeDamage('perfeito', stats), 18)
  assert.equal(strikeDamage('bom', stats), 9)
  assert.equal(strikeDamage('errou', stats), 0)
})

test('bloqueio perfeito zera o dano e a defesa reduz até no mínimo 1', () => {
  const armored = heroStats(['escudo'])
  assert.equal(blockDamage('perfeito', 12, armored), 0)
  assert.equal(blockDamage('bom', 12, armored), 4)
  assert.equal(blockDamage('errou', 12, armored), 10)
  assert.equal(blockDamage('bom', 2, armored), 1)
})

test('um duelo alterna ataque e defesa até alguém cair', () => {
  const stats = heroStats(['espada'])
  let duel: Duel = startDuel(FOES.gosmo, stats)
  assert.equal(duel.turn, 'ataque')
  duel = resolveAttack(duel, 'bom', stats).duel
  assert.equal(duel.foe.hp, FOES.gosmo.maxHp - 9)
  assert.equal(duel.turn, 'defesa')
  duel = resolveDefense(duel, 'errou', stats).duel
  assert.equal(duel.hero.hp, stats.maxHp - FOES.gosmo.attack)
  assert.equal(duel.turn, 'ataque')
  assert.equal(duel.exchanges, 1)
  while (duel.turn !== 'vitoria') {
    duel = resolveAttack(duel, 'perfeito', stats).duel
    if (duel.turn === 'defesa') duel = resolveDefense(duel, 'perfeito', stats).duel
  }
  assert.equal(duel.foe.hp, 0)
})

test('o herói perde quando a vida chega a zero e o turno fora de hora é ignorado', () => {
  const stats = BASE_STATS
  let duel = startDuel(FOES.reiCorvo, stats)
  assert.deepEqual(resolveDefense(duel, 'errou', stats).duel, duel)
  while (duel.turn !== 'derrota') {
    duel = resolveAttack(duel, 'errou', stats).duel
    duel = resolveDefense(duel, 'errou', stats).duel
  }
  assert.equal(duel.hero.hp, 0)
})

test('golpe perfeito com asas cura sem passar da vida máxima', () => {
  const stats = heroStats(['asas'])
  const duel = startDuel(FOES.lumen, stats)
  const hurt: Duel = { ...duel, hero: { ...duel.hero, hp: duel.hero.maxHp - 2 } }
  const exchange = resolveAttack(hurt, 'perfeito', stats)
  assert.equal(exchange.healed, 2)
  assert.equal(exchange.duel.hero.hp, duel.hero.maxHp)
})

test('a dificuldade cresce a cada patente', () => {
  for (let rank = 1; rank <= 6; rank++) {
    const previous = difficultyFor(rank - 1)
    const current = difficultyFor(rank)
    assert.ok(current.sweepsPerSecond > previous.sweepsPerSecond)
    assert.ok(current.zoneWidth < previous.zoneWidth)
    assert.ok(current.strikeSeconds < previous.strikeSeconds)
  }
})

test('capa e botas facilitam a mira e o tempo', () => {
  const plain = timingFor(difficultyFor(4), BASE_STATS)
  const geared = timingFor(difficultyFor(4), heroStats(['capa', 'botas']))
  assert.ok(geared.zoneWidth > plain.zoneWidth)
  assert.ok(geared.sweepsPerSecond < plain.sweepsPerSecond)
  assert.ok(geared.strikeSeconds > plain.strikeSeconds)
})

test('o ataque expira depois de algumas passadas', () => {
  assert.equal(attackTimedOut(1, 1), false)
  assert.equal(attackTimedOut(6, 1), true)
})

function simulate(foe: typeof FOES.gosmo, gear: Parameters<typeof heroStats>[0], attack: Grade[], defense: Grade[]): Duel {
  const stats = heroStats(gear)
  let duel = startDuel(foe, stats)
  let turn = 0
  while (duel.turn === 'ataque' || duel.turn === 'defesa') {
    duel = resolveAttack(duel, attack[turn % attack.length], stats).duel
    if (duel.turn === 'defesa') duel = resolveDefense(duel, defense[turn % defense.length], stats).duel
    turn++
  }
  return duel
}

test('um duelo típico dura de 5 a 10 rodadas, o que dá entre 30 e 60 segundos', () => {
  const typical = simulate(FOES.gosmo, ['espada'], ['bom', 'perfeito', 'bom', 'errou'], ['bom', 'errou', 'perfeito'])
  assert.equal(typical.turn, 'vitoria')
  assert.ok(typical.exchanges >= 5 && typical.exchanges <= 10, `rodadas = ${typical.exchanges}`)
})

test('o Rei Corvo pune quem erra tudo, mas cai diante de quem joga bem com o equipamento', () => {
  const allGear = ['espada', 'escudo', 'elmo', 'capa', 'botas', 'asas'] as const
  assert.equal(simulate(FOES.reiCorvo, [...allGear], ['bom', 'errou'], ['errou']).turn, 'derrota')
  assert.equal(simulate(FOES.reiCorvo, [...allGear], ['perfeito', 'bom'], ['bom', 'perfeito']).turn, 'vitoria')
})
