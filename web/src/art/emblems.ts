import { createCanvas, context2d } from '../pixel/canvas'
import {
  circle,
  heater,
  mirror,
  paintMaterial,
  polygon,
  rect,
  sparkle,
  subtract,
  union,
  type Mask,
  type Material
} from './masks'

export const EMBLEM_SIZE = 32

const IRON: Material = { outline: '#1e1b24', dark: '#4b4f58', base: '#7b808a', light: '#aeb4bd', shine: '#e3e7ec' }
const IRON_DARK: Material = { outline: '#1e1b24', dark: '#34373f', base: '#50545d', light: '#6f747e', shine: '#aeb4bd' }
const BRONZE: Material = { outline: '#2a160d', dark: '#7a4221', base: '#b8693a', light: '#e09a5f', shine: '#ffd2a1' }
const BRONZE_LIGHT: Material = { outline: '#4a2412', dark: '#b8693a', base: '#e09a5f', light: '#ffc58c', shine: '#fff0dc' }
const SILVER: Material = { outline: '#1f2430', dark: '#6c7688', base: '#aab4c3', light: '#dbe3ee', shine: '#ffffff' }
const STEEL_BLUE: Material = { outline: '#1f2430', dark: '#3f4f75', base: '#5b6f9e', light: '#8497c7', shine: '#c7d3f2' }
const GOLD: Material = { outline: '#2e1d05', dark: '#9a6a0c', base: '#e0a81c', light: '#ffd65a', shine: '#fff4c2' }
const RUBY: Material = { outline: '#2a0710', dark: '#8a1630', base: '#d6334f', light: '#ff7b8c', shine: '#ffd0d6' }
const LEAF: Material = { outline: '#1d2a0d', dark: '#4f7a1f', base: '#7fae2e', light: '#b9dc5a', shine: '#eaffb0' }
const DIAMOND: Material = { outline: '#0d2a33', dark: '#1f7f97', base: '#45c6dc', light: '#9cefff', shine: '#ffffff' }
const AMETHYST: Material = { outline: '#1f0f33', dark: '#5b2c9a', base: '#8f55e0', light: '#c49bff', shine: '#f3e6ff' }
const FEATHER: Material = { outline: '#2b1f45', dark: '#b7a6e0', base: '#e6dcff', light: '#ffffff', shine: '#ffffff' }
const FIRE: Material = { outline: '#3a0d05', dark: '#d1461f', base: '#ff7a2e', light: '#ffc14d', shine: '#fff1a8' }

function star(cx: number, cy: number, outer: number, inner: number): Mask {
  const points: Array<[number, number]> = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
  }
  return polygon(points)
}

function chevron(top: number, thickness: number, halfWidth: number): Mask {
  return polygon([
    [16 - halfWidth, top + 8],
    [16, top],
    [16 + halfWidth, top + 8],
    [16 + halfWidth, top + 8 + thickness],
    [16, top + thickness],
    [16 - halfWidth, top + 8 + thickness]
  ])
}

const inset = (material: Material): Material => ({ ...material, outline: material.dark })

const within =
  (mask: Mask, clip: Mask): Mask =>
  (x, y) =>
    mask(x, y) && clip(x, y)

function paint(ctx: CanvasRenderingContext2D, mask: Mask, material: Material, bevel = true): void {
  paintMaterial(ctx, mask, material, EMBLEM_SIZE, bevel)
}

function rivet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = IRON.shine
  ctx.fillRect(x, y, 1, 1)
  ctx.fillStyle = IRON.outline
  ctx.fillRect(x, y + 1, 1, 1)
}

function drawIron(ctx: CanvasRenderingContext2D): void {
  paint(ctx, circle(16, 16.5, 13), IRON)
  paint(ctx, within(rect(3, 14, 28, 18), circle(16, 16.5, 12)), IRON_DARK)
  paint(ctx, circle(16, 16.5, 5), IRON)
  paint(ctx, circle(16, 16.5, 2.5), { ...SILVER, outline: IRON.dark })
  ;[
    [16, 5],
    [16, 26],
    [7, 9],
    [24, 9],
    [7, 23],
    [24, 23]
  ].forEach(([x, y]) => rivet(ctx, x, y))
}

function drawBronze(ctx: CanvasRenderingContext2D): void {
  paint(ctx, heater(16, 2, 12.5, 28), BRONZE)
  paint(ctx, heater(16, 4.5, 10, 24), inset(BRONZE))
  paint(ctx, within(chevron(12, 5, 13), heater(16, 4.5, 10, 24)), BRONZE_LIGHT)
  ;[
    [6, 5],
    [25, 5],
    [16, 28]
  ].forEach(([x, y]) => rivet(ctx, x, y))
}

function drawSilver(ctx: CanvasRenderingContext2D): void {
  paint(ctx, heater(16, 2, 12.5, 28), SILVER)
  paint(ctx, heater(16, 4.5, 10, 24), inset(SILVER))
  paint(ctx, within(heater(16, 4.5, 10, 24), rect(0, 18, 31, 31)), STEEL_BLUE)
  paint(ctx, within(chevron(16, 3, 12), heater(16, 4.5, 10, 24)), inset(SILVER))
  paint(ctx, star(16, 10.5, 5.5, 2.4), GOLD)
  sparkle(ctx, 26, 4, '#ffffff')
}

function drawGold(ctx: CanvasRenderingContext2D): void {
  const leaf = (cx: number, cy: number) => circle(cx, cy, 2.3)
  const laurel = mirror(union(leaf(5, 25), leaf(4, 20), leaf(4, 15), leaf(6, 11), leaf(7.5, 28)), 16)
  paint(ctx, laurel, LEAF)
  paint(ctx, heater(16, 9, 10, 21), GOLD)
  paint(ctx, heater(16, 11, 7.5, 17), inset(GOLD))
  paint(
    ctx,
    polygon([
      [9, 10],
      [9, 3],
      [12.5, 6],
      [16, 0.5],
      [19.5, 6],
      [23, 3],
      [23, 10]
    ]),
    GOLD
  )
  paint(ctx, circle(16, 7, 1.6), RUBY, false)
  paint(ctx, circle(16, 19, 4), RUBY)
  sparkle(ctx, 25, 13, '#fff4c2')
}

function drawDiamond(ctx: CanvasRenderingContext2D): void {
  const gem = polygon([
    [3, 12],
    [9.5, 4],
    [22.5, 4],
    [29, 12],
    [16, 30]
  ])
  for (let y = 0; y < EMBLEM_SIZE; y++) {
    for (let x = 0; x < EMBLEM_SIZE; x++) {
      if (!gem(x, y)) continue
      ctx.fillStyle = diamondFacet(gem, x, y)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  sparkle(ctx, 6, 5, '#ffffff')
  sparkle(ctx, 27, 22, '#9cefff')
  sparkle(ctx, 12, 8, '#ffffff')
}

function diamondFacet(gem: Mask, x: number, y: number): string {
  const isEdge = !gem(x - 1, y) || !gem(x + 1, y) || !gem(x, y - 1) || !gem(x, y + 1)
  if (isEdge) return DIAMOND.outline
  if (y === 12) return DIAMOND.dark
  if (y < 12) {
    if (x < 11) return DIAMOND.light
    if (x > 20) return DIAMOND.base
    return (x + y) % 2 === 0 ? DIAMOND.shine : DIAMOND.light
  }
  const leftLine = 16 - ((30 - y) / 18) * 6
  const rightLine = 16 + ((30 - y) / 18) * 6
  if (Math.abs(x + 0.5 - leftLine) < 0.6 || Math.abs(x + 0.5 - rightLine) < 0.6) return DIAMOND.dark
  if (x + 0.5 < leftLine) return DIAMOND.base
  if (x + 0.5 > rightLine) return DIAMOND.dark
  return DIAMOND.light
}

function drawLegendary(ctx: CanvasRenderingContext2D): void {
  const wing = polygon([
    [12, 10],
    [5, 5],
    [0.5, 6],
    [3, 10],
    [0.5, 12],
    [3.5, 16],
    [1.5, 18],
    [6, 21],
    [5, 23],
    [11, 22]
  ])
  paint(ctx, mirror(wing, 16), FEATHER)
  paint(ctx, heater(16, 6, 8.5, 23), AMETHYST)
  paint(ctx, heater(16, 8, 6.5, 19), inset(AMETHYST))
  paint(ctx, star(16, 16, 6, 2.6), GOLD)
  sparkle(ctx, 16, 2, '#f3e6ff')
}

function drawImmortal(ctx: CanvasRenderingContext2D): void {
  paint(ctx, subtract(circle(16, 15, 15), circle(16, 15, 12.5)), GOLD, false)
  paint(
    ctx,
    polygon([
      [5, 18],
      [5.5, 7],
      [9.5, 11],
      [11, 2],
      [14, 8],
      [16, 0.5],
      [18, 8],
      [21, 2],
      [22.5, 11],
      [26.5, 7],
      [27, 18]
    ]),
    FIRE
  )
  paint(ctx, heater(16, 11, 9.5, 20.5), GOLD)
  paint(ctx, heater(16, 13.5, 7, 16), RUBY)
  paint(
    ctx,
    polygon([
      [16, 15],
      [19.5, 20],
      [16, 25.5],
      [12.5, 20]
    ]),
    { ...FEATHER, outline: '#4a0d1a' }
  )
  sparkle(ctx, 27, 26, '#fff1a8')
}

const PAINTERS = [drawIron, drawBronze, drawSilver, drawGold, drawDiamond, drawLegendary, drawImmortal]

const cache = new Map<number, HTMLCanvasElement>()

export function emblemCanvas(rankIndex: number): HTMLCanvasElement {
  const cached = cache.get(rankIndex)
  if (cached) return cached
  const canvas = createCanvas(EMBLEM_SIZE, EMBLEM_SIZE)
  PAINTERS[Math.min(rankIndex, PAINTERS.length - 1)](context2d(canvas))
  cache.set(rankIndex, canvas)
  return canvas
}

export function emblemDataUrl(rankIndex: number): string {
  return emblemCanvas(rankIndex).toDataURL('image/png')
}
