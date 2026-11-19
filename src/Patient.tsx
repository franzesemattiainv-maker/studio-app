import { useEffect, useState } from 'react'
import { Icon, Mark } from './Icon'
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  if (!patient) return null

  const mine = requests.filter((r) => r.patientId === patientId)
  const unseen = mine.filter((r) => r.status !== 'in_attesa' && !r.seen).length

  const sent = (msg: string) => {
    setToast(msg)
    setView('richieste')
  }

  const initials = patient.name.split(' ').map((w) => w[0]).join('')

  return (
    <div className="pt">
      <header className="pt-head">
        {view === 'home' ? (
          <div className="brand sm">
            <Mark size={26} />
            <span>Studio</span>
          </div>
        ) : (
          <button className="back" onClick={() => setView('home')}>
            <Icon name="back" size={16} /> Indietro
          </button>
        )}
        <div className="pt-user">
          <span className="demo-chip"><i className="live amber" /> Demo</span>
          <span className="av sm">{initials}</span>
          <button className="icon-btn" onClick={() => setSession(null)} aria-label="Esci" title="Esci">
            <Icon name="out" size={18} />
          </button>
        </div>
      </header>

      <main className="pt-main">
        <div key={view} className="view-enter">
          {view === 'home' && (
            <Home
              patient={patient}
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
        </div>
      </main>

      <nav className="dock glass">
        <span className="dock-ind" style={{ transform: `translateX(${view === 'richieste' ? 100 : 0}%)` }} />
        <button className={view !== 'richieste' ? 'on' : ''} onClick={() => setView('home')}>
          <Icon name="home" size={19} /> Home
        </button>
        <button className={view === 'richieste' ? 'on' : ''} onClick={() => setView('richieste')}>
          <Icon name="inbox" size={19} /> Richieste
          {unseen > 0 && <i className="dot-badge num">{unseen}</i>}
        </button>
      </nav>
      {toast && (
        <div className="toast glass">
          <Icon name="check" size={16} /> {toast}
        </div>
      )}
    </div>
  )
}

function Home({ patient, onOpen, unseen, pending }: { patient: Patient; onOpen: (v: View) => void; unseen: number; pending: number }) {
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const meta = (id: Section) => SECTIONS.find((s) => s.id === id)!

  return (
    <div className="bento pt-bento">
      <section className="b-hero tile glass framed">
        <span className="eyebrow num">{today}</span>
        <h1>
          Buongiorno,
          <br />
          <span className="grad">{patient.name.split(' ')[0]}.</span>
        </h1>
        <span className="rule left" />
        {unseen > 0 ? (
          <button className="pulse-pill" onClick={() => onOpen('richieste')}>
            <i className="live" />
            Il medico ha risposto · <b className="num">{unseen}</b>
            <Icon name="arrow" size={15} />
          </button>
        ) : (
          <span className="status-line">
            <i className={`live ${pending ? 'amber' : ''}`} />
            {pending > 0 ? (
              <>
                <b className="num">{pending}</b> {pending === 1 ? 'richiesta' : 'richieste'} in attesa del medico
              </>
            ) : (
              'Nessuna richiesta in sospeso'
            )}
          </span>
        )}
      </section>

      <button className="b-rx tile glass interactive" onClick={() => onOpen('ricette')}>
        <span className="tile-glow" />
        <div className="tile-top">
          <span className="tile-ic accent"><Icon name="ricette" /></span>
          <span className="chip">Più usata</span>
        </div>
        <div className="tile-body">
          <span className="eyebrow">Terapia abituale</span>
          <ul className="ther-mini">
            {patient.therapy.map((d) => (
              <li key={d.name}>
                <span>{d.name.replace(/\s[\d.,]+\s?(mg|mcg)$/, '')}</span>
                <b className="num">{d.name.match(/[\d.,]+\s?(mg|mcg)$/)?.[0] ?? ''}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="tile-foot">
          <h3>Richiedi ricetta</h3>
          <Icon name="arrow" size={18} className="go" />
        </div>
      </button>

      {(['appuntamenti', 'certificati'] as const).map((id) => (
        <button key={id} className={`b-${id} tile glass interactive`} onClick={() => onOpen(id)}>
          <span className="tile-glow" />
          <span className="tile-ic"><Icon name={id} /></span>
          <div className="tile-foot col">
            <h3>{meta(id).short === 'Visita' ? 'Prenota visita' : meta(id).short}</h3>
            <small>{meta(id).hint}</small>
          </div>
        </button>
      ))}

      <button className="b-domande tile glass interactive" onClick={() => onOpen('domande')}>
        <span className="tile-glow" />
        <span className="tile-ic"><Icon name="domande" /></span>
        <div className="tile-foot col grow">
          <h3>Fai una domanda</h3>
          <small>{meta('domande').hint}</small>
        </div>
        <Icon name="arrow" size={18} className="go" />
      </button>

      <div className="b-sos sos">
        <Icon name="alert" size={18} />
        <span>
          <b>Emergenza? Chiama il 112.</b> Il medico legge le richieste negli orari di studio.
        </span>
      </div>
    </div>
  )
}

function FormShell({ icon, title, sub, children, onSubmit }: { icon: Section; title: string; sub: string; children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form className="pform" onSubmit={onSubmit}>
      <header className="pform-head">
        <span className="tile-ic accent lg"><Icon name={icon} size={24} /></span>
        <div>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
      </header>
      <div className="pform-body glass">{children}</div>
    </form>
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
    <FormShell
      icon="ricette"
      title="Richiedi ricetta"
      sub="La tua terapia abituale. Togli la spunta ai farmaci che non ti servono."
      onSubmit={(e) => {
        e.preventDefault()
        if (!drugs.length) return
        addRequest({ section: 'ricette', patientId: patient.id, drugs, note: note.trim() || undefined } as Request)
        onSent('Richiesta inviata al medico')
      }}
    >
      <div className="optlist">
        {patient.therapy.map((d) => (
          <label key={d.name} className={`opt ${sel.has(d.name) ? 'on' : ''}`}>
            <input type="checkbox" checked={sel.has(d.name)} onChange={() => toggle(d.name)} />
            <span className="cb" />
            <span className="opt-txt">
              <b>{d.name}</b>
              <small>{d.dose}</small>
            </span>
          </label>
        ))}
      </div>
      <label className="field">
        <span>Un altro farmaco <i>facoltativo</i></span>
        <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Scrivi il nome" />
      </label>
      <label className="field">
        <span>Nota per il medico <i>facoltativa</i></span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button className="btn primary block" disabled={!drugs.length}>
        Invia al medico · <span className="num">{drugs.length}</span> {drugs.length === 1 ? 'farmaco' : 'farmaci'}
      </button>
    </FormShell>
  )
}

const PREFS = ['Mattina', 'Pomeriggio', 'Indifferente']

function AppuntamentoForm({ patientId, onSent }: { patientId: string; onSent: (m: string) => void }) {
  const [reason, setReason] = useState('')
  const [preferred, setPreferred] = useState('Indifferente')
  return (
    <FormShell
      icon="appuntamenti"
      title="Prenota una visita"
      sub="Il medico ti proporrà giorno e ora."
      onSubmit={(e) => {
        e.preventDefault()
        if (!reason.trim()) return
        addRequest({ section: 'appuntamenti', patientId, reason: reason.trim(), preferred } as Request)
        onSent('Richiesta di visita inviata')
      }}
    >
      <label className="field">
        <span>Motivo della visita</span>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Ad esempio: controllo pressione" required />
      </label>
      <div className="field">
        <span>Quando preferisci?</span>
        <div className="seg" style={{ ['--n' as string]: PREFS.length, ['--idx' as string]: PREFS.indexOf(preferred) }}>
          <span className="seg-ind" />
          {PREFS.map((o) => (
            <button type="button" key={o} className={preferred === o ? 'on' : ''} onClick={() => setPreferred(o)}>
              {o}
            </button>
          ))}
        </div>
      </div>
      <button className="btn primary block" disabled={!reason.trim()}>Invia richiesta</button>
    </FormShell>
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
    <FormShell
      icon="certificati"
      title="Richiedi un certificato"
      sub="Scegli il tipo. Il medico ti avvisa quando è pronto."
      onSubmit={(e) => {
        e.preventDefault()
        addRequest({ section: 'certificati', patientId, kind, note: note.trim() || undefined } as Request)
        onSent('Richiesta di certificato inviata')
      }}
    >
      <div className="optlist">
        {CERT_KINDS.map((k) => (
          <label key={k} className={`opt ${kind === k ? 'on' : ''}`}>
            <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
            <span className="cb round" />
            <span className="opt-txt"><b>{k}</b></span>
          </label>
        ))}
      </div>
      <label className="field">
        <span>Dettagli <i>facoltativi</i></span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </label>
      <button className="btn primary block">Invia richiesta</button>
    </FormShell>
  )
}

function DomandaForm({ patientId, onSent }: { patientId: string; onSent: (m: string) => void }) {
  const [text, setText] = useState('')
  return (
    <FormShell
      icon="domande"
      title="Fai una domanda"
      sub="Per dubbi non urgenti. Il medico risponde negli orari di studio."
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        addRequest({ section: 'domande', patientId, text: text.trim() } as Request)
        onSent('Domanda inviata al medico')
      }}
    >
      <label className="field">
        <span>La tua domanda</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} required />
      </label>
      <button className="btn primary block" disabled={!text.trim()}>Invia domanda</button>
    </FormShell>
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

  return (
    <div className="reqs">
      <header className="pform-head">
        <span className="tile-ic accent lg"><Icon name="inbox" size={24} /></span>
        <div>
          <h1>Le mie richieste</h1>
          <p className="num">{list.length} in totale · {list.filter((r) => r.status === 'in_attesa').length} in attesa</p>
        </div>
      </header>

      {!list.length && <div className="empty glass">Non hai ancora inviato richieste.</div>}

      <ol className="timeline">
        {list.map((r, i) => (
          <li key={r.id} className={`tl-item ${r.status} ${!r.seen && r.status !== 'in_attesa' ? 'fresh' : ''}`} style={{ ['--i' as string]: i }}>
            <span className="tl-node"><Icon name={r.section} size={15} /></span>
            <article className="tl-card glass">
              <div className="card-top">
                <span className="eyebrow">{SECTIONS.find((s) => s.id === r.section)!.short}</span>
                <span className={`tag ${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <Summary r={r} />
              <small className="when num"><Icon name="clock" size={12} /> Inviata {ago(r.createdAt)}</small>
              {r.section === 'ricette' && r.status === 'approvata' && r.code && (
                <div className="code">
                  <span className="eyebrow">Codice ricetta · mostra in farmacia</span>
                  <b className="mono">{r.code}</b>
                </div>
              )}
              {r.section === 'appuntamenti' && r.confirmedSlot && (
                <div className="code">
                  <span className="eyebrow">Appuntamento confermato</span>
                  <b className="num">{r.confirmedSlot}</b>
                </div>
              )}
              {r.doctorNote && (
                <div className="reply">
                  <span className="eyebrow">Dal medico</span>
                  {r.doctorNote}
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Summary({ r }: { r: Request }) {
  switch (r.section) {
    case 'ricette':
      return (
        <div className="sum">
          <div className="drugs">
            {r.drugs.map((d) => (
              <span key={d.name} className="drug num">{d.name}</span>
            ))}
          </div>
          {r.note && <q>{r.note}</q>}
        </div>
      )
    case 'appuntamenti':
      return <div className="sum"><p>{r.reason}</p><small>Preferenza · {r.preferred}</small></div>
    case 'certificati':
      return <div className="sum"><p>{r.kind}</p>{r.note && <q>{r.note}</q>}</div>
    case 'domande':
      return <div className="sum"><p>{r.text}</p></div>
  }
}
