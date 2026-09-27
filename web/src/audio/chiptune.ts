export type Sfx =
  | 'win'
  | 'loss'
  | 'undo'
  | 'rankUp'
  | 'rankDown'
  | 'text'
  | 'step'
  | 'select'
  | 'hit'
  | 'crit'
  | 'miss'
  | 'block'
  | 'hurt'
  | 'whoosh'
  | 'victory'
  | 'defeat'
  | 'gear'

const TEMPO = 96
const STEP_SECONDS = 60 / TEMPO / 2
const LOOKAHEAD_SECONDS = 0.12

const MELODY: Array<number | null> = [
  72, null, 76, null, 79, null, 76, 74,
  72, null, 69, null, 72, null, null, null,
  69, null, 72, null, 77, null, 76, 74,
  74, null, 79, null, 77, 76, 74, null,
  76, null, 79, null, 84, null, 83, 81,
  79, null, 76, null, 72, null, null, null,
  77, null, 76, null, 74, null, 72, null,
  71, null, 74, null, 72, null, null, null
]

const BASS_ROOTS = [48, 45, 41, 43, 48, 45, 41, 43]

function midiToHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}

export class Chiptune {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private schedulerId: number | null = null
  private nextStepTime = 0
  private step = 0
  musicEnabled = false
  sfxEnabled = false

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.55
      this.master.connect(this.context.destination)
      this.noise = this.createNoise(this.context)
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private createNoise(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  setMusic(enabled: boolean): void {
    this.musicEnabled = enabled
    if (enabled) {
      const context = this.ensureContext()
      this.nextStepTime = context.currentTime + 0.05
      this.step = 0
      this.schedulerId ??= window.setInterval(() => this.schedule(), 30)
    } else if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId)
      this.schedulerId = null
    }
  }

  setSfx(enabled: boolean): void {
    this.sfxEnabled = enabled
    if (enabled) this.ensureContext()
  }

  private tone(type: OscillatorType, frequency: number, start: number, duration: number, volume: number, slideTo?: number): void {
    const context = this.context
    if (!context || !this.master) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(this.master)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  private hiss(start: number, duration: number, volume: number, highpass: number): void {
    const context = this.context
    if (!context || !this.master || !this.noise) return
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = this.noise
    filter.type = 'highpass'
    filter.frequency.value = highpass
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    source.connect(filter).connect(gain).connect(this.master)
    source.start(start)
    source.stop(start + duration)
  }

  private schedule(): void {
    const context = this.context
    if (!context) return
    while (this.nextStepTime < context.currentTime + LOOKAHEAD_SECONDS) {
      this.playStep(this.step, this.nextStepTime)
      this.nextStepTime += STEP_SECONDS
      this.step = (this.step + 1) % MELODY.length
    }
  }

  private playStep(step: number, time: number): void {
    const note = MELODY[step]
    if (note !== null) this.tone('square', midiToHz(note), time, STEP_SECONDS * 1.7, 0.045)
    if (step % 2 === 0) {
      const root = BASS_ROOTS[Math.floor(step / 8)]
      const pattern = [0, 7, 4, 7]
      this.tone('triangle', midiToHz(root + pattern[(step / 2) % 4]), time, STEP_SECONDS * 1.8, 0.14)
    }
    if (step % 4 === 2) this.hiss(time, 0.04, 0.035, 6000)
    if (step % 8 === 0) this.hiss(time, 0.09, 0.05, 900)
  }

  play(effect: Sfx): void {
    if (!this.sfxEnabled) return
    const context = this.ensureContext()
    const now = context.currentTime + 0.01
    switch (effect) {
      case 'win':
        this.tone('square', 988, now, 0.07, 0.08)
        this.tone('square', 1319, now + 0.07, 0.22, 0.08)
        break
      case 'loss':
        this.tone('triangle', 330, now, 0.18, 0.18, 196)
        this.hiss(now, 0.06, 0.05, 1500)
        break
      case 'undo':
        this.tone('square', 523, now, 0.06, 0.05, 392)
        break
      case 'select':
        this.tone('square', 784, now, 0.05, 0.05)
        this.tone('square', 1047, now + 0.05, 0.08, 0.05)
        break
      case 'rankUp':
        ;[72, 76, 79, 84].forEach((note, index) => this.tone('square', midiToHz(note), now + index * 0.09, 0.14, 0.08))
        ;[72, 76, 79].forEach((note) => this.tone('triangle', midiToHz(note), now + 0.36, 0.6, 0.12))
        this.tone('square', midiToHz(88), now + 0.36, 0.5, 0.06)
        break
      case 'rankDown':
        ;[67, 63, 60].forEach((note, index) => this.tone('triangle', midiToHz(note), now + index * 0.12, 0.2, 0.14))
        break
      case 'text':
        this.tone('square', 620 + Math.random() * 120, now, 0.025, 0.018)
        break
      case 'step':
        this.hiss(now, 0.025, 0.025, 2500)
        break
      case 'hit':
        this.tone('square', 220, now, 0.08, 0.09, 110)
        this.hiss(now, 0.08, 0.08, 1200)
        break
      case 'crit':
        this.tone('square', 660, now, 0.05, 0.08)
        this.tone('square', 990, now + 0.05, 0.12, 0.08)
        this.hiss(now, 0.12, 0.1, 900)
        break
      case 'miss':
        this.tone('triangle', 520, now, 0.14, 0.1, 300)
        break
      case 'block':
        this.tone('square', 1568, now, 0.05, 0.06)
        this.tone('square', 2093, now + 0.04, 0.1, 0.05)
        this.hiss(now, 0.05, 0.05, 5000)
        break
      case 'hurt':
        this.tone('square', 160, now, 0.16, 0.1, 80)
        this.hiss(now, 0.1, 0.07, 700)
        break
      case 'whoosh':
        this.hiss(now, 0.12, 0.04, 3000)
        break
      case 'victory':
        ;[67, 72, 76, 79, 84].forEach((note, index) => this.tone('square', midiToHz(note), now + index * 0.1, 0.16, 0.08))
        ;[60, 64, 67].forEach((note) => this.tone('triangle', midiToHz(note), now + 0.5, 0.7, 0.12))
        break
      case 'defeat':
        ;[67, 65, 63, 60].forEach((note, index) => this.tone('triangle', midiToHz(note), now + index * 0.16, 0.24, 0.14))
        break
      case 'gear':
        ;[84, 88, 91, 96].forEach((note, index) => this.tone('square', midiToHz(note), now + index * 0.06, 0.1, 0.05))
        break
    }
  }
}
