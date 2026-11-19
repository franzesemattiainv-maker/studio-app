import { DoctorApp } from './Doctor'
import { Login } from './Login'
import { PatientApp } from './Patient'
import { useDemo, useSession } from './store'

export default function App() {
  const session = useSession()
  const { patients } = useDemo()

  const key = session?.role === 'paziente' ? session.patientId : session?.role ?? 'login'

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="halo" />
        <span className="halo low" />
        <span className="vignette" />
        <span className="grain" />
      </div>
      <div key={key} className="stage-enter">
        {session?.role === 'medico' ? (
          <DoctorApp />
        ) : session?.role === 'paziente' && patients.some((p) => p.id === session.patientId) ? (
          <PatientApp patientId={session.patientId} />
        ) : (
          <Login />
        )}
      </div>
    </>
  )
}
