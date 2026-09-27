import type { GearId } from '../game/gear'
import type { Palette } from '../pixel/canvas'

const OUTLINE = '#2b1d2f'

export interface GearLayer {
  gear: GearId
  depth: 'back' | 'front'
  x: number
  y: number
  rows: string[]
  swayRows?: string[]
  palette: Palette
  followsBody: boolean
  hiddenBy?: GearId[]
}

export const GEAR_LAYERS: GearLayer[] = [
  {
    gear: 'capa',
    depth: 'back',
    x: 0,
    y: 10,
    rows: ['...oo', '..oCo', '..oCc', '.oCCc', '.oCcc', 'oCccc', 'occo.', 'oo...'],
    swayRows: ['...oo', '..oCo', '..oCc', '.oCCc', '.oCcc', '.oCcc', '.occo', '..oo.'],
    palette: { o: OUTLINE, C: '#ffd65a', c: '#d99a12' },
    followsBody: true
  },
  {
    gear: 'asas',
    depth: 'back',
    x: 0,
    y: 4,
    rows: ['...oo.', '..owwo', '.owwLo', 'owwLLo', 'owLLo.', '.oLo..', '..o...'],
    swayRows: ['......', '...oo.', '..owwo', '.owwLo', 'owwLLo', 'owLLo.', '.oLo..', '..o...'],
    palette: { o: '#3b2a63', w: '#fbf6ff', L: '#c4a8ff' },
    followsBody: true
  },
  {
    gear: 'escudo',
    depth: 'front',
    x: 2,
    y: 10,
    rows: ['.oooo.', 'obBBbo', 'oBByBo', 'obBBbo', 'obbbbo', '.oooo.'],
    palette: { o: OUTLINE, B: '#e09a5f', b: '#b8693a', y: '#ffe2bd' },
    followsBody: true
  },
  {
    gear: 'espada',
    depth: 'front',
    x: 14,
    y: 3,
    rows: ['.oo.', 'owgo', 'owgo', 'owgo', 'owgo', 'owgo', 'owgo', 'oyyo', 'yYYy', 'obbo', 'obbo', '.oo.'],
    palette: { o: OUTLINE, w: '#f4f8fb', g: '#9aa6b5', y: '#c98a1c', Y: '#ffd166', b: '#6b3f2a' },
    followsBody: true
  },
  {
    gear: 'elmo',
    depth: 'front',
    x: 8,
    y: 0,
    rows: ['..Rr', '.rr.'],
    palette: { r: '#e0533d', R: '#ff8a5b' },
    followsBody: true,
    hiddenBy: ['coroa']
  },
  {
    gear: 'coroa',
    depth: 'front',
    x: 6,
    y: 0,
    rows: ['Y.YY.Y', 'yyryyy'],
    palette: { y: '#f0b90b', Y: '#ffe07a', r: '#e8435e' },
    followsBody: true
  }
]

const PALETTE_SWAPS: Partial<Record<GearId, Palette>> = {
  elmo: { H: '#e6edf5', h: '#9aa8bb' },
  botas: { f: '#45c6dc' }
}

export function gearPalette(gear: GearId[]): Palette {
  return gear.reduce<Palette>((palette, id) => ({ ...palette, ...PALETTE_SWAPS[id] }), {})
}
