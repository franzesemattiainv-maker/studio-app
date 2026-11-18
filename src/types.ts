export type Section = 'ricette' | 'appuntamenti' | 'certificati' | 'domande'

export type Status = 'in_attesa' | 'approvata' | 'rifiutata' | 'risposta'

export interface Drug {
  name: string
  dose: string
}

export interface Patient {
  id: string
  name: string
  birth: string
  therapy: Drug[]
}

interface BaseRequest {
  id: string
  patientId: string
  createdAt: number
  status: Status
  /** Note from the doctor (rejection reason or reply). */
  doctorNote?: string
  closedAt?: number
  /** Patient has seen the doctor's outcome. */
  seen?: boolean
}

export interface PrescriptionRequest extends BaseRequest {
  section: 'ricette'
  drugs: Drug[]
  note?: string
  /** Demo NRE-style code shown to the patient once approved. */
  code?: string
  early?: boolean
}

export interface AppointmentRequest extends BaseRequest {
  section: 'appuntamenti'
  reason: string
  preferred: string
  confirmedSlot?: string
}

export interface CertificateRequest extends BaseRequest {
  section: 'certificati'
  kind: string
  note?: string
}

export interface QuestionRequest extends BaseRequest {
  section: 'domande'
  text: string
}

export type Request =
  | PrescriptionRequest
  | AppointmentRequest
  | CertificateRequest
  | QuestionRequest

export interface DemoState {
  version: number
  patients: Patient[]
  requests: Request[]
}

export type Session =
  | { role: 'paziente'; patientId: string }
  | { role: 'medico' }
  | null
