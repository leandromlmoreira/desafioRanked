import { emblemDataUrl } from '../art/emblems'
import { buildOwlPortrait } from '../art/props'
import { Chiptune } from '../audio/chiptune'
import type { GearId } from '../game/gear'
import { context2d } from '../pixel/canvas'
import { RANKS, rankRangeLabel, type RankProgress } from '../rankTier'
import { Dialog } from '../ui/dialog'
import { element } from '../ui/dom'
import { STATION_DISTANCES } from '../world/layout'
import { Scene } from '../world/scene'

export const EMBLEM_URLS = RANKS.map((_, index) => emblemDataUrl(index))

export function pathDistance(progress: RankProgress): number {
  const start = STATION_DISTANCES[progress.rankIndex]
  const end = STATION_DISTANCES[progress.rankIndex + 1]
  return end === undefined ? start : start + (end - start) * progress.fractionToNext
}

export class Shell {
  readonly audio = new Chiptune()
  readonly scene = new Scene(element<HTMLCanvasElement>('scene'))
  readonly dialog = new Dialog(element('dialog-text'), () => this.audio.play('text'))
  private readonly toast = element('rank-toast')
  private toastTimer: number | null = null
  private arrivals: Array<() => void> = []

  constructor() {
    element<HTMLImageElement>('brand-mark').src = EMBLEM_URLS[3]
    context2d(element<HTMLCanvasElement>('dialog-portrait')).drawImage(buildOwlPortrait(), 0, 0)
    this.bindScene()
  }

  showProgress(progress: RankProgress, eyebrow: string, gear: GearId[]): void {
    element<HTMLImageElement>('hud-emblem').src = EMBLEM_URLS[progress.rankIndex]
    element('hud-eyebrow').textContent = eyebrow
    const name = element('hud-rank-name')
    name.textContent = progress.level
    name.style.setProperty('--rank-glow', RANKS[progress.rankIndex].glow)
    element('hud-rank-range').textContent = `${rankRangeLabel(progress.rankIndex)} vitórias`
    this.scene.setRank(progress.rankIndex)
    this.scene.setGear(gear)
    this.scene.walker.target = pathDistance(progress)
  }

  placeHero(progress: RankProgress): void {
    this.scene.walker.place(pathDistance(progress))
    this.scene.snapCamera()
  }

  arrival(): Promise<void> {
    if (!this.scene.walker.isWalking) return Promise.resolve()
    return new Promise((resolve) => {
      const timer = window.setTimeout(resolve, 6000)
      this.arrivals.push(() => {
        window.clearTimeout(timer)
        resolve()
      })
    })
  }

  start(): void {
    this.scene.start()
  }

  private showToast(rankIndex: number): void {
    element<HTMLImageElement>('rank-toast-emblem').src = EMBLEM_URLS[rankIndex]
    element('rank-toast-name').textContent = RANKS[rankIndex].name
    this.toast.style.setProperty('--rank-glow', RANKS[rankIndex].glow)
    this.toast.classList.remove('is-visible')
    void this.toast.offsetWidth
    this.toast.classList.add('is-visible')
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('is-visible'), 2200)
  }

  private bindScene(): void {
    const { scene, audio } = this
    scene.walker.onCross((stationIndex, direction) => {
      if (direction === 1 && stationIndex > 0) {
        scene.celebrate(stationIndex)
        audio.play('rankUp')
        this.showToast(stationIndex)
      }
      if (direction === -1) audio.play('rankDown')
    })
    scene.walker.onStep(() => audio.play('step'))
    scene.walker.onArrive(() => {
      const pending = this.arrivals
      this.arrivals = []
      pending.forEach((resolve) => resolve())
    })
    scene.onPhaseChange((label) => (element('phase-label').textContent = label))
    element('phase-button').addEventListener('click', () => scene.skipToNextPhase())
    element('dialog').addEventListener('click', () => this.dialog.finish())
    new ResizeObserver(([entry]) => scene.resize(entry.contentRect.width, entry.contentRect.height)).observe(element('stage'))
    this.bindToggle('music-toggle', (enabled) => audio.setMusic(enabled))
    this.bindToggle('sfx-toggle', (enabled) => {
      audio.setSfx(enabled)
      audio.play('select')
    })
  }

  private bindToggle(id: string, onChange: (enabled: boolean) => void): void {
    const button = element<HTMLButtonElement>(id)
    button.addEventListener('click', () => {
      const enabled = button.getAttribute('aria-pressed') !== 'true'
      button.setAttribute('aria-pressed', String(enabled))
      onChange(enabled)
    })
  }
}
