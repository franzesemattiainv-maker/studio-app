import { useEffect, useState } from 'react'
import { addRequest, patchRequests, setSession, useDemo } from './store'
import type { Drug, Patient, Request, Section } from './types'
import { ago, SECTIONS, STATUS_LABEL } from './util'

type View = 'home' | Section | 'richieste'

export function PatientApp({ patientId }: { patientId: string }) {
  const { patients, requests } = useDemo()
  const patient = patients.find((p) => p.id === patientId)
  const [view, setView] = useState<View>('home')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  if (!patient) return null

  const mine = requests.filter((r) => r.patientId === patientId)
  const unseen = mine.filter((r) => r.status !== 'in_attesa' && !r.seen).length

  const sent = (msg: string) => {
    setToast(msg)
    setView('richieste')
  }

  return (
    <div className="phone-shell">
      <header className="pt-head">
        {view === 'home' ? (
          <div>
            <small className="muted">Buongiorno</small>
            <h1>{patient.name.split(' ')[0]}</h1>
          </div>
        ) : (
          <button className="back" onClick={() => setView('home')}>‹ Indietro</button>
        )}
        <button className="link" onClick={() => setSession(null)}>Esci</button>
      </header>

      <main className="pt-main">
        {view === 'home' && (
          <Home
            onOpen={setView}
            unseen={unseen}
            pending={mine.filter((r) => r.status === 'in_attesa').length}
          />
        )}
        {view === 'ricette' && <RicettaForm patient={patient} onSent={sent} />}
        {view === 'appuntamenti' && <AppuntamentoForm patientId={patientId} onSent={sent} />}
        {view === 'certificati' && <CertificatoForm patientId={patientId} onSent={sent} />}
        {view === 'domande' && <DomandaForm patientId={patientId} onSent={sent} />}
        {view === 'richieste' && <MyRequests list={mine} />}
      </main>

      <nav className="tabbar">
        <button className={view !== 'richieste' ? 'on' : ''} onClick={() => setView('home')}>
          <span>⌂</span>Home
        </button>
        <button className={view === 'richieste' ? 'on' : ''} onClick={() => setView('richieste')}>
          <span>☰</span>Le mie richieste
          {unseen > 0 && <i className="badge">{unseen}</i>}
        </button>
      </nav>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Home({ onOpen, unseen, pending }: { onOpen: (v: View) => void; unseen: number; pending: number }) {
  return (
    <>
      {unseen > 0 && (
        <button className="notice" onClick={() => onOpen('richieste')}>
          <b>Il medico ha risposto</b>
          <span>{unseen === 1 ? '1 richiesta aggiornata' : `${unseen} richieste aggiornate`} · Apri</span>
        </button>
      )}
      <h2 className="sh">Di cosa hai bisogno?</h2>
      <div className="grid2">
        {SECTIONS.map((s) => (
          <button key={s.id} className="tile" onClick={() => onOpen(s.id)}>
            <span className="ic">{s.icon}</span>
            <b>{s.short}</b>
            <small>{s.hint}</small>
          </button>
        ))}
      </div>
      {pending > 0 && (
        <p className="muted center">
          Hai {pending} {pending === 1 ? 'richiesta' : 'richieste'} in attesa del medico.
        </p>
      )}
      <div className="sos">
        <b>Per un'emergenza chiama il 112.</b> Questa app non è pensata per le urgenze: il medico legge le richieste negli orari di studio.
      </div>
    </>
  )
}

function RicettaForm({ patient, onSent }: { patient: Patient; onSent: (m: string) => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set(patient.therapy.map((d) => d.name)))
  const [extra, setExtra] = useState('')
  const [note, setNote] = useState('')

  const toggle = (n: string) => {
    const s = new Set(sel)
    if (s.has(n)) s.delete(n)
    else s.add(n)
    setSel(s)
  }

  const drugs: Drug[] = [
    ...patient.therapy.filter((d) => sel.has(d.name)),
    ...(extra.trim() ? [{ name: extra.trim(), dose: 'Da confermare dal medico' }] : []),
  ]

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!drugs.length) return
        addRequest({ section: 'ricette', patientId: patient.id, drugs, note: note.trim() || undefined } as Request)
        onSent('Richiesta inviata al medico')
      }}
    >
      <h2 className="sh">Richiedi ricetta</h2>
      <p className="muted">I farmaci della tua terapia abituale. Togli la spunta a quelli che non ti servono.</p>
      {patient.therapy.map((d) => (
        <label key={d.name} className="row check">
          <input type="checkbox" checked={sel.has(d.name)} onChange={() => toggle(d.name)} />
          <span className="cb" />
          <span>
            {d.name}
            <small>{d.dose}</small>
          </span>
        </label>
      ))}
      <label className="field">
        Un altro farmaco (facoltativo)
        <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Scrivi il nome" />
      </label>
      <label className="field">
        Nota per il medico (facoltativa)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button className="btn primary block" disabled={!drugs.length}>
        Invia al medico
      </button>
    </form>
  )
}

function AppuntamentoForm({ patientId, onSent }: { patientId: string; onSent: (m: string) => void }) {
  const [reason, setReason] = useState('')
  const [preferred, setPreferred] = useState('Indifferente')
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!reason.trim()) return
        addRequest({ section: 'appuntamenti', patientId, reason: reason.trim(), preferred } as Request)
        onSent('Richiesta di visita inviata')
      }}
    >
      <h2 className="sh">Prenota una visita</h2>
      <label className="field">
        Motivo della visita
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Ad esempio: controllo pressione" required />
      </label>
      <div className="field">
        Quando preferisci?
        <div className="seg">
          {['Mattina', 'Pomeriggio', 'Indifferente'].map((o) => (
            <button type="button" key={o} className={preferred === o ? 'on' : ''} onClick={() => setPreferred(o)}>
              {o}
            </button>
          ))}
        </div>
      </div>
      <p className="muted">Il medico ti proporrà giorno e ora.</p>
      <button className="btn primary block" disabled={!reason.trim()}>Invia richiesta</button>
    </form>
  )
}

const CERT_KINDS = [
  'Certificato per attività sportiva non agonistica',
  'Certificato di malattia',
  'Certificato di buona salute',
  'Altro',
]

function CertificatoForm({ patientId, onSent }: { patientId: string; onSent: (m: string) => void }) {
  const [kind, setKind] = useState(CERT_KINDS[0])
  const [note, setNote] = useState('')
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        addRequest({ section: 'certificati', patientId, kind, note: note.trim() || undefined } as Request)
        onSent('Richiesta di certificato inviata')
      }}
    >
      <h2 className="sh">Richiedi un certificato</h2>
      {CERT_KINDS.map((k) => (
        <label key={k} className="row check">
          <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
          <span className="cb round" />
          <span>{k}</span>
        </label>
      ))}
      <label className="field">
        Dettagli (facoltativi)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button className="btn primary block">Invia richiesta</button>
    </form>
  )
}

function DomandaForm({ patientId, onSent }: { patientId: string; onSent: (m: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        addRequest({ section: 'domande', patientId, text: text.trim() } as Request)
        onSent('Domanda inviata al medico')
      }}
    >
      <h2 className="sh">Fai una domanda</h2>
      <p className="muted">Per dubbi non urgenti. Il medico risponde negli orari di studio.</p>
      <label className="field">
        La tua domanda
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} required />
      </label>
      <button className="btn primary block" disabled={!text.trim()}>Invia domanda</button>
    </form>
  )
}

function MyRequests({ list }: { list: Request[] }) {
  // Mark outcomes as seen once the list is shown.
  useEffect(() => {
    const ids = list.filter((r) => r.status !== 'in_attesa' && !r.seen).map((r) => r.id)
    if (ids.length) {
      const t = setTimeout(() => patchRequests(ids, () => ({ seen: true })), 1500)
      return () => clearTimeout(t)
    }
  }, [list])

  if (!list.length) return <p className="muted center">Non hai ancora inviato richieste.</p>

  return (
    <div className="form">
      <h2 className="sh">Le mie richieste</h2>
      {list.map((r) => (
        <div key={r.id} className={`card ${!r.seen && r.status !== 'in_attesa' ? 'fresh' : ''}`}>
          <div className="card-top">
            <span className="kind">{SECTIONS.find((s) => s.id === r.section)!.short}</span>
            <span className={`tag ${r.status}`}>{STATUS_LABEL[r.status]}</span>
          </div>
          <Summary r={r} />
          <small className="muted">Inviata {ago(r.createdAt)}</small>
          {r.section === 'ricette' && r.status === 'approvata' && r.code && (
            <div className="code">
              <small>Codice ricetta (da mostrare in farmacia)</small>
              <b>{r.code}</b>
            </div>
          )}
          {r.section === 'appuntamenti' && r.confirmedSlot && (
            <div className="code">
              <small>Appuntamento confermato</small>
              <b className="txt">{r.confirmedSlot}</b>
            </div>
          )}
          {r.doctorNote && (
            <div className="reply">
              <small>Dal medico</small>
              {r.doctorNote}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function Summary({ r }: { r: Request }) {
  switch (r.section) {
    case 'ricette':
      return <p className="sum">{r.drugs.map((d) => d.name).join(', ')}{r.note && <small>“{r.note}”</small>}</p>
    case 'appuntamenti':
      return <p className="sum">{r.reason}<small>Preferenza: {r.preferred}</small></p>
    case 'certificati':
      return <p className="sum">{r.kind}{r.note && <small>“{r.note}”</small>}</p>
    case 'domande':
      return <p className="sum">{r.text}</p>
  }
}
