import { useEffect, useMemo, useState } from 'react'
import { Icon, Mark } from './Icon'
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

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function DoctorApp() {
  const { requests, patients } = useDemo()
  const [section, setSection] = useState<Section>('ricette')
  const [tab, setTab] = useState<'aperte' | 'chiuse'>('aperte')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const now = useClock()

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

  const oldest = useMemo(() => {
    const o: Partial<Record<Section, number>> = {}
    requests.forEach((r) => {
      if (r.status === 'in_attesa' && (o[r.section] === undefined || r.createdAt < o[r.section]!)) o[r.section] = r.createdAt
    })
    return o
  }, [requests])

  const today = new Date().setHours(0, 0, 0, 0)
  const handledToday = requests.filter((r) => r.closedAt && r.closedAt >= today).length
  const totalOpen = Object.values(counts).reduce((a, b) => a + b, 0)

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
      <header className="cmd glass">
        <div className="brand">
          <Mark size={28} />
          <span>Studio</span>
          <span className="cmd-sep" />
          <span className="cmd-doc">
            <span className="script">Laura Conti</span>
            <small>Dott.ssa · Medicina generale</small>
          </span>
        </div>
        <div className="cmd-right">
          <span className="demo-chip"><i className="live amber" /> Demo · dati inventati</span>
          <span className="cmd-live">
            <i className="live" />
            <span className="mono">{now.toLocaleTimeString('it-IT')}</span>
          </span>
          <button className="icon-btn" title="Ripristina demo" aria-label="Ripristina demo" onClick={() => { if (confirm('Ripristinare i dati demo iniziali?')) resetDemo() }}>
            <Icon name="reset" size={17} />
          </button>
          <button className="icon-btn" title="Esci" aria-label="Esci" onClick={() => setSession(null)}>
            <Icon name="out" size={17} />
          </button>
        </div>
      </header>

      <section className="overview">
        <div className="ov-intro">
          <span className="eyebrow num">{now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>
            <span className="num">{totalOpen}</span> {totalOpen === 1 ? 'richiesta' : 'richieste'}
            <br />
            <span className="grad">in coda oggi.</span>
          </h1>
          <span className="rule left" />
        </div>

        <div className="bento dr-bento">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`sec-card tile glass interactive ${section === s.id ? 'active' : ''}`}
              style={{ ['--i' as string]: i }}
              onClick={() => go(s.id)}
            >
              <span className="tile-glow" />
              <div className="tile-top">
                <span className={`tile-ic ${section === s.id ? 'accent' : ''}`}><Icon name={s.id} size={19} /></span>
                {counts[s.id] > 0 && <i className="live amber" />}
              </div>
              <b className="big num">{String(counts[s.id]).padStart(2, '0')}</b>
              <div className="sec-label">
                <span>{s.label}</span>
                <small className="num">{oldest[s.id] ? `la più vecchia ${ago(oldest[s.id]!)}` : 'tutto gestito'}</small>
              </div>
            </button>
          ))}

          <div className="kpi tile glass">
            <span className="tile-glow on" />
            <span className="eyebrow"><Icon name="pulse" size={13} /> Oggi</span>
            <div className="kpi-row">
              <div>
                <b className="big num">{String(handledToday).padStart(2, '0')}</b>
                <small>richieste gestite</small>
              </div>
              <div>
                <b className="big num accent-txt">~{handledToday * MIN_SAVED}<em>min</em></b>
                <small>di telefonate risparmiate (stima)</small>
              </div>
            </div>
            <div className="kpi-bar"><span style={{ width: `${Math.min(100, (handledToday / Math.max(1, handledToday + totalOpen)) * 100)}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="ws">
        <div className="queue">
          <header className="q-head">
            <div>
              <span className="eyebrow">Coda</span>
              <h2>{meta.label}</h2>
            </div>
            <div className="seg" style={{ ['--n' as string]: 2, ['--idx' as string]: tab === 'aperte' ? 0 : 1 }}>
              <span className="seg-ind" />
              <button className={tab === 'aperte' ? 'on' : ''} onClick={() => { setTab('aperte'); setSel(new Set()) }}>
                Da gestire <span className="num pill-n">{counts[section]}</span>
              </button>
              <button className={tab === 'chiuse' ? 'on' : ''} onClick={() => { setTab('chiuse'); setSel(new Set()) }}>Gestite</button>
            </div>
          </header>

          {tab === 'aperte' && bulk && list.length > 0 && (
            <div className={`bar glass ${sel.size ? 'armed' : ''}`}>
              <label className="check inline">
                <input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(list.map((r) => r.id)))} />
                <span className="cb" />
                Seleziona tutte
              </label>
              <span className="grow" />
              <button className="btn ghost" disabled={!sel.size} onClick={() => setRejecting([...sel])}>Non approvare</button>
              <button className="btn primary" disabled={!sel.size} onClick={() => approve([...sel])}>
                <Icon name="check" size={16} /> Approva{sel.size ? <span className="num"> · {sel.size}</span> : ''}
              </button>
            </div>
          )}

          <div key={section + tab} className="view-enter">
            {list.length === 0 ? (
              <div className="empty glass">
                <span className="tile-ic accent"><Icon name="check" /></span>
                {tab === 'aperte' ? <>Nessuna richiesta da gestire in <b>{meta.label.toLowerCase()}</b>.</> : 'Ancora nessuna richiesta gestita.'}
              </div>
            ) : (
              <div className="list">
                {list.map((r, i) => (
                  <div
                    key={r.id}
                    className={`lrow glass ${openId === r.id ? 'open' : ''} ${sel.has(r.id) ? 'picked' : ''}`}
                    style={{ ['--i' as string]: i }}
                    onClick={() => setOpenId(r.id)}
                  >
                    {tab === 'aperte' && bulk && (
                      <label className="check" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} />
                        <span className="cb" />
                      </label>
                    )}
                    <div className="lp">
                      <span className="av sm">{pname(r.patientId).split(' ').map((w) => w[0]).join('')}</span>
                      <div>
                        <b>{pname(r.patientId)}</b>
                        <small className="num">{ago(r.createdAt)}</small>
                      </div>
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
          </div>
        </div>

        {open ? (
          <Detail
            key={open.id}
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
        ) : (
          <aside className="detail-empty glass">
            <span className="tile-ic"><Icon name={section} size={22} /></span>
            <b>Seleziona una richiesta</b>
            <small>Il dettaglio clinico e le azioni compaiono qui.</small>
          </aside>
        )}
      </section>

      {rejecting && <RejectModal count={rejecting.length} onCancel={() => setRejecting(null)} onConfirm={(t) => reject(rejecting, t)} />}
      {toast && (
        <div className="toast glass">
          <Icon name="check" size={16} /> {toast}
        </div>
      )}
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
      <aside className="drawer glass" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn x" onClick={props.onClose} aria-label="Chiudi"><Icon name="x" size={18} /></button>

        <header className="d-head">
          <span className="eyebrow">
            <Icon name={r.section} size={13} /> {SECTIONS.find((s) => s.id === r.section)!.label}
          </span>
          <div className="d-id">
            <span className="av lg">{props.patient.split(' ').map((w) => w[0]).join('')}</span>
            <div>
              <h2>{props.patient}</h2>
              {p && <small className="num">Nato/a il {p.birth}</small>}
            </div>
          </div>
          <dl className="d-meta">
            <div><dt>Ricevuta</dt><dd className="num">{ago(r.createdAt)}</dd></div>
            <div><dt>Stato</dt><dd><span className={`tag ${r.status}`}>{STATUS_LABEL[r.status]}</span></dd></div>
            {r.section === 'ricette' && <div><dt>Farmaci</dt><dd className="num">{String(r.drugs.length).padStart(2, '0')}</dd></div>}
          </dl>
        </header>

        <div className="dblock">
          <span className="lbl">Richiesta</span>
          <Summary r={r} />
        </div>

        {r.section === 'ricette' && p && (
          <div className="dblock">
            <span className="lbl">Terapia abituale registrata</span>
            <table className="ther-table">
              <tbody>
                {p.therapy.map((d) => (
                  <tr key={d.name} className={r.drugs.some((x) => x.name === d.name) ? 'req' : ''}>
                    <td><i className="tick" />{d.name}</td>
                    <td className="num">{d.dose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.early && (
              <p className="warnbox"><Icon name="alert" size={15} /> Richiesta in anticipo rispetto al consumo previsto.</p>
            )}
          </div>
        )}

        {!pending && (
          <div className="dblock">
            <span className="lbl">Esito</span>
            {r.section === 'ricette' && r.code && <b className="mono code-lg">{r.code}</b>}
            {r.section === 'appuntamenti' && r.confirmedSlot && <p className="num">{r.confirmedSlot}</p>}
            {r.doctorNote && <p className="reply">{r.doctorNote}</p>}
          </div>
        )}

        {pending && r.section === 'appuntamenti' && (
          <div className="dblock">
            <span className="lbl">Proponi un orario</span>
            <div className="slots">
              {nextSlots(r.preferred).map((s) => (
                <button key={s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>
                  <Icon name="clock" size={15} /> <span className="num">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pending && r.section === 'domande' && (
          <div className="dblock">
            <span className="lbl">Risposte rapide</span>
            <div className="slots">
              {QUICK_REPLIES.map((q) => <button key={q} className={reply === q ? 'on' : ''} onClick={() => setReply(q)}>{q}</button>)}
            </div>
            <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Scrivi la risposta" />
          </div>
        )}

        {pending && (
          <div className="dactions">
            <button className="btn ghost" onClick={props.onReject}>Non approvare</button>
            {r.section === 'ricette' && <button className="btn primary" onClick={props.onApprove}><Icon name="check" size={16} /> Approva ricetta</button>}
            {r.section === 'certificati' && <button className="btn primary" onClick={props.onApprove}><Icon name="check" size={16} /> Certificato pronto</button>}
            {r.section === 'appuntamenti' && <button className="btn primary" disabled={!slot} onClick={() => slot && props.onConfirmSlot(slot)}><Icon name="check" size={16} /> Conferma orario</button>}
            {r.section === 'domande' && <button className="btn primary" disabled={!reply.trim()} onClick={() => props.onReply(reply.trim())}><Icon name="arrow" size={16} /> Invia risposta</button>}
          </div>
        )}
        {pending && r.section === 'ricette' && (
          <p className="fineprint">In uso reale la ricetta si emette dal gestionale dello studio. In questa demo il codice è inventato.</p>
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
    <div className="scrim" onClick={onCancel}>
      <div className="modal glass framed" onClick={(e) => e.stopPropagation()}>
        <span className="tile-ic danger"><Icon name="x" /></span>
        <h2>Non approvare {count > 1 ? <><span className="num">{count}</span> richieste</> : 'la richiesta'}</h2>
        <p className="muted">Il paziente vedrà questo messaggio.</p>
        <div className="slots">
          {REASONS.map((r) => <button key={r} className={text === r ? 'on' : ''} onClick={() => setText(r)}>{r}</button>)}
        </div>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="dactions">
          <button className="btn ghost" onClick={onCancel}>Annulla</button>
          <button className="btn danger" disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>Conferma</button>
        </div>
      </div>
    </div>
  )
}
