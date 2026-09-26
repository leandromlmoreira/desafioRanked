export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  life: number
  maxLife: number
  color: string
  size: number
  glows: boolean
}

export class ParticleField {
  private particles: Particle[] = []

  emit(particle: Omit<Particle, 'maxLife'>): void {
    this.particles.push({ ...particle, maxLife: particle.life })
  }

  burst(x: number, y: number, colors: string[], count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 24 + Math.random() * 60
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: 90,
        life: 0.7 + Math.random() * 0.7,
        color: colors[i % colors.length],
        size: Math.random() > 0.75 ? 2 : 1,
        glows: true
      })
    }
  }

  rise(x: number, y: number, colors: string[], count: number): void {
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 24,
        y: y + Math.random() * 6,
        vx: (Math.random() - 0.5) * 6,
        vy: -12 - Math.random() * 26,
        gravity: -4,
        life: 1 + Math.random() * 1.2,
        color: colors[i % colors.length],
        size: 1,
        glows: true
      })
    }
  }

  update(dt: number): void {
    this.particles = this.particles.filter((particle) => {
      particle.life -= dt
      particle.vy += particle.gravity * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      return particle.life > 0
    })
  }

  draw(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, onlyGlowing: boolean): void {
    this.particles.forEach((particle) => {
      if (particle.glows !== onlyGlowing) return
      const fade = particle.life / particle.maxLife
      if (fade < 0.3 && Math.floor(particle.life * 20) % 2 === 0) return
      ctx.globalAlpha = Math.min(1, fade * 1.6)
      ctx.fillStyle = particle.color
      ctx.fillRect(Math.round(particle.x - offsetX), Math.round(particle.y - offsetY), particle.size, particle.size)
    })
    ctx.globalAlpha = 1
  }
}
