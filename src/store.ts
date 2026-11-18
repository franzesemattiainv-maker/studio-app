import { useSyncExternalStore } from 'react'
import type { DemoState, Patient, Request, Session } from './types'

const KEY = 'studio-demo-state'
const SESSION_KEY = 'studio-demo-session'
const VERSION = 1

const H = 60 * 60 * 1000

export const PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Mario Rossi',
    birth: '12/03/1951',
    therapy: [
      { name: 'Ramipril 5 mg', dose: '1 compressa al giorno' },
      { name: 'Atorvastatina 20 mg', dose: '1 compressa la sera' },
      { name: 'Cardioaspirina 100 mg', dose: '1 compressa a pranzo' },
    ],
  },
  {
    id: 'p2',
    name: 'Anna Bianchi',
    birth: '04/09/1963',
    therapy: [{ name: 'Levotiroxina 75 mcg', dose: '1 compressa a digiuno' }],
  },
  {
    id: 'p3',
    name: 'Luigi Esposito',
    birth: '22/11/1948',
    therapy: [
      { name: 'Metformina 850 mg', dose: '2 compresse al giorno' },
      { name: 'Amlodipina 5 mg', dose: '1 compressa al giorno' },
    ],
  },
  {
    id: 'p4',
    name: 'Giulia Ferri',
    birth: '30/06/1972',
    therapy: [{ name: 'Pantoprazolo 20 mg', dose: '1 compressa al mattino' }],
  },
  {
    id: 'p5',
    name: 'Paolo Ricci',
    birth: '15/01/1958',
    therapy: [{ name: 'Atorvastatina 20 mg', dose: '1 compressa la sera' }],
  },
]

function seed(): DemoState {
  const now = Date.now()
  const requests: Request[] = [
    {
      id: 'r1', section: 'ricette', patientId: 'p4', createdAt: now - 2 * H, status: 'in_attesa',
      drugs: [PATIENTS[3].therapy[0]],
    },
    {
      id: 'r2', section: 'ricette', patientId: 'p3', createdAt: now - 3 * H, status: 'in_attesa',
      drugs: PATIENTS[2].therapy,
    },
    {
      id: 'r3', section: 'ricette', patientId: 'p2', createdAt: now - 5 * H, status: 'in_attesa',
      drugs: PATIENTS[1].therapy,
    },
    {
      id: 'r4', section: 'ricette', patientId: 'p5', createdAt: now - 26 * H, status: 'in_attesa',
      drugs: PATIENTS[4].therapy, early: true, note: 'Parto per due settimane, vorrei averla prima.',
    },
    {
      id: 'r5', section: 'ricette', patientId: 'p1', createdAt: now - 72 * H, status: 'approvata',
      drugs: PATIENTS[0].therapy.slice(0, 2), code: demoCode(), closedAt: now - 70 * H, seen: true,
    },
    {
      id: 'a1', section: 'appuntamenti', patientId: 'p3', createdAt: now - 4 * H, status: 'in_attesa',
      reason: 'Controllo glicemia e pressione', preferred: 'Mattina',
    },
    {
      id: 'a2', section: 'appuntamenti', patientId: 'p2', createdAt: now - 20 * H, status: 'in_attesa',
      reason: 'Dolore al ginocchio da qualche settimana', preferred: 'Pomeriggio',
    },
    {
      id: 'c1', section: 'certificati', patientId: 'p4', createdAt: now - 6 * H, status: 'in_attesa',
      kind: 'Certificato per attività sportiva non agonistica',
    },
    {
      id: 'q1', section: 'domande', patientId: 'p5', createdAt: now - 1 * H, status: 'in_attesa',
      text: "Posso prendere l'ibuprofene insieme all'atorvastatina?",
    },
    {
      id: 'q2', section: 'domande', patientId: 'p3', createdAt: now - 8 * H, status: 'in_attesa',
      text: 'Gli esami del sangue vanno fatti a digiuno?',
    },
  ]
  return { version: VERSION, patients: PATIENTS, requests }
}

/** Fake prescription code, clearly marked as a demo. */
export function demoCode(): string {
  const n = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
  return `DEMO-${n.slice(0, 5)}-${n.slice(5)}`
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

let state: DemoState = (() => {
  const s = read<DemoState>(KEY)
  return s && s.version === VERSION ? s : seed()
})()
let session: Session = read<Session>(SESSION_KEY)
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

// Keep several open tabs (patient in one, doctor in another) in sync.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    const s = read<DemoState>(KEY)
    if (s) state = s
    emit()
  }
})

export function useDemo() {
  return useSyncExternalStore(subscribe, () => state)
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => session)
}

export function setSession(s: Session) {
  session = s
  write(SESSION_KEY, s)
  emit()
}

export function update(fn: (s: DemoState) => DemoState) {
  state = fn(state)
  write(KEY, state)
  emit()
}

export function addRequest(r: Omit<Request, 'id' | 'createdAt' | 'status'>) {
  const full = {
    ...r,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    status: 'in_attesa',
  } as Request
  update((s) => ({ ...s, requests: [full, ...s.requests] }))
}

export function patchRequests(ids: string[], patch: (r: Request) => Partial<Request>) {
  const set = new Set(ids)
  update((s) => ({
    ...s,
    requests: s.requests.map((r) => (set.has(r.id) ? ({ ...r, ...patch(r) } as Request) : r)),
  }))
}

export function resetDemo() {
  state = seed()
  write(KEY, state)
  emit()
}

export function patientById(id: string): Patient | undefined {
  return state.patients.find((p) => p.id === id)
}
