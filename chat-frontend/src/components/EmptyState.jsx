import { MessageSquareDashed } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-grid">
      <div className="w-16 h-16 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-5">
        <MessageSquareDashed size={28} className="text-faint" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink mb-1.5">No room selected</h3>
      <p className="text-muted text-sm max-w-xs">
        Choose a room from the sidebar, or create a new one to start the conversation.
      </p>
    </div>
  )
}
