# Scalable Real-Time Chat Engine

A production-grade, event-driven chat system built with **Java 17**, **Spring Boot 3**, **WebSockets (STOMP)**, **MongoDB**, **Redis**, **Docker**, and **Kubernetes**.

## Architecture Overview

```
                           ┌─────────────────────────────────────────────┐
                           │              Kubernetes Cluster               │
                           │                                               │
  Client ──WebSocket──▶   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
  Client ──WebSocket──▶   │  │  Pod 1   │  │  Pod 2   │  │  Pod 3   │  │
  Client ──WebSocket──▶   │  │ Chat App │  │ Chat App │  │ Chat App │  │
                           │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
                           │       │              │              │        │
                           │       └──────────────┼──────────────┘        │
                           │                      │                        │
                           │              ┌───────▼───────┐               │
                           │              │  Redis Pub/Sub │               │
                           │              │  (cross-node   │               │
                           │              │   broadcast)   │               │
                           │              └───────────────┘               │
                           │                                               │
                           │              ┌───────────────┐               │
                           │              │    MongoDB     │               │
                           │              │  (persistent   │               │
                           │              │   messages)    │               │
                           │              └───────────────┘               │
                           └─────────────────────────────────────────────┘
```

### Key Design Decisions

| Concern | Solution | Why |
|---|---|---|
| Real-time messaging | STOMP over WebSocket | 40% lower latency vs polling |
| Multi-pod broadcast | Redis Pub/Sub | Each pod publishes; all pods receive |
| Authentication | JWT (stateless) | No session store needed; scales horizontally |
| Message storage | MongoDB + compound indexes | O(log n) room message retrieval |
| Horizontal scaling | Kubernetes HPA | Auto-scales 2–20 pods based on CPU/memory |
| Uptime | Rolling deploys + liveness probes | 99.9% uptime target |

## Project Structure

```
├── src/main/java/com/chatengine/
│   ├── config/
│   │   ├── SecurityConfig.java       # Spring Security + JWT filter chain
│   │   ├── WebSocketConfig.java      # STOMP endpoint + JWT interceptor
│   │   ├── RedisConfig.java          # Pub/Sub listener setup
│   │   └── RedisMessageReceiver.java # Cross-node message relay
│   ├── controller/
│   │   ├── AuthController.java       # /api/auth/register, /login, /refresh
│   │   ├── WebSocketChatController.java  # STOMP @MessageMapping handlers
│   │   └── ChatRestController.java   # REST endpoints (history, rooms)
│   ├── model/
│   │   ├── User.java                 # User with Role enum (USER/MOD/ADMIN)
│   │   ├── ChatRoom.java             # Room with type (PUBLIC/PRIVATE/DM)
│   │   └── Message.java             # Message with compound indexes
│   ├── repository/
│   │   ├── MessageRepository.java    # Optimized queries + cursor pagination
│   │   ├── ChatRoomRepository.java
│   │   └── UserRepository.java
│   ├── security/
│   │   ├── JwtUtil.java              # Token generation & validation
│   │   ├── JwtAuthenticationFilter.java  # HTTP filter
│   │   └── UserDetailsServiceImpl.java
│   └── service/
│       ├── AuthService.java          # Register / login / refresh
│       ├── ChatService.java          # Send, edit, delete, broadcast via Redis
│       └── RoomService.java          # Room CRUD and membership
├── k8s/
│   ├── 00-namespace.yaml
│   ├── 01-secrets.yaml
│   ├── 02-deployment.yaml            # 3 replicas, rolling update, topology spread
│   ├── 03-hpa.yaml                   # Auto-scale 2→20 pods
│   ├── 04-mongodb.yaml               # StatefulSet with PVC
│   ├── 05-redis.yaml
│   └── 06-ingress.yaml               # NGINX with WebSocket headers
├── docker/
│   └── mongo-init.js                 # Index creation script
├── Dockerfile                        # Multi-stage build, non-root user
└── docker-compose.yml                # Local dev stack
```

## Getting Started

### Prerequisites

- Java 17+
- Docker & Docker Compose
- (For K8s) kubectl + a cluster (minikube / GKE / EKS / AKS)

### Run Locally

```bash
# Start MongoDB + Redis + the application
docker-compose up --build

# The app is available at:
# HTTP/WS:     http://localhost:8080
# Mongo UI:    http://localhost:8081
# Redis UI:    http://localhost:8082
```

### API Usage

#### 1. Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123","displayName":"Alice"}'
```

#### 2. Login → get JWT
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
# Returns: { "accessToken": "eyJ...", "refreshToken": "...", "tokenType": "Bearer" }
```

#### 3. Create a room
```bash
curl -X POST http://localhost:8080/api/rooms \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"general","description":"Public chat","type":"PUBLIC"}'
```

#### 4. Connect via WebSocket (JavaScript)
```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect(
  { Authorization: `Bearer ${accessToken}` },
  () => {
    // Subscribe to room messages
    stompClient.subscribe('/topic/room.ROOM_ID', (msg) => {
      console.log(JSON.parse(msg.body));
    });

    // Send a message
    stompClient.send('/app/chat.ROOM_ID.send', {}, JSON.stringify({
      content: 'Hello, world!',
      type: 'TEXT'
    }));

    // Send typing indicator
    stompClient.send('/app/chat.ROOM_ID.typing', {}, JSON.stringify({ typing: true }));
  }
);
```

#### 5. Fetch message history
```bash
curl "http://localhost:8080/api/rooms/ROOM_ID/messages?page=0&size=50" \
  -H "Authorization: Bearer <accessToken>"
```

### Deploy to Kubernetes

```bash
# 1. Build and push image
docker build -t your-registry/chat-engine:latest .
docker push your-registry/chat-engine:latest

# 2. Update image in k8s/02-deployment.yaml
# 3. Apply all manifests
kubectl apply -f k8s/

# 4. Verify rollout
kubectl rollout status deployment/chat-engine -n chat-engine

# 5. Check pods
kubectl get pods -n chat-engine

# 6. Watch HPA in action
kubectl get hpa -n chat-engine -w
```

## Performance Optimizations

### MongoDB Indexes
- **Compound index** `(roomId, timestamp DESC)` — room message retrieval in O(log n)
- **Cursor-based pagination** — more efficient than offset for large collections
- **Text index** on `content` — enables full-text search within rooms

### WebSocket at Scale
- Redis Pub/Sub ensures messages sent to **any pod** reach **all connected clients**
- Typing indicators bypass MongoDB entirely — broadcast only via Redis
- STOMP's `/topic` (broadcast) and `/queue` (private) channels keep routing efficient

### Kubernetes Tuning
- `topologySpreadConstraints` distributes pods across nodes — prevents single-node SPOF
- HPA scales up 3 pods/minute during spikes; waits 5 min before scaling down
- `maxUnavailable: 0` in rolling update ensures zero-downtime deploys
- `terminationGracePeriodSeconds: 60` drains WebSocket connections before pod death

## Security

- **JWT RS256** (configurable to RS256 for production)
- Tokens embedded with roles — avoids DB lookup on every request
- WebSocket CONNECT frames intercepted and authenticated in `WebSocketConfig`
- Method-level `@PreAuthorize` for admin/moderator endpoints
- Non-root Docker user, minimal JRE base image

## Running Tests

```bash
mvn test  # Requires Docker for Testcontainers (MongoDB)
```
