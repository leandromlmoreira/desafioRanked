import { hexToRgb, mixRgb, type Rgb } from '../pixel/color'

interface SkyKey {
  at: number
  top: string
  middle: string
  bottom: string
  darkness: number
  warmth: number
  light: string
}

const KEYS: SkyKey[] = [
  { at: 0, top: '#4f9be0', middle: '#86c1ec', bottom: '#d3ecf2', darkness: 0, warmth: 0, light: '#ffffff' },
  { at: 0.22, top: '#5f98d6', middle: '#9cbfe2', bottom: '#f5dca8', darkness: 0.04, warmth: 0.3, light: '#fff2dc' },
  { at: 0.34, top: '#4a5596', middle: '#b0709a', bottom: '#f8a25a', darkness: 0.2, warmth: 0.9, light: '#ffc9a4' },
  { at: 0.42, top: '#2c2b68', middle: '#6f4a88', bottom: '#e57f68', darkness: 0.42, warmth: 0.65, light: '#c99cb8' },
  { at: 0.5, top: '#181a46', middle: '#2e2d66', bottom: '#5a4478', darkness: 0.66, warmth: 0.15, light: '#8580bc' },
  { at: 0.58, top: '#0c0e2c', middle: '#171a44', bottom: '#2a2a5a', darkness: 0.8, warmth: 0, light: '#5c64a6' },
  { at: 0.72, top: '#0c0e2c', middle: '#171a44', bottom: '#2a2a5a', darkness: 0.8, warmth: 0, light: '#5c64a6' },
  { at: 0.82, top: '#384890', middle: '#9a7aa8', bottom: '#f2b0a0', darkness: 0.34, warmth: 0.5, light: '#e2bcc6' },
  { at: 1, top: '#4f9be0', middle: '#86c1ec', bottom: '#d3ecf2', darkness: 0, warmth: 0, light: '#ffffff' }
]

export interface Ambience {
  skyTop: Rgb
  skyMiddle: Rgb
  skyBottom: Rgb
  darkness: number
  warmth: number
  light: Rgb
  sunProgress: number | null
  moonProgress: number | null
  farRange: Rgb
  farRangeShade: Rgb
  hills: Rgb
  hillsShade: Rgb
  cloud: Rgb
  cloudShade: Rgb
  phaseLabel: string
}

const rgb = (hex: string) => hexToRgb(hex)

function phaseLabel(time: number): string {
  if (time < 0.28 || time >= 0.9) return 'Dia'
  if (time < 0.47) return 'Entardecer'
  if (time < 0.78) return 'Noite'
  return 'Amanhecer'
}

function arcProgress(time: number, start: number, span: number): number | null {
  const progress = (((time - start) % 1) + 1) % 1 / span
  return progress <= 1 ? progress : null
}

export function ambienceAt(time: number): Ambience {
  const t = ((time % 1) + 1) % 1
  const nextIndex = KEYS.findIndex((key) => key.at > t)
  const to = KEYS[nextIndex]
  const from = KEYS[nextIndex - 1]
  const amount = (t - from.at) / (to.at - from.at)
  const mix = (a: string, b: string) => mixRgb(rgb(a), rgb(b), amount)
  const darkness = from.darkness + (to.darkness - from.darkness) * amount
  const warmth = from.warmth + (to.warmth - from.warmth) * amount
  const skyBottom = mix(from.bottom, to.bottom)
  const haze = (day: string, night: string, hazeAmount: number) =>
    mixRgb(mixRgb(mixRgb(rgb(day), rgb(night), darkness), skyBottom, hazeAmount), rgb('#f08a6a'), warmth * 0.18)
  return {
    skyTop: mix(from.top, to.top),
    skyMiddle: mix(from.middle, to.middle),
    skyBottom,
    darkness,
    warmth,
    light: mix(from.light, to.light),
    sunProgress: arcProgress(t, 0.8, 0.64),
    moonProgress: arcProgress(t, 0.46, 0.34),
    farRange: haze('#9ab6da', '#2a2d5e', 0.35),
    farRangeShade: haze('#7f9cc6', '#23264f', 0.3),
    hills: haze('#5c8f8a', '#1a2143', 0.12),
    hillsShade: haze('#4a7a7a', '#151b38', 0.08),
    cloud: mixRgb(mixRgb(rgb('#ffffff'), rgb('#ffc9a8'), warmth), rgb('#3c4274'), darkness),
    cloudShade: mixRgb(mixRgb(rgb('#d6e6f5'), rgb('#e79a8f'), warmth), rgb('#2c3160'), darkness),
    phaseLabel: phaseLabel(t)
  }
}

export const PHASE_STARTS = [0.3, 0.47, 0.78, 0.92]
