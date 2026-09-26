export const WORLD_WIDTH = 400
export const WORLD_HEIGHT = 620
export const GROUND_Y = 524
export const PLATEAU_Y = 108

export type Point = [number, number]

export const MOUNTAIN_OUTLINE: Point[] = [
  [8, GROUND_Y],
  [30, 500],
  [48, 474],
  [64, 452],
  [80, 432],
  [96, 398],
  [112, 374],
  [124, 340],
  [138, 306],
  [148, 272],
  [158, 236],
  [164, 200],
  [170, 162],
  [176, 128],
  [184, PLATEAU_Y + 2],
  [194, PLATEAU_Y],
  [246, PLATEAU_Y],
  [258, PLATEAU_Y + 4],
  [268, 128],
  [280, 160],
  [290, 196],
  [300, 230],
  [314, 262],
  [326, 298],
  [338, 330],
  [352, 364],
  [366, 402],
  [380, 440],
  [394, 478],
  [WORLD_WIDTH + 20, 500],
  [WORLD_WIDTH + 20, GROUND_Y]
]

export const PATH_POINTS: Point[] = [
  [92, GROUND_Y - 1],
  [128, GROUND_Y - 1],
  [178, 470],
  [206, 456],
  [262, 420],
  [300, 400],
  [236, 360],
  [186, 334],
  [230, 300],
  [282, 270],
  [252, 236],
  [206, 206],
  [236, 170],
  [252, 142],
  [220, PLATEAU_Y - 1]
]

export const STATION_POINT_INDEXES = [0, 3, 5, 7, 9, 11, 14]

export const TEMPLE = { x: 196, width: 48, baseY: PLATEAU_Y }

export const HOUSES = [
  { x: 14, width: 40, wallHeight: 20, roofColor: '#b5533c' },
  { x: 222, width: 32, wallHeight: 16, roofColor: '#5c6fb3' }
]

export const CAMPFIRE: Point = [104, GROUND_Y - 1]

export interface PathSample {
  x: number
  y: number
  directionX: number
}

const segmentLengths = PATH_POINTS.slice(1).map(([x, y], index) => {
  const [px, py] = PATH_POINTS[index]
  return Math.hypot(x - px, y - py)
})

const cumulative = segmentLengths.reduce<number[]>((acc, length) => [...acc, acc[acc.length - 1] + length], [0])

export const PATH_LENGTH = cumulative[cumulative.length - 1]

export const STATION_DISTANCES = STATION_POINT_INDEXES.map((pointIndex) => cumulative[pointIndex])

export function samplePath(distance: number): PathSample {
  const clamped = Math.min(PATH_LENGTH, Math.max(0, distance))
  let segment = segmentLengths.length - 1
  for (let i = 0; i < segmentLengths.length; i++) {
    if (clamped <= cumulative[i + 1]) {
      segment = i
      break
    }
  }
  const [x0, y0] = PATH_POINTS[segment]
  const [x1, y1] = PATH_POINTS[segment + 1]
  const t = segmentLengths[segment] === 0 ? 0 : (clamped - cumulative[segment]) / segmentLengths[segment]
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, directionX: Math.sign(x1 - x0) || 1 }
}

export function mountainTopAt(x: number): number {
  for (let i = 0; i < MOUNTAIN_OUTLINE.length - 1; i++) {
    const [x0, y0] = MOUNTAIN_OUTLINE[i]
    const [x1, y1] = MOUNTAIN_OUTLINE[i + 1]
    if (x >= x0 && x <= x1 && x1 !== x0) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return GROUND_Y
}
