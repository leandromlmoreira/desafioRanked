import { FLAME_FRAMES } from '../art/props'
import { paintPixelMap, seededRandom } from '../pixel/canvas'
import { hexToRgb, mixRgb, rgbToCss } from '../pixel/color'

export interface Arena {
  width: number
  height: number
  groundY: number
}

interface Backdrop {
  sky: string[]
  paint: (ctx: CanvasRenderingContext2D, arena: Arena, random: () => number) => void
  animate?: (ctx: CanvasRenderingContext2D, arena: Arena, time: number) => void
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
]

function paintSky(ctx: CanvasRenderingContext2D, { width, groundY }: Arena, stops: string[]): void {
  const colors = stops.map(hexToRgb)
  const bands = colors.length - 1
  for (let y = 0; y < groundY; y++) {
    const position = (y / groundY) * bands
    const band = Math.min(bands - 1, Math.floor(position))
    const local = position - band
    for (let x = 0; x < width; x++) {
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16
      const step = Math.floor(local * 4 + threshold) / 4
      ctx.fillStyle = rgbToCss(mixRgb(colors[band], colors[band + 1], step))
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function ridge(
  ctx: CanvasRenderingContext2D,
  { width, groundY }: Arena,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
  color: string,
  cap?: string
): void {
  for (let x = 0; x < width; x++) {
    const wave = Math.sin(x * frequency + phase) + Math.sin(x * frequency * 2.3 + phase * 1.7) * 0.45
    const top = Math.round(baseY - Math.abs(wave) * amplitude)
    ctx.fillStyle = color
    ctx.fillRect(x, top, 1, groundY - top)
    if (cap && Math.abs(wave) > 1.05) {
      ctx.fillStyle = cap
      ctx.fillRect(x, top, 1, 2)
    }
  }
}

function ground(ctx: CanvasRenderingContext2D, { width, height, groundY }: Arena, base: string, top: string, speck: string, random: () => number): void {
  ctx.fillStyle = base
  ctx.fillRect(0, groundY, width, height - groundY)
  ctx.fillStyle = top
  ctx.fillRect(0, groundY, width, 2)
  for (let x = 0; x < width; x += 1) {
    if (random() < 0.28) ctx.fillRect(x, groundY - 1, 1, 1)
  }
  ctx.fillStyle = speck
  for (let i = 0; i < width * 0.35; i++) {
    ctx.fillRect(Math.floor(random() * width), groundY + 3 + Math.floor(random() * (height - groundY - 3)), 2, 1)
  }
}

function pine(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, color: string): void {
  ctx.fillStyle = color
  for (let row = 0; row < size; row++) {
    const half = Math.floor((row % Math.ceil(size / 3)) * 0.8 + row / 3)
    ctx.fillRect(x - half, baseY - size + row, half * 2 + 1, 1)
  }
  ctx.fillRect(x, baseY, 1, 2)
}

function house(ctx: CanvasRenderingContext2D, x: number, baseY: number, wall: string, roof: string, light: string): void {
  ctx.fillStyle = roof
  for (let row = 0; row < 5; row++) ctx.fillRect(x - row, baseY - 12 + row, 12 + row * 2, 1)
  ctx.fillStyle = wall
  ctx.fillRect(x - 3, baseY - 7, 18, 7)
  ctx.fillStyle = light
  ctx.fillRect(x + 1, baseY - 5, 3, 3)
  ctx.fillRect(x + 9, baseY - 5, 3, 3)
}

function stars(ctx: CanvasRenderingContext2D, { width, groundY }: Arena, random: () => number, count: number, color: string): void {
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) ctx.fillRect(Math.floor(random() * width), Math.floor(random() * groundY * 0.7), 1, 1)
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
  ctx.fillStyle = color
  for (let y = -radius; y <= radius; y++) {
    const half = Math.floor(Math.sqrt(radius * radius - y * y))
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1)
  }
}

function temple(ctx: CanvasRenderingContext2D, cx: number, baseY: number, stone: string, shade: string, door: string): void {
  ctx.fillStyle = stone
  for (let row = 0; row < 6; row++) ctx.fillRect(cx - 8 - row * 2, baseY - 30 + row, 17 + row * 4, 1)
  ctx.fillRect(cx - 18, baseY - 24, 37, 3)
  ;[-15, -8, 7, 14].forEach((offset) => ctx.fillRect(cx + offset, baseY - 21, 3, 21))
  ctx.fillStyle = shade
  ;[-15, -8, 7, 14].forEach((offset) => ctx.fillRect(cx + offset + 2, baseY - 21, 1, 21))
  ctx.fillRect(cx - 20, baseY - 2, 41, 2)
  ctx.fillStyle = door
  ctx.fillRect(cx - 4, baseY - 16, 9, 16)
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const frame = FLAME_FRAMES[Math.floor(time * 8) % FLAME_FRAMES.length]
  paintPixelMap(ctx, frame, { r: '#e0472e', o: '#ff8a3d', y: '#ffd166', w: '#fff6d0' }, x - 3, y - 8)
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number): void {
  ctx.globalCompositeOperation = 'lighter'
  ;[1, 0.66, 0.36].forEach((scale, index) => {
    ctx.globalAlpha = alpha * (0.12 + index * 0.08)
    disc(ctx, x, y, Math.round(radius * scale), color)
  })
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

const BACKDROPS: Backdrop[] = [
  {
    sky: ['#2a1f47', '#6b3f7a', '#e0765a', '#ffc07a'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      disc(ctx, Math.round(width * 0.78), Math.round(groundY * 0.55), 9, '#ffe2a8')
      ridge(ctx, arena, groundY - 18, 10, 0.05, 1, '#5a3f6e')
      ridge(ctx, arena, groundY - 6, 6, 0.09, 4, '#3d4f3a')
      house(ctx, 6, groundY, '#6b4a5a', '#3a2433', '#ffd98a')
      house(ctx, width - 22, groundY, '#6b4a5a', '#3a2433', '#ffd98a')
      ground(ctx, arena, '#4f7a3a', '#7fae4a', '#3c5a2c', random)
    },
    animate(ctx, { width, groundY }, time) {
      const x = Math.round(width * 0.5)
      ctx.fillStyle = '#6b3f2a'
      ctx.fillRect(x - 4, groundY - 1, 9, 2)
      flame(ctx, x, groundY - 1, time)
      glow(ctx, x, groundY - 5, 14, '#ffb35c', 0.9 + Math.sin(time * 11) * 0.1)
    }
  },
  {
    sky: ['#1f3040', '#3f5f6e', '#8fb3b8'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      ridge(ctx, arena, groundY - 20, 8, 0.04, 2, '#5d7f86')
      for (let x = -4; x < width + 8; x += 9) pine(ctx, x + Math.floor(random() * 5), groundY - 8, 16 + Math.floor(random() * 6), '#3a5a55')
      for (let x = 0; x < width + 8; x += 13) pine(ctx, x + Math.floor(random() * 6), groundY, 20 + Math.floor(random() * 8), '#23372f')
      ground(ctx, arena, '#35583f', '#5f8a55', '#2a4532', random)
    },
    animate(ctx, { width, groundY }, time) {
      ctx.fillStyle = '#e8f3f2'
      ;[0, 1, 2].forEach((band) => {
        const y = groundY - 14 + band * 6
        ctx.globalAlpha = 0.16 + band * 0.05
        for (let x = 0; x < width; x++) {
          const wobble = Math.round(Math.sin(x * 0.08 + time * (0.6 + band * 0.25) + band) * 2)
          ctx.fillRect(x, y + wobble, 1, 3)
        }
      })
      ctx.globalAlpha = 1
    }
  },
  {
    sky: ['#3d5f9a', '#7fa4d0', '#cfe3f0'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      ridge(ctx, arena, groundY - 22, 16, 0.035, 0.5, '#8a9ab5', '#f2f6f9')
      ridge(ctx, arena, groundY - 8, 7, 0.07, 3, '#6f6a82')
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(random() * width)
        ctx.fillStyle = '#58546a'
        ctx.fillRect(x, groundY - 5, 8, 5)
        ctx.fillStyle = '#7fae2e'
        ctx.fillRect(x, groundY - 6, 8, 1)
      }
      ground(ctx, arena, '#6b677e', '#7fae2e', '#58546a', random)
    }
  },
  {
    sky: ['#b8503a', '#f08a4b', '#ffd27a', '#ffe9b5'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      disc(ctx, Math.round(width * 0.24), Math.round(groundY * 0.62), 12, '#fff1c2')
      ridge(ctx, arena, groundY - 10, 6, 0.05, 2, '#d9884a')
      ground(ctx, arena, '#c9a13a', '#f0cf6a', '#a8832a', random)
    },
    animate(ctx, { width, groundY }, time) {
      ctx.fillStyle = '#fff4d6'
      for (let i = 0; i < 6; i++) {
        const x = Math.round(((time * (26 + i * 5) + i * 47) % (width + 30)) - 20)
        const y = Math.round(groundY * (0.2 + i * 0.1))
        ctx.globalAlpha = 0.5
        ctx.fillRect(x, y, 10 + (i % 3) * 4, 1)
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff8e8'
      ;[0.15, 0.55, 0.85].forEach((offset, index) => {
        const x = Math.round(((time * 4 + offset * (width + 40)) % (width + 40)) - 30)
        const y = 8 + index * 7
        ctx.fillRect(x, y, 22, 4)
        ctx.fillRect(x + 4, y - 3, 12, 3)
      })
    }
  },
  {
    sky: ['#0b1020', '#142440', '#1d3450'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      ctx.fillStyle = '#0a1224'
      for (let x = 0; x < width; x += 7) {
        const length = 6 + Math.floor(random() * 14)
        for (let row = 0; row < length; row++) ctx.fillRect(x + Math.floor(row / 3), row, Math.max(1, 5 - Math.floor(row / 3)), 1)
      }
      ridge(ctx, arena, groundY - 6, 8, 0.08, 1, '#16223a')
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(random() * width)
        const size = 5 + Math.floor(random() * 8)
        ctx.fillStyle = '#1f7f97'
        for (let row = 0; row < size; row++) ctx.fillRect(x - Math.floor(row / 3), groundY - size + row, 1 + Math.floor(row / 3) * 2, 1)
        ctx.fillStyle = '#9cefff'
        ctx.fillRect(x, groundY - size, 1, Math.ceil(size / 2))
      }
      ground(ctx, arena, '#1c2940', '#3d5a7a', '#16223a', random)
    },
    animate(ctx, { width, groundY }, time) {
      for (let i = 0; i < 9; i++) {
        const blink = Math.sin(time * 2 + i * 1.9)
        if (blink < 0.55) continue
        const x = Math.round((i * 37 + 11) % width)
        const y = Math.round((i * 23) % (groundY - 10)) + 6
        ctx.fillStyle = '#d8fbff'
        ctx.fillRect(x, y - 1, 1, 3)
        ctx.fillRect(x - 1, y, 3, 1)
      }
    }
  },
  {
    sky: ['#0e0a17', '#1c1540', '#3a2a6e'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      stars(ctx, arena, random, width, '#fff3dc')
      stars(ctx, arena, random, width / 3, '#c4a8ff')
      disc(ctx, Math.round(width * 0.2), 16, 7, '#f2ecff')
      disc(ctx, Math.round(width * 0.2) + 3, 14, 6, '#1c1540')
      ridge(ctx, arena, groundY - 12, 6, 0.06, 5, '#231b44')
      temple(ctx, Math.round(width * 0.82), groundY, '#4a3d7a', '#2e2552', '#140f1f')
      ground(ctx, arena, '#2e2548', '#5a4a8a', '#231b44', random)
    },
    animate(ctx, { width }, time) {
      for (let i = 0; i < 5; i++) {
        const x = Math.round((i * 53 + 17) % width)
        const y = 6 + ((i * 17) % 30)
        if (Math.sin(time * 3 + i * 2.1) > 0.6) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x, y - 1, 1, 3)
          ctx.fillRect(x - 1, y, 3, 1)
        }
      }
    }
  },
  {
    sky: ['#2a1845', '#b8506a', '#ff9a4d', '#ffd27a'],
    paint(ctx, arena, random) {
      const { width, groundY } = arena
      stars(ctx, arena, random, width / 4, '#fff3dc')
      ridge(ctx, arena, groundY - 10, 5, 0.06, 2, '#7a3a5a')
      temple(ctx, Math.round(width * 0.5), groundY, '#e8c89a', '#b88a5a', '#ffc766')
      ground(ctx, arena, '#6b4a32', '#d69a5e', '#553a26', random)
    },
    animate(ctx, { width, groundY }, time) {
      const x = Math.round(width * 0.5)
      const y = groundY - 31
      flame(ctx, x, y, time)
      glow(ctx, x, y - 4, 20, '#ffd98a', 0.6 + Math.sin(time * 3) * 0.12)
    }
  }
]

export const BACKDROP_COUNT = BACKDROPS.length

export function paintBackdrop(ctx: CanvasRenderingContext2D, index: number, arena: Arena): void {
  const backdrop = BACKDROPS[Math.min(BACKDROPS.length - 1, Math.max(0, index))]
  paintSky(ctx, arena, backdrop.sky)
  backdrop.paint(ctx, arena, seededRandom(31 + index * 7))
}

export function animateBackdrop(ctx: CanvasRenderingContext2D, index: number, arena: Arena, time: number): void {
  BACKDROPS[Math.min(BACKDROPS.length - 1, Math.max(0, index))].animate?.(ctx, arena, time)
}
