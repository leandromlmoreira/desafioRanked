export type Palette = Record<string, string>

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível')
  ctx.imageSmoothingEnabled = false
  return ctx
}

export function paintPixelMap(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Palette,
  offsetX = 0,
  offsetY = 0
): void {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(offsetX + x, offsetY + y, 1, 1)
    }
  })
}

export function mirrorRows(halfRows: string[]): string[] {
  return halfRows.map((row) => row + [...row].reverse().join(''))
}

export function flipHorizontally(source: HTMLCanvasElement): HTMLCanvasElement {
  const flipped = createCanvas(source.width, source.height)
  const ctx = context2d(flipped)
  ctx.translate(source.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(source, 0, 0)
  return flipped
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
