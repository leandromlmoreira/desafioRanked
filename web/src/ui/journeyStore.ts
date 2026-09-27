import { newJourney, parseJourney, type Journey } from '../game/journey'

const JOURNEY_KEY = 'ranktier:jornada'
const MODE_KEY = 'ranktier:modo'

export type Mode = 'jornada' | 'livre'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function loadJourney(): Journey {
  return parseJourney(read(JOURNEY_KEY)) ?? newJourney()
}

export function saveJourney(journey: Journey): void {
  write(JOURNEY_KEY, JSON.stringify(journey))
}

export function loadMode(): Mode {
  return read(MODE_KEY) === 'livre' ? 'livre' : 'jornada'
}

export function saveMode(mode: Mode): void {
  write(MODE_KEY, mode)
}
