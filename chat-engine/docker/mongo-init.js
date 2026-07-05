// MongoDB initialization script
// Creates indexes for optimal performance

db = db.getSiblingDB('chatengine');

// ── Users collection ────────────────────────────────────────
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// ── Chat rooms collection ────────────────────────────────────
db.chat_rooms.createIndex({ name: 1 }, { unique: true });
db.chat_rooms.createIndex({ memberIds: 1 });          // Find rooms by member
db.chat_rooms.createIndex({ type: 1, isPrivate: 1 }); // Filter public rooms
db.chat_rooms.createIndex({ lastActivity: -1 });      // Sort by activity

// ── Messages collection ─────────────────────────────────────
// Primary retrieval index: room messages sorted by time
db.messages.createIndex({ roomId: 1, timestamp: -1 });

// Cursor-based pagination
db.messages.createIndex({ roomId: 1, _id: -1 });

// Unread messages lookup
db.messages.createIndex({ roomId: 1, timestamp: 1, senderId: 1 });

// Full-text search on message content
db.messages.createIndex({ content: 'text' });

// Cleanup old messages (TTL — optional, adjust expiry as needed)
// db.messages.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

print('✅ MongoDB indexes created successfully');
