import './style.css'
import './game.css'
import { Shell } from './app/shell'
import { Battle } from './battle/battle'
import { FreeMode } from './modes/freeMode'
import { JourneyMode } from './modes/journeyMode'
import { StoryPlayer } from './story/storyPlayer'
import { element } from './ui/dom'
import { Inventory } from './ui/inventory'
import { loadMode, saveMode, type Mode } from './ui/journeyStore'

const shell = new Shell()
const battle = new Battle(shell.audio)
const story = new StoryPlayer(shell.audio)
const inventory = new Inventory(shell.audio)
const journeyMode = new JourneyMode(shell, battle, story, inventory)
const freeMode = new FreeMode(shell, () => journeyMode.gear)

const tabs: Record<Mode, HTMLButtonElement> = {
  jornada: element<HTMLButtonElement>('tab-journey'),
  livre: element<HTMLButtonElement>('tab-free')
}
const panels: Record<Mode, HTMLElement> = {
  jornada: element('journey-panel'),
  livre: element('free-panel')
}

function switchTo(mode: Mode): void {
  ;(Object.keys(tabs) as Mode[]).forEach((key) => {
    tabs[key].setAttribute('aria-selected', String(key === mode))
    tabs[key].tabIndex = key === mode ? 0 : -1
    panels[key].hidden = key !== mode
  })
  document.body.dataset.mode = mode
  saveMode(mode)
  if (mode === 'jornada') {
    freeMode.deactivate()
    void journeyMode.activate()
  } else {
    journeyMode.deactivate()
    freeMode.activate()
  }
}

;(Object.keys(tabs) as Mode[]).forEach((mode) => {
  tabs[mode].addEventListener('click', () => {
    if (tabs[mode].getAttribute('aria-selected') === 'true') return
    shell.audio.play('select')
    switchTo(mode)
  })
  tabs[mode].addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const next: Mode = mode === 'jornada' ? 'livre' : 'jornada'
    tabs[next].focus()
    tabs[next].click()
  })
})

switchTo(freeMode.arrivedFromLink ? 'livre' : loadMode())
shell.start()
