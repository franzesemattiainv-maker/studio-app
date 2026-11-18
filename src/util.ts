import type { Section, Status } from './types'

export const SECTIONS: { id: Section; label: string; short: string; icon: string; hint: string }[] = [
  { id: 'ricette', label: 'Ricette ripetute', short: 'Ricetta', icon: '℞', hint: 'I farmaci che prendi di solito' },
  { id: 'appuntamenti', label: 'Appuntamenti', short: 'Visita', icon: '◷', hint: 'Prenota una visita in studio' },
  { id: 'certificati', label: 'Certificati', short: 'Certificato', icon: '▤', hint: 'Sportivo, malattia, altro' },
  { id: 'domande', label: 'Domande', short: 'Domanda', icon: '?', hint: 'Una domanda non urgente al medico' },
]

export const STATUS_LABEL: Record<Status, string> = {
  in_attesa: 'In attesa',
  approvata: 'Approvata',
  rifiutata: 'Non approvata',
  risposta: 'Risposta',
}

export function ago(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'adesso'
  if (m < 60) return `${m} min fa`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ${h === 1 ? 'ora' : 'ore'} fa`
  const d = Math.round(h / 24)
  return d === 1 ? 'ieri' : `${d} giorni fa`
}

export function surname(name: string): string {
  const [first, ...rest] = name.split(' ')
  return `${rest.join(' ')} ${first[0]}.`
}
