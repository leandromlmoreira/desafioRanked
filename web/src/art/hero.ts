import type { GearId } from '../game/gear'
import { createCanvas, context2d, flipHorizontally, paintPixelMap, type Palette } from '../pixel/canvas'
import { GEAR_LAYERS, gearPalette } from './gearLayers'

export const HERO_WIDTH = 18
export const HERO_HEIGHT = 18
export const BODY_X = 3
export const BODY_Y = 2

export type HeroFrame = 'idle0' | 'idle1' | 'walk0' | 'walk1' | 'walk2' | 'walk3'

const PALETTE: Palette = {
  o: '#2b1d2f',
  H: '#7fdca4',
  h: '#3f9a74',
  s: '#ffd6b0',
  S: '#e8a987',
  e: '#2b1d2f',
  c: '#f4978e',
  r: '#e0533d',
  R: '#ff8a5b',
  t: '#4d6bc6',
  T: '#7596ee',
  a: '#34478f',
  k: '#a86a3d',
  K: '#d69a5e',
  b: '#6b3f2a',
  p: '#4a3b63',
  q: '#2f2545',
  f: '#6b3a2a'
}

const HEAD = [
  '....oooo....',
  '...oHHHHo...',
  '..oHHhhhHo..',
  '.ohHhhhhhho.',
  '.ohhhhsssso.',
  '.ohhhsssseso',
  '.ohhhsssssco',
  '..ohhSSSSSo.',
  '.kkorrrRRro.'
]

const TORSO_HAND_FRONT = ['okkkotTTTto.', 'okKkotttTao.', 'okkkobbbbso.', '.ooootttto..']
const TORSO_HAND_BACK = ['okkkotTTTto.', 'okKkotaTtto.', 'okkkobsbbbo.', '.ooootttto..']

const LEGS: Record<string, string[]> = {
  stand: ['.....pp.pp..', '.....pp.pp..', '.....fff.fff'],
  strideNear: ['....qq..pp..', '...qq....pp.', '..ff.....fff'],
  strideFar: ['....pp..qq..', '...pp....qq.', '..ff.....fff'],
  passNear: ['.....qpp....', '.....qpp....', '.....ffff...'],
  passFar: ['.....pqq....', '.....pqq....', '.....ffff...']
}

interface FrameSpec {
  torso: string[]
  legs: string[]
  bob: number
  sway: number
}

const FRAMES: Record<HeroFrame, FrameSpec> = {
  idle0: { torso: TORSO_HAND_FRONT, legs: LEGS.stand, bob: 0, sway: 0 },
  idle1: { torso: TORSO_HAND_FRONT, legs: LEGS.stand, bob: 1, sway: 1 },
  walk0: { torso: TORSO_HAND_BACK, legs: LEGS.strideNear, bob: 1, sway: 1 },
  walk1: { torso: TORSO_HAND_FRONT, legs: LEGS.passNear, bob: 0, sway: 0 },
  walk2: { torso: TORSO_HAND_FRONT, legs: LEGS.strideFar, bob: 1, sway: 1 },
  walk3: { torso: TORSO_HAND_BACK, legs: LEGS.passFar, bob: 0, sway: 0 }
}

export const FRAME_ORDER = Object.keys(FRAMES) as HeroFrame[]

function paintLayers(ctx: CanvasRenderingContext2D, gear: GearId[], depth: 'back' | 'front', originX: number, spec: FrameSpec): void {
  GEAR_LAYERS.filter((layer) => layer.depth === depth && gear.includes(layer.gear))
    .filter((layer) => !layer.hiddenBy?.some((other) => gear.includes(other)))
    .forEach((layer) => {
      const rows = spec.sway && layer.swayRows ? layer.swayRows : layer.rows
      const bob = layer.followsBody ? spec.bob : 0
      paintPixelMap(ctx, rows, layer.palette, originX + layer.x, layer.y + bob)
    })
}

function paintFrame(ctx: CanvasRenderingContext2D, spec: FrameSpec, originX: number, gear: GearId[]): void {
  const palette = { ...PALETTE, ...gearPalette(gear) }
  paintLayers(ctx, gear, 'back', originX, spec)
  paintPixelMap(ctx, spec.legs, palette, originX + BODY_X, BODY_Y + 13)
  paintPixelMap(ctx, [...HEAD, ...spec.torso], palette, originX + BODY_X, BODY_Y + spec.bob)
  paintLayers(ctx, gear, 'front', originX, spec)
}

export interface HeroSheet {
  right: HTMLCanvasElement
  left: HTMLCanvasElement
}

export function buildHeroSheet(gear: GearId[] = []): HeroSheet {
  const sheet = createCanvas(HERO_WIDTH * FRAME_ORDER.length, HERO_HEIGHT)
  const ctx = context2d(sheet)
  FRAME_ORDER.forEach((frame, index) => paintFrame(ctx, FRAMES[frame], index * HERO_WIDTH, gear))
  return { right: sheet, left: flipHorizontally(sheet) }
}

export function drawHeroFrame(
  ctx: CanvasRenderingContext2D,
  sheet: HeroSheet,
  frame: HeroFrame,
  x: number,
  y: number,
  facing: 1 | -1
): void {
  const index = FRAME_ORDER.indexOf(frame)
  const sourceX = facing === 1 ? index * HERO_WIDTH : (FRAME_ORDER.length - 1 - index) * HERO_WIDTH
  ctx.drawImage(facing === 1 ? sheet.right : sheet.left, sourceX, 0, HERO_WIDTH, HERO_HEIGHT, x, y, HERO_WIDTH, HERO_HEIGHT)
}

export function heroPortrait(gear: GearId[]): HTMLCanvasElement {
  const sheet = buildHeroSheet(gear)
  const canvas = createCanvas(16, 16)
  context2d(canvas).drawImage(sheet.right, 1, 0, 16, 14, 0, 2, 16, 14)
  return canvas
}
