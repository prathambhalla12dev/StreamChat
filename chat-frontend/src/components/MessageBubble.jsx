import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, MoreHorizontal, Check, X } from 'lucide-react'
import Avatar from './Avatar'

export default function MessageBubble({ message, isOwn, showAvatar, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const [showActions, setShowActions] = useState(false)

  function saveEdit() {
    if (draft.trim() && draft !== message.content) {
      onEdit(message.id, draft.trim())
    }
    setEditing(false)
  }

  const timestamp = message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : ''

  return (
    <div
      className={`flex gap-2.5 group animate-msg-in ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-9 shrink-0">
        {showAvatar && !isOwn && <Avatar name={message.senderUsername} size={36} />}
      </div>

      <div className={`flex flex-col max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-medium text-muted">{isOwn ? 'You' : message.senderUsername}</span>
            <span className="text-[11px] font-mono text-faint">{timestamp}</span>
          </div>
        )}

        <div className="relative flex items-center gap-1.5">
          {isOwn && showActions && !editing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-faint hover:text-ink hover:bg-surface2 transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-md text-faint hover:text-coral hover:bg-surface2 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}

          {editing ? (
            <div className="flex items-center gap-1.5 bg-surface2 rounded-2xl px-3 py-2 border border-accent">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') setEditing(false)
                }}
                autoFocus
                className="bg-transparent outline-none text-sm min-w-[160px]"
              />
              <button onClick={saveEdit} className="text-signal hover:text-signal/80">
                <Check size={14} />
              </button>
              <button onClick={() => setEditing(false)} className="text-faint hover:text-coral">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words ${
                isOwn
                  ? 'bg-accent text-white rounded-tr-sm'
                  : 'bg-surface2 text-ink rounded-tl-sm border border-border'
              }`}
            >
              {message.content}
              {message.edited && (
                <span className={`ml-1.5 text-[10px] ${isOwn ? 'text-white/60' : 'text-faint'}`}>(edited)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
