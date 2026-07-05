export default function TypingIndicator({ usernames }) {
  if (!usernames || usernames.length === 0) return null

  const label =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing`
      : `${usernames.length} people are typing`

  return (
    <div className="flex items-center gap-2.5 px-1 py-2 animate-fade-up">
      <div className="flex items-center gap-1 bg-surface2 border border-border rounded-2xl px-3 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-faint animate-typing-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-faint animate-typing-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-faint animate-typing-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-faint">{label}</span>
    </div>
  )
}
