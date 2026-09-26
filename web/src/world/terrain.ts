import { context2d, createCanvas, paintPixelMap, seededRandom, type Palette } from '../pixel/canvas'
import { hexToRgb, mixHex, type Rgb } from '../pixel/color'
import {
  CAMPFIRE,
  GROUND_Y,
  HOUSES,
  PATH_POINTS,
  PLATEAU_Y,
  TEMPLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  mountainTopAt,
  type Point
} from './layout'

export interface LightRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Terrain {
  canvas: HTMLCanvasElement
  windows: LightRect[]
  chimneys: Point[]
  templeDoor: LightRect
  lanterns: Point[]
}

const GRASS = ['#9edc72', '#72c160', '#4f9a55', '#3a7a4a', '#2c5e40'].map(hexToRgb)
const ROCK = ['#ddd3c6', '#b5a99d', '#8c8081', '#5f566a'].map(hexToRgb)
const SNOW = ['#ffffff', '#e8eefb', '#c6cfe8', '#a2acce', '#8791b8'].map(hexToRgb)

export const WATERFALL = { x: 336, width: 8, top: 338, poolLeft: 314, poolRight: 376 }

const PINE_PALETTE: Palette = { o: '#1d3a2c', G: '#5aa05a', g: '#3a7447', t: '#5a3a2a', s: '#f4f7ff' }

const PINE = [
  '....o....',
  '...oGo...',
  '...oGo...',
  '..oGGgo..',
  '..oGggo..',
  '...oGgo..',
  '..oGGggo.',
  '.oGGgggo.',
  '..oGgggo.',
  '.oGGggggo',
  'oGGgggggo',
  '.ooooooo.',
  '....t....',
  '....t....'
]

const SNOWY_PINE = PINE.map((row, index) => (index < 5 ? row.replace(/G/g, 's') : row))

const ROUND_TREE_PALETTE: Palette = { o: '#1f3a26', L: '#8fd46a', l: '#5eab55', d: '#3f8048', t: '#6b4a32' }

const ROUND_TREE = [
  '...oooooo...',
  '..oLLllllo..',
  '.oLLlllllldo',
  'oLLllllllddo',
  'oLlllllllddo',
  'olllllllddo.',
  '.olllllddddo',
  '..oolddddoo.',
  '....ottoo...',
  '.....tt.....',
  '.....tt.....',
  '....tttt....'
]

function noise(x: number, seed: number): number {
  return Math.sin(x * 0.13 + seed) * 0.5 + Math.sin(x * 0.051 + seed * 2.1) * 0.35 + Math.sin(x * 0.37 + seed * 0.7) * 0.15
}

function noise2d(x: number, y: number, seed: number): number {
  return (noise(x + y * 0.61, seed) + noise(y * 1.3 - x * 0.4, seed + 5)) / 2
}

function ridgeX(y: number): number {
  return 224 + (y - PLATEAU_Y) * 0.06 + noise(y, 4) * 5
}

function silhouetteTop(x: number): number {
  const onPlateau = x > 186 && x < 256
  return Math.round(mountainTopAt(x) + (onPlateau ? 0 : noise(x * 2.3, 9) * 2))
}

interface Terrace {
  top: number
  height: number
}

function terraceAt(x: number, y: number): Terrace | null {
  for (let k = 0; k < 9; k++) {
    if (noise(x * 0.9, k * 7.7) < 0.12) continue
    const top = Math.round(176 + k * 40 + noise(x * 0.7, k * 3.1) * 5)
    const height = 5 + Math.round((noise(x * 1.3, k) + 1) * 2)
    if (y >= top - 1 && y < top + height + 1) return { top, height }
  }
  return null
}

function snowLine(x: number): number {
  return 168 + noise(x, 2) * 9
}

function surfaceColor(x: number, y: number, top: number): Rgb {
  const lit = x < ridgeX(y)
  const ramp = y < snowLine(x) ? SNOW : GRASS
  const depth = y - top
  if (depth < 2) return ramp[lit ? 0 : 1]
  if (ramp === SNOW && noise2d(x * 1.6, y * 1.4, 31) > 0.6) return ROCK[lit ? 1 : 2]
  if (ramp === SNOW && noise2d(x * 1.6, y * 1.4, 31) > 0.5) return ROCK[lit ? 0 : 1]
  const patch = noise2d(x * 0.8, y * 0.9, 11)
  if (lit) return patch > 0.45 ? ramp[0] : patch < -0.55 ? ramp[2] : ramp[1]
  return patch > 0.5 ? ramp[2] : ramp[3]
}

function crackAt(x: number, terraceTop: number): boolean {
  const hash = Math.sin(x * 12.9898 + terraceTop * 78.233) * 43758.5453
  return hash - Math.floor(hash) < 0.16
}

function cliffColor(x: number, y: number, terrace: Terrace): Rgb {
  const lit = x < ridgeX(y)
  const row = y - terrace.top
  if (row === -1) return (y < snowLine(x) ? SNOW : GRASS)[0]
  if (row >= terrace.height) return (y < snowLine(x) ? SNOW : GRASS)[lit ? 2 : 4]
  if (row === terrace.height - 1) return ROCK[3]
  const crack = row > 0 && crackAt(x, terrace.top)
  if (lit) return crack ? ROCK[2] : row === 0 ? ROCK[0] : ROCK[1]
  return crack ? ROCK[3] : row === 0 ? ROCK[1] : ROCK[2]
}

function paintMountain(ctx: CanvasRenderingContext2D): void {
  const image = ctx.createImageData(WORLD_WIDTH, WORLD_HEIGHT)
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const top = silhouetteTop(x)
    for (let y = Math.max(0, top); y < GROUND_Y + 2; y++) {
      const terrace = y - top > 3 ? terraceAt(x, y) : null
      const [r, g, b] = terrace ? cliffColor(x, y, terrace) : surfaceColor(x, y, top)
      const offset = (y * WORLD_WIDTH + x) * 4
      image.data[offset] = r
      image.data[offset + 1] = g
      image.data[offset + 2] = b
      image.data[offset + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

function paintWaterfall(ctx: CanvasRenderingContext2D): void {
  const { x, width, top, poolLeft, poolRight } = WATERFALL
  ctx.fillStyle = '#5f566a'
  ctx.fillRect(x - 8, top - 9, width + 16, 11)
  ctx.fillStyle = '#8c8081'
  ctx.fillRect(x - 7, top - 8, width + 14, 9)
  ctx.fillStyle = '#b5a99d'
  ctx.fillRect(x - 7, top - 8, width + 14, 2)
  ctx.fillStyle = '#231c35'
  ctx.fillRect(x - 1, top - 5, width + 2, 6)
  ctx.fillRect(x, top - 6, width, 1)
  ctx.fillStyle = '#72c160'
  ctx.fillRect(x - 8, top - 11, width + 16, 3)
  ctx.fillStyle = '#9edc72'
  ctx.fillRect(x - 7, top - 11, width + 14, 1)
  ctx.fillStyle = '#2f5f8f'
  ctx.fillRect(x - 1, top, width + 2, GROUND_Y - top)
  ctx.fillStyle = '#5fb3e8'
  ctx.fillRect(x, top, width, GROUND_Y - top)
  ctx.fillStyle = '#9fdcff'
  ctx.fillRect(x + 1, top, 1, GROUND_Y - top)
  const center = (poolLeft + poolRight) / 2
  const half = (poolRight - poolLeft) / 2
  for (let row = 0; row < 5; row++) {
    const inset = Math.round(half * (1 - Math.sqrt(1 - (row / 5) ** 2)))
    ctx.fillStyle = '#2f5f8f'
    ctx.fillRect(poolLeft + inset - 1, GROUND_Y - 1 + row, poolRight - poolLeft - inset * 2 + 2, 1)
    ctx.fillStyle = row === 0 ? '#9fdcff' : '#4f9fdc'
    ctx.fillRect(poolLeft + inset, GROUND_Y - 1 + row, poolRight - poolLeft - inset * 2, 1)
  }
  ctx.fillStyle = '#e9f7ff'
  ctx.fillRect(Math.round(center) - 12, GROUND_Y - 1, 24, 1)
}

function distanceToPath(x: number, y: number): number {
  let best = Infinity
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const [x0, y0] = PATH_POINTS[i]
    const [x1, y1] = PATH_POINTS[i + 1]
    const dx = x1 - x0
    const dy = y1 - y0
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
    best = Math.min(best, Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t)))
  }
  return best
}

function paintPath(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const [x0, y0] = PATH_POINTS[i]
    const [x1, y1] = PATH_POINTS[i + 1]
    const length = Math.hypot(x1 - x0, y1 - y0)
    for (let step = 0; step <= length; step++) {
      const x = Math.round(x0 + ((x1 - x0) * step) / length)
      const y = Math.round(y0 + ((y1 - y0) * step) / length)
      ctx.fillStyle = '#5b3d33'
      ctx.fillRect(x - 3, y - 1, 7, 4)
      ctx.fillStyle = '#c99a6b'
      ctx.fillRect(x - 2, y - 1, 5, 3)
    }
    for (let step = 0; step <= length; step++) {
      const x = Math.round(x0 + ((x1 - x0) * step) / length)
      const y = Math.round(y0 + ((y1 - y0) * step) / length)
      ctx.fillStyle = step % 4 === 0 && y0 !== y1 ? '#8a6246' : '#e3bb8a'
      ctx.fillRect(x - 2, y - 1, 5, 1)
    }
  }
}

function paintTrees(ctx: CanvasRenderingContext2D): void {
  const random = seededRandom(42)
  const spots: Point[] = []
  for (let attempt = 0; attempt < 2400 && spots.length < 110; attempt++) {
    const x = Math.round(16 + random() * (WORLD_WIDTH - 26))
    const y = Math.round(mountainTopAt(x) + 8 + random() * (GROUND_Y - mountainTopAt(x) - 12))
    if (y > GROUND_Y - 16 || y < 170) continue
    if (random() > (y - 150) / 260) continue
    if (distanceToPath(x + 4, y + 10) < 11) continue
    if (x + 9 > WATERFALL.x - 4 && x < WATERFALL.x + WATERFALL.width + 4) continue
    if (terraceAt(x + 4, y + 13) || terraceAt(x + 4, y + 6)) continue
    if (spots.some(([sx, sy]) => Math.abs(sx - x) < 7 && Math.abs(sy - y) < 9)) continue
    spots.push([x, y])
  }
  spots
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y]) => paintPixelMap(ctx, y < 236 ? SNOWY_PINE : PINE, PINE_PALETTE, x, y))
}

const MEADOW = ['#58a552', '#4d9750', '#43894c', '#3a7a47', '#326c42']

function paintMeadow(ctx: CanvasRenderingContext2D): void {
  const top = GROUND_Y + 3
  const bandHeight = Math.ceil((WORLD_HEIGHT - top) / MEADOW.length)
  for (let y = top; y < WORLD_HEIGHT; y++) {
    const band = Math.min(MEADOW.length - 1, Math.floor((y - top) / bandHeight))
    const next = Math.min(MEADOW.length - 1, band + 1)
    const nearEdge = (y - top) % bandHeight >= bandHeight - 2
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      ctx.fillStyle = MEADOW[nearEdge && (x + y) % 2 === 0 ? next : band]
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function paintTrail(ctx: CanvasRenderingContext2D): void {
  for (let y = GROUND_Y + 2; y < WORLD_HEIGHT; y++) {
    const progress = (y - GROUND_Y) / (WORLD_HEIGHT - GROUND_Y)
    const center = 104 - progress * 26 + Math.sin(progress * 5) * 6
    const half = 5 + progress * 9
    ctx.fillStyle = '#8a6246'
    ctx.fillRect(Math.round(center - half - 1), y, Math.round(half * 2 + 2), 1)
    ctx.fillStyle = '#c99a6b'
    ctx.fillRect(Math.round(center - half), y, Math.round(half * 2), 1)
  }
}

function paintGround(ctx: CanvasRenderingContext2D): void {
  const random = seededRandom(9)
  paintMeadow(ctx)
  paintTrail(ctx)
  ctx.fillStyle = '#58a552'
  ctx.fillRect(0, GROUND_Y - 1, WORLD_WIDTH, 4)
  ctx.fillStyle = '#7ccb62'
  ctx.fillRect(0, GROUND_Y - 1, WORLD_WIDTH, 1)
  ctx.fillStyle = '#c99a6b'
  ctx.fillRect(62, GROUND_Y, 84, 3)
  ctx.fillStyle = '#e3bb8a'
  ctx.fillRect(64, GROUND_Y, 80, 1)
  const flowers = ['#ffd1e0', '#ffe27a', '#ffffff', '#b8a6ff']
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(random() * WORLD_WIDTH)
    const y = GROUND_Y + 5 + Math.floor(random() * (WORLD_HEIGHT - GROUND_Y - 8))
    if (Math.abs(x - (104 - ((y - GROUND_Y) / (WORLD_HEIGHT - GROUND_Y)) * 26)) < 16) continue
    const roll = random()
    if (roll > 0.72) {
      ctx.fillStyle = flowers[Math.floor(random() * flowers.length)]
      ctx.fillRect(x, y, 1, 1)
      ctx.fillStyle = '#2c5e40'
      ctx.fillRect(x, y + 1, 1, 1)
    } else {
      ctx.fillStyle = roll > 0.36 ? '#72c160' : '#2c5e40'
      ctx.fillRect(x, y, 1, 1)
      ctx.fillRect(x + 2, y, 1, 1)
      ctx.fillRect(x + 1, y + 1, 1, 1)
    }
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(random() * WORLD_WIDTH)
    if (x > 60 && x < 148) continue
    ctx.fillStyle = '#7ccb62'
    ctx.fillRect(x, GROUND_Y - 2, 1, 1)
    if (random() > 0.7) {
      ctx.fillStyle = random() > 0.5 ? '#ffd1e0' : '#ffe27a'
      ctx.fillRect(x, GROUND_Y - 3, 1, 1)
    }
  }
}

function paintHouse(ctx: CanvasRenderingContext2D, house: (typeof HOUSES)[number], windows: LightRect[], chimneys: Point[]): void {
  const { x, width, wallHeight, roofColor } = house
  const wallTop = GROUND_Y - wallHeight
  const roofHeight = Math.round(width * 0.42)
  const roofDark = mixHex(roofColor, '#1b1030', 0.3)
  ctx.fillStyle = '#3a2433'
  ctx.fillRect(x - 1, wallTop - 1, width + 2, wallHeight + 1)
  ctx.fillStyle = '#f1dcb0'
  ctx.fillRect(x, wallTop, width, wallHeight)
  ctx.fillStyle = '#d7b98a'
  ctx.fillRect(x + width - 5, wallTop, 5, wallHeight)
  ctx.fillStyle = '#8a5a3c'
  ctx.fillRect(x, wallTop, width, 2)
  ctx.fillRect(x, wallTop, 2, wallHeight)
  ctx.fillRect(x + width - 2, wallTop, 2, wallHeight)
  const chimneyX = x + width - 12
  ctx.fillStyle = '#3a2433'
  ctx.fillRect(chimneyX - 1, wallTop - roofHeight - 1, 7, roofHeight)
  ctx.fillStyle = '#9b6a5a'
  ctx.fillRect(chimneyX, wallTop - roofHeight, 5, roofHeight)
  chimneys.push([chimneyX + 2, wallTop - roofHeight - 2])
  for (let row = 0; row < roofHeight; row++) {
    const inset = Math.round(((roofHeight - row) / roofHeight) * (width / 2 + 2))
    const left = x - 4 + inset
    const right = x + width + 4 - inset
    ctx.fillStyle = '#2a1830'
    ctx.fillRect(left - 1, wallTop - roofHeight + row, right - left + 2, 1)
    ctx.fillStyle = row % 3 === 2 ? roofDark : roofColor
    ctx.fillRect(left, wallTop - roofHeight + row, right - left, 1)
  }
  ctx.fillStyle = '#2a1830'
  ctx.fillRect(x - 5, wallTop, width + 10, 1)
  const doorX = x + Math.round(width / 2) - 3
  ctx.fillStyle = '#3a2433'
  ctx.fillRect(doorX - 1, GROUND_Y - 11, 8, 11)
  ctx.fillStyle = '#7a4a2f'
  ctx.fillRect(doorX, GROUND_Y - 10, 6, 10)
  ctx.fillStyle = '#ffd166'
  ctx.fillRect(doorX + 4, GROUND_Y - 5, 1, 1)
  const windowY = wallTop + 5
  ;[x + 5, x + width - 12].forEach((windowX) => {
    ctx.fillStyle = '#3a2433'
    ctx.fillRect(windowX - 1, windowY - 1, 8, 8)
    ctx.fillStyle = '#3d4a78'
    ctx.fillRect(windowX, windowY, 6, 6)
    windows.push({ x: windowX, y: windowY, width: 6, height: 6 })
  })
}

function paintCampfireBase(ctx: CanvasRenderingContext2D): void {
  const [x, y] = CAMPFIRE
  ctx.fillStyle = '#4a4663'
  ;[-6, -4, 3, 5].forEach((dx) => ctx.fillRect(x + dx, y - 1, 2, 2))
  ctx.fillStyle = '#6b3f2a'
  ctx.fillRect(x - 3, y - 1, 7, 2)
  ctx.fillStyle = '#8a5a3c'
  ctx.fillRect(x - 2, y - 2, 5, 1)
}

function paintFence(ctx: CanvasRenderingContext2D): void {
  for (let x = 56; x < 64; x += 3) {
    ctx.fillStyle = '#5a3a2a'
    ctx.fillRect(x, GROUND_Y - 7, 2, 7)
  }
  ctx.fillStyle = '#8a5a3c'
  ctx.fillRect(55, GROUND_Y - 5, 10, 1)
  for (let x = 172; x < 196; x += 4) {
    ctx.fillStyle = '#5a3a2a'
    ctx.fillRect(x, GROUND_Y - 7, 2, 7)
  }
  ctx.fillStyle = '#8a5a3c'
  ctx.fillRect(171, GROUND_Y - 5, 26, 1)
  ctx.fillRect(171, GROUND_Y - 3, 26, 1)
}

function paintTemple(ctx: CanvasRenderingContext2D): LightRect {
  const { x, width, baseY } = TEMPLE
  const stone = '#efe6f7'
  const stoneShade = '#c4b8da'
  const outline = '#3a2f55'
  ctx.fillStyle = outline
  ctx.fillRect(x - 5, baseY - 5, width + 10, 6)
  ctx.fillStyle = stone
  ctx.fillRect(x - 4, baseY - 4, width + 8, 2)
  ctx.fillStyle = stoneShade
  ctx.fillRect(x - 4, baseY - 2, width + 8, 2)
  const pillarTop = baseY - 30
  ctx.fillStyle = outline
  ctx.fillRect(x - 1, pillarTop - 1, width + 2, 27)
  ctx.fillStyle = '#2b2346'
  ctx.fillRect(x, pillarTop, width, 25)
  ;[0, 10, width - 16, width - 6].forEach((offset) => {
    ctx.fillStyle = outline
    ctx.fillRect(x + offset - 1, pillarTop, 8, 25)
    ctx.fillStyle = stone
    ctx.fillRect(x + offset, pillarTop, 6, 25)
    ctx.fillStyle = stoneShade
    ctx.fillRect(x + offset + 4, pillarTop, 2, 25)
    ctx.fillRect(x + offset + 2, pillarTop + 2, 1, 21)
  })
  ctx.fillStyle = outline
  ctx.fillRect(x - 5, pillarTop - 5, width + 10, 6)
  ctx.fillStyle = stone
  ctx.fillRect(x - 4, pillarTop - 4, width + 8, 3)
  const roofBase = pillarTop - 5
  const roofHeight = 14
  for (let row = 0; row < roofHeight; row++) {
    const inset = Math.round(((roofHeight - row) / roofHeight) * (width / 2 + 6))
    const left = x - 6 + inset
    const right = x + width + 6 - inset
    ctx.fillStyle = outline
    ctx.fillRect(left - 1, roofBase - roofHeight + row, right - left + 2, 1)
    ctx.fillStyle = row < 2 ? '#8d6cd9' : row % 4 === 3 ? '#4f3a8f' : '#6a4fb8'
    ctx.fillRect(left, roofBase - roofHeight + row, right - left, 1)
  }
  ctx.fillStyle = '#ffd166'
  ctx.fillRect(x + width / 2 - 1, roofBase - roofHeight - 5, 2, 5)
  ctx.fillRect(x + width / 2 - 2, roofBase - roofHeight - 4, 4, 2)
  ctx.fillStyle = '#ffd166'
  ctx.fillRect(x + width / 2 - 3, roofBase - 6, 6, 3)
  const door = { x: x + width / 2 - 6, y: baseY - 22, width: 12, height: 18 }
  ctx.fillStyle = outline
  ctx.fillRect(door.x - 1, door.y - 1, door.width + 2, door.height + 1)
  ctx.fillStyle = '#6a4fb8'
  ctx.fillRect(door.x, door.y, door.width, door.height)
  return door
}

const STONE_LANTERN_PALETTE: Palette = { o: '#3a2f55', s: '#efe6f7', d: '#c4b8da', w: '#fff1b8' }

const STONE_LANTERN = ['.ooooo.', 'ossssso', '.odwdo.', '.odwdo.', '.ooooo.', '..odo..', '..odo..', '.osssso', 'ooooooo']

function paintLanterns(ctx: CanvasRenderingContext2D): Point[] {
  const spots: Point[] = [
    [TEMPLE.x - 14, PLATEAU_Y - 9],
    [TEMPLE.x + TEMPLE.width + 7, PLATEAU_Y - 9]
  ]
  spots.forEach(([x, y]) => paintPixelMap(ctx, STONE_LANTERN, STONE_LANTERN_PALETTE, x, y))
  return spots.map(([x, y]) => [x + 3, y + 3])
}

function paintRoundTrees(ctx: CanvasRenderingContext2D): void {
  paintPixelMap(ctx, ROUND_TREE, ROUND_TREE_PALETTE, 60, GROUND_Y - 12)
  paintPixelMap(ctx, ROUND_TREE, ROUND_TREE_PALETTE, 112, GROUND_Y - 12)
  paintPixelMap(ctx, PINE, PINE_PALETTE, 2, GROUND_Y - 14)
  paintPixelMap(ctx, PINE, PINE_PALETTE, 266, GROUND_Y - 14)
}

export function buildTerrain(): Terrain {
  const canvas = createCanvas(WORLD_WIDTH, WORLD_HEIGHT)
  const ctx = context2d(canvas)
  const windows: LightRect[] = []
  const chimneys: Point[] = []
  paintMountain(ctx)
  paintTrees(ctx)
  paintWaterfall(ctx)
  paintPath(ctx)
  const templeDoor = paintTemple(ctx)
  const lanterns = paintLanterns(ctx)
  paintGround(ctx)
  paintRoundTrees(ctx)
  HOUSES.forEach((house) => paintHouse(ctx, house, windows, chimneys))
  paintFence(ctx)
  paintCampfireBase(ctx)
  return { canvas, windows, chimneys, templeDoor, lanterns }
}
