import { Zap } from 'lucide-react'

export default function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-[44%] p-12 bg-surface border-r border-border overflow-hidden">
      {/* Ambient grid + glow */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-signal/10 rounded-full blur-[100px]" />

      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">Pulse</span>
      </div>

      <div className="relative z-10 space-y-6 max-w-md">
        <div className="flex items-center gap-2 text-xs font-mono text-signal">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-signal" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-signal" />
          </span>
          LIVE · 3 NODES CONNECTED
        </div>
        <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight">
          Messages that move<br />at the speed of <span className="text-accent-glow">now.</span>
        </h1>
        <p className="text-muted text-[15px] leading-relaxed">
          Event-driven WebSocket architecture, distributed across Kubernetes pods
          via Redis pub/sub — built for sub-100ms delivery at any scale.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-border">
        <Stat value="40%" label="Lower latency" />
        <Stat value="99.9%" label="Uptime" />
        <Stat value="20" label="Max pod scale" />
      </div>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-display text-xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-faint mt-0.5">{label}</div>
    </div>
  )
}
