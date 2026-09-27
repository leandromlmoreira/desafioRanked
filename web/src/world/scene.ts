import { buildHeroSheet, drawHeroFrame, HERO_HEIGHT, HERO_WIDTH, type HeroSheet } from '../art/hero'
import { buildFlameSheet, buildGlow } from '../art/props'
import type { GearId } from '../game/gear'
import { context2d, seededRandom } from '../pixel/canvas'
import { mixHex, mixRgb } from '../pixel/color'
import { RANKS } from '../rankTier'
import { ambienceAt, PHASE_STARTS, type Ambience } from './ambience'
import { paintClouds, paintFarRanges, paintHills, paintSky, paintStars, paintSunAndMoon, type View } from './backdrop'
import { CAMPFIRE, GROUND_Y, STATION_DISTANCES, WORLD_HEIGHT, WORLD_WIDTH, samplePath } from './layout'
import { ParticleField } from './particles'
import { LitLayer } from './litLayer'
import { buildTerrain, WATERFALL, type Terrain } from './terrain'
import { Walker } from './walker'

const CYCLE_SECONDS = 200
const START_TIME = 0.37
const FAST_FORWARD_SPEED = 18
const HERO_HOP_ROOM = 8

interface Firefly {
  x: number
  y: number
  phase: number
  radius: number
}

interface Smoke {
  x: number
  y: number
  age: number
  drift: number
}

export type PhaseListener = (label: string) => void

export class Scene {
  readonly walker = new Walker()
  readonly particles = new ParticleField()
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly world = new LitLayer(1, 1)
  private readonly hero = new LitLayer(HERO_WIDTH, HERO_HEIGHT + HERO_HOP_ROOM)
  private readonly terrain: Terrain
  private heroSheet: HeroSheet
  private readonly flames: HTMLCanvasElement
  private readonly warmGlow = buildGlow(14, '#ffc56b')
  private readonly smallGlow = buildGlow(5, '#fff1a8')
  private readonly fireflyGlow = buildGlow(3, '#e8ff8a')
  private readonly templeGlow = buildGlow(26, '#ffe7a3')
  private readonly fireflies: Firefly[]
  private smoke: Smoke[] = []
  private sky: ImageData | null = null
  private view: View = { width: 0, height: 0, cameraX: 0, cameraY: 0, rise: 0, time: 0 }
  private cameraX = 0
  private cameraY = WORLD_HEIGHT
  private time = START_TIME
  private fastForwardTo: number | null = null
  private clock = 0
  private shake = 0
  private rankIndex = 0
  private lastPhase = ''
  private phaseListeners: PhaseListener[] = []
  private smokeTimer = 0
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = context2d(canvas)
    this.terrain = buildTerrain()
    this.heroSheet = buildHeroSheet()
    this.flames = buildFlameSheet()
    const random = seededRandom(77)
    this.fireflies = Array.from({ length: 30 }, () => ({
      x: 10 + random() * (WORLD_WIDTH - 20),
      y: 360 + random() * (GROUND_Y - 330),
      phase: random() * Math.PI * 2,
      radius: 4 + random() * 10
    }))
  }

  onPhaseChange(listener: PhaseListener): void {
    this.phaseListeners.push(listener)
  }

  resize(cssWidth: number, cssHeight: number): void {
    const scale = Math.max(2, Math.round(cssWidth / 300))
    const width = Math.min(WORLD_WIDTH, Math.floor(cssWidth / scale))
    const height = Math.min(WORLD_HEIGHT, Math.floor(cssHeight / scale))
    this.canvas.width = width
    this.canvas.height = height
    this.canvas.style.width = `${width * scale}px`
    this.canvas.style.height = `${height * scale}px`
    this.world.resize(width, height)
    this.ctx.imageSmoothingEnabled = false
    this.sky = this.ctx.createImageData(width, height)
    this.view = { ...this.view, width, height }
    this.snapCamera()
  }

  setGear(gear: GearId[]): void {
    this.heroSheet = buildHeroSheet(gear)
  }

  setRank(rankIndex: number): void {
    this.rankIndex = rankIndex
  }

  celebrate(rankIndex: number): void {
    const { x, y } = this.walker.position
    const rank = RANKS[rankIndex]
    this.particles.burst(x, y - 10, [rank.color, rank.glow, '#fff6d0', '#ffd166'], 70)
    this.particles.rise(x, y - 4, [rank.glow, '#fff6d0'], 26)
    this.walker.hop()
    if (!this.reducedMotion) this.shake = 0.35
  }

  cheer(rankIndex: number): void {
    const { x, y } = this.walker.position
    const rank = RANKS[rankIndex]
    this.particles.burst(x, y - 10, [rank.color, rank.glow], 18)
  }

  skipToNextPhase(): void {
    const current = ((this.time % 1) + 1) % 1
    const next = PHASE_STARTS.find((start) => start > current + 0.01) ?? 1 + PHASE_STARTS[0]
    this.fastForwardTo = Math.floor(this.time) + next
  }

  get phaseLabel(): string {
    return this.lastPhase
  }

  snapCamera(): void {
    const [x, y] = this.cameraTarget()
    this.cameraX = x
    this.cameraY = y
  }

  start(): void {
    let previous = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000))
      previous = now
      this.update(dt)
      this.draw()
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  private cameraTarget(): [number, number] {
    const { x, y } = this.walker.position
    const targetX = x - this.view.width / 2
    const targetY = y - this.view.height * 0.64
    return [
      Math.min(WORLD_WIDTH - this.view.width, Math.max(0, targetX)),
      Math.min(WORLD_HEIGHT - this.view.height, Math.max(0, targetY))
    ]
  }

  private update(dt: number): void {
    this.clock += dt
    if (this.fastForwardTo !== null) {
      this.time = Math.min(this.fastForwardTo, this.time + (dt * FAST_FORWARD_SPEED) / CYCLE_SECONDS)
      if (this.time >= this.fastForwardTo) this.fastForwardTo = null
    } else {
      this.time += dt / CYCLE_SECONDS
    }
    this.walker.update(dt)
    this.particles.update(dt)
    this.shake = Math.max(0, this.shake - dt)
    const [targetX, targetY] = this.cameraTarget()
    const follow = 1 - Math.exp(-dt * 3.2)
    this.cameraX += (targetX - this.cameraX) * follow
    this.cameraY += (targetY - this.cameraY) * follow
    this.updateSmoke(dt)
    this.updateEmbers(dt)
  }

  private updateSmoke(dt: number): void {
    this.smokeTimer -= dt
    if (this.smokeTimer <= 0) {
      this.smokeTimer = 0.45
      this.terrain.chimneys.forEach(([x, y]) => this.smoke.push({ x, y, age: 0, drift: Math.random() * 2 - 1 }))
    }
    this.smoke = this.smoke.filter((puff) => {
      puff.age += dt
      puff.y -= dt * 7
      puff.x += dt * (3 + puff.drift + Math.sin(puff.age * 2) * 2)
      return puff.age < 3.2
    })
  }

  private updateEmbers(dt: number): void {
    if (Math.random() > dt * 3) return
    const [x, y] = CAMPFIRE
    this.particles.emit({
      x: x + Math.random() * 3 - 1,
      y: y - 6,
      vx: (Math.random() - 0.5) * 6,
      vy: -14 - Math.random() * 10,
      gravity: 0,
      life: 0.8 + Math.random() * 0.6,
      color: Math.random() > 0.5 ? '#ffd166' : '#ff8a3d',
      size: 1,
      glows: true
    })
  }

  private draw(): void {
    if (!this.sky) return
    const ambience = ambienceAt(this.time)
    if (ambience.phaseLabel !== this.lastPhase) {
      this.lastPhase = ambience.phaseLabel
      this.phaseListeners.forEach((listener) => listener(ambience.phaseLabel))
    }
    const shakeX = this.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0
    const shakeY = this.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0
    const cameraX = Math.round(this.cameraX) + shakeX
    const cameraY = Math.round(this.cameraY) + shakeY
    const bottomCamera = WORLD_HEIGHT - this.view.height
    this.view = { ...this.view, cameraX, cameraY, rise: bottomCamera - cameraY, time: this.clock }
    const ctx = this.ctx
    paintSky(ctx, this.sky, this.view, ambience)
    paintStars(ctx, this.view, ambience)
    paintSunAndMoon(ctx, this.view, ambience)
    paintFarRanges(ctx, this.view, ambience)
    paintClouds(ctx, this.view, ambience)
    paintHills(ctx, this.view, ambience)
    this.paintWorldLayer(ambience, cameraX, cameraY)
    ctx.drawImage(this.world.canvas, 0, 0)
    this.paintLights(ambience, cameraX, cameraY)
    this.paintHero(ambience, cameraX, cameraY)
    this.paintGlowingParticles(cameraX, cameraY)
    this.paintForeground(ambience, cameraX, cameraY)
  }

  private paintWorldLayer(ambience: Ambience, cameraX: number, cameraY: number): void {
    const ctx = this.world.ctx
    const { width, height } = this.view
    this.world.clear()
    ctx.drawImage(this.terrain.canvas, cameraX, cameraY, width, height, 0, 0, width, height)
    this.paintWater(ctx, cameraX, cameraY)
    this.paintStations(ctx, cameraX, cameraY)
    this.paintSmoke(ctx, cameraX, cameraY)
    this.particles.draw(ctx, cameraX, cameraY, false)
    this.paintHeroShadow(ctx, cameraX, cameraY)
    this.world.applyLight(ambience.light)
  }

  private paintStations(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    STATION_DISTANCES.forEach((distance, index) => {
      if (index === RANKS.length - 1) return
      const point = samplePath(distance)
      const x = Math.round(point.x) + 6 - cameraX
      const y = Math.round(point.y) - cameraY
      const unlocked = index <= this.rankIndex
      const isCurrent = index === this.rankIndex
      const rank = RANKS[index]
      ctx.fillStyle = '#3a2433'
      ctx.fillRect(x - 1, y - 15, 3, 16)
      ctx.fillStyle = '#8a5a3c'
      ctx.fillRect(x, y - 14, 1, 15)
      const wave = isCurrent && Math.floor(this.clock * 3) % 2 === 0 ? 1 : 0
      const cloth = unlocked ? rank.color : '#d8cdb9'
      const clothShade = unlocked ? mixHex(rank.color, '#1b1030', 0.35) : '#a99d88'
      ctx.fillStyle = '#2b1d2f'
      ctx.fillRect(x + 1, y - 15 + wave, 8, 8)
      ctx.fillStyle = cloth
      ctx.fillRect(x + 1, y - 14 + wave, 7, 6)
      ctx.fillStyle = clothShade
      ctx.fillRect(x + 1, y - 9 + wave, 7, 1)
      ctx.fillRect(x + 7, y - 14 + wave, 1, 6)
      ctx.fillStyle = '#2b1d2f'
      ctx.fillRect(x + 4, y - 8 + wave, 2, 1)
      if (unlocked) {
        ctx.fillStyle = mixHex(rank.glow, '#ffffff', 0.4)
        ctx.fillRect(x + 3, y - 12 + wave, 3, 1)
        ctx.fillRect(x + 4, y - 13 + wave, 1, 3)
      }
      ctx.fillStyle = '#2b1d2f'
      ctx.fillRect(x - 1, y - 18, 3, 3)
      ctx.fillStyle = '#ffd166'
      ctx.fillRect(x, y - 17, 1, 1)
    })
  }

  private paintWater(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const { x, width, top, poolLeft, poolRight } = WATERFALL
    const flow = Math.floor(this.clock * 45)
    ctx.fillStyle = '#e9f7ff'
    for (let y = top; y < GROUND_Y - 1; y++) {
      const lane = (y * 7) % width
      if ((y + flow + lane * 3) % 9 < 2) ctx.fillRect(x + lane - cameraX, y - cameraY, 1, 2)
    }
    for (let i = 0; i < 7; i++) {
      const jitter = Math.floor(Math.sin(this.clock * 9 + i * 1.7) * 2)
      ctx.fillRect(x - 3 + i * 2 - cameraX, GROUND_Y - 3 + jitter - cameraY, 1, 1)
    }
    const shimmer = Math.floor(this.clock * 6) % 6
    ctx.fillStyle = '#b8e6ff'
    for (let i = 0; i < 4; i++) {
      const sx = poolLeft + 8 + ((i * 11 + shimmer * 2) % (poolRight - poolLeft - 16))
      ctx.fillRect(sx - cameraX, GROUND_Y + 1 + (i % 2) - cameraY, 3, 1)
    }
  }

  private paintSmoke(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    this.smoke.forEach((puff) => {
      const size = puff.age < 1 ? 1 : puff.age < 2.2 ? 2 : 3
      ctx.globalAlpha = Math.max(0, 0.75 - puff.age / 4.2)
      ctx.fillStyle = '#e7e1ef'
      ctx.fillRect(Math.round(puff.x - cameraX), Math.round(puff.y - cameraY), size, size)
    })
    ctx.globalAlpha = 1
  }

  private paintHeroShadow(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const { x, y } = this.walker.position
    ctx.fillStyle = 'rgba(30, 16, 40, 0.35)'
    ctx.fillRect(Math.round(x) - 3 - cameraX, Math.round(y) + 1 - cameraY, 6, 1)
  }

  private paintHero(ambience: Ambience, cameraX: number, cameraY: number): void {
    const { x, y } = this.walker.position
    this.hero.clear()
    drawHeroFrame(this.hero.ctx, this.heroSheet, this.walker.frame, 0, HERO_HOP_ROOM - this.walker.hopOffset, this.walker.facing)
    this.hero.applyLight(mixRgb(ambience.light, [255, 255, 255], 0.25))
    const drawX = Math.round(x) - HERO_WIDTH / 2 - cameraX
    const drawY = Math.round(y) - HERO_HEIGHT - HERO_HOP_ROOM + 1 - cameraY
    this.ctx.drawImage(this.hero.canvas, drawX, drawY)
  }

  private paintGlowingParticles(cameraX: number, cameraY: number): void {
    this.ctx.globalCompositeOperation = 'lighter'
    this.particles.draw(this.ctx, cameraX, cameraY, true)
    this.ctx.globalCompositeOperation = 'source-over'
  }

  private paintLights(ambience: Ambience, cameraX: number, cameraY: number): void {
    const ctx = this.ctx
    const night = ambience.darkness
    this.terrain.windows.forEach((windowRect, index) => {
      const threshold = 0.26 + index * 0.045
      if (night < threshold) return
      const x = windowRect.x - cameraX
      const y = windowRect.y - cameraY
      ctx.fillStyle = '#ffd98a'
      ctx.fillRect(x, y, windowRect.width, windowRect.height)
      ctx.fillStyle = '#e8a04e'
      ctx.fillRect(x + 2, y, 1, windowRect.height)
      ctx.fillRect(x, y + 3, windowRect.width, 1)
      this.glow(this.warmGlow, x + 3, y + 3, Math.min(1, (night - threshold) * 4) * 0.9)
    })
    STATION_DISTANCES.forEach((distance, index) => {
      if (index === RANKS.length - 1) return
      const point = samplePath(distance)
      const intensity = Math.min(1, Math.max(0, (night - 0.3 - index * 0.03) * 3))
      if (intensity <= 0) return
      this.glow(this.smallGlow, Math.round(point.x) + 6 - cameraX, Math.round(point.y) - 17 - cameraY, intensity)
    })
    this.terrain.lanterns.forEach(([x, y]) => this.glow(this.warmGlow, x - cameraX, y - cameraY, 0.2 + night * 0.8))
    this.paintCampfire(ctx, night, cameraX, cameraY)
    this.paintTempleLight(ctx, night, cameraX, cameraY)
    this.paintFireflies(ctx, night, cameraX, cameraY)
  }

  private glow(sprite: HTMLCanvasElement, centerX: number, centerY: number, alpha: number): void {
    if (alpha <= 0) return
    const ctx = this.ctx
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = alpha
    ctx.drawImage(sprite, Math.round(centerX - sprite.width / 2), Math.round(centerY - sprite.height / 2))
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  private paintCampfire(ctx: CanvasRenderingContext2D, night: number, cameraX: number, cameraY: number): void {
    const [x, y] = CAMPFIRE
    const frame = Math.floor(this.clock * 8) % 3
    ctx.drawImage(this.flames, frame * 7, 0, 7, 8, x - 3 - cameraX, y - 9 - cameraY, 7, 8)
    const flicker = 0.85 + Math.sin(this.clock * 13) * 0.08 + Math.sin(this.clock * 7.3) * 0.07
    this.glow(this.warmGlow, x - cameraX, y - 5 - cameraY, (0.35 + night * 0.9) * flicker)
  }

  private paintTempleLight(ctx: CanvasRenderingContext2D, night: number, cameraX: number, cameraY: number): void {
    const door = this.terrain.templeDoor
    const isSummit = this.rankIndex === RANKS.length - 1
    const pulse = (Math.sin(this.clock * 2) + 1) / 2
    const x = door.x - cameraX
    const y = door.y - cameraY
    ctx.fillStyle = isSummit ? '#fff1b8' : mixHex('#6a4fb8', '#ffd98a', 0.25 + night * 0.6)
    ctx.fillRect(x, y, door.width, door.height)
    ctx.fillStyle = isSummit ? '#ffd166' : '#b58be8'
    ctx.fillRect(x + door.width / 2 - 1, y + 3, 2, door.height - 6)
    const strength = (isSummit ? 1 : 0.25 + night * 0.5) * (0.8 + pulse * 0.2)
    this.glow(this.templeGlow, x + door.width / 2, y + door.height / 2, strength)
    if (isSummit && night > 0.3) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.12 + pulse * 0.08
      ctx.fillStyle = '#ffe7a3'
      ctx.fillRect(x + 2, 0, door.width - 4, y)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  private paintFireflies(ctx: CanvasRenderingContext2D, night: number, cameraX: number, cameraY: number): void {
    const visibility = Math.min(1, Math.max(0, (night - 0.28) / 0.25))
    if (visibility <= 0) return
    this.fireflies.forEach((fly) => {
      const t = this.clock * 0.6 + fly.phase
      const x = Math.round(fly.x + Math.sin(t) * fly.radius + Math.sin(t * 2.3) * 3 - cameraX)
      const y = Math.round(fly.y + Math.cos(t * 0.8) * fly.radius * 0.6 - cameraY)
      const blink = Math.max(0, Math.sin(this.clock * 2.4 + fly.phase * 3))
      if (blink < 0.1) return
      this.glow(this.fireflyGlow, x, y, visibility * blink)
      ctx.globalAlpha = visibility * blink
      ctx.fillStyle = '#f4ffb0'
      ctx.fillRect(x, y, 1, 1)
      ctx.globalAlpha = 1
    })
  }

  private paintForeground(ambience: Ambience, cameraX: number, cameraY: number): void {
    const ctx = this.ctx
    const rise = WORLD_HEIGHT - this.view.height - cameraY
    const baseY = Math.round(WORLD_HEIGHT + 6 - cameraY + rise * 0.35)
    if (baseY - 26 > this.view.height) return
    const color = mixHex('#1f3a2c', '#0b0f22', ambience.darkness)
    const highlight = mixHex('#2e5a3c', '#141a36', ambience.darkness)
    for (let sx = 0; sx < this.view.width; sx++) {
      const layerX = sx + cameraX * 1.3
      const bush = Math.abs(Math.sin(layerX * 0.05)) * 12 + Math.abs(Math.sin(layerX * 0.13 + 1)) * 5
      const blade = Math.round(Math.sin(layerX * 1.7 + Math.sin(this.clock * 1.5 + layerX * 0.1) * 0.6) * 2)
      const top = baseY - Math.round(bush) - Math.max(0, blade)
      ctx.fillStyle = color
      ctx.fillRect(sx, top, 1, this.view.height - top)
      ctx.fillStyle = highlight
      ctx.fillRect(sx, top, 1, 1)
    }
  }
}
