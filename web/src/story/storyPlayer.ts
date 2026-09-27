import type { Chiptune } from '../audio/chiptune'
import { foeSprite } from '../art/foes'
import { gearIcon } from '../art/gearIcons'
import { heroPortrait } from '../art/hero'
import { buildOwlPortrait } from '../art/props'
import type { GearId, GearItem } from '../game/gear'
import { SPEAKER_NAMES, type Actor, type Speaker, type StoryScene } from '../game/story'
import { foeFrame, heroFrame, heroSprites, idleLift, owlFrame, type HeroSprites } from '../stage/sprites'
import { Theater, type ActorPose } from '../stage/theater'
import { Dialog } from '../ui/dialog'
import { element, isActivationKey, paintInto } from '../ui/dom'

export interface StoryOptions {
  gear: GearId[]
  rewards: GearItem[]
}

const ACTOR_SLOTS: Record<number, number[]> = { 1: [0.68], 2: [0.58, 0.8] }

export class StoryPlayer {
  private readonly overlay = element('story')
  private readonly theater: Theater
  private readonly dialog: Dialog
  private readonly portrait = element<HTMLCanvasElement>('story-portrait')
  private readonly speakerLabel = element('story-speaker')
  private readonly counter = element('story-count')
  private readonly box = element('story-box')
  private readonly audio: Chiptune
  private scene: StoryScene | null = null
  private hero: HeroSprites = heroSprites([])
  private gear: GearId[] = []
  private index = 0
  private clock = 0
  private frameId: number | null = null
  private settle: (() => void) | null = null
  private previousFocus: HTMLElement | null = null

  constructor(audio: Chiptune) {
    this.audio = audio
    this.theater = new Theater(element<HTMLCanvasElement>('story-canvas'))
    this.dialog = new Dialog(element('story-text'), () => audio.play('text'))
    const stage = element('story-stage')
    new ResizeObserver(([entry]) => this.theater.resize(entry.contentRect.width, entry.contentRect.height)).observe(stage)
    this.bindInput()
  }

  get isOpen(): boolean {
    return !this.overlay.hidden
  }

  play(scene: StoryScene, options: StoryOptions): Promise<void> {
    this.scene = scene
    this.gear = options.gear
    this.hero = heroSprites(options.gear)
    this.index = 0
    this.theater.setBackdrop(scene.backdrop)
    element('story-eyebrow').textContent = scene.eyebrow
    element('story-title').textContent = scene.title
    this.renderRewards(options.rewards)
    this.previousFocus = document.activeElement as HTMLElement | null
    this.overlay.hidden = false
    document.body.classList.add('has-overlay')
    requestAnimationFrame(() => this.overlay.classList.add('is-open'))
    this.showLine()
    this.startLoop()
    element('story-next').focus({ preventScroll: true })
    return new Promise((resolve) => (this.settle = resolve))
  }

  private renderRewards(rewards: GearItem[]): void {
    const holder = element('story-rewards')
    holder.replaceChildren(
      ...rewards.map((item) => {
        const chip = document.createElement('span')
        chip.className = 'reward-chip'
        const icon = document.createElement('canvas')
        paintInto(icon, gearIcon(item.id))
        const text = document.createElement('span')
        text.innerHTML = `<small>Novo equipamento</small><strong>${item.name}</strong><em>${item.perk}</em>`
        chip.append(icon, text)
        return chip
      })
    )
    holder.hidden = rewards.length === 0
    if (rewards.length > 0) this.audio.play('gear')
  }

  private bindInput(): void {
    element('story-next').addEventListener('click', () => this.advance())
    this.box.addEventListener('click', (event) => {
      if (!(event.target as HTMLElement).closest('button')) this.advance()
    })
    element('story-skip').addEventListener('click', () => this.finish())
    window.addEventListener('keydown', (event) => {
      if (!this.isOpen) return
      if (event.key === 'Escape') {
        event.preventDefault()
        this.finish()
        return
      }
      if (!isActivationKey(event) || event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      this.advance()
    })
  }

  private advance(): void {
    if (this.dialog.isTyping) {
      this.dialog.finish()
      return
    }
    if (!this.scene) return
    if (this.index >= this.scene.lines.length - 1) {
      this.finish()
      return
    }
    this.index++
    this.audio.play('select')
    this.showLine()
  }

  private showLine(): void {
    const scene = this.scene
    if (!scene) return
    const line = scene.lines[this.index]
    this.speakerLabel.textContent = SPEAKER_NAMES[line.speaker]
    this.box.dataset.speaker = line.speaker
    this.counter.textContent = `${this.index + 1}/${scene.lines.length}`
    element('story-next-label').textContent = this.index === scene.lines.length - 1 ? 'Seguir viagem' : 'Continuar'
    this.paintPortrait(line.speaker)
    this.dialog.say(line.text)
  }

  private paintPortrait(speaker: Speaker): void {
    this.portrait.hidden = speaker === 'narrador'
    if (speaker === 'coruja') paintInto(this.portrait, buildOwlPortrait())
    if (speaker === 'corvo') paintInto(this.portrait, foeSprite('reiCorvo'))
    if (speaker === 'heroi') paintInto(this.portrait, heroPortrait(this.gear))
  }

  private finish(): void {
    this.dialog.finish()
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
    this.overlay.classList.remove('is-open')
    this.overlay.hidden = true
    document.body.classList.remove('has-overlay')
    this.previousFocus?.focus()
    this.settle?.()
    this.settle = null
  }

  private startLoop(): void {
    let previous = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000))
      previous = now
      this.clock += dt
      this.theater.render(this.clock, dt, this.poses())
      this.frameId = requestAnimationFrame(frame)
    }
    this.frameId = requestAnimationFrame(frame)
  }

  private poses(): ActorPose[] {
    const scene = this.scene
    if (!scene) return []
    const speaker = scene.lines[this.index].speaker
    const heroSpeaking = speaker === 'heroi'
    const hero: ActorPose = {
      sprite: heroFrame(this.hero, Math.floor(this.clock * 2) % 2 === 0 ? 'idle0' : 'idle1'),
      centerX: this.theater.xAt(0.26),
      lift: heroSpeaking ? Math.round(Math.abs(Math.sin(this.clock * 5)) * 2) : 0,
      flashing: false,
      alpha: 1
    }
    const slots = ACTOR_SLOTS[scene.cast.length] ?? ACTOR_SLOTS[1]
    return [hero, ...scene.cast.map((actor, index) => this.actorPose(actor, slots[index], speaker === actor))]
  }

  private actorPose(actor: Actor, share: number, speaking: boolean): ActorPose {
    const sprite = actor === 'coruja' ? owlFrame() : foeFrame('reiCorvo')
    const base = actor === 'coruja' ? 2 : 0
    return {
      sprite,
      centerX: this.theater.xAt(share),
      lift: base + (speaking ? Math.round(Math.abs(Math.sin(this.clock * 5)) * 2) : idleLift('coruja', this.clock, share * 10)),
      flashing: false,
      alpha: 1
    }
  }
}
