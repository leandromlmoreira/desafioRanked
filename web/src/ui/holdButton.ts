const FIRST_REPEAT_MS = 380
const FASTEST_REPEAT_MS = 45

export function bindHoldButton(button: HTMLButtonElement, action: () => void): void {
  let timer: number | null = null
  let interval = 130

  const stop = () => {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
    button.classList.remove('is-held')
  }

  const repeat = () => {
    action()
    interval = Math.max(FASTEST_REPEAT_MS, interval * 0.86)
    timer = window.setTimeout(repeat, interval)
  }

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    button.setPointerCapture(event.pointerId)
    button.classList.add('is-held')
    interval = 130
    action()
    timer = window.setTimeout(repeat, FIRST_REPEAT_MS)
  })

  ;['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => button.addEventListener(type, stop))

  button.addEventListener('click', (event) => {
    if (event.detail === 0) action()
  })

  button.addEventListener('contextmenu', (event) => event.preventDefault())
}
