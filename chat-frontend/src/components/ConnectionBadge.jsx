export default function ConnectionBadge({ status }) {
  const config = {
    connected: { color: 'bg-signal', text: 'Live', pulse: true },
    connecting: { color: 'bg-amber', text: 'Connecting…', pulse: true },
    disconnected: { color: 'bg-faint', text: 'Offline', pulse: false },
    error: { color: 'bg-coral', text: 'Connection error', pulse: false },
  }[status] || { color: 'bg-faint', text: 'Unknown', pulse: false }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface2 border border-border text-xs font-mono text-muted">
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span className={`animate-pulse-ring absolute inline-flex h-full w-full rounded-full ${config.color}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.color}`} />
      </span>
      {config.text}
    </div>
  )
}
