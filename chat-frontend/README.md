# Pulse — Chat Engine Frontend

A React + Vite + Tailwind frontend for the Scalable Real-Time Chat Engine. Built around the idea of "live" — pulsing connection indicators, physics-based message entry animation, and a distraction-free three-pane layout.

## Stack

- **React 18** + **React Router 6**
- **Vite 5** — build tooling
- **Tailwind CSS** — custom design tokens (see `tailwind.config.js`)
- **@stomp/stompjs** + **sockjs-client** — WebSocket/STOMP connection to the backend
- **lucide-react** — icons
- **date-fns** — timestamp formatting

## Design

- Dark theme: charcoal base `#0F1117`, indigo-violet accent `#6C5CE7`
- Display font: Space Grotesk · Body font: Inter · Mono accents: JetBrains Mono
- Auth screens: split layout with a brand panel showing live architecture stats
- Chat view: room sidebar → message thread → composer, with real-time typing indicators and inline edit/delete

## Local Development

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` to `http://localhost:8080` (your Spring Boot backend) — see `vite.config.js`. Run the backend (`docker-compose up` in the chat-engine backend repo) alongside this.

App runs at `http://localhost:5173`.

## Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Docker

```bash
docker build -t chat-frontend .
docker run -p 8080:8080 chat-frontend
```

The container serves the built static files via Nginx, and proxies `/api` and `/ws` to `chat-engine-service` (the backend's K8s Service DNS name) — see `nginx.conf`. For local Docker testing outside K8s, update the `proxy_pass` targets in `nginx.conf` to your backend's address.

## Kubernetes

```bash
docker build -t your-registry/chat-frontend:latest .
docker push your-registry/chat-frontend:latest
# update image in k8s/deployment.yaml
kubectl apply -f k8s/deployment.yaml
```

This deploys 2–6 replicas (HPA-scaled) behind a ClusterIP service. The backend's Ingress (`06-ingress.yaml` in the backend repo) routes `/` to this service and `/api`, `/ws` to the backend service.

## Project Structure

```
src/
├── components/        # Reusable UI: Avatar, MessageBubble, RoomSidebar, etc.
├── context/
│   └── AuthContext.jsx   # Auth state + WebSocket lifecycle
├── lib/
│   ├── api.js          # REST client (fetch wrapper with JWT header)
│   └── socket.js        # STOMP/WebSocket client
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ChatPage.jsx      # Main app: rooms + messages + composer
└── styles/index.css
```

## Environment Notes

- JWT tokens are stored in `localStorage` (`accessToken`, `refreshToken`, `username`)
- The WebSocket reconnects automatically (4s delay) if the connection drops
- Typing indicators auto-expire after 3s of inactivity (in case a `TYPING_STOP` event is missed)
