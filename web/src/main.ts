import './style.css'
import { evaluateRank, RANKS } from './rankTier'

interface State {
  wins: number
  losses: number
  soundOn: boolean
}

const state: State = { wins: 0, losses: 0, soundOn: false }
let previousRankIndex = evaluateRank(state.wins, state.losses).rankIndex

function sceneSvg(): string {
  return `
    <svg viewBox="0 0 160 100" shape-rendering="crispEdges" role="img" aria-label="Vilarejo pixel art ao entardecer">
      <rect width="160" height="60" fill="#33224a"/>
      <rect width="160" height="20" y="20" fill="#5c3a68"/>
      <rect width="160" height="14" y="40" fill="#a2537a"/>
      <rect width="160" height="10" y="50" fill="#ff9d5c"/>
      <rect x="18" y="10" width="8" height="8" fill="#ffe6a8"/>
      <rect x="0" y="58" width="160" height="10" fill="#3a2140"/>
      <rect x="0" y="66" width="160" height="34" fill="#241329"/>
      <rect x="4" y="30" width="10" height="34" fill="#3a2417"/>
      <rect x="2" y="24" width="14" height="8" fill="#4a5c34"/>
      <rect x="130" y="20" width="12" height="44" fill="#3a2417"/>
      <rect x="127" y="12" width="18" height="10" fill="#4a5c34"/>
      <g>
        <rect x="55" y="42" width="50" height="26" fill="#6b3a22"/>
        <rect x="50" y="30" width="60" height="14" fill="#4a2c1f"/>
        <rect x="76" y="18" width="8" height="14" fill="#4a2c1f"/>
        <g class="smoke">
          <rect x="78" y="10" width="3" height="3" fill="#cfc9d6"/>
          <rect x="78" y="10" width="3" height="3" fill="#cfc9d6"/>
          <rect x="78" y="10" width="3" height="3" fill="#cfc9d6"/>
        </g>
        <rect class="window-glow" x="62" y="48" width="10" height="10" fill="#ffdca8"/>
        <rect class="window-glow" x="88" y="48" width="10" height="10" fill="#ffdca8"/>
        <rect x="74" y="52" width="12" height="16" fill="#2f1c12"/>
      </g>
      <g transform="translate(30,74)">
        <rect x="-2" y="10" width="4" height="4" fill="#5a3a2a"/>
        <rect x="6" y="10" width="4" height="4" fill="#5a3a2a"/>
        <g class="flame">
          <rect x="-1" y="0" width="10" height="4" fill="#ff7b3f"/>
          <rect x="1" y="-4" width="6" height="5" fill="#ffd166"/>
          <rect x="2" y="-7" width="4" height="4" fill="#fff3c4"/>
        </g>
      </g>
      <rect x="0" y="94" width="160" height="6" fill="#1a0e1f"/>
    </svg>
  `
}

function characterSvg(): string {
  return `
    <svg viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="Personagem do jogador">
      <rect x="5" y="1" width="6" height="5" fill="#ffd9b3"/>
      <rect x="4" y="0" width="8" height="2" fill="#5a3a2a"/>
      <rect x="4" y="6" width="8" height="6" fill="#ff7b3f"/>
      <rect x="3" y="7" width="2" height="4" fill="#ffd9b3"/>
      <rect x="11" y="7" width="2" height="4" fill="#ffd9b3"/>
      <rect x="4" y="12" width="3" height="4" fill="#3a2417"/>
      <rect x="9" y="12" width="3" height="4" fill="#3a2417"/>
    </svg>
  `
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Elemento raiz #app não encontrado')
}

app.innerHTML = `
  <div class="app-shell">
    <h1 class="title">RankTier</h1>
    <p class="subtitle">A vila aconchegante das patentes</p>
    <div class="stage">
      <div class="pixel-panel scene-frame">${sceneSvg()}</div>
      <div class="pixel-panel board-panel">
        <p class="board-title">Quadro de Patentes</p>
        <div class="ladder" id="ladder">
          ${RANKS.map(
            (rank, index) => `
            <div class="rung" data-rank-index="${index}" style="--rung-color:${rank.color}">
              <span class="rung-dot" style="--rung-color:${rank.color}"></span>
              <span>${rank.name}</span>
            </div>
          `
          ).join('')}
          <div class="character" id="character">${characterSvg()}</div>
          <div class="confetti-layer" id="confetti"></div>
        </div>
      </div>
    </div>

    <div class="pixel-panel">
      <div class="controls">
        <div class="stat-card">
          <span class="stat-label" id="wins-label">Vitórias</span>
          <div class="stat-row">
            <button class="pixel-btn is-negative" id="wins-dec" aria-label="Diminuir vitórias">-</button>
            <input class="stat-input" id="wins-input" type="number" min="0" step="1" inputmode="numeric" value="0" aria-labelledby="wins-label" />
            <button class="pixel-btn" id="wins-inc" aria-label="Aumentar vitórias">+</button>
          </div>
          <span class="hint" id="wins-hint"></span>
        </div>
        <div class="stat-card">
          <span class="stat-label" id="losses-label">Derrotas</span>
          <div class="stat-row">
            <button class="pixel-btn is-negative" id="losses-dec" aria-label="Diminuir derrotas">-</button>
            <input class="stat-input" id="losses-input" type="number" min="0" step="1" inputmode="numeric" value="0" aria-labelledby="losses-label" />
            <button class="pixel-btn" id="losses-inc" aria-label="Aumentar derrotas">+</button>
          </div>
          <span class="hint" id="losses-hint"></span>
        </div>
      </div>

      <div class="summary">
        <span class="balance" id="balance">Saldo: 0</span>
        <span class="rank-badge" id="rank-badge">Ferro</span>
      </div>
      <p class="progress-line" id="progress-line" aria-live="polite"></p>

      <div class="footer-row">
        <label class="sound-toggle" for="sound-toggle">
          <input type="checkbox" id="sound-toggle" />
          Som
        </label>
      </div>
    </div>
  </div>
`

const winsInput = document.querySelector<HTMLInputElement>('#wins-input')!
const lossesInput = document.querySelector<HTMLInputElement>('#losses-input')!
const winsHint = document.querySelector<HTMLSpanElement>('#wins-hint')!
const lossesHint = document.querySelector<HTMLSpanElement>('#losses-hint')!
const balanceEl = document.querySelector<HTMLSpanElement>('#balance')!
const rankBadge = document.querySelector<HTMLSpanElement>('#rank-badge')!
const progressLine = document.querySelector<HTMLParagraphElement>('#progress-line')!
const ladder = document.querySelector<HTMLDivElement>('#ladder')!
const character = document.querySelector<HTMLDivElement>('#character')!
const confettiLayer = document.querySelector<HTMLDivElement>('#confetti')!
const soundToggle = document.querySelector<HTMLInputElement>('#sound-toggle')!

let audioContext: AudioContext | null = null

function playRankUpChime(): void {
  if (!state.soundOn) return
  audioContext ??= new AudioContext()
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator()
    const gain = audioContext!.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = frequency
    const startTime = audioContext!.currentTime + index * 0.09
    gain.gain.setValueAtTime(0.06, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18)
    oscillator.connect(gain).connect(audioContext!.destination)
    oscillator.start(startTime)
    oscillator.stop(startTime + 0.2)
  })
}

function spawnConfetti(color: string): void {
  confettiLayer.innerHTML = ''
  const particleCount = 14
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('span')
    particle.className = 'confetto'
    const angle = (Math.PI / particleCount) * i * 2 - Math.PI / 2
    const distance = 26 + Math.random() * 22
    particle.style.setProperty('--c', color)
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 20}px`)
    particle.style.setProperty('--rot', `${Math.random() * 360}deg`)
    confettiLayer.appendChild(particle)
  }
  window.setTimeout(() => {
    confettiLayer.innerHTML = ''
  }, 900)
}

function positionCharacter(rankIndex: number, didRankUp: boolean): void {
  const rung = ladder.querySelector<HTMLDivElement>(`.rung[data-rank-index="${rankIndex}"]`)
  if (!rung) return
  const previousTop = character.style.getPropertyValue('--current-top') || '0px'
  const targetTop = rung.offsetTop + rung.offsetHeight / 2 - character.offsetHeight / 2
  character.style.transform = `translateY(${targetTop}px)`
  character.style.setProperty('--current-top', `${targetTop}px`)
  if (didRankUp) {
    character.style.setProperty('--hop-start', previousTop)
    character.style.setProperty('--hop-end', `${targetTop}px`)
    character.classList.remove('is-jumping')
    void character.offsetWidth
    character.classList.add('is-jumping')
  }
}

function parseIntOrZero(rawValue: string): number {
  const parsed = Number.parseInt(rawValue, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function render(): void {
  const progress = evaluateRank(state.wins, state.losses)
  const rank = RANKS[progress.rankIndex]
  const didRankUp = progress.rankIndex > previousRankIndex

  winsInput.value = String(state.wins)
  lossesInput.value = String(state.losses)
  balanceEl.textContent = `Saldo: ${progress.balance}`
  rankBadge.textContent = progress.level
  rankBadge.style.setProperty('--rank-color', rank.color)

  progressLine.textContent =
    progress.winsToNext === null
      ? 'Patente máxima alcançada! Você é Imortal.'
      : `Faltam ${progress.winsToNext} vitória${progress.winsToNext === 1 ? '' : 's'} para ${progress.nextRankName}.`

  ladder.querySelectorAll<HTMLDivElement>('.rung').forEach((rung) => {
    rung.classList.toggle('is-current', Number(rung.dataset.rankIndex) === progress.rankIndex)
  })

  positionCharacter(progress.rankIndex, didRankUp)

  if (didRankUp) {
    spawnConfetti(rank.glow)
    playRankUpChime()
  }

  previousRankIndex = progress.rankIndex
}

function setWins(value: number): void {
  state.wins = Math.max(0, value)
  winsHint.textContent = value < 0 ? 'Valor ajustado para 0.' : ''
  render()
}

function setLosses(value: number): void {
  state.losses = Math.max(0, value)
  lossesHint.textContent = value < 0 ? 'Valor ajustado para 0.' : ''
  render()
}

document.querySelector('#wins-inc')!.addEventListener('click', () => setWins(state.wins + 1))
document.querySelector('#wins-dec')!.addEventListener('click', () => setWins(state.wins - 1))
document.querySelector('#losses-inc')!.addEventListener('click', () => setLosses(state.losses + 1))
document.querySelector('#losses-dec')!.addEventListener('click', () => setLosses(state.losses - 1))

winsInput.addEventListener('input', () => setWins(parseIntOrZero(winsInput.value)))
lossesInput.addEventListener('input', () => setLosses(parseIntOrZero(lossesInput.value)))

soundToggle.addEventListener('change', () => {
  state.soundOn = soundToggle.checked
})

window.addEventListener('resize', () => {
  const progress = evaluateRank(state.wins, state.losses)
  positionCharacter(progress.rankIndex, false)
})

render()
window.setTimeout(() => positionCharacter(previousRankIndex, false), 0)
