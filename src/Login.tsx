import { PATIENTS, setSession } from './store'

export function Login() {
  return (
    <div className="login">
      <div className="login-card">
        <div className="logo big">
          <span className="mk">+</span>
          <span>Studio</span>
        </div>
        <h1>
          Dal medico, <em>senza la fila.</em>
        </h1>
        <p className="muted">
          Versione dimostrativa con dati inventati. Nessun dato sanitario reale viene raccolto.
        </p>

        <section>
          <h2>Entra come medico</h2>
          <button className="btn primary block" onClick={() => setSession({ role: 'medico' })}>
            Dott.ssa Laura Conti · Area medico
          </button>
        </section>

        <section>
          <h2>Oppure entra come paziente</h2>
          <div className="plist">
            {PATIENTS.map((p) => (
              <button
                key={p.id}
                className="prow"
                onClick={() => setSession({ role: 'paziente', patientId: p.id })}
              >
                <span className="av">{p.name.split(' ').map((w) => w[0]).join('')}</span>
                <span>
                  <b>{p.name}</b>
                  <small>Nato/a il {p.birth}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
        <p className="tip">
          Suggerimento: apri l'app in due schede, una come paziente e una come medico, per vedere le richieste arrivare in tempo reale.
        </p>
      </div>
    </div>
  )
}
