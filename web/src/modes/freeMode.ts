import { EMBLEM_URLS, type Shell } from '../app/shell'
import type { GearId } from '../game/gear'
import { RANKS, evaluateRank, rankRangeLabel, type RankProgress } from '../rankTier'
import { element } from '../ui/dom'
import { bindHoldButton } from '../ui/holdButton'
import { composeMessage, formatBalance, type ChangeKind } from '../ui/messages'
import { loadRecord, saveRecord, shareUrl, type JournalRecord } from '../ui/persistence'
import { buildTrack, paintTrack } from '../ui/track'

const MAX_COUNT = 9999

export class FreeMode {
  private readonly shell: Shell
  private readonly gear: () => GearId[]
  private readonly record: JournalRecord = loadRecord()
  private readonly winsInput = element<HTMLInputElement>('wins-input')
  private readonly lossesInput = element<HTMLInputElement>('losses-input')
  private readonly ranksGrid = element<HTMLOListElement>('ranks-grid')
  private settledRankIndex: number
  private messageTimer: number | null = null
  private active = false

  constructor(shell: Shell, gear: () => GearId[]) {
    this.shell = shell
    this.gear = gear
    this.settledRankIndex = evaluateRank(this.record.wins, this.record.losses).rankIndex
    buildTrack(element('progress-track'))
    this.buildRanksGrid()
    this.bindCounters()
    this.bindActions()
  }

  get arrivedFromLink(): boolean {
    return new URLSearchParams(window.location.search).has('vitorias')
  }

  activate(): void {
    this.active = true
    const progress = this.render()
    this.shell.placeHero(progress)
    this.settledRankIndex = progress.rankIndex
    this.shell.dialog.say(composeMessage('intro', progress, this.record.wins))
  }

  deactivate(): void {
    this.active = false
  }

  private buildRanksGrid(): void {
    this.ranksGrid.innerHTML = RANKS.map(
      (rank, index) => `
      <li>
        <button class="rank-tile" type="button" data-rank-index="${index}" style="--rank-color:${rank.color};--rank-glow:${rank.glow}">
          <img src="${EMBLEM_URLS[index]}" alt="" width="48" height="48" />
          <span class="rank-tile-name">${rank.name}</span>
          <span class="rank-tile-range">${rankRangeLabel(index)}</span>
        </button>
      </li>`
    ).join('')
    this.ranksGrid.querySelectorAll<HTMLButtonElement>('.rank-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        this.shell.audio.play('select')
        this.setWins(RANKS[Number(tile.dataset.rankIndex)].min)
      })
    })
  }

  private render(): RankProgress {
    const progress = evaluateRank(this.record.wins, this.record.losses)
    if (document.activeElement !== this.winsInput) this.winsInput.value = String(this.record.wins)
    if (document.activeElement !== this.lossesInput) this.lossesInput.value = String(this.record.losses)
    paintTrack(element('progress-track'), progress)
    element('progress-next').textContent =
      progress.winsToNext === null ? 'Topo alcançado' : `Faltam ${progress.winsToNext} para ${progress.nextRankName}`
    const balance = element('balance')
    balance.textContent = formatBalance(progress.balance)
    balance.dataset.sign = progress.balance > 0 ? 'positive' : progress.balance < 0 ? 'negative' : 'zero'
    this.ranksGrid.querySelectorAll<HTMLButtonElement>('.rank-tile').forEach((tile) => {
      const index = Number(tile.dataset.rankIndex)
      tile.classList.toggle('is-locked', index > progress.rankIndex)
      tile.classList.toggle('is-current', index === progress.rankIndex)
      tile.setAttribute('aria-label', `${RANKS[index].name}: ${rankRangeLabel(index)} vitórias${index === progress.rankIndex ? ', patente atual' : ''}. Ir até lá.`)
    })
    this.shell.showProgress(progress, 'Modo livre', this.gear())
    saveRecord(this.record)
    return progress
  }

  private scheduleMessage(kind: ChangeKind): void {
    if (this.messageTimer !== null) window.clearTimeout(this.messageTimer)
    this.messageTimer = window.setTimeout(async () => {
      this.messageTimer = null
      const progress = evaluateRank(this.record.wins, this.record.losses)
      const rankChanged = progress.rankIndex !== this.settledRankIndex
      if (rankChanged) await this.shell.arrival()
      if (!this.active) return
      const current = evaluateRank(this.record.wins, this.record.losses)
      const said = current.rankIndex > this.settledRankIndex ? 'rankUp' : current.rankIndex < this.settledRankIndex ? 'rankDown' : kind
      this.settledRankIndex = current.rankIndex
      this.shell.dialog.say(composeMessage(said, current, this.record.wins))
    }, 260)
  }

  private clamp(value: number): number {
    return Math.min(MAX_COUNT, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)))
  }

  private setWins(value: number): void {
    const next = this.clamp(value)
    if (next === this.record.wins) return
    const kind: ChangeKind = next > this.record.wins ? 'win' : 'winUndo'
    this.shell.audio.play(kind === 'win' ? 'win' : 'undo')
    this.record.wins = next
    this.render()
    this.scheduleMessage(kind)
  }

  private setLosses(value: number): void {
    const next = this.clamp(value)
    if (next === this.record.losses) return
    const kind: ChangeKind = next > this.record.losses ? 'loss' : 'lossUndo'
    this.shell.audio.play(kind === 'loss' ? 'loss' : 'undo')
    this.record.losses = next
    this.render()
    this.scheduleMessage(kind)
  }

  private bindCounters(): void {
    bindHoldButton(element('wins-inc'), () => this.setWins(this.record.wins + 1))
    bindHoldButton(element('wins-dec'), () => this.setWins(this.record.wins - 1))
    bindHoldButton(element('losses-inc'), () => this.setLosses(this.record.losses + 1))
    bindHoldButton(element('losses-dec'), () => this.setLosses(this.record.losses - 1))
    this.winsInput.addEventListener('input', () => this.setWins(Number.parseInt(this.winsInput.value, 10)))
    this.lossesInput.addEventListener('input', () => this.setLosses(Number.parseInt(this.lossesInput.value, 10)))
    ;[this.winsInput, this.lossesInput].forEach((input) => {
      input.addEventListener('focus', () => input.select())
      input.addEventListener('blur', () => this.render())
    })
  }

  private bindActions(): void {
    const shareButton = element<HTMLButtonElement>('share-button')
    shareButton.addEventListener('click', async () => {
      const original = shareButton.textContent
      try {
        await navigator.clipboard.writeText(shareUrl(this.record))
        shareButton.textContent = 'Link copiado!'
      } catch {
        shareButton.textContent = 'Não deu para copiar'
      }
      window.setTimeout(() => (shareButton.textContent = original), 1800)
    })
    element('reset-button').addEventListener('click', () => {
      this.record.wins = 0
      this.record.losses = 0
      this.render()
      this.scheduleMessage('winUndo')
    })
    window.addEventListener('keydown', (event) => {
      if (!this.active || document.body.classList.contains('has-overlay')) return
      if (event.target instanceof HTMLInputElement) return
      if (event.key === 'ArrowUp') this.setWins(this.record.wins + 1)
      if (event.key === 'ArrowDown') this.setWins(this.record.wins - 1)
    })
  }
}
