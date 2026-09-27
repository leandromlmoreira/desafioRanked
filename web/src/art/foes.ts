import type { FoeId } from '../game/foes'
import { context2d, createCanvas } from '../pixel/canvas'
import { circle, mirror, paintMaterial, polygon, rect, subtract, union, type Mask, type Material } from './masks'

export const FOE_SIZE = 24

const MUD: Material = { outline: '#1f2a12', dark: '#56702c', base: '#86a345', light: '#b9d66a', shine: '#e6f7a8' }
const FUR: Material = { outline: '#1b1d2e', dark: '#4f5a78', base: '#8290b0', light: '#b7c3dc', shine: '#e3e9f5' }
const MUZZLE: Material = { outline: '#4f5a78', dark: '#c9d1e3', base: '#eef2f8', light: '#ffffff', shine: '#ffffff' }
const STONE: Material = { outline: '#1c1a22', dark: '#4f4b5c', base: '#7d7890', light: '#aaa5bd', shine: '#d9d4e8' }
const MOSS: Material = { outline: '#2f5a1f', dark: '#4f7a1f', base: '#7fae2e', light: '#b9dc5a', shine: '#eaffb0' }
const GOLD: Material = { outline: '#2e1d05', dark: '#9a6a0c', base: '#e0a81c', light: '#ffd65a', shine: '#fff4c2' }
const AMBER: Material = { outline: '#3a2305', dark: '#c77f12', base: '#f2b233', light: '#ffe08a', shine: '#fff4c2' }
const CRYSTAL: Material = { outline: '#0d2a33', dark: '#1f7f97', base: '#45c6dc', light: '#9cefff', shine: '#ffffff' }
const CROW: Material = { outline: '#0f0a18', dark: '#1d1830', base: '#342c52', light: '#544a7e', shine: '#8b80b8' }
const ROYAL: Material = { outline: '#1f0f33', dark: '#5b2c9a', base: '#8f55e0', light: '#c49bff', shine: '#f3e6ff' }

type Painter = (ctx: CanvasRenderingContext2D) => void

const floor = (mask: Mask): Mask => subtract(mask, rect(0, 23, FOE_SIZE, FOE_SIZE + 10))

function paint(ctx: CanvasRenderingContext2D, mask: Mask, material: Material, bevel = true): void {
  paintMaterial(ctx, mask, material, FOE_SIZE, bevel)
}

function dot(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, width = 1, height = 1): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

function eyes(ctx: CanvasRenderingContext2D, y: number, leftX: number, rightX: number, iris: string): void {
  dot(ctx, '#140f1f', leftX - 1, y - 1, 4, 4)
  dot(ctx, '#140f1f', rightX - 1, y - 1, 4, 4)
  dot(ctx, iris, leftX, y, 2, 2)
  dot(ctx, iris, rightX, y, 2, 2)
  dot(ctx, '#ffffff', leftX, y, 1, 1)
  dot(ctx, '#ffffff', rightX, y, 1, 1)
}

const paintGosmo: Painter = (ctx) => {
  paint(ctx, union(floor(circle(12, 18.5, 10)), circle(12, 8, 2.2)), MUD)
  dot(ctx, MUD.shine, 6, 12, 2, 1)
  dot(ctx, MUD.shine, 5, 13, 1, 2)
  dot(ctx, '#fff3dc', 7, 14, 3, 3)
  dot(ctx, '#fff3dc', 14, 14, 3, 3)
  dot(ctx, '#140f1f', 8, 15, 2, 2)
  dot(ctx, '#140f1f', 15, 15, 2, 2)
  dot(ctx, '#f4978e', 5, 18, 2, 1)
  dot(ctx, '#f4978e', 17, 18, 2, 1)
  dot(ctx, '#3a1f2a', 10, 18, 1, 1)
  dot(ctx, '#3a1f2a', 13, 18, 1, 1)
  dot(ctx, '#3a1f2a', 11, 19, 2, 1)
}

const paintUivo: Painter = (ctx) => {
  const ears = mirror(polygon([[5, 1], [11, 6], [5, 10]]), 12)
  paint(ctx, floor(circle(12, 20, 7.5)), FUR)
  paint(ctx, union(circle(12, 11, 6.5), ears), FUR)
  dot(ctx, '#f4978e', 6, 4, 1, 3)
  dot(ctx, '#f4978e', 17, 4, 1, 3)
  paint(ctx, circle(12, 15, 3.4), MUZZLE)
  paint(ctx, floor(circle(12, 21, 3.5)), MUZZLE, false)
  eyes(ctx, 10, 8, 14, '#ffd166')
  dot(ctx, '#140f1f', 11, 13, 2, 2)
  dot(ctx, '#140f1f', 11, 16, 2, 1)
}

const paintPedrusco: Painter = (ctx) => {
  const body = union(rect(5, 10, 18, 21), rect(2, 11, 5, 19), rect(18, 11, 21, 19), rect(6, 21, 10, 23), rect(13, 21, 17, 23))
  paint(ctx, body, STONE)
  paint(ctx, rect(7, 3, 16, 10), STONE)
  paint(ctx, union(rect(6, 2, 17, 4), rect(1, 10, 6, 12)), MOSS, false)
  paint(ctx, rect(17, 10, 22, 12), MOSS, false)
  dot(ctx, '#9cefff', 9, 6, 2, 1)
  dot(ctx, '#9cefff', 13, 6, 2, 1)
  dot(ctx, '#140f1f', 10, 8, 4, 1)
  dot(ctx, STONE.dark, 9, 13, 1, 3)
  dot(ctx, STONE.dark, 10, 16, 2, 1)
  dot(ctx, STONE.dark, 14, 18, 1, 2)
  dot(ctx, '#ff9ab0', 3, 9, 1, 1)
  dot(ctx, '#ffd166', 19, 9, 1, 1)
}

const paintPlumaria: Painter = (ctx) => {
  paint(ctx, mirror(polygon([[8, 11], [0, 5], [0, 15], [6, 19]]), 12), AMBER)
  paint(ctx, polygon([[9, 18], [15, 18], [17, 23], [7, 23]]), AMBER)
  paint(ctx, circle(12, 15, 5.5), GOLD)
  paint(ctx, union(circle(12, 8, 4.5), polygon([[10, 5], [12, 0], [14, 5]])), GOLD)
  eyes(ctx, 7, 9, 13, '#e8435e')
  dot(ctx, '#ff8a3d', 11, 9, 2, 2)
  dot(ctx, '#c2501d', 11, 11, 2, 1)
  dot(ctx, GOLD.shine, 10, 13, 2, 1)
}

const paintLumen: Painter = (ctx) => {
  const skirt = polygon([[5, 10], [19, 10], [19, 21], [16.5, 18], [14, 21], [12, 18.5], [10, 21], [7.5, 18], [5, 21]])
  paint(ctx, union(circle(12, 10, 7), skirt), CRYSTAL)
  dot(ctx, '#0d2a33', 8, 8, 2, 4)
  dot(ctx, '#0d2a33', 14, 8, 2, 4)
  dot(ctx, '#ffffff', 8, 8, 1, 1)
  dot(ctx, '#ffffff', 14, 8, 1, 1)
  dot(ctx, '#0d2a33', 11, 14, 2, 2)
  dot(ctx, CRYSTAL.shine, 7, 5, 2, 1)
  dot(ctx, CRYSTAL.shine, 6, 6, 1, 1)
}

function paintCrow(ctx: CanvasRenderingContext2D, iris: string): void {
  paint(ctx, floor(circle(12, 17, 7.5)), CROW)
  paint(ctx, mirror(polygon([[5, 12], [9, 11], [8, 21], [4, 20]]), 12), CROW)
  paint(ctx, circle(12, 8.5, 5.5), CROW)
  eyes(ctx, 7, 9, 13, iris)
  dot(ctx, '#ffb84d', 11, 10, 2, 1)
  dot(ctx, '#e0892a', 11, 11, 2, 1)
  dot(ctx, '#e0892a', 11, 12, 1, 1)
  dot(ctx, CROW.shine, 10, 15, 3, 1)
  dot(ctx, '#ffb84d', 9, 23, 2, 1)
  dot(ctx, '#ffb84d', 13, 23, 2, 1)
}

const paintSentinela: Painter = (ctx) => {
  dot(ctx, '#6b3f2a', 21, 3, 1, 21)
  dot(ctx, '#dbe3ee', 20, 1, 3, 2)
  dot(ctx, '#ffffff', 21, 0, 1, 1)
  paintCrow(ctx, '#ff6b6b')
  dot(ctx, '#e8435e', 7, 13, 10, 2)
  dot(ctx, '#a8233a', 7, 14, 10, 1)
}

const paintReiCorvo: Painter = (ctx) => {
  paint(ctx, polygon([[5, 9], [19, 9], [23, 24], [1, 24]]), ROYAL)
  paintCrow(ctx, '#ffd166')
  paint(ctx, union(rect(7, 2, 16, 4), polygon([[7, 3], [7, 0], [9, 3]]), polygon([[11, 3], [12, -1], [13, 3]]), polygon([[15, 3], [17, 0], [17, 3]])), GOLD, false)
  dot(ctx, '#e8435e', 11, 2, 2, 1)
  dot(ctx, '#ffd166', 7, 13, 10, 1)
}

const PAINTERS: Record<FoeId, Painter> = {
  gosmo: paintGosmo,
  uivo: paintUivo,
  pedrusco: paintPedrusco,
  plumaria: paintPlumaria,
  lumen: paintLumen,
  sentinela: paintSentinela,
  reiCorvo: paintReiCorvo
}

const cache = new Map<FoeId, HTMLCanvasElement>()

export function foeSprite(id: FoeId): HTMLCanvasElement {
  const cached = cache.get(id)
  if (cached) return cached
  const canvas = createCanvas(FOE_SIZE, FOE_SIZE)
  PAINTERS[id](context2d(canvas))
  cache.set(id, canvas)
  return canvas
}

export function silhouette(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = context2d(canvas)
  ctx.drawImage(source, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}
