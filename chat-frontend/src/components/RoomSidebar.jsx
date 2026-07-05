import { useState } from 'react'
// import { Hash } from 'lucide-react'

import {
  Hash,
  Lock,
  Plus,
  Search,
  Zap,
  LogOut,
  X,
  Globe2,
  UserPlus,
} from 'lucide-react'

import Avatar from './Avatar'

export default function RoomSidebar({
  rooms,
  joinedRoomIds,
  activeRoomId,
  onSelectRoom,
  onJoinRoom,
  onCreateRoom,
  currentUser,
  onLogout,
}) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [roomPrivacy, setRoomPrivacy] = useState('PUBLIC')

  const [creating, setCreating] = useState(false)
  const [joiningRoomId, setJoiningRoomId] = useState(null)
  const [error, setError] = useState('')

  const filtered = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e) {
    e.preventDefault()

    if (!newRoomName.trim()) return

    setCreating(true)
    setError('')

    const isPrivate = roomPrivacy === 'PRIVATE'

    try {
      await onCreateRoom({
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
        type: roomPrivacy,
        privateRoom: isPrivate,
      })

      setNewRoomName('')
      setNewRoomDesc('')
      setRoomPrivacy('PUBLIC')
      setShowCreate(false)
    } catch (err) {
      setError(err.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(e, room) {
    e.stopPropagation()

    setJoiningRoomId(room.id)
    setError('')

    try {
      await onJoinRoom(room)
    } catch (err) {
      setError(err.message || 'Failed to join room')
    } finally {
      setJoiningRoomId(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-72 bg-surface border-r border-border shrink-0">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Zap
            size={16}
            className="text-white"
            fill="white"
          />
        </div>

        <span className="font-display font-semibold tracking-tight">
          Pulse
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a room…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface2 border border-border text-sm placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-medium text-faint uppercase tracking-wider">
            Rooms
          </span>

          <button
            onClick={() => {
              setShowCreate((value) => !value)
              setError('')
            }}
            className="text-faint hover:text-accent-glow transition-colors p-1 rounded"
            title="Create room"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Create room form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-3 p-3 rounded-lg bg-surface2 border border-border space-y-2 animate-fade-up"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                New room
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setError('')
                }}
                className="text-faint hover:text-ink"
              >
                <X size={13} />
              </button>
            </div>

            <input
              value={newRoomName}
              onChange={(e) =>
                setNewRoomName(e.target.value)
              }
              placeholder="room-name"
              autoFocus
              className="w-full px-2.5 py-1.5 rounded-md bg-surface border border-border text-sm placeholder:text-faint focus:border-accent outline-none"
            />

            <input
              value={newRoomDesc}
              onChange={(e) =>
                setNewRoomDesc(e.target.value)
              }
              placeholder="Description (optional)"
              className="w-full px-2.5 py-1.5 rounded-md bg-surface border border-border text-sm placeholder:text-faint focus:border-accent outline-none"
            />

            {/* Public / Private selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setRoomPrivacy('PUBLIC')
                }
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs transition-colors ${
                  roomPrivacy === 'PUBLIC'
                    ? 'border-accent bg-accent/15 text-accent-glow'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                <Globe2 size={13} />
                Public
              </button>

              <button
                type="button"
                onClick={() =>
                  setRoomPrivacy('PRIVATE')
                }
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs transition-colors ${
                  roomPrivacy === 'PRIVATE'
                    ? 'border-accent bg-accent/15 text-accent-glow'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                <Lock size={13} />
                Private
              </button>
            </div>

            <p className="text-[10px] text-faint leading-relaxed">
              {roomPrivacy === 'PUBLIC'
                ? 'Anyone can discover and join this room.'
                : 'Private rooms are only available to members.'}
            </p>

            {error && (
              <p className="text-xs text-coral">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                creating || !newRoomName.trim()
              }
              className="w-full py-1.5 rounded-md bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        )}

        {!showCreate && error && (
          <p className="text-xs text-coral px-2 py-2">
            {error}
          </p>
        )}

        {filtered.length === 0 && (
          <p className="text-xs text-faint px-2 py-4 text-center">
            No rooms found.
          </p>
        )}

        {filtered.map((room) => {
          const joined = joinedRoomIds.has(room.id)

          return (
            <div
              key={room.id}
              className={`w-full flex items-center gap-1 rounded-lg transition-colors group ${
                activeRoomId === room.id
                  ? 'bg-accent/15'
                  : 'hover:bg-surface2'
              }`}
            >
              <button
                onClick={() => onSelectRoom(room)}
                className={`flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-2 text-sm ${
                  activeRoomId === room.id
                    ? 'text-ink'
                    : 'text-muted group-hover:text-ink'
                }`}
              >
                <span
                  className={
                    activeRoomId === room.id
                      ? 'text-accent-glow'
                      : 'text-faint group-hover:text-muted'
                  }
                >
                  {room.isPrivate ? (
                    <Lock size={14} />
                  ) : (
                    <Hash size={14} />
                  )}
                </span>

                <span className="truncate flex-1 text-left">
                  {room.name}
                </span>
              </button>

              {!joined && !room.isPrivate && (
                <button
                  onClick={(e) =>
                    handleJoin(e, room)
                  }
                  disabled={
                    joiningRoomId === room.id
                  }
                  className="mr-1.5 flex items-center gap-1 px-2 py-1 rounded-md bg-accent/15 hover:bg-accent/25 text-accent-glow text-[10px] font-medium transition-colors disabled:opacity-50"
                  title="Join room"
                >
                  <UserPlus size={11} />

                  {joiningRoomId === room.id
                    ? 'Joining'
                    : 'Join'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Current user footer */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-t border-border shrink-0">
        <Avatar
          name={currentUser}
          size={32}
          online
        />

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {currentUser}
          </div>

          <div className="text-[11px] text-signal">
            Online
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-faint hover:text-coral transition-colors p-1.5 rounded-md hover:bg-surface2"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )
}