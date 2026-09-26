export type Mask = (x: number, y: number) => boolean

export interface Material {
  outline: string
  dark: string
  base: string
  light: string
  shine: string
}

export const circle =
  (cx: number, cy: number, radius: number): Mask =>
  (x, y) =>
    (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius * radius

export const rect =
  (x0: number, y0: number, x1: number, y1: number): Mask =>
  (x, y) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1

export const polygon =
  (points: Array<[number, number]>): Mask =>
  (x, y) => {
    const px = x + 0.5
    const py = y + 0.5
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i]
      const [xj, yj] = points[j]
      const crosses = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      if (crosses) inside = !inside
    }
    return inside
  }

export const heater =
  (cx: number, top: number, halfWidth: number, height: number): Mask =>
  (x, y) => {
    const px = x + 0.5 - cx
    const py = y + 0.5 - top
    if (py < 0 || py > height) return false
    const shoulder = height * 0.45
    if (py <= shoulder) return Math.abs(px) <= halfWidth
    const progress = (py - shoulder) / (height - shoulder)
    return Math.abs(px) <= halfWidth * Math.cos((progress * Math.PI) / 2) ** 0.75
  }

export const union =
  (...masks: Mask[]): Mask =>
  (x, y) =>
    masks.some((mask) => mask(x, y))

export const subtract =
  (base: Mask, cut: Mask): Mask =>
  (x, y) =>
    base(x, y) && !cut(x, y)

export const mirror =
  (mask: Mask, axisX: number): Mask =>
  (x, y) =>
    mask(x, y) || mask(Math.round(2 * axisX - 1 - x), y)

export const fromRows =
  (rows: string[], offsetX: number, offsetY: number): Mask =>
  (x, y) =>
    rows[y - offsetY]?.[x - offsetX] === '#'

export function paintMaterial(
  ctx: CanvasRenderingContext2D,
  mask: Mask,
  material: Material,
  size: number,
  bevel = true
): void {
  const center = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask(x, y)) continue
      ctx.fillStyle = pickShade(mask, material, x, y, center, bevel)
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function pickShade(mask: Mask, material: Material, x: number, y: number, center: number, bevel: boolean): string {
  const isEdge = !mask(x - 1, y) || !mask(x + 1, y) || !mask(x, y - 1) || !mask(x, y + 1)
  if (isEdge) return material.outline
  if (!bevel) return material.base
  const topLeftEdge = !mask(x - 2, y) || !mask(x, y - 2)
  const bottomRightEdge = !mask(x + 2, y) || !mask(x, y + 2)
  if (topLeftEdge && !bottomRightEdge) return material.light
  if (bottomRightEdge) return material.dark
  const diagonal = x + y - center * 2
  const checker = (x + y) % 2 === 0
  if (diagonal < -18) return checker ? material.light : material.base
  if (diagonal > 16) return checker ? material.dark : material.base
  return material.base
}

export function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y - 1, 1, 3)
  ctx.fillRect(x - 1, y, 3, 1)
}
