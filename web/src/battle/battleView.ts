import type { Duel, Fighter, Grade } from '../game/combat'
import type { Foe } from '../game/foes'
import type { RankInfo } from '../rankTier'
import { element } from '../ui/dom'
import type { BattleSetup } from './battle'

export type FloatKind = 'hit' | 'crit' | 'miss' | 'heal' | 'block' | 'hurt'

const PROMPTS: Record<string, { text: string; action: string; mode: string }> = {
  intro: { text: 'Prepare-se. Toque para começar.', action: 'Pronto!', mode: 'idle' },
  attack: { text: 'Sua vez! Pare o ponteiro no alvo dourado.', action: 'Golpear!', mode: 'attack' },
  strike: { text: 'Sua vez! Pare o ponteiro no alvo dourado.', action: 'Golpear!', mode: 'attack' },
  defend: { text: 'Lá vem o golpe! Defenda quando chegar à marca.', action: 'Defender!', mode: 'defend' },
  guard: { text: 'Lá vem o golpe! Defenda quando chegar à marca.', action: 'Defender!', mode: 'defend' },
  finale: { text: 'Duelo encerrado!', action: 'Fim', mode: 'idle' },
  result: { text: 'Duelo encerrado!', action: 'Fim', mode: 'idle' }
}

export class BattleView {
  private readonly overlay = element('battle')
  private readonly prompt = element('battle-prompt')
  private readonly action = element<HTMLButtonElement>('battle-action')
  private readonly actionLabel = element('battle-action-label')
  private readonly meter = element('meter')
  private readonly zone = element('meter-zone')
  private readonly perfect = element('meter-perfect')
  private readonly marker = element('meter-marker')
  private readonly bubble = element('battle-bubble')
  private readonly floats = element('battle-floats')
  private readonly result = element('battle-result')

  prepare(setup: BattleSetup, duel: Duel, rank: RankInfo): void {
    this.overlay.style.setProperty('--rank-color', rank.color)
    this.overlay.style.setProperty('--rank-glow', rank.glow)
    element('battle-duel').textContent = setup.duelLabel
    element('battle-foe-name').textContent = setup.foe.name
    element('battle-foe-epithet').textContent = setup.foe.epithet
    element('battle-stakes').textContent = `Vale +${setup.reward} vitórias`
    this.bubble.textContent = setup.foe.taunt
    this.result.hidden = true
    this.floats.replaceChildren()
    this.updateHp(duel)
  }

  focusAction(): void {
    this.action.focus({ preventScroll: true })
  }

  showPhase(phase: string, foe: Foe | null): void {
    const copy = PROMPTS[phase]
    this.prompt.textContent = copy.text
    this.actionLabel.textContent = copy.action
    this.meter.dataset.mode = copy.mode
    this.action.dataset.mode = copy.mode
    this.action.disabled = phase === 'finale' || phase === 'result'
    this.bubble.classList.toggle('is-visible', phase === 'intro' && foe !== null)
    element('battle-controls').classList.toggle('is-resolving', phase === 'strike' || phase === 'guard')
    if (phase === 'defend') this.setMarker(0)
  }

  setZone(center: number, width: number, perfectShare: number): void {
    this.zone.style.left = `${(center - width / 2) * 100}%`
    this.zone.style.width = `${width * 100}%`
    this.perfect.style.width = `${perfectShare * 100}%`
  }

  setMarker(position: number): void {
    this.marker.style.left = `${position * 100}%`
  }

  flashGrade(grade: Grade): void {
    this.meter.dataset.grade = grade
    this.meter.classList.remove('is-graded')
    void this.meter.offsetWidth
    this.meter.classList.add('is-graded')
  }

  float(text: string, position: { left: number; top: number }, kind: FloatKind): void {
    const label = document.createElement('span')
    label.className = `battle-float is-${kind}`
    label.textContent = text
    label.style.left = `${position.left}%`
    label.style.top = `${position.top}%`
    label.addEventListener('animationend', () => label.remove())
    this.floats.append(label)
  }

  updateHp(duel: Duel): void {
    this.paintHp('hero', duel.hero)
    this.paintHp('foe', duel.foe)
  }

  showResult(duel: Duel, setup: BattleSetup): void {
    const won = duel.turn === 'vitoria'
    this.result.dataset.outcome = won ? 'win' : 'loss'
    element('result-eyebrow').textContent = won ? 'Vitória!' : 'Derrota'
    element('result-title').textContent = won ? `${setup.foe.name} ficou para trás` : `${setup.foe.name} levou essa`
    element('result-reward').textContent = won ? `+${setup.reward} vitórias` : `+${setup.reward} derrotas`
    element('result-stats').textContent = `${duel.perfects} ${duel.perfects === 1 ? 'acerto perfeito' : 'acertos perfeitos'} · ${duel.exchanges + (won ? 1 : 0)} rodadas`
    this.result.hidden = false
    requestAnimationFrame(() => element('battle-continue').focus({ preventScroll: true }))
  }

  private paintHp(who: 'hero' | 'foe', fighter: Fighter): void {
    const share = fighter.maxHp === 0 ? 0 : fighter.hp / fighter.maxHp
    const fill = element(`${who}-hp-fill`)
    fill.style.width = `${share * 100}%`
    fill.dataset.level = share <= 0.25 ? 'low' : share <= 0.5 ? 'mid' : 'high'
    element(`${who}-hp-text`).textContent = `${fighter.hp}/${fighter.maxHp}`
  }
}
