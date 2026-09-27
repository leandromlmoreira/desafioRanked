import { foeSprite, silhouette } from '../art/foes'
import { buildHeroSheet, FRAME_ORDER, HERO_HEIGHT, HERO_WIDTH, type HeroFrame } from '../art/hero'
import { buildOwlPortrait } from '../art/props'
import type { FoeId } from '../game/foes'
import type { GearId } from '../game/gear'
import type { Sprite } from './theater'

const FLASH_COLOR = '#fff6e8'

export interface HeroSprites {
  image: HTMLCanvasElement
  flash: HTMLCanvasElement
}

export function heroSprites(gear: GearId[]): HeroSprites {
  const sheet = buildHeroSheet(gear)
  return { image: sheet.right, flash: silhouette(sheet.right, FLASH_COLOR) }
}

export function heroFrame(sprites: HeroSprites, frame: HeroFrame): Sprite {
  return {
    image: sprites.image,
    flash: sprites.flash,
    sx: FRAME_ORDER.indexOf(frame) * HERO_WIDTH,
    sy: 0,
    width: HERO_WIDTH,
    height: HERO_HEIGHT
  }
}

function staticSprite(canvas: HTMLCanvasElement): Sprite {
  return { image: canvas, flash: silhouette(canvas, FLASH_COLOR), sx: 0, sy: 0, width: canvas.width, height: canvas.height }
}

const foeCache = new Map<FoeId, Sprite>()

export function foeFrame(id: FoeId): Sprite {
  const cached = foeCache.get(id)
  if (cached) return cached
  const sprite = staticSprite(foeSprite(id))
  foeCache.set(id, sprite)
  return sprite
}

let owl: Sprite | null = null

export function owlFrame(): Sprite {
  owl ??= staticSprite(buildOwlPortrait())
  return owl
}

export function idleLift(id: FoeId | 'coruja', time: number, seed = 0): number {
  if (id === 'lumen') return 6 + Math.round(Math.sin(time * 2.2 + seed) * 2)
  if (id === 'plumaria') return 3 + Math.round(Math.sin(time * 4 + seed) * 2)
  return Math.floor(time * 2 + seed) % 2
}
