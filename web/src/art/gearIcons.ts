import type { GearId } from '../game/gear'
import { context2d, createCanvas, paintPixelMap, type Palette } from '../pixel/canvas'

export const ICON_SIZE = 12

const OUTLINE = '#2b1d2f'

interface Icon {
  rows: string[]
  palette: Palette
}

const ICONS: Record<GearId, Icon> = {
  espada: {
    rows: [
      '.........ooo',
      '........owwo',
      '.......owgo.',
      '......owgo..',
      '.....owgo...',
      '....owgo....',
      '.oo.wgo.....',
      '.oyoooo.....',
      '..oyyo......',
      '.obooyo.....',
      'obo..oo.....',
      'oo..........'
    ],
    palette: { o: OUTLINE, w: '#f4f8fb', g: '#9aa6b5', y: '#ffd166', b: '#6b3f2a' }
  },
  escudo: {
    rows: [
      '...oooooo...',
      '..oBBBBBBo..',
      '.oBBbbbbBBo.',
      'oBBbbyybbBBo',
      'oBbbyYYybbBo',
      'oBbbyYYybbBo',
      'oBBbbyybbBBo',
      'oBBbbbbbbBBo',
      '.oBBbbbbBBo.',
      '..oBBBBBBo..',
      '...oBBBBo...',
      '....oooo....'
    ],
    palette: { o: OUTLINE, B: '#e09a5f', b: '#b8693a', y: '#8a4f25', Y: '#ffe2bd' }
  },
  elmo: {
    rows: [
      '.....rR.....',
      '....rRRr....',
      '...oorroo...',
      '..oSSSSSSo..',
      '.oSWSSSSSSo.',
      '.oSWSSSSSSo.',
      '.oSSSoooooo.',
      '.oSSSokkkko.',
      '.oSSSSoooSo.',
      '.osSSSSSSso.',
      '..osssssso..',
      '...oooooo...'
    ],
    palette: { o: OUTLINE, S: '#c9d4e1', W: '#f4f8fb', s: '#8796aa', k: '#140f1f', r: '#e0533d', R: '#ff8a5b' }
  },
  capa: {
    rows: [
      '..oooooooo..',
      '.ocCCyyCCco.',
      '.oCCCCCCCCo.',
      'ocCCCCCCCCco',
      'oCCCCCCCCcco',
      'oCCCCCCCCcco',
      'oCCCCCCCccco',
      'oCCCCCCcccco',
      'oCCCCCccccco',
      'oCcCCcccCcco',
      'ocooccoocooo',
      'o..oo..oo..o'
    ],
    palette: { o: OUTLINE, C: '#ffd65a', c: '#d99a12', y: '#e8435e' }
  },
  botas: {
    rows: [
      '............',
      '...oooooo...',
      '...oWDDdo...',
      '...oWDDdo...',
      '...oDDDdo...',
      '...oDDDdo...',
      '...oDDDdo...',
      '...oDDDdooo.',
      '..oDDDDDDDdo',
      '..oDWWDDDDdo',
      '..oddddddddo',
      '...ooooooooo'
    ],
    palette: { o: OUTLINE, D: '#45c6dc', W: '#d8fbff', d: '#23809a' }
  },
  asas: {
    rows: [
      '........oo..',
      '......ooWWo.',
      '....ooWWWLo.',
      '...oWWWWLLo.',
      '..oWWWWLLo..',
      '.oWWWLLLo...',
      '.oWWLLLo....',
      'oWWLLoo.....',
      'oWLLo.......',
      'oLLo........',
      'oLo.........',
      'oo..........'
    ],
    palette: { o: '#3b2a63', W: '#fbf6ff', L: '#c4a8ff' }
  },
  coroa: {
    rows: [
      '............',
      '.o...oo...o.',
      'oYo.oYYo.oYo',
      'oyyoyyyyoyyo',
      'oYyyyyyyyyYo',
      'oyyRyyyyRyyo',
      'oyyyyrryyyyo',
      'oddddddddddo',
      'oyyyyyyyyyyo',
      'oooooooooooo',
      '............',
      '............'
    ],
    palette: { o: OUTLINE, y: '#f0b90b', Y: '#ffe07a', d: '#b8860b', R: '#e8435e', r: '#ff9ab0' }
  }
}

export function gearIcon(id: GearId): HTMLCanvasElement {
  const canvas = createCanvas(ICON_SIZE, ICON_SIZE)
  const icon = ICONS[id]
  paintPixelMap(context2d(canvas), icon.rows, icon.palette)
  return canvas
}
