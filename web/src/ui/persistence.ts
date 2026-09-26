const STORAGE_KEY = 'ranktier:journal'

export interface JournalRecord {
  wins: number
  losses: number
}

function parseCount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value >= 0 ? Math.min(value, 9999) : null
}

function fromUrl(): JournalRecord | null {
  const params = new URLSearchParams(window.location.search)
  const wins = parseCount(params.get('vitorias'))
  const losses = parseCount(params.get('derrotas'))
  if (wins === null && losses === null) return null
  return { wins: wins ?? 0, losses: losses ?? 0 }
}

function fromStorage(): JournalRecord | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    const wins = parseCount(String(stored?.wins))
    const losses = parseCount(String(stored?.losses))
    return wins === null || losses === null ? null : { wins, losses }
  } catch {
    return null
  }
}

export function loadRecord(): JournalRecord {
  return fromUrl() ?? fromStorage() ?? { wins: 0, losses: 0 }
}

export function saveRecord(record: JournalRecord): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    return
  }
}

export function shareUrl(record: JournalRecord): string {
  const url = new URL(window.location.href)
  url.search = new URLSearchParams({ vitorias: String(record.wins), derrotas: String(record.losses) }).toString()
  return url.toString()
}
