const API_BASE =
  import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('accessToken')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {
      // ignore parse failure
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  // Rooms
  getPublicRooms: () => request('/rooms'),
  getMyRooms: () => request('/rooms/mine'),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  joinRoom: (roomId) => request(`/rooms/${roomId}/join`, { method: 'POST' }),
  leaveRoom: (roomId) => request(`/rooms/${roomId}/leave`, { method: 'POST' }),
  getOrCreateDM: (username) => request(`/rooms/dm/${username}`, { method: 'POST' }),

  // Messages
  getMessages: (roomId, page = 0, size = 50) =>
    request(`/rooms/${roomId}/messages?page=${page}&size=${size}`),
  editMessage: (messageId, content) =>
    request(`/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteMessage: (messageId) =>
    request(`/messages/${messageId}`, { method: 'DELETE' }),
}

export { getToken }
