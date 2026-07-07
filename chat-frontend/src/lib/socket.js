import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let stompClient = null
const subscriptions = new Map()

const WS_BASE = import.meta.env.VITE_WS_URL || ''

export function connectSocket({ onConnect, onError }) {
  const token = localStorage.getItem('accessToken')

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},

    onConnect: () => {
      onConnect?.()
    },

    onStompError: (frame) => {
      onError?.(
        frame.headers?.message || 'WebSocket protocol error'
      )
    },

    onWebSocketError: () => {
      onError?.('Connection lost')
    },
  })

  stompClient.activate()
  return stompClient
}

export function disconnectSocket() {
  subscriptions.forEach((sub) => sub.unsubscribe())
  subscriptions.clear()

  stompClient?.deactivate()
  stompClient = null
}

export function subscribeToRoom(roomId, callback) {
  if (!stompClient || !stompClient.connected) {
    return null
  }

  const destination = `/topic/room.${roomId}`

  if (subscriptions.has(destination)) {
    subscriptions.get(destination).unsubscribe()
  }

  const sub = stompClient.subscribe(destination, (message) => {
    callback(JSON.parse(message.body))
  })

  subscriptions.set(destination, sub)

  return sub
}

export function unsubscribeFromRoom(roomId) {
  const destination = `/topic/room.${roomId}`

  if (subscriptions.has(destination)) {
    subscriptions.get(destination).unsubscribe()
    subscriptions.delete(destination)
  }
}

export function sendMessage(
  roomId,
  content,
  type = 'TEXT',
  replyToMessageId = null
) {
  if (!stompClient || !stompClient.connected) {
    return false
  }

  stompClient.publish({
    destination: `/app/chat.${roomId}.send`,
    body: JSON.stringify({
      content,
      type,
      replyToMessageId,
    }),
  })

  return true
}

export function sendTyping(roomId, typing) {
  if (!stompClient || !stompClient.connected) {
    return
  }

  stompClient.publish({
    destination: `/app/chat.${roomId}.typing`,
    body: JSON.stringify({ typing }),
  })
}

export function isSocketConnected() {
  return !!stompClient?.connected
}