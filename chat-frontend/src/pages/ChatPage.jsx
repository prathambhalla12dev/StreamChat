import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Hash } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import {
  subscribeToRoom,
  unsubscribeFromRoom,
  sendMessage,
  sendTyping,
} from '../lib/socket'

import RoomSidebar from '../components/RoomSidebar'
import RoomHeader from '../components/RoomHeader'
import MessageBubble from '../components/MessageBubble'
import MessageComposer from '../components/MessageComposer'
import TypingIndicator from '../components/TypingIndicator'
import EmptyState from '../components/EmptyState'

export default function ChatPage() {
  const { user, logout, connectionStatus } = useAuth()
  const { roomId } = useParams()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState([])
  const [joinedRoomIds, setJoinedRoomIds] = useState(new Set())

  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const scrollRef = useRef(null)
  const typingTimeouts = useRef({})

  // Load public rooms + user's joined rooms
  const loadRooms = useCallback(async () => {
    try {
      const [publicRooms, myRooms] = await Promise.all([
        api.getPublicRooms(),
        api.getMyRooms(),
      ])

      // Track rooms that the current user has joined
      setJoinedRoomIds(new Set(myRooms.map((room) => room.id)))

      // Merge public rooms and joined rooms without duplicates
      const roomMap = new Map()

      myRooms.forEach((room) => {
        roomMap.set(room.id, room)
      })

      publicRooms.forEach((room) => {
        roomMap.set(room.id, room)
      })

      setRooms(Array.from(roomMap.values()))
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // Sync active room from URL
  useEffect(() => {
    if (!roomId || rooms.length === 0) return

    const room = rooms.find((r) => r.id === roomId)

    if (room) {
      setActiveRoom(room)
    }
  }, [roomId, rooms])

  // Handle incoming WebSocket events
  const handleIncomingEvent = useCallback((event) => {
    switch (event.eventType) {
      case 'MESSAGE_SENT':
        setMessages((prev) => {
          // Prevent accidental duplicate events
          if (prev.some((message) => message.id === event.id)) {
            return prev
          }

          return [...prev, event]
        })
        break

      case 'MESSAGE_EDITED':
        setMessages((prev) =>
          prev.map((message) =>
            message.id === event.id
              ? {
                  ...message,
                  content: event.content,
                  edited: true,
                }
              : message
          )
        )
        break

      case 'MESSAGE_DELETED':
        setMessages((prev) =>
          prev.filter((message) => message.id !== event.id)
        )
        break

      case 'TYPING_START':
        setTypingUsers((prev) => {
          if (prev.includes(event.username)) {
            return prev
          }

          return [...prev, event.username]
        })

        clearTimeout(typingTimeouts.current[event.username])

        typingTimeouts.current[event.username] = setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((username) => username !== event.username)
          )
        }, 3000)

        break

      case 'TYPING_STOP':
        setTypingUsers((prev) =>
          prev.filter((username) => username !== event.username)
        )

        clearTimeout(typingTimeouts.current[event.username])
        break

      default:
        break
    }
  }, [])

  // Load message history and subscribe to active room
  useEffect(() => {
    if (!activeRoom || connectionStatus !== 'connected') {
      return
    }

    setLoadingMessages(true)
    setMessages([])
    setTypingUsers([])

    api
      .getMessages(activeRoom.id, 0, 50)
      .then((page) => {
        const content = (page.content || []).slice().reverse()
        setMessages(content)
      })
      .catch((err) => {
        console.error('Failed to load messages:', err)
      })
      .finally(() => {
        setLoadingMessages(false)
      })

    subscribeToRoom(activeRoom.id, handleIncomingEvent)

    return () => {
      unsubscribeFromRoom(activeRoom.id)
    }
  }, [activeRoom, connectionStatus, handleIncomingEvent])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight
    }
  }, [messages, typingUsers])

  // Select room
  function handleSelectRoom(room) {
    setActiveRoom(room)
    navigate(`/chat/${room.id}`)
  }

  // Join public room
  async function handleJoinRoom(room) {
    try {
      const joinedRoom = await api.joinRoom(room.id)

      setJoinedRoomIds((prev) => {
        const updated = new Set(prev)
        updated.add(room.id)
        return updated
      })

      setRooms((prev) =>
        prev.map((existingRoom) =>
          existingRoom.id === joinedRoom.id
            ? joinedRoom
            : existingRoom
        )
      )

      setActiveRoom(joinedRoom)
      navigate(`/chat/${joinedRoom.id}`)
    } catch (err) {
      console.error('Failed to join room:', err)
      throw err
    }
  }

  // Create room
  async function handleCreateRoom(payload) {
    try {
      const room = await api.createRoom(payload)

      setRooms((prev) => {
        const roomMap = new Map(
          prev.map((existingRoom) => [
            existingRoom.id,
            existingRoom,
          ])
        )

        roomMap.set(room.id, room)

        return Array.from(roomMap.values())
      })

      // Creator is automatically a member
      setJoinedRoomIds((prev) => {
        const updated = new Set(prev)
        updated.add(room.id)
        return updated
      })

      setActiveRoom(room)
      navigate(`/chat/${room.id}`)
    } catch (err) {
      console.error('Failed to create room:', err)
      throw err
    }
  }

  function handleSend(content) {
    if (!activeRoom) return

    if (!joinedRoomIds.has(activeRoom.id)) {
      console.error('Join the room before sending messages')
      return
    }

    sendMessage(activeRoom.id, content)
  }

  function handleTyping(isTyping) {
    if (!activeRoom) return
    if (!joinedRoomIds.has(activeRoom.id)) return

    sendTyping(activeRoom.id, isTyping)
  }

  async function handleEditMessage(messageId, content) {
    try {
      await api.editMessage(messageId, content)
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }

  async function handleDeleteMessage(messageId) {
    try {
      await api.deleteMessage(messageId)

      setMessages((prev) =>
        prev.filter((message) => message.id !== messageId)
      )
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const isActiveRoomJoined = activeRoom
    ? joinedRoomIds.has(activeRoom.id)
    : false

  return (
    <div className="flex h-screen w-screen bg-base overflow-hidden">
      <RoomSidebar
        rooms={rooms}
        joinedRoomIds={joinedRoomIds}
        activeRoomId={activeRoom?.id}
        onSelectRoom={handleSelectRoom}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        currentUser={user?.username}
        onLogout={logout}
      />

      {activeRoom ? (
        <div className="flex-1 flex flex-col min-w-0">
          <RoomHeader
            room={activeRoom}
            memberCount={activeRoom.memberIds?.length}
            connectionStatus={connectionStatus}
          />

          {!isActiveRoomJoined ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <Hash size={36} className="text-accent mb-4" />

              <h2 className="font-display text-xl font-semibold mb-2">
                Join #{activeRoom.name}
              </h2>

              <p className="text-sm text-muted mb-5 max-w-sm">
                You need to join this room before you can send
                and receive live messages.
              </p>

              <button
                onClick={() => handleJoinRoom(activeRoom)}
                className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-dim text-white text-sm font-medium transition-colors"
              >
                Join Room
              </button>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-grid"
              >
                {loadingMessages ? (
                  <MessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-faint text-sm">
                    No messages yet — say hello 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const prev = messages[idx - 1]

                    const showAvatar =
                      !prev ||
                      prev.senderUsername !== msg.senderUsername

                    return (
                      <MessageBubble
                        key={msg.id || idx}
                        message={msg}
                        isOwn={
                          msg.senderUsername === user?.username
                        }
                        showAvatar={showAvatar}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                      />
                    )
                  })
                )}

                <TypingIndicator usernames={typingUsers} />
              </div>

              <MessageComposer
                onSend={handleSend}
                onTyping={handleTyping}
                disabled={
                  connectionStatus !== 'connected' ||
                  !isActiveRoomJoined
                }
              />
            </>
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex gap-2.5 ${
            i % 2 === 0 ? '' : 'flex-row-reverse'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-surface2 bg-shimmer animate-shimmer shrink-0" />

          <div
            className="h-10 rounded-2xl bg-surface2 bg-shimmer animate-shimmer"
            style={{
              width: 120 + (i % 3) * 60,
            }}
          />
        </div>
      ))}
    </div>
  )
}