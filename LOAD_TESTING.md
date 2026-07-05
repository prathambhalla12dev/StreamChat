## Load Testing Guide

Use **Artillery.io** to simulate thousands of concurrent users and measure performance.

### Installation

```bash
npm install -g artillery
```

### Test Configuration

Create `load-test.yml`:

```yaml
config:
  target: "http://localhost:8080"
  phases:
    # Warm up: Gradual ramp to 50 users over 2 minutes
    - duration: 120
      arrivalRate: 1
      name: "Warm up"
    
    # Sustained: Hold 50 concurrent users for 5 minutes
    - duration: 300
      arrivalRate: 1
      name: "Sustained"
    
    # Spike: Sudden spike to 100 users for 2 minutes
    - duration: 120
      arrivalRate: 1
      name: "Spike"
      rampTo: 100
    
    # Cool down: Gradually back to 10 users
    - duration: 60
      arrivalRate: 0.5
      name: "Cool down"
      rampTo: 10

  processor: "./load-test-processor.js"
  variables:
    baseUrl: "http://localhost:8080"

scenarios:
  - name: "Chat Application Flow"
    weight: 100
    flow:
      # 1. Register a new user
      - post:
          url: "/api/auth/register"
          json:
            username: "user_{{ $randomNumber(1, 100000) }}"
            email: "user_{{ $randomNumber(1, 100000) }}@example.com"
            password: "TestPassword123!"
            displayName: "Test User {{ $randomNumber(1, 100000) }}"
          capture:
            json: "$.id"
            as: "userId"
          think: 2

      # 2. Login and get JWT token
      - post:
          url: "/api/auth/login"
          json:
            username: "user_{{ $randomNumber(1, 100000) }}"
            password: "TestPassword123!"
          capture:
            json: "$.accessToken"
            as: "token"
          think: 1

      # 3. List all rooms
      - get:
          url: "/api/rooms"
          headers:
            Authorization: "Bearer {{ token }}"
          think: 2

      # 4. Create a room
      - post:
          url: "/api/rooms"
          json:
            name: "room_{{ $randomNumber(1, 100000) }}"
            description: "Test room"
            type: "PUBLIC"
            privateRoom: false
          headers:
            Authorization: "Bearer {{ token }}"
          capture:
            json: "$.id"
            as: "roomId"
          think: 1

      # 5. Get room messages (pagination test)
      - get:
          url: "/api/rooms/{{ roomId }}/messages?page=0&size=50"
          headers:
            Authorization: "Bearer {{ token }}"
          think: 2

      # 6. Simulate WebSocket connection (via REST polling for this test)
      - loop:
        - get:
            url: "/api/rooms/{{ roomId }}/messages?page=0&size=10"
            headers:
              Authorization: "Bearer {{ token }}"
            think: 3
        count: 3

      # 7. Cleanup (optional)
      - get:
          url: "/api/rooms/mine"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Load Test Processor

Create `load-test-processor.js`:

```javascript
module.exports = {
  setup: function(context, ee, next) {
    console.log('Load test starting...');
    
    ee.on('response', function(latency, code, rid, time) {
      if (code >= 400) {
        console.error(`Request ${rid} failed with status ${code}`);
      }
    });
    
    return next();
  },

  cleanup: function(context, ee, next) {
    console.log('Load test complete');
    return next();
  }
};
```

### Run Load Test

```bash
# Basic test
artillery run load-test.yml

# Generate HTML report
artillery run load-test.yml --output load-test-results.json
artillery report load-test-results.json --output report.html

# View report in browser
open report.html
```

### Expected Results

After a successful load test, you should see:

```
Summary Report
──────────────
Scenarios launched: 1000
Scenarios completed: 1000
Requests completed: 5000
Response time (avg): 45ms
Response time (p95): 120ms
Response time (p99): 250ms
Throughput: 10 req/sec
Errors: 0
```

### WebSocket Load Testing

For more realistic WebSocket testing, use `artillery-plugin-statsd`:

```bash
npm install -g artillery-plugin-statsd
```

Add to `load-test.yml`:

```yaml
config:
  plugins:
    statsd:
      host: "localhost"
      port: 8125
      prefix: "artillery"

  http:
    timeout: 10
    max: 50  # Max concurrent connections

  processor: "./load-test-processor.js"
```

### Performance Benchmarks to Aim For

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Avg latency | <100ms | <50ms | <30ms |
| p95 latency | <300ms | <200ms | <100ms |
| p99 latency | <1000ms | <500ms | <250ms |
| Error rate | <1% | <0.1% | <0.01% |
| Throughput | >100 req/s | >500 req/s | >1000 req/s |

### Monitor During Test

In another terminal:

```bash
# Watch pod resource usage
kubectl top pods -n chat-engine --containers=true

# Watch HPA scaling
kubectl get hpa -n chat-engine -w

# Watch logs
kubectl logs -n chat-engine deployment/chat-engine -f --tail=50
```

### Stress Test (Advanced)

To find the breaking point:

```yaml
config:
  phases:
    - duration: 300
      arrivalRate: 10
      rampTo: 100
      name: "Stress test"
```

Run and monitor when response times spike or errors appear.

---

See https://artillery.io/docs for full Artillery documentation.
