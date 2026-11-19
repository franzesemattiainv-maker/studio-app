import type { Section } from './types'

const PATHS = {
  ricette: ['M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z', 'm8.5 8.5 7 7'],
  appuntamenti: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z', 'M16 2v4M8 2v4M4 10h16', 'M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01'],
  certificati: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M8.5 13h7M8.5 17h4.5'],
  domande: ['M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12Z', 'M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.6-2.4 2.1-2.4 3.4', 'M12 16.8h.01'],
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5'],
  inbox: ['M3 13h5l1.5 3h5L16 13h5', 'M5.5 5h13L21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z'],
  check: ['m5 12.5 4.5 4.5L19 7.5'],
  x: ['M6 6l12 12M18 6 6 18'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  back: ['M19 12H5', 'm11 6-6 6 6 6'],
  out: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 17l5-5-5-5', 'M15 12H4'],
  reset: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  alert: ['M12 3 2 20h20Z', 'M12 10v4', 'M12 17h.01'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  pulse: ['M3 12h4l3-7 4 14 3-7h4'],
  plus: ['M12 5v14M5 12h14'],
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className }: { name: IconName | Section; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <span className="mark" style={{ width: size, height: size }}>
      <Icon name="plus" size={size * 0.55} />
    </span>
  )
}
