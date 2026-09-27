export function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (!found) throw new Error(`Elemento #${id} não encontrado`)
  return found as T
}

export function paintInto(target: HTMLCanvasElement, source: HTMLCanvasElement): void {
  target.width = source.width
  target.height = source.height
  const ctx = target.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, target.width, target.height)
  ctx.drawImage(source, 0, 0)
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Enter'
}
