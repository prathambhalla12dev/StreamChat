import { Hash, Lock, Users } from 'lucide-react'
import ConnectionBadge from './ConnectionBadge'

export default function RoomHeader({ room, memberCount, connectionStatus }) {
  return (
    <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0 bg-base/80 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-faint shrink-0">
          {room.isPrivate ? <Lock size={16} /> : <Hash size={16} />}
        </span>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-[15px] truncate">{room.name}</h2>
          {room.description && (
            <p className="text-xs text-faint truncate">{room.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {memberCount !== undefined && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-faint">
            <Users size={13} />
            {memberCount}
          </div>
        )}
        <ConnectionBadge status={connectionStatus} />
      </div>
    </div>
  )
}
