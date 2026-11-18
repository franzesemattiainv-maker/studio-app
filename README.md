# Studio · demo

Il medico di famiglia, senza la fila. Versione dimostrativa da far provare ai medici: **tutti i dati sono inventati** e restano solo nel browser di chi la usa.

## Cosa fa
- **Paziente**: chiede ricette ripetute (dalla terapia abituale), visite, certificati, domande. Vede lo stato e il codice ricetta.
- **Medico**: richieste divise in 4 sezioni, approvazione in blocco, rifiuto con motivo, conferma orario visita, risposte rapide.
- Installabile sul telefono (PWA): dal browser, "Aggiungi a schermata Home".

## Provarla
Apri l'app, entra come medico in una scheda e come paziente in un'altra: le richieste si aggiornano in tempo reale. "Ripristina demo" (area medico) riporta ai dati iniziali.

## Sviluppo
```bash
npm install
npm run dev
```
Ogni push su `main` pubblica la demo su GitHub Pages.

## Prossimi passi verso la versione reale
- Backend con server in UE (es. Supabase EU), autenticazione vera, ruoli e permessi.
- Conformità GDPR per dati sanitari (DPIA, registro trattamenti, consenso).
- Notifiche push / email al paziente.
- Pubblicazione sugli store (Capacitor) dopo il pilota.
