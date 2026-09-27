const CHARACTER_DELAY_MS = 24

export class Dialog {
  private readonly textElement: HTMLElement
  private readonly onCharacter: () => void
  private readonly instant: boolean
  private fullText = ''
  private shown = 0
  private timer: number | null = null

  constructor(textElement: HTMLElement, onCharacter: () => void) {
    this.textElement = textElement
    this.onCharacter = onCharacter
    this.instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  get isTyping(): boolean {
    return this.timer !== null
  }

  say(text: string): void {
    if (text === this.fullText) return
    this.stop()
    this.fullText = text
    this.shown = 0
    this.textElement.setAttribute('aria-label', text)
    if (this.instant) {
      this.finish()
      return
    }
    this.textElement.closest('[data-typewriter]')?.classList.add('is-typing')
    this.timer = window.setInterval(() => this.tick(), CHARACTER_DELAY_MS)
  }

  finish(): void {
    this.stop()
    this.shown = this.fullText.length
    this.textElement.textContent = this.fullText
  }

  private tick(): void {
    this.shown += 1
    this.textElement.textContent = this.fullText.slice(0, this.shown)
    const character = this.fullText[this.shown - 1]
    if (this.shown % 2 === 0 && character && character.trim()) this.onCharacter()
    if (this.shown >= this.fullText.length) this.stop()
  }

  private stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.textElement.closest('[data-typewriter]')?.classList.remove('is-typing')
  }
}
