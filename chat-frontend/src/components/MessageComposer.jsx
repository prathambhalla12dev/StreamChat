import { useState, useRef, useCallback } from 'react'
import { Send, Smile, Paperclip } from 'lucide-react'

export default function MessageComposer({ onSend, onTyping, disabled }) {
  const [value, setValue] = useState('')
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)

  const handleChange = useCallback(
    (e) => {
      setValue(e.target.value)

      if (!isTypingRef.current) {
        isTypingRef.current = true
        onTyping?.(true)
      }

      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false
        onTyping?.(false)
      }, 1500)
    },
    [onTyping]
  )

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    clearTimeout(typingTimeoutRef.current)
    isTypingRef.current = false
    onTyping?.(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 bg-surface2 border border-border rounded-2xl px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-colors">
        <button
          type="button"
          className="p-1.5 text-faint hover:text-muted transition-colors shrink-0"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'Connecting…' : 'Type a message…'}
          className="flex-1 bg-transparent outline-none resize-none text-[14px] placeholder:text-faint py-1.5 max-h-32 disabled:opacity-50"
          style={{ scrollbarWidth: 'thin' }}
        />

        <button
          type="button"
          className="p-1.5 text-faint hover:text-muted transition-colors shrink-0"
          title="Add emoji"
        >
          <Smile size={18} />
        </button>

        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="p-2 rounded-xl bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  )
}
