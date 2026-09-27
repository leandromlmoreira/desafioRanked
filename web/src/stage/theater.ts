import { context2d, createCanvas } from '../pixel/canvas'
import { ParticleField } from '../world/particles'
import { animateBackdrop, paintBackdrop, type Arena } from './backdrops'

const TARGET_HEIGHT = 84
const MIN_SCALE = 3

export interface Sprite {
  image: CanvasImageSource
  flash?: CanvasImageSource
  sx: number
  sy: number
  width: number
  height: number
}

export interface ActorPose {
  sprite: Sprite
  centerX: number
  lift: number
  flashing: boolean
  alpha: number
}

export class Theater {
  readonly particles = new ParticleField()
  arena: Arena = { width: 1, height: 1, groundY: 1 }
  scale = MIN_SCALE
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly backdrop = createCanvas(1, 1)
  private backdropIndex = 0
  private shakeLeft = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = context2d(canvas)
  }

  resize(cssWidth: number, cssHeight: number): void {
    if (cssWidth <= 0 || cssHeight <= 0) return
    this.scale = Math.max(MIN_SCALE, Math.round(cssHeight / TARGET_HEIGHT))
    const width = Math.ceil(cssWidth / this.scale)
    const height = Math.ceil(cssHeight / this.scale)
    this.canvas.width = width
    this.canvas.height = height
    this.canvas.style.width = `${width * this.scale}px`
    this.canvas.style.height = `${height * this.scale}px`
    this.ctx.imageSmoothingEnabled = false
    this.arena = { width, height, groundY: Math.round(height * 0.8) }
    this.repaintBackdrop()
  }

  setBackdrop(index: number): void {
    this.backdropIndex = index
    this.repaintBackdrop()
  }

  shake(seconds: number): void {
    this.shakeLeft = Math.max(this.shakeLeft, seconds)
  }

  xAt(share: number): number {
    return Math.round(this.arena.width * share)
  }

  percentOf(x: number, y: number): { left: number; top: number } {
    return { left: (x / this.arena.width) * 100, top: (y / this.arena.height) * 100 }
  }

  render(time: number, dt: number, actors: ActorPose[]): void {
    this.particles.update(dt)
    this.shakeLeft = Math.max(0, this.shakeLeft - dt)
    const ctx = this.ctx
    const offsetX = this.shakeLeft > 0 ? Math.round((Math.random() - 0.5) * 3) : 0
    const offsetY = this.shakeLeft > 0 ? Math.round((Math.random() - 0.5) * 2) : 0
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY)
    ctx.drawImage(this.backdrop, 0, 0)
    animateBackdrop(ctx, this.backdropIndex, this.arena, time)
    actors.forEach((actor) => this.drawShadow(actor))
    actors.forEach((actor) => this.drawActor(actor))
    this.particles.draw(ctx, 0, 0, false)
    ctx.globalCompositeOperation = 'lighter'
    this.particles.draw(ctx, 0, 0, true)
    ctx.globalCompositeOperation = 'source-over'
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private repaintBackdrop(): void {
    this.backdrop.width = this.arena.width
    this.backdrop.height = this.arena.height
    paintBackdrop(context2d(this.backdrop), this.backdropIndex, this.arena)
  }

  private drawShadow(actor: ActorPose): void {
    const width = Math.max(4, Math.round(actor.sprite.width * 0.5 - actor.lift * 0.3))
    this.ctx.fillStyle = 'rgba(20, 10, 30, 0.35)'
    this.ctx.fillRect(Math.round(actor.centerX - width / 2), this.arena.groundY, width, 1)
  }

  private drawActor({ sprite, centerX, lift, flashing, alpha }: ActorPose): void {
    if (alpha <= 0) return
    const x = Math.round(centerX - sprite.width / 2)
    const y = Math.round(this.arena.groundY - sprite.height - lift) + 1
    const image = flashing && sprite.flash ? sprite.flash : sprite.image
    this.ctx.globalAlpha = alpha
    this.ctx.drawImage(image, sprite.sx, sprite.sy, sprite.width, sprite.height, x, y, sprite.width, sprite.height)
    this.ctx.globalAlpha = 1
  }
}
