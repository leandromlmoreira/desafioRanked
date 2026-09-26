import { context2d, createCanvas } from '../pixel/canvas'
import { rgbToCss, type Rgb } from '../pixel/color'

export class LitLayer {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private readonly mask: HTMLCanvasElement
  private readonly maskCtx: CanvasRenderingContext2D

  constructor(width: number, height: number) {
    this.canvas = createCanvas(width, height)
    this.ctx = context2d(this.canvas)
    this.mask = createCanvas(width, height)
    this.maskCtx = context2d(this.mask)
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.mask.width = width
    this.mask.height = height
    this.ctx.imageSmoothingEnabled = false
    this.maskCtx.imageSmoothingEnabled = false
  }

  clear(): void {
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  applyLight(light: Rgb): void {
    const { width, height } = this.canvas
    this.maskCtx.clearRect(0, 0, width, height)
    this.maskCtx.drawImage(this.canvas, 0, 0)
    this.ctx.globalCompositeOperation = 'multiply'
    this.ctx.fillStyle = rgbToCss(light)
    this.ctx.fillRect(0, 0, width, height)
    this.ctx.globalCompositeOperation = 'destination-in'
    this.ctx.drawImage(this.mask, 0, 0)
    this.ctx.globalCompositeOperation = 'source-over'
  }
}
