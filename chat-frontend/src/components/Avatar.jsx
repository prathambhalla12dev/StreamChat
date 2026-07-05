const PALETTE = [
  ['#6C5CE7', '#8B7FFF'],
  ['#2ED573', '#7BED9F'],
  ['#FF6B6B', '#FF9F9F'],
  ['#FFC857', '#FFE08A'],
  ['#54A0FF', '#A0CFFF'],
  ['#FF7F50', '#FFAB8A'],
]

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export default function Avatar({ name, size = 36, online }) {
  const [from, to] = PALETTE[hashCode(name || '?') % PALETTE.length]
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-display font-semibold text-white"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background: `linear-gradient(135deg, ${from}, ${to})`,
        }}
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-surface ${online ? 'bg-signal' : 'bg-faint'}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  )
}
