import type { Chiptune } from '../audio/chiptune'
import type { HeroFrame } from '../art/hero'
import {
  ATTACK_CENTER,
  attackTimedOut,
  BLOCK_CENTER,
  gradeTiming,
  isOver,
  pingPong,
  PERFECT_SHARE,
  resolveAttack,
  resolveDefense,
  startDuel,
  sweep,
  timingFor,
  type Duel,
  type Exchange,
  type Grade,
  type Timing
} from '../game/combat'
import { difficultyFor, type Foe } from '../game/foes'
import { heroStats, type GearId, type HeroStats } from '../game/gear'
import type { Outcome } from '../game/journey'
import { RANKS } from '../rankTier'
import { foeFrame, heroFrame, heroSprites, idleLift, type HeroSprites } from '../stage/sprites'
import { Theater, type ActorPose } from '../stage/theater'
import { element, isActivationKey } from '../ui/dom'
import { BattleView } from './battleView'

export interface BattleSetup {
  foe: Foe
  rankIndex: number
  gear: GearId[]
  duelLabel: string
  reward: number
}

export type BattleResult = Outcome | null

type Phase = 'intro' | 'attack' | 'strike' | 'defend' | 'guard' | 'finale' | 'result'

const INTRO_SECONDS = 2.4
const STRIKE_SECONDS = 0.85
const STRIKE_IMPACT = 0.2
const DEFEND_DELAY = 0.55
const GUARD_SECONDS = 0.8
const GUARD_IMPACT = 0.12
const FINALE_SECONDS = 1.3
const REACH = 15


export class Battle {
  private readonly audio: Chiptune
  private readonly view = new BattleView()
  private readonly theater: Theater
  private readonly overlay = element('battle')
  private readonly viewport = element('battle-viewport')
  private setup: BattleSetup | null = null
  private stats: HeroStats = heroStats([])
  private timing: Timing = timingFor(difficultyFor(0), this.stats)
  private duel: Duel | null = null
  private hero: HeroSprites = heroSprites([])
  private phase: Phase = 'result'
  private phaseTime = 0
  private clock = 0
  private marker = 0
  private lungeFrom = 0
  private exchange: Exchange | null = null
  private impactDone = false
  private heroFlash = 0
  private foeFlash = 0
  private settle: ((result: BattleResult) => void) | null = null
  private frameId: number | null = null
  private previousFocus: HTMLElement | null = null

  constructor(audio: Chiptune) {
    this.audio = audio
    this.theater = new Theater(element<HTMLCanvasElement>('battle-canvas'))
    new ResizeObserver(([entry]) => this.theater.resize(entry.contentRect.width, entry.contentRect.height)).observe(this.viewport)
    this.bindInput()
  }

  open(setup: BattleSetup): Promise<BattleResult> {
    this.setup = setup
    this.stats = heroStats(setup.gear)
    this.timing = timingFor(difficultyFor(setup.rankIndex), this.stats)
    this.duel = startDuel(setup.foe, this.stats)
    this.hero = heroSprites(setup.gear)
    this.theater.setBackdrop(Math.min(setup.rankIndex, 6))
    this.view.prepare(setup, this.duel, RANKS[setup.rankIndex])
    this.previousFocus = document.activeElement as HTMLElement | null
    this.overlay.hidden = false
    document.body.classList.add('has-overlay')
    requestAnimationFrame(() => this.overlay.classList.add('is-open'))
    this.enter('intro')
    this.startLoop()
    this.view.focusAction()
    return new Promise((resolve) => (this.settle = resolve))
  }

  private close(result: BattleResult): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
    this.overlay.classList.remove('is-open')
    this.overlay.hidden = true
    document.body.classList.remove('has-overlay')
    this.previousFocus?.focus()
    this.settle?.(result)
    this.settle = null
  }

  private bindInput(): void {
    element('battle-action').addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return
      event.preventDefault()
      this.press()
    })
    element('battle-action').addEventListener('click', (event) => {
      if (event.detail === 0) this.press()
    })
    this.viewport.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).closest('button')) return
      this.press()
    })
    element('battle-flee').addEventListener('click', () => this.close(null))
    element('battle-continue').addEventListener('click', () => this.close(this.duel?.turn === 'vitoria' ? 'vitoria' : 'derrota'))
    window.addEventListener('keydown', (event) => {
      if (this.overlay.hidden) return
      if (event.key === 'Escape' && this.phase !== 'result') {
        event.preventDefault()
        this.close(null)
        return
      }
      if (!isActivationKey(event) || this.phase === 'result') return
      event.preventDefault()
      if (!event.repeat) this.press()
    })
  }

  private press(): void {
    if (this.phase === 'intro') {
      this.enter('attack')
      return
    }
    if (this.phase === 'attack') this.resolveAttack(gradeTiming(this.marker, ATTACK_CENTER, this.timing.zoneWidth))
    if (this.phase === 'defend' && this.phaseTime >= DEFEND_DELAY) {
      this.resolveDefense(gradeTiming(this.marker, BLOCK_CENTER, this.timing.zoneWidth))
    }
  }

  private enter(phase: Phase): void {
    this.phase = phase
    this.phaseTime = 0
    this.impactDone = false
    this.marker = 0
    this.view.showPhase(phase, this.setup?.foe ?? null)
    if (phase === 'attack') this.view.setZone(ATTACK_CENTER, this.timing.zoneWidth, PERFECT_SHARE)
    if (phase === 'defend') {
      this.view.setZone(BLOCK_CENTER, this.timing.zoneWidth, PERFECT_SHARE)
      this.audio.play('whoosh')
    }
  }

  private resolveAttack(grade: Grade): void {
    if (!this.duel) return
    this.exchange = resolveAttack(this.duel, grade, this.stats)
    this.view.flashGrade(grade)
    this.enter('strike')
    this.audio.play('whoosh')
  }

  private resolveDefense(grade: Grade): void {
    if (!this.duel) return
    this.exchange = resolveDefense(this.duel, grade, this.stats)
    this.lungeFrom = Math.min(1, this.marker / BLOCK_CENTER)
    this.view.flashGrade(grade)
    this.enter('guard')
  }

  private startLoop(): void {
    let previous = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000))
      previous = now
      this.update(dt)
      this.draw(dt)
      this.frameId = requestAnimationFrame(frame)
    }
    this.frameId = requestAnimationFrame(frame)
  }

  private update(dt: number): void {
    this.clock += dt
    this.phaseTime += dt
    this.heroFlash = Math.max(0, this.heroFlash - dt)
    this.foeFlash = Math.max(0, this.foeFlash - dt)
    switch (this.phase) {
      case 'intro':
        if (this.phaseTime >= INTRO_SECONDS) this.enter('attack')
        break
      case 'attack':
        this.marker = pingPong(this.phaseTime, this.timing.sweepsPerSecond)
        this.view.setMarker(this.marker)
        if (attackTimedOut(this.phaseTime, this.timing.sweepsPerSecond)) this.resolveAttack('errou')
        break
      case 'strike':
        if (!this.impactDone && this.phaseTime >= STRIKE_IMPACT) this.landStrike()
        if (this.phaseTime >= STRIKE_SECONDS) this.afterExchange('defend')
        break
      case 'defend': {
        const running = Math.max(0, this.phaseTime - DEFEND_DELAY)
        this.marker = sweep(running, this.timing.strikeSeconds)
        this.view.setMarker(this.marker)
        if (this.marker >= 1) this.resolveDefense('errou')
        break
      }
      case 'guard':
        if (!this.impactDone && this.phaseTime >= GUARD_IMPACT) this.landGuard()
        if (this.phaseTime >= GUARD_SECONDS) this.afterExchange('attack')
        break
      case 'finale':
        if (this.phaseTime >= FINALE_SECONDS) this.showResult()
        break
      case 'result':
        break
    }
  }

  private landStrike(): void {
    this.impactDone = true
    const exchange = this.exchange
    const setup = this.setup
    if (!exchange || !setup) return
    this.duel = exchange.duel
    const foeX = this.theater.xAt(0.7)
    const y = this.theater.arena.groundY - 14
    if (exchange.damage > 0) {
      const perfect = exchange.grade === 'perfeito'
      this.foeFlash = 0.16
      this.theater.shake(perfect ? 0.3 : 0.16)
      this.theater.particles.burst(foeX, y, perfect ? ['#fff6d0', '#ffd166', '#ff8a3d'] : ['#fff6d0', '#e8d9bd'], perfect ? 26 : 12)
      this.view.float(perfect ? `Perfeito! −${exchange.damage}` : `−${exchange.damage}`, this.theater.percentOf(foeX, y - 8), perfect ? 'crit' : 'hit')
      this.audio.play(perfect ? 'crit' : 'hit')
    } else {
      this.view.float('Errou', this.theater.percentOf(foeX, y - 8), 'miss')
      this.audio.play('miss')
    }
    if (exchange.healed > 0) {
      const heroX = this.theater.xAt(0.3)
      this.view.float(`+${exchange.healed}`, this.theater.percentOf(heroX, y - 10), 'heal')
      this.theater.particles.rise(heroX, y + 6, ['#c4a8ff', '#fbf6ff'], 10)
    }
    this.view.updateHp(exchange.duel)
  }

  private landGuard(): void {
    this.impactDone = true
    const exchange = this.exchange
    if (!exchange) return
    this.duel = exchange.duel
    const heroX = this.theater.xAt(0.3)
    const y = this.theater.arena.groundY - 12
    if (exchange.grade === 'perfeito') {
      this.theater.particles.burst(heroX + 6, y, ['#fff6d0', '#9cefff', '#ffffff'], 16)
      this.view.float('Bloqueio!', this.theater.percentOf(heroX, y - 10), 'block')
      this.audio.play('block')
    } else {
      this.heroFlash = 0.18
      this.theater.shake(exchange.grade === 'errou' ? 0.28 : 0.12)
      this.theater.particles.burst(heroX, y, ['#ff7a85', '#ffd6b0'], exchange.grade === 'errou' ? 14 : 7)
      this.view.float(`−${exchange.damage}`, this.theater.percentOf(heroX, y - 10), 'hurt')
      this.audio.play(exchange.grade === 'bom' ? 'block' : 'hurt')
    }
    this.view.updateHp(exchange.duel)
  }

  private afterExchange(next: Phase): void {
    if (!this.duel) return
    if (!isOver(this.duel)) {
      this.enter(next)
      return
    }
    this.enter('finale')
    const won = this.duel.turn === 'vitoria'
    this.audio.play(won ? 'victory' : 'defeat')
    if (won) {
      const foeX = this.theater.xAt(0.7)
      const color = RANKS[this.setup?.rankIndex ?? 0]
      this.theater.particles.burst(foeX, this.theater.arena.groundY - 12, [color.color, color.glow, '#fff6d0', '#ffd166'], 60)
    }
  }

  private showResult(): void {
    if (!this.duel || !this.setup) return
    this.enter('result')
    this.view.showResult(this.duel, this.setup)
  }

  private heroPose(): ActorPose {
    const home = this.theater.xAt(0.3)
    const target = this.theater.xAt(0.7) - REACH
    let centerX = home
    let lift = 0
    let frame: HeroFrame = Math.floor(this.clock * 2) % 2 === 0 ? 'idle0' : 'idle1'
    if (this.phase === 'strike') {
      const t = this.phaseTime
      const out = t < STRIKE_IMPACT ? easeOut(t / STRIKE_IMPACT) : t < 0.4 ? 1 : 1 - easeInOut((t - 0.4) / (STRIKE_SECONDS - 0.4))
      centerX = Math.round(home + (target - home) * Math.max(0, out))
      lift = t < STRIKE_IMPACT ? Math.round(Math.sin((t / STRIKE_IMPACT) * Math.PI) * 5) : 0
      frame = t < 0.4 ? 'walk0' : 'walk2'
    }
    const won = this.duel?.turn === 'vitoria'
    const lost = this.duel?.turn === 'derrota'
    if ((this.phase === 'finale' || this.phase === 'result') && won) {
      lift = Math.round(Math.abs(Math.sin(this.clock * 6)) * 6)
    }
    return {
      sprite: heroFrame(this.hero, frame),
      centerX,
      lift,
      flashing: this.heroFlash > 0,
      alpha: (this.phase === 'finale' || this.phase === 'result') && lost ? 0.55 : 1
    }
  }

  private foePose(): ActorPose | null {
    const setup = this.setup
    if (!setup) return null
    const home = this.theater.xAt(0.7)
    const target = this.theater.xAt(0.3) + REACH
    let progress = 0
    if (this.phase === 'defend') {
      const windUp = this.phaseTime < DEFEND_DELAY ? -Math.sin((this.phaseTime / DEFEND_DELAY) * Math.PI) * 0.06 : 0
      progress = this.phaseTime < DEFEND_DELAY ? windUp : Math.min(1, this.marker / BLOCK_CENTER)
    }
    if (this.phase === 'guard') {
      const t = this.phaseTime
      progress = t < GUARD_IMPACT ? this.lungeFrom + (1 - this.lungeFrom) * (t / GUARD_IMPACT) : 1 - easeInOut((t - GUARD_IMPACT) / (GUARD_SECONDS - GUARD_IMPACT))
    }
    const vanishing = (this.phase === 'finale' || this.phase === 'result') && this.duel?.turn === 'vitoria'
    const alpha = vanishing ? Math.max(0, 1 - this.phaseTime / 0.5) : 1
    return {
      sprite: foeFrame(setup.foe.id),
      centerX: Math.round(home + (target - home) * easeIn(Math.max(-0.1, progress))),
      lift: idleLift(setup.foe.id, this.clock),
      flashing: this.foeFlash > 0 || (this.phase === 'defend' && this.phaseTime < DEFEND_DELAY && Math.floor(this.phaseTime * 14) % 2 === 0),
      alpha: this.phase === 'result' && vanishing ? 0 : alpha
    }
  }

  private draw(dt: number): void {
    const foe = this.foePose()
    this.theater.render(this.clock, dt, foe ? [this.heroPose(), foe] : [this.heroPose()])
  }
}

function easeOut(t: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3
}

function easeIn(t: number): number {
  return t < 0 ? t : t ** 2
}

function easeInOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - (-2 * clamped + 2) ** 2 / 2
}
