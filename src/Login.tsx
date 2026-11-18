import { Icon, Mark } from './Icon'
import { PATIENTS, setSession } from './store'

export function Login() {
  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand">
          <Mark />
          <span>Studio</span>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="live" /> Medicina generale · ambiente demo
          </span>
          <h1>
            Dal medico,
            <br />
            <span className="grad">senza la fila.</span>
          </h1>
          <p>
            Ricette, visite, certificati e domande arrivano allo studio già ordinati. Il medico decide, in blocco, in pochi secondi.
          </p>
        </div>
        <dl className="hero-stats">
          <div>
            <dt>Sezioni</dt>
            <dd>04</dd>
          </div>
          <div>
            <dt>Approvazione</dt>
            <dd>1 tocco</dd>
          </div>
          <div>
            <dt>Dati reali</dt>
            <dd>0</dd>
          </div>
        </dl>
      </section>

      <section className="login-panel glass">
        <div className="panel-label">Accesso</div>
        <button className="role-doctor" onClick={() => setSession({ role: 'medico' })}>
          <span className="rd-glow" />
          <span className="rd-ic">
            <Icon name="pulse" size={22} />
          </span>
          <span className="rd-txt">
            <b>Area medico</b>
            <small>Dott.ssa Laura Conti</small>
          </span>
          <Icon name="arrow" size={18} className="rd-arrow" />
        </button>

        <div className="panel-label">Oppure entra come paziente</div>
        <div className="plist">
          {PATIENTS.map((p, i) => (
            <button
              key={p.id}
              className="prow"
              style={{ ['--i' as string]: i }}
              onClick={() => setSession({ role: 'paziente', patientId: p.id })}
            >
              <span className="av">{p.name.split(' ').map((w) => w[0]).join('')}</span>
              <span className="prow-txt">
                <b>{p.name}</b>
                <small className="num">{p.birth}</small>
              </span>
              <span className="prow-meta num">{p.therapy.length} farmaci</span>
              <Icon name="arrow" size={16} className="prow-arrow" />
            </button>
          ))}
        </div>

        <p className="tip">
          Apri due schede, una come paziente e una come medico: le richieste arrivano in tempo reale. Tutti i dati sono inventati.
        </p>
      </section>
    </div>
  )
}
