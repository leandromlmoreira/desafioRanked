import { rgbToCss, type Rgb } from '../pixel/color'
import { seededRandom } from '../pixel/canvas'
import type { Ambience } from './ambience'

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
]

const SKY_BANDS = 9

export interface View {
  width: number
  height: number
  cameraX: number
  cameraY: number
  rise: number
  time: number
}

interface Star {
  x: number
  y: number
  phase: number
  bright: boolean
}

interface Cloud {
  x: number
  y: number
  width: number
  speed: number
}

const random = seededRandom(1337)

const STARS: Star[] = Array.from({ length: 90 }, () => ({
  x: random() * 900,
  y: random() * 200,
  phase: random() * Math.PI * 2,
  bright: random() > 0.85
}))

const CLOUDS: Cloud[] = Array.from({ length: 7 }, (_, index) => ({
  x: random() * 700,
  y: 18 + random() * 90 + (index % 2) * 20,
  width: 22 + Math.floor(random() * 26),
  speed: 1.5 + random() * 2.5
}))

function bandColor(ambience: Ambience, value: number): Rgb {
  const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ]
  return value < 0.55
    ? lerp(ambience.skyTop, ambience.skyMiddle, value / 0.55)
    : lerp(ambience.skyMiddle, ambience.skyBottom, (value - 0.55) / 0.45)
}

export function paintSky(ctx: CanvasRenderingContext2D, image: ImageData, view: View, ambience: Ambience): void {
  const bands = Array.from({ length: SKY_BANDS }, (_, index) => bandColor(ambience, index / (SKY_BANDS - 1)))
  const span = view.height * 1.1 + view.rise * 0.08
  for (let y = 0; y < view.height; y++) {
    const value = Math.min(1, Math.max(0, (y + view.rise * 0.08 - view.height * 0.05) / span))
    const scaled = value * (SKY_BANDS - 1)
    const lower = Math.floor(scaled)
    const fraction = scaled - lower
    for (let x = 0; x < view.width; x++) {
      const pick = fraction * 16 > BAYER[y % 4][x % 4] ? Math.min(SKY_BANDS - 1, lower + 1) : lower
      const [r, g, b] = bands[pick]
      const offset = (y * view.width + x) * 4
      image.data[offset] = r
      image.data[offset + 1] = g
      image.data[offset + 2] = b
      image.data[offset + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

export function paintStars(ctx: CanvasRenderingContext2D, view: View, ambience: Ambience): void {
  const visibility = Math.min(1, Math.max(0, (ambience.darkness - 0.4) / 0.3))
  if (visibility <= 0) return
  STARS.forEach((star) => {
    const x = Math.round((star.x - view.cameraX * 0.04) % (view.width + 40))
    const y = Math.round(star.y - view.height * 0.1 + view.rise * 0.05)
    if (y > view.height * 0.7) return
    const twinkle = (Math.sin(view.time * 2.2 + star.phase) + 1) / 2
    ctx.globalAlpha = visibility * (0.35 + twinkle * 0.65)
    ctx.fillStyle = star.bright ? '#fff6d8' : '#c9d2ff'
    ctx.fillRect(x, y, 1, 1)
    if (star.bright && twinkle > 0.7) {
      ctx.globalAlpha = visibility * 0.5
      ctx.fillRect(x - 1, y, 3, 1)
      ctx.fillRect(x, y - 1, 1, 3)
    }
  })
  ctx.globalAlpha = 1
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
  ctx.fillStyle = color
  for (let y = -radius; y <= radius; y++) {
    const half = Math.round(Math.sqrt(radius * radius - y * y))
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1)
  }
}

function celestialPosition(view: View, progress: number): [number, number] {
  const x = Math.round(view.width * (0.12 + progress * 0.76))
  const y = Math.round(view.height * 0.58 - Math.sin(progress * Math.PI) * view.height * 0.46 + view.rise * 0.06)
  return [x, y]
}

export function paintSunAndMoon(ctx: CanvasRenderingContext2D, view: View, ambience: Ambience): void {
  if (ambience.sunProgress !== null) {
    const [x, y] = celestialPosition(view, ambience.sunProgress)
    ctx.globalAlpha = 0.18
    disc(ctx, x, y, 16, '#fff1c1')
    ctx.globalAlpha = 0.3
    disc(ctx, x, y, 11, '#ffe39a')
    ctx.globalAlpha = 1
    disc(ctx, x, y, 7, ambience.warmth > 0.5 ? '#ffb86b' : '#fff4c9')
    disc(ctx, x - 1, y - 1, 4, '#fffbe8')
  }
  if (ambience.moonProgress !== null) {
    const [x, y] = celestialPosition(view, ambience.moonProgress)
    ctx.globalAlpha = 0.14
    disc(ctx, x, y, 13, '#c9d2ff')
    ctx.globalAlpha = 1
    disc(ctx, x, y, 6, '#f4f1ff')
    disc(ctx, x + 3, y - 2, 5, rgbToCss(ambience.skyTop))
    ctx.fillStyle = '#d6d0f0'
    ctx.fillRect(x - 3, y + 1, 1, 1)
    ctx.fillRect(x - 4, y - 2, 1, 1)
  }
}

function farRangeHeight(x: number): number {
  const ridge = Math.abs(Math.sin(x * 0.021 + 0.4)) * 34 + Math.abs(Math.sin(x * 0.047 + 2)) * 16
  return 18 + ridge + Math.sin(x * 0.19) * 2
}

function hillsHeight(x: number): number {
  const base = 16 + Math.sin(x * 0.028) * 8 + Math.sin(x * 0.067 + 1.2) * 5
  const treeCenter = Math.round(x / 7) * 7 + Math.sin(Math.round(x / 7) * 12.9) * 2
  const tree = Math.max(0, 7 - Math.abs(x - treeCenter) * 2.1) * (Math.sin(Math.round(x / 7) * 3.7) > -0.2 ? 1 : 0)
  return base + tree
}

function paintRange(
  ctx: CanvasRenderingContext2D,
  view: View,
  factor: number,
  baseline: number,
  height: (x: number) => number,
  lit: Rgb,
  shade: Rgb,
  snow: Rgb | null
): void {
  const baseY = Math.round(baseline + view.rise * factor)
  const litCss = rgbToCss(lit)
  const shadeCss = rgbToCss(shade)
  const snowCss = snow ? rgbToCss(snow) : ''
  for (let sx = 0; sx < view.width; sx++) {
    const layerX = sx + view.cameraX * factor
    const h = height(layerX)
    const top = Math.round(baseY - h)
    if (top >= view.height) continue
    ctx.fillStyle = h >= height(layerX - 1) ? litCss : shadeCss
    ctx.fillRect(sx, top, 1, view.height - top)
    if (snow && h > 52) {
      ctx.fillStyle = snowCss
      ctx.fillRect(sx, top, 1, Math.min(4, Math.round(h - 50)))
    }
  }
}

export function paintFarRanges(ctx: CanvasRenderingContext2D, view: View, ambience: Ambience): void {
  paintRange(ctx, view, 0.16, view.height * 0.6, farRangeHeight, ambience.farRange, ambience.farRangeShade, ambience.cloud)
}

export function paintHills(ctx: CanvasRenderingContext2D, view: View, ambience: Ambience): void {
  paintRange(ctx, view, 0.42, view.height * 0.86, hillsHeight, ambience.hills, ambience.hillsShade, null)
}

function paintCloud(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, light: string, shade: string): void {
  const puffs = [
    [0.18, 4, 5],
    [0.42, 7, 8],
    [0.68, 5, 6],
    [0.85, 3, 4]
  ]
  puffs.forEach(([at, radius]) => disc(ctx, Math.round(x + width * at), y - radius + 5, radius, light))
  ctx.fillStyle = light
  ctx.fillRect(x, y + 1, width, 4)
  ctx.fillStyle = shade
  ctx.fillRect(x + 2, y + 4, width - 4, 2)
}

export function paintClouds(ctx: CanvasRenderingContext2D, view: View, ambience: Ambience): void {
  const light = rgbToCss(ambience.cloud)
  const shade = rgbToCss(ambience.cloudShade)
  ctx.globalAlpha = 1 - ambience.darkness * 0.5
  CLOUDS.forEach((cloud) => {
    const span = view.width + 120
    const drift = cloud.x + view.time * cloud.speed - view.cameraX * 0.25
    const x = Math.round((((drift % span) + span) % span) - 60)
    const y = Math.round(cloud.y + view.rise * 0.22)
    if (y > view.height) return
    paintCloud(ctx, x, y, cloud.width, light, shade)
  })
  ctx.globalAlpha = 1
}
