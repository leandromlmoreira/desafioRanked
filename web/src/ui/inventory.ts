import type { Chiptune } from '../audio/chiptune'
import { emblemDataUrl } from '../art/emblems'
import { gearIcon } from '../art/gearIcons'
import { buildHeroSheet, HERO_HEIGHT, HERO_WIDTH } from '../art/hero'
import { GEAR, heroStats, type GearId } from '../game/gear'
import { RANKS } from '../rankTier'
import { element, paintInto } from './dom'

export interface InventoryState {
  rankIndex: number
  equipped: GearId[]
}

export class Inventory {
  private readonly overlay = element('inventory')
  private readonly list = element('gear-list')
  private readonly audio: Chiptune
  private onToggle: (id: GearId) => InventoryState = () => ({ rankIndex: 0, equipped: [] })
  private previousFocus: HTMLElement | null = null
  private onClose: (() => void) | null = null

  constructor(audio: Chiptune) {
    this.audio = audio
    element('inventory-close').addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.close()
    })
    window.addEventListener('keydown', (event) => {
      if (!this.overlay.hidden && event.key === 'Escape') this.close()
    })
  }

  open(state: InventoryState, onToggle: (id: GearId) => InventoryState, onClose: () => void): void {
    this.onToggle = onToggle
    this.onClose = onClose
    this.previousFocus = document.activeElement as HTMLElement | null
    this.render(state)
    this.overlay.hidden = false
    document.body.classList.add('has-overlay')
    requestAnimationFrame(() => this.overlay.classList.add('is-open'))
    element('inventory-close').focus({ preventScroll: true })
  }

  private close(): void {
    this.overlay.classList.remove('is-open')
    this.overlay.hidden = true
    document.body.classList.remove('has-overlay')
    this.previousFocus?.focus()
    this.onClose?.()
  }

  private render(state: InventoryState): void {
    this.paintHero(state.equipped)
    this.renderStats(state.equipped)
    this.list.replaceChildren(...GEAR.map((item) => this.gearRow(item.id, state)))
  }

  private paintHero(equipped: GearId[]): void {
    const sheet = buildHeroSheet(equipped)
    const canvas = document.createElement('canvas')
    canvas.width = HERO_WIDTH
    canvas.height = HERO_HEIGHT
    canvas.getContext('2d')?.drawImage(sheet.right, 0, 0, HERO_WIDTH, HERO_HEIGHT, 0, 0, HERO_WIDTH, HERO_HEIGHT)
    paintInto(element<HTMLCanvasElement>('inventory-hero'), canvas)
  }

  private renderStats(equipped: GearId[]): void {
    const stats = heroStats(equipped)
    const rows: Array<[string, string]> = [
      ['Vida', String(stats.maxHp)],
      ['Ataque', String(stats.attack)],
      ['Defesa', String(stats.defense)],
      ['Mira', stats.aim > 0 ? `+${Math.round(stats.aim * 100)}%` : '—'],
      ['Calma', stats.calm > 0 ? `+${Math.round(stats.calm * 100)}%` : '—'],
      ['Cura', stats.perfectHeal > 0 ? `+${stats.perfectHeal}` : '—']
    ]
    element('inventory-stats').innerHTML = rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')
  }

  private gearRow(id: GearId, state: InventoryState): HTMLLIElement {
    const item = GEAR.find((gear) => gear.id === id)!
    const unlocked = item.rankIndex <= state.rankIndex
    const equipped = state.equipped.includes(id)
    const row = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'gear-row'
    button.dataset.state = unlocked ? (equipped ? 'equipped' : 'stored') : 'locked'
    button.style.setProperty('--rank-color', RANKS[item.rankIndex].color)
    button.disabled = !unlocked
    if (unlocked) button.setAttribute('aria-pressed', String(equipped))
    const icon = document.createElement('canvas')
    paintInto(icon, gearIcon(id))
    icon.className = 'gear-row-icon'
    const status = unlocked ? (equipped ? 'Equipado' : 'Guardado') : `Chega no ${RANKS[item.rankIndex].name}`
    button.append(icon)
    button.insertAdjacentHTML(
      'beforeend',
      `<span class="gear-row-text">
        <span class="gear-row-slot">${item.slot}</span>
        <strong class="gear-row-name">${unlocked ? item.name : '???'}</strong>
        <span class="gear-row-perk">${unlocked ? item.perk : 'Continue subindo para descobrir.'}</span>
        ${unlocked ? `<span class="gear-row-lore">${item.lore}</span>` : ''}
      </span>
      <span class="gear-row-status"><img src="${emblemDataUrl(item.rankIndex)}" alt="" width="20" height="20" />${status}</span>`
    )
    button.addEventListener('click', () => {
      this.audio.play(equipped ? 'undo' : 'gear')
      const next = this.onToggle(id)
      this.render(next)
      ;(this.list.querySelector(`[data-gear="${id}"] button`) as HTMLButtonElement | null)?.focus()
    })
    row.dataset.gear = id
    row.append(button)
    return row
  }
}
