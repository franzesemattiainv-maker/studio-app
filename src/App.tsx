import { DoctorApp } from './Doctor'
import { Login } from './Login'
import { PatientApp } from './Patient'
import { useDemo, useSession } from './store'

export default function App() {
  const session = useSession()
  const { patients } = useDemo()

  return (
    <>
      <div className="demo-ribbon">Versione demo · dati inventati</div>
      {session?.role === 'medico' ? (
        <DoctorApp />
      ) : session?.role === 'paziente' && patients.some((p) => p.id === session.patientId) ? (
        <PatientApp patientId={session.patientId} />
      ) : (
        <Login />
      )}
    </>
  )
}
