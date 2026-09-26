import { context2d, createCanvas, mirrorRows, paintPixelMap, type Palette } from '../pixel/canvas'

const OWL_PALETTE: Palette = {
  o: '#2b1d2f',
  B: '#c99466',
  b: '#8f5d3e',
  w: '#fff3dc',
  k: '#2b1d2f',
  y: '#ffd166',
  n: '#f2a03d',
  F: '#f1dcb4',
  f: '#caa57c',
  r: '#6b3f2a',
  R: '#94603f'
}

const OWL_HALF = [
  '........',
  '..o.....',
  '..oo....',
  '..oBoooo',
  '.oBBbbbb',
  '.oBwwwbb',
  'oBwwkkwb',
  'oBwkyywb',
  'oBwwwwbb',
  'oBbbbbbn',
  'oBbFfFbn',
  '.oBfFfFb',
  '.oBFfFfb',
  '..oBbbbb',
  'rrroonnn',
  'RRRRRRRR'
]

export function buildOwlPortrait(): HTMLCanvasElement {
  const canvas = createCanvas(16, 16)
  paintPixelMap(context2d(canvas), mirrorRows(OWL_HALF), OWL_PALETTE)
  return canvas
}

const FLAME_PALETTE: Palette = { r: '#e0472e', o: '#ff8a3d', y: '#ffd166', w: '#fff6d0' }

export const FLAME_FRAMES = [
  ['...r...', '..ror..', '..ror..', '.royor.', '.royyor', 'roywyor', 'royyyor', '.rrorr.'],
  ['....r..', '...ro..', '..roor.', '.royor.', '.royyor', 'roywwor', 'royyyor', '.rroor.'],
  ['..r....', '..or...', '.roor..', '.royor.', 'royyor.', 'roywyor', 'royyyor', '.rrorr.']
]

export function buildFlameSheet(): HTMLCanvasElement {
  const canvas = createCanvas(7 * FLAME_FRAMES.length, 8)
  const ctx = context2d(canvas)
  FLAME_FRAMES.forEach((rows, index) => paintPixelMap(ctx, rows, FLAME_PALETTE, index * 7, 0))
  return canvas
}

export function buildGlow(radius: number, color: string): HTMLCanvasElement {
  const size = radius * 2 + 1
  const canvas = createCanvas(size, size)
  const ctx = context2d(canvas)
  const rings = [
    { scale: 1, alpha: 0.1 },
    { scale: 0.72, alpha: 0.14 },
    { scale: 0.46, alpha: 0.22 }
  ]
  ctx.fillStyle = color
  rings.forEach(({ scale, alpha }) => {
    const ringRadius = radius * scale
    ctx.globalAlpha = alpha
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if ((x - radius) ** 2 + (y - radius) ** 2 <= ringRadius * ringRadius) ctx.fillRect(x, y, 1, 1)
      }
    }
  })
  return canvas
}
