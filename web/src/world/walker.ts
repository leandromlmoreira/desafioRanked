import type { HeroFrame } from '../art/hero'
import { STATION_DISTANCES, samplePath } from './layout'

const WALK_FRAMES: HeroFrame[] = ['walk0', 'walk1', 'walk2', 'walk3']
const HOP_DURATION = 0.45

export type CrossListener = (stationIndex: number, direction: 1 | -1) => void
export type StepListener = () => void
export type ArriveListener = () => void

export class Walker {
  distance = 0
  target = 0
  facing: 1 | -1 = 1
  private stride = 0
  private idleClock = 0
  private hopClock = HOP_DURATION
  private crossListeners: CrossListener[] = []
  private stepListeners: StepListener[] = []
  private arriveListeners: ArriveListener[] = []

  onCross(listener: CrossListener): void {
    this.crossListeners.push(listener)
  }

  onStep(listener: StepListener): void {
    this.stepListeners.push(listener)
  }

  onArrive(listener: ArriveListener): void {
    this.arriveListeners.push(listener)
  }

  get isWalking(): boolean {
    return Math.abs(this.target - this.distance) > 0.01
  }

  hop(): void {
    this.hopClock = 0
  }

  place(distance: number): void {
    this.distance = distance
    this.target = distance
  }

  update(dt: number): void {
    this.idleClock += dt
    this.hopClock = Math.min(HOP_DURATION, this.hopClock + dt)
    if (!this.isWalking) return
    const remaining = this.target - this.distance
    const speed = Math.min(170, Math.max(42, Math.abs(remaining) * 1.4))
    const step = Math.sign(remaining) * Math.min(Math.abs(remaining), speed * dt)
    const previous = this.distance
    this.distance += step
    this.facing = (samplePath(this.distance + Math.sign(step) * 0.5).directionX * Math.sign(step)) as 1 | -1
    const previousStride = Math.floor(this.stride / 4)
    this.stride += Math.abs(step)
    if (Math.floor(this.stride / 4) !== previousStride && Math.floor(this.stride / 4) % 2 === 0) {
      this.stepListeners.forEach((listener) => listener())
    }
    STATION_DISTANCES.forEach((stationDistance, index) => {
      const crossedUp = previous < stationDistance && this.distance >= stationDistance
      const crossedDown = previous >= stationDistance && this.distance < stationDistance
      if (crossedUp) this.crossListeners.forEach((listener) => listener(index, 1))
      if (crossedDown) this.crossListeners.forEach((listener) => listener(index, -1))
    })
    if (!this.isWalking) this.arriveListeners.forEach((listener) => listener())
  }

  get frame(): HeroFrame {
    if (this.isWalking) return WALK_FRAMES[Math.floor(this.stride / 4) % WALK_FRAMES.length]
    return Math.floor(this.idleClock / 0.55) % 2 === 0 ? 'idle0' : 'idle1'
  }

  get hopOffset(): number {
    const progress = this.hopClock / HOP_DURATION
    return progress >= 1 ? 0 : Math.round(Math.sin(progress * Math.PI) * 7)
  }

  get position(): { x: number; y: number } {
    const { x, y } = samplePath(this.distance)
    return { x, y }
  }
}
