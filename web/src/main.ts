import './style.css'
import { emblemDataUrl } from './art/emblems'
import { buildOwlPortrait } from './art/props'
import { Chiptune } from './audio/chiptune'
import { context2d } from './pixel/canvas'
import { RANKS, evaluateRank, rankRangeLabel, type RankProgress } from './rankTier'
import { Dialog } from './ui/dialog'
import { bindHoldButton } from './ui/holdButton'
import { composeMessage, formatBalance, type ChangeKind } from './ui/messages'
import { loadRecord, saveRecord, shareUrl, type JournalRecord } from './ui/persistence'
import { STATION_DISTANCES } from './world/layout'
import { Scene } from './world/scene'

const PROGRESS_SEGMENTS = 12
const MAX_COUNT = 9999

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error(`Elemento #${id} não encontrado`)
  return found as T
}

const stage = element<HTMLElement>('stage')
const scene = new Scene(element<HTMLCanvasElement>('scene'))
const audio = new Chiptune()
const dialog = new Dialog(element('dialog-text'), () => audio.play('text'))

const winsInput = element<HTMLInputElement>('wins-input')
const lossesInput = element<HTMLInputElement>('losses-input')
const balanceLabel = element('balance')
const progressNext = element('progress-next')
const progressTrack = element('progress-track')
const ranksGrid = element<HTMLOListElement>('ranks-grid')
const hudEmblem = element<HTMLImageElement>('hud-emblem')
const hudRankName = element('hud-rank-name')
const hudRankRange = element('hud-rank-range')
const toast = element('rank-toast')
const toastEmblem = element<HTMLImageElement>('rank-toast-emblem')
const toastName = element('rank-toast-name')
const phaseLabel = element('phase-label')

const emblemUrls = RANKS.map((_, index) => emblemDataUrl(index))

const record: JournalRecord = loadRecord()
let settledRankIndex = evaluateRank(record.wins, record.losses).rankIndex
let pendingKind: ChangeKind = 'intro'
let messageTimer: number | null = null
let awaitingArrival = false
let toastTimer: number | null = null

function pathDistance(progress: RankProgress): number {
  const start = STATION_DISTANCES[progress.rankIndex]
  const end = STATION_DISTANCES[progress.rankIndex + 1]
  return end === undefined ? start : start + (end - start) * progress.fractionToNext
}

function buildRanksGrid(): void {
  ranksGrid.innerHTML = RANKS.map(
    (rank, index) => `
      <li>
        <button class="rank-tile" type="button" data-rank-index="${index}" style="--rank-color:${rank.color};--rank-glow:${rank.glow}">
          <img src="${emblemUrls[index]}" alt="" width="48" height="48" />
          <span class="rank-tile-name">${rank.name}</span>
          <span class="rank-tile-range">${rankRangeLabel(index)}</span>
        </button>
      </li>`
  ).join('')
  ranksGrid.querySelectorAll<HTMLButtonElement>('.rank-tile').forEach((tile) => {
    tile.addEventListener('click', () => travelTo(Number(tile.dataset.rankIndex)))
  })
}

function buildProgressTrack(): void {
  progressTrack.innerHTML = Array.from({ length: PROGRESS_SEGMENTS }, () => '<span class="segment"></span>').join('')
}

function renderProgress(progress: RankProgress): void {
  const rank = RANKS[progress.rankIndex]
  const filled = Math.round(progress.fractionToNext * PROGRESS_SEGMENTS)
  progressTrack.style.setProperty('--rank-color', rank.color)
  progressTrack.style.setProperty('--rank-glow', rank.glow)
  progressTrack.querySelectorAll('.segment').forEach((segment, index) => segment.classList.toggle('is-filled', index < filled))
  progressTrack.setAttribute('aria-valuenow', String(Math.round(progress.fractionToNext * 100)))
  progressNext.textContent =
    progress.winsToNext === null ? 'Topo alcançado' : `Faltam ${progress.winsToNext} para ${progress.nextRankName}`
  balanceLabel.textContent = formatBalance(progress.balance)
  balanceLabel.dataset.sign = progress.balance > 0 ? 'positive' : progress.balance < 0 ? 'negative' : 'zero'
}

function renderHud(progress: RankProgress): void {
  hudEmblem.src = emblemUrls[progress.rankIndex]
  hudRankName.textContent = progress.level
  hudRankName.style.setProperty('--rank-glow', RANKS[progress.rankIndex].glow)
  hudRankRange.textContent = `${rankRangeLabel(progress.rankIndex)} vitórias`
  ranksGrid.querySelectorAll<HTMLButtonElement>('.rank-tile').forEach((tile) => {
    const index = Number(tile.dataset.rankIndex)
    tile.classList.toggle('is-locked', index > progress.rankIndex)
    tile.classList.toggle('is-current', index === progress.rankIndex)
    tile.setAttribute('aria-label', `${RANKS[index].name}: ${rankRangeLabel(index)} vitórias${index === progress.rankIndex ? ', patente atual' : ''}. Ir até lá.`)
  })
}

function render(): RankProgress {
  const progress = evaluateRank(record.wins, record.losses)
  if (document.activeElement !== winsInput) winsInput.value = String(record.wins)
  if (document.activeElement !== lossesInput) lossesInput.value = String(record.losses)
  renderProgress(progress)
  renderHud(progress)
  scene.setRank(progress.rankIndex)
  scene.walker.target = pathDistance(progress)
  saveRecord(record)
  return progress
}

function sayPendingMessage(): void {
  const progress = evaluateRank(record.wins, record.losses)
  const kindToSay =
    progress.rankIndex > settledRankIndex ? 'rankUp' : progress.rankIndex < settledRankIndex ? 'rankDown' : pendingKind
  settledRankIndex = progress.rankIndex
  dialog.say(composeMessage(kindToSay, progress, record.wins))
}

function scheduleMessage(kind: ChangeKind): void {
  pendingKind = kind
  if (messageTimer !== null) window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    messageTimer = null
    const rankChanged = evaluateRank(record.wins, record.losses).rankIndex !== settledRankIndex
    if (rankChanged && scene.walker.isWalking) {
      awaitingArrival = true
      return
    }
    sayPendingMessage()
  }, 260)
}

function clampCount(value: number): number {
  return Math.min(MAX_COUNT, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)))
}

function setWins(value: number): void {
  const next = clampCount(value)
  if (next === record.wins) return
  const kind: ChangeKind = next > record.wins ? 'win' : 'winUndo'
  audio.play(kind === 'win' ? 'win' : 'undo')
  record.wins = next
  render()
  scheduleMessage(kind)
}

function setLosses(value: number): void {
  const next = clampCount(value)
  if (next === record.losses) return
  const kind: ChangeKind = next > record.losses ? 'loss' : 'lossUndo'
  audio.play(kind === 'loss' ? 'loss' : 'undo')
  record.losses = next
  render()
  scheduleMessage(kind)
}

function travelTo(rankIndex: number): void {
  audio.play('select')
  setWins(RANKS[rankIndex].min)
}

function showToast(rankIndex: number): void {
  toastEmblem.src = emblemUrls[rankIndex]
  toastName.textContent = RANKS[rankIndex].name
  toast.style.setProperty('--rank-glow', RANKS[rankIndex].glow)
  toast.classList.remove('is-visible')
  void toast.offsetWidth
  toast.classList.add('is-visible')
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200)
}

function bindCounters(): void {
  bindHoldButton(element('wins-inc'), () => setWins(record.wins + 1))
  bindHoldButton(element('wins-dec'), () => setWins(record.wins - 1))
  bindHoldButton(element('losses-inc'), () => setLosses(record.losses + 1))
  bindHoldButton(element('losses-dec'), () => setLosses(record.losses - 1))
  winsInput.addEventListener('input', () => setWins(Number.parseInt(winsInput.value, 10)))
  lossesInput.addEventListener('input', () => setLosses(Number.parseInt(lossesInput.value, 10)))
  ;[winsInput, lossesInput].forEach((input) => {
    input.addEventListener('focus', () => input.select())
    input.addEventListener('blur', () => render())
  })
}

function bindToggle(id: string, onChange: (enabled: boolean) => void): void {
  const button = element<HTMLButtonElement>(id)
  button.addEventListener('click', () => {
    const enabled = button.getAttribute('aria-pressed') !== 'true'
    button.setAttribute('aria-pressed', String(enabled))
    onChange(enabled)
  })
}

function bindActions(): void {
  bindToggle('music-toggle', (enabled) => audio.setMusic(enabled))
  bindToggle('sfx-toggle', (enabled) => {
    audio.setSfx(enabled)
    audio.play('select')
  })
  element('phase-button').addEventListener('click', () => scene.skipToNextPhase())
  element('dialog').addEventListener('click', () => dialog.finish())
  const shareButton = element<HTMLButtonElement>('share-button')
  shareButton.addEventListener('click', async () => {
    const original = shareButton.textContent
    try {
      await navigator.clipboard.writeText(shareUrl(record))
      shareButton.textContent = 'Link copiado!'
    } catch {
      shareButton.textContent = 'Não deu para copiar'
    }
    window.setTimeout(() => (shareButton.textContent = original), 1800)
  })
  element('reset-button').addEventListener('click', () => {
    record.wins = 0
    record.losses = 0
    render()
    scheduleMessage('winUndo')
  })
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return
    if (event.key === 'ArrowUp') setWins(record.wins + 1)
    if (event.key === 'ArrowDown') setWins(record.wins - 1)
  })
}

function bindScene(): void {
  scene.walker.onCross((stationIndex, direction) => {
    if (direction === 1 && stationIndex > 0) {
      scene.celebrate(stationIndex)
      audio.play('rankUp')
      showToast(stationIndex)
    }
    if (direction === -1) audio.play('rankDown')
  })
  scene.walker.onStep(() => audio.play('step'))
  scene.walker.onArrive(() => {
    if (!awaitingArrival) return
    awaitingArrival = false
    sayPendingMessage()
  })
  scene.onPhaseChange((label) => (phaseLabel.textContent = label))
  new ResizeObserver(([entry]) => scene.resize(entry.contentRect.width, entry.contentRect.height)).observe(stage)
}

function paintPortrait(): void {
  const portrait = element<HTMLCanvasElement>('dialog-portrait')
  context2d(portrait).drawImage(buildOwlPortrait(), 0, 0)
}

function boot(): void {
  element<HTMLImageElement>('brand-mark').src = emblemUrls[3]
  buildRanksGrid()
  buildProgressTrack()
  paintPortrait()
  bindCounters()
  bindActions()
  bindScene()
  const progress = render()
  scene.walker.place(pathDistance(progress))
  scene.snapCamera()
  scene.start()
  dialog.say(composeMessage('intro', progress, record.wins))
}

boot()
