import type { Shell } from '../app/shell'
import { foeSprite } from '../art/foes'
import { gearIcon } from '../art/gearIcons'
import type { Battle } from '../battle/battle'
import { GEAR, type GearId } from '../game/gear'
import {
  chapterScene,
  chapterSize,
  duelNumber,
  equippedGear,
  journeyRank,
  markSeen,
  newJourney,
  nextFoe,
  pendingScenes,
  recordDuel,
  rewardFor,
  toggleGear,
  type Journey,
  type SceneId
} from '../game/journey'
import { defeatLine, sceneById, victoryLine } from '../game/story'
import { RANKS, type RankProgress } from '../rankTier'
import type { StoryPlayer } from '../story/storyPlayer'
import { element, paintInto } from '../ui/dom'
import type { Inventory, InventoryState } from '../ui/inventory'
import { loadJourney, saveJourney } from '../ui/journeyStore'
import { formatBalance, remainingLine } from '../ui/messages'
import { buildTrack, paintTrack } from '../ui/track'

const DANGER_PIPS = 7

export class JourneyMode {
  private readonly shell: Shell
  private readonly battle: Battle
  private readonly story: StoryPlayer
  private readonly inventory: Inventory
  private journey: Journey = loadJourney()
  private busy = false
  private active = false
  private restartArmed: number | null = null

  constructor(shell: Shell, battle: Battle, story: StoryPlayer, inventory: Inventory) {
    this.shell = shell
    this.battle = battle
    this.story = story
    this.inventory = inventory
    buildTrack(element('journey-track'))
    this.bindActions()
  }

  get gear(): GearId[] {
    return equippedGear(this.journey)
  }

  toggle(id: GearId): InventoryState {
    this.update(toggleGear(this.journey, id))
    return this.inventoryState()
  }

  async activate(): Promise<void> {
    this.active = true
    const progress = this.render()
    this.shell.placeHero(progress)
    this.shell.dialog.say(this.hint(progress))
    await this.playPending()
  }

  deactivate(): void {
    this.active = false
  }

  private inventoryState(): InventoryState {
    return { rankIndex: journeyRank(this.journey).rankIndex, equipped: this.gear }
  }

  private update(journey: Journey): RankProgress {
    this.journey = journey
    saveJourney(journey)
    return this.render()
  }

  private render(): RankProgress {
    const progress = journeyRank(this.journey)
    const chapter = sceneById(chapterScene(progress.rankIndex))
    element('chapter-eyebrow').textContent = chapter.eyebrow
    element('chapter-title').textContent = chapter.title
    element('journey-wins').textContent = String(this.journey.wins)
    element('journey-losses').textContent = String(this.journey.losses)
    const balance = element('journey-balance')
    balance.textContent = formatBalance(progress.balance)
    balance.dataset.sign = progress.balance > 0 ? 'positive' : progress.balance < 0 ? 'negative' : 'zero'
    element('journey-rank-label').textContent = progress.level
    element('journey-rank-label').style.color = RANKS[progress.rankIndex].glow
    element('journey-next').textContent =
      progress.winsToNext === null ? 'Chama do Topo acesa' : `Faltam ${progress.winsToNext} para ${progress.nextRankName}`
    paintTrack(element('journey-track'), progress)
    this.renderFoe(progress)
    this.renderGear(progress)
    if (this.active) this.shell.showProgress(progress, 'Jornada', this.gear)
    return progress
  }

  private duelLabel(progress: RankProgress): string {
    const size = chapterSize(progress.rankIndex)
    return size === null ? `Desafio Imortal nº ${Math.max(1, this.journey.duelsWon - 13)}` : `Duelo ${duelNumber(this.journey)} de ${size}`
  }

  private renderFoe(progress: RankProgress): void {
    const foe = nextFoe(this.journey)
    paintInto(element<HTMLCanvasElement>('foe-portrait'), foeSprite(foe.id))
    element('foe-duel').textContent = `Próximo · ${this.duelLabel(progress)}`
    element('foe-name').textContent = foe.name
    element('foe-epithet').textContent = foe.epithet
    element('duel-stakes').textContent = `+${rewardFor(progress.rankIndex)} vitórias`
    const danger = element('foe-danger')
    danger.innerHTML = Array.from({ length: DANGER_PIPS }, (_, index) => `<i class="${index <= progress.rankIndex ? 'is-on' : ''}"></i>`).join('')
    danger.setAttribute('aria-label', `Dificuldade ${progress.rankIndex + 1} de ${DANGER_PIPS}`)
    element('duel-button').closest('.foe-card')?.setAttribute('style', `--rank-color:${RANKS[progress.rankIndex].color};--rank-glow:${RANKS[progress.rankIndex].glow}`)
  }

  private renderGear(progress: RankProgress): void {
    const equipped = this.gear
    element('gear-strip').replaceChildren(
      ...GEAR.map((item) => {
        const slot = document.createElement('li')
        const unlocked = item.rankIndex <= progress.rankIndex
        slot.className = 'gear-slot'
        slot.dataset.state = unlocked ? (equipped.includes(item.id) ? 'equipped' : 'stored') : 'locked'
        slot.title = unlocked ? `${item.name}: ${item.perk}` : `Chega no ${RANKS[item.rankIndex].name}`
        const icon = document.createElement('canvas')
        paintInto(icon, gearIcon(item.id))
        slot.append(icon)
        return slot
      })
    )
  }

  private hint(progress: RankProgress): string {
    const foe = nextFoe(this.journey)
    if (progress.winsToNext === null) return `A chama está acesa. Os Desafios Imortais seguem abertos: ${foe.name} quer revanche!`
    if (this.journey.duelsWon === 0 && this.journey.duelsLost === 0) return `${foe.name} te espera perto da fogueira. Toque em Duelar quando quiser.`
    return `${foe.name} te espera. ${remainingLine(progress)}`
  }

  private async duel(): Promise<void> {
    if (this.busy) return
    this.busy = true
    const before = journeyRank(this.journey)
    const foe = nextFoe(this.journey)
    const result = await this.battle.open({
      foe,
      rankIndex: before.rankIndex,
      gear: this.gear,
      duelLabel: this.duelLabel(before),
      reward: rewardFor(before.rankIndex)
    })
    if (result === null) {
      this.shell.dialog.say('Recuar também é estratégia. Respire fundo e volte quando quiser.')
      this.busy = false
      return
    }
    const report = recordDuel(this.journey, result)
    const progress = this.update(report.journey)
    this.shell.dialog.say(
      result === 'vitoria'
        ? victoryLine(foe.name, report.amount, report.journey.duelsWon, remainingLine(progress))
        : defeatLine(foe.name, report.amount, report.journey.duelsLost)
    )
    if (report.rankAfter > report.rankBefore) {
      await this.shell.arrival()
      await wait(900)
      await this.playPending()
    }
    this.busy = false
    element('duel-button').focus({ preventScroll: true })
  }

  private async playPending(): Promise<void> {
    for (const id of pendingScenes(this.journey)) await this.playScene(id)
    if (this.active) this.shell.dialog.say(this.hint(journeyRank(this.journey)))
  }

  private async playScene(id: SceneId): Promise<void> {
    const rewards = GEAR.filter((item) => chapterScene(item.rankIndex) === id)
    await this.story.play(sceneById(id), { gear: this.gear, rewards })
    this.update(markSeen(this.journey, id))
  }

  private restart(button: HTMLButtonElement): void {
    if (this.restartArmed === null) {
      button.textContent = 'Toque de novo para confirmar'
      this.restartArmed = window.setTimeout(() => {
        this.restartArmed = null
        button.textContent = 'Recomeçar jornada'
      }, 3000)
      return
    }
    window.clearTimeout(this.restartArmed)
    this.restartArmed = null
    button.textContent = 'Recomeçar jornada'
    const progress = this.update(newJourney())
    this.shell.audio.play('rankDown')
    void this.shell.arrival().then(() => this.playPending())
    this.shell.dialog.say(this.hint(progress))
  }

  private bindActions(): void {
    element('duel-button').addEventListener('click', () => void this.duel())
    element('inventory-button').addEventListener('click', () => {
      this.shell.audio.play('select')
      this.inventory.open(this.inventoryState(), (id) => this.toggle(id), () => this.render())
    })
    element('gear-strip').addEventListener('click', () => element('inventory-button').click())
    element('replay-button').addEventListener('click', () => {
      if (this.busy) return
      void this.playScene(chapterScene(journeyRank(this.journey).rankIndex))
    })
    element<HTMLButtonElement>('restart-button').addEventListener('click', (event) => this.restart(event.currentTarget as HTMLButtonElement))
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
