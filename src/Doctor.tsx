import { useEffect, useMemo, useState } from 'react'
import { demoCode, patchRequests, resetDemo, setSession, useDemo } from './store'
import type { Request, Section } from './types'
import { Summary } from './Patient'
import { ago, SECTIONS, STATUS_LABEL } from './util'

/** Rough minutes of phone or desk time saved per handled request (demo estimate). */
const MIN_SAVED = 4

const QUICK_REPLIES = [
  'Sì, nessun problema.',
  'Meglio di no: passi in studio così ne parliamo.',
  'Sì, a digiuno da almeno 8 ore. Può bere acqua.',
]

function nextSlots(preferred?: string): string[] {
  const out: string[] = []
  const d = new Date()
  const hours = preferred === 'Pomeriggio' ? ['15:30', '16:45'] : preferred === 'Mattina' ? ['9:15', '11:00'] : ['10:30', '16:00']
  while (out.length < 4) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const day = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    for (const h of hours) if (out.length < 4) out.push(`${day[0].toUpperCase()}${day.slice(1)}, ore ${h}`)
  }
  return out
}

export function DoctorApp() {
  const { requests, patients } = useDemo()
  const [section, setSection] = useState<Section>('ricette')
  const [tab, setTab] = useState<'aperte' | 'chiuse'>('aperte')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const pname = (id: string) => patients.find((p) => p.id === id)?.name ?? '—'

  const counts = useMemo(() => {
    const c: Record<Section, number> = { ricette: 0, appuntamenti: 0, certificati: 0, domande: 0 }
    requests.forEach((r) => r.status === 'in_attesa' && c[r.section]++)
    return c
  }, [requests])

  const today = new Date().setHours(0, 0, 0, 0)
  const handledToday = requests.filter((r) => r.closedAt && r.closedAt >= today).length

  const list = requests
    .filter((r) => r.section === section && (tab === 'aperte' ? r.status === 'in_attesa' : r.status !== 'in_attesa'))
    .sort((a, b) => (tab === 'aperte' ? a.createdAt - b.createdAt : (b.closedAt ?? 0) - (a.closedAt ?? 0)))

  const open = requests.find((r) => r.id === openId) ?? null
  const bulk = section === 'ricette' || section === 'certificati'

  const go = (s: Section) => {
    setSection(s)
    setSel(new Set())
    setOpenId(null)
    setTab('aperte')
  }

  const toggle = (id: string) => {
    const s = new Set(sel)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSel(s)
  }

  const approve = (ids: string[]) => {
    const now = Date.now()
    patchRequests(ids, (r) => ({
      status: 'approvata',
      closedAt: now,
      seen: false,
      ...(r.section === 'ricette' ? { code: demoCode() } : {}),
      ...(r.section === 'certificati' ? { doctorNote: 'Il certificato è pronto: lo trova in studio o nella sua email.' } : {}),
    }))
    setSel(new Set())
    setOpenId(null)
    setToast(ids.length === 1 ? 'Richiesta approvata' : `${ids.length} richieste approvate`)
  }

  const reject = (ids: string[], reason: string) => {
    patchRequests(ids, () => ({ status: 'rifiutata', closedAt: Date.now(), seen: false, doctorNote: reason }))
    setSel(new Set())
    setOpenId(null)
    setRejecting(null)
    setToast(ids.length === 1 ? 'Richiesta non approvata' : `${ids.length} richieste non approvate`)
  }

  const allSel = list.length > 0 && list.every((r) => sel.has(r.id))
  const meta = SECTIONS.find((s) => s.id === section)!

  return (
    <div className="dr">
      <aside className="dr-side">
        <div className="logo"><span className="mk">+</span><span>Studio</span></div>
        <div className="who">
          <b>Dott.ssa Laura Conti</b>
          <small>Medicina generale · demo</small>
        </div>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.id} className={section === s.id ? 'on' : ''} onClick={() => go(s.id)}>
              <span className="ic">{s.icon}</span>
              {s.label}
              {counts[s.id] > 0 && <em>{counts[s.id]}</em>}
            </button>
          ))}
        </nav>
        <div className="stat">
          <b>{handledToday}</b>
          <span>richieste gestite oggi</span>
          <b className="sm">~{handledToday * MIN_SAVED} min</b>
          <span>di telefonate risparmiate (stima)</span>
        </div>
        <div className="side-foot">
          <button className="link" onClick={() => { if (confirm('Ripristinare i dati demo iniziali?')) resetDemo() }}>Ripristina demo</button>
          <button className="link" onClick={() => setSession(null)}>Esci</button>
        </div>
      </aside>

      <section className="dr-main">
        <header className="dr-head">
          <h1>{meta.label}</h1>
          <div className="seg">
            <button className={tab === 'aperte' ? 'on' : ''} onClick={() => { setTab('aperte'); setSel(new Set()) }}>Da gestire · {counts[section]}</button>
            <button className={tab === 'chiuse' ? 'on' : ''} onClick={() => { setTab('chiuse'); setSel(new Set()) }}>Gestite</button>
          </div>
        </header>

        {tab === 'aperte' && bulk && list.length > 0 && (
          <div className="bar">
            <label className="check inline">
              <input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(list.map((r) => r.id)))} />
              <span className="cb" />
              Seleziona tutte
            </label>
            <span className="grow" />
            <button className="btn ghost" disabled={!sel.size} onClick={() => setRejecting([...sel])}>Non approvare</button>
            <button className="btn primary" disabled={!sel.size} onClick={() => approve([...sel])}>
              Approva selezionate{sel.size ? ` (${sel.size})` : ''}
            </button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="empty">
            {tab === 'aperte' ? <>Nessuna richiesta da gestire in <b>{meta.label.toLowerCase()}</b>. ✓</> : 'Ancora nessuna richiesta gestita.'}
          </div>
        ) : (
          <div className="list">
            {list.map((r) => (
              <div key={r.id} className={`lrow ${openId === r.id ? 'open' : ''}`} onClick={() => setOpenId(r.id)}>
                {tab === 'aperte' && bulk && (
                  <label className="check" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
                    <span className="cb" />
                  </label>
                )}
                <div className="lp">
                  <b>{pname(r.patientId)}</b>
                  <small>{ago(r.createdAt)}</small>
                </div>
                <div className="ls"><Summary r={r} /></div>
                <div className="lt">
                  {r.section === 'ricette' && r.early && r.status === 'in_attesa' && <span className="tag warn">In anticipo</span>}
                  <span className={`tag ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {open && (
        <Detail
          r={open}
          patient={pname(open.patientId)}
          onClose={() => setOpenId(null)}
          onApprove={() => approve([open.id])}
          onReject={() => setRejecting([open.id])}
          onConfirmSlot={(slot) => {
            patchRequests([open.id], () => ({ status: 'approvata', closedAt: Date.now(), seen: false, confirmedSlot: slot }))
            setOpenId(null)
            setToast('Appuntamento confermato')
          }}
          onReply={(text) => {
            patchRequests([open.id], () => ({ status: 'risposta', closedAt: Date.now(), seen: false, doctorNote: text }))
            setOpenId(null)
            setToast('Risposta inviata')
          }}
        />
      )}

      {rejecting && <RejectModal count={rejecting.length} onCancel={() => setRejecting(null)} onConfirm={(t) => reject(rejecting, t)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Detail(props: {
  r: Request
  patient: string
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onConfirmSlot: (s: string) => void
  onReply: (t: string) => void
}) {
  const { r } = props
  const [slot, setSlot] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const { patients } = useDemo()
  const p = patients.find((x) => x.id === r.patientId)
  const pending = r.status === 'in_attesa'

  return (
    <div className="drawer-wrap" onClick={props.onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={props.onClose} aria-label="Chiudi">×</button>
        <small className="muted">{SECTIONS.find((s) => s.id === r.section)!.label} · {ago(r.createdAt)}</small>
        <h2>{props.patient}</h2>
        {p && <small className="muted">Nato/a il {p.birth}</small>}

        <div className="dblock"><Summary r={r} /></div>

        {r.section === 'ricette' && p && (
          <div className="dblock">
            <small className="lbl">Terapia abituale registrata</small>
            {p.therapy.map((d) => <div key={d.name} className="ther">{d.name} <small>{d.dose}</small></div>)}
            {r.early && <p className="warnbox">Richiesta in anticipo rispetto al consumo previsto.</p>}
          </div>
        )}

        {!pending && (
          <div className="dblock">
            <span className={`tag ${r.status}`}>{STATUS_LABEL[r.status]}</span>
            {r.section === 'ricette' && r.code && <p>Codice: <b className="mono">{r.code}</b></p>}
            {r.section === 'appuntamenti' && r.confirmedSlot && <p>{r.confirmedSlot}</p>}
            {r.doctorNote && <p className="reply">{r.doctorNote}</p>}
          </div>
        )}

        {pending && r.section === 'appuntamenti' && (
          <div className="dblock">
            <small className="lbl">Proponi un orario</small>
            <div className="slots">
              {nextSlots(r.preferred).map((s) => (
                <button key={s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {pending && r.section === 'domande' && (
          <div className="dblock">
            <small className="lbl">Risposte rapide</small>
            <div className="slots">
              {QUICK_REPLIES.map((q) => <button key={q} onClick={() => setReply(q)}>{q}</button>)}
            </div>
            <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Scrivi la risposta" />
          </div>
        )}

        {pending && (
          <div className="dactions">
            <button className="btn ghost" onClick={props.onReject}>Non approvare</button>
            {r.section === 'ricette' && <button className="btn primary" onClick={props.onApprove}>Approva ricetta</button>}
            {r.section === 'certificati' && <button className="btn primary" onClick={props.onApprove}>Certificato pronto</button>}
            {r.section === 'appuntamenti' && <button className="btn primary" disabled={!slot} onClick={() => slot && props.onConfirmSlot(slot)}>Conferma orario</button>}
            {r.section === 'domande' && <button className="btn primary" disabled={!reply.trim()} onClick={() => props.onReply(reply.trim())}>Invia risposta</button>}
          </div>
        )}
        {pending && r.section === 'ricette' && (
          <p className="muted small">In uso reale la ricetta si emette dal gestionale dello studio. In questa demo il codice è inventato.</p>
        )}
      </aside>
    </div>
  )
}

const REASONS = [
  'Serve una visita prima di rinnovare la terapia.',
  'La richiesta è troppo in anticipo: la riprovi tra qualche giorno.',
  'Per questa richiesta passi in studio.',
]

function RejectModal({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: (t: string) => void }) {
  const [text, setText] = useState(REASONS[0])
  return (
    <div className="drawer-wrap center" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Non approvare {count > 1 ? `${count} richieste` : 'la richiesta'}</h2>
        <p className="muted">Il paziente vedrà questo messaggio.</p>
        <div className="slots">
          {REASONS.map((r) => <button key={r} className={text === r ? 'on' : ''} onClick={() => setText(r)}>{r}</button>)}
        </div>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="dactions">
          <button className="btn ghost" onClick={onCancel}>Annulla</button>
          <button className="btn primary" disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>Conferma</button>
        </div>
      </div>
    </div>
  )
}
