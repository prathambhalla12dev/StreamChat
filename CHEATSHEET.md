# ⚡ Quick Reference Cheat Sheet

Fast access to common commands and tasks.

---

## 🚀 Local Development

```bash
# Start everything
docker-compose up --build

# Rebuild a specific service
docker-compose up --build chat-engine

# Stop everything
docker-compose down

# View logs
docker-compose logs -f chat-engine
docker-compose logs -f chat-frontend

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

---

## 🔨 Backend Development

```bash
cd chat-engine/

# Build with Maven
mvn clean package

# Run tests
mvn test

# Run integration tests
mvn verify

# Run with Spring Boot
mvn spring-boot:run

# Format code
mvn spotless:apply

# Check dependencies
mvn dependency:tree
```

---

## 🎨 Frontend Development

```bash
cd chat-frontend/

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Check for issues
npm run lint
```

---

## ☸️ Kubernetes Commands

```bash
# Check pod status
kubectl get pods -n chat-engine

# View pod logs
kubectl logs deployment/chat-engine -n chat-engine -f

# Scale deployment
kubectl scale deployment chat-engine -n chat-engine --replicas=5

# Watch HPA
kubectl get hpa -n chat-engine -w

# Get resource usage
kubectl top pods -n chat-engine
kubectl top nodes

# Port forward to local
kubectl port-forward svc/chat-engine-service 8080:80 -n chat-engine

# Open shell in pod
kubectl exec -it <pod-name> -n chat-engine -- /bin/bash

# Delete failed pods
kubectl delete pod <pod-name> -n chat-engine

# View events
kubectl get events -n chat-engine

# Restart deployment
kubectl rollout restart deployment/chat-engine -n chat-engine

# Check rollout status
kubectl rollout status deployment/chat-engine -n chat-engine

# View deployment history
kubectl rollout history deployment/chat-engine -n chat-engine

# Rollback to previous version
kubectl rollout undo deployment/chat-engine -n chat-engine
```

---

## 🐳 Docker Commands

```bash
# Build image
docker build -t chat-engine:latest chat-engine/

# Build and push
docker build -t myregistry/chat-engine:latest chat-engine/
docker push myregistry/chat-engine:latest

# Run container
docker run -p 8080:8080 chat-engine:latest

# List images
docker images

# List running containers
docker ps

# View logs
docker logs <container-id> -f

# Stop container
docker stop <container-id>

# Remove image
docker rmi <image-id>

# Remove all unused images
docker image prune -a
```

---

## 📊 API Testing

```bash
# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "displayName": "Alice"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'

# Get rooms (need JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/rooms

# Create room
curl -X POST http://localhost:8080/api/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "general",
    "description": "General chat",
    "type": "PUBLIC"
  }'

# Get message history
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8080/api/rooms/ROOM_ID/messages?page=0&size=50"

# Health check
curl http://localhost:8080/actuator/health

# Metrics
curl http://localhost:8080/actuator/prometheus
```

---

## 🔐 Security Commands

```bash
# Generate JWT secret (256-bit)
openssl rand -base64 32

# Create Kubernetes secret
kubectl create secret generic chat-engine-secrets \
  --from-literal=JWT_SECRET="your-secret-here" \
  -n chat-engine

# View secret (base64 decoded)
kubectl get secret chat-engine-secrets -n chat-engine -o jsonpath='{.data.JWT_SECRET}' | base64 -d

# Scan Docker image for vulnerabilities
trivy image chat-engine:latest

# Check pod security policies
kubectl get pods -n chat-engine -o json | jq '.items[] | {name: .metadata.name, uid: .spec.securityContext.runAsUser}'
```

---

## 📈 Monitoring

```bash
# View Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# Test alert rules
curl http://localhost:9090/api/v1/rules

# View Grafana dashboards
open http://localhost:3001

# Check pod resource limits
kubectl describe node | grep -A5 "Allocated resources"

# Monitor resource usage in real-time
watch kubectl top pods -n chat-engine

# Stream logs from all pods
kubectl logs -n chat-engine -f --all-containers=true --prefix=true
```

---

## 🐛 Troubleshooting

```bash
# Check why pod is not starting
kubectl describe pod <pod-name> -n chat-engine

# Check DNS resolution inside pod
kubectl exec <pod-name> -n chat-engine -- nslookup kubernetes.default

# Test network connectivity
kubectl exec <pod-name> -n chat-engine -- curl -v http://chat-engine-service:8080/actuator/health

# Check persistent volume status
kubectl get pv
kubectl get pvc -n chat-engine

# View webhook/mutation errors
kubectl get validatingwebhookconfigurations

# Check resource quotas
kubectl describe resourcequota -n chat-engine
```

---

## 🔄 Deployment

```bash
# Dry-run apply (see what would change)
kubectl apply -f k8s/ --dry-run=client -o yaml

# Apply with validation
kubectl apply -f k8s/ --validate=true

# Watch deployment progress
kubectl rollout status deployment/chat-engine -n chat-engine -w

# Force delete stuck pod
kubectl delete pod <pod-name> -n chat-engine --grace-period=0 --force

# Scale using HPA
kubectl autoscale deployment chat-engine -n chat-engine --min=2 --max=20 --cpu-percent=70

# Manual scale
kubectl scale deployment chat-engine -n chat-engine --replicas=5
```

---

## 💾 Database

```bash
# Connect to MongoDB
kubectl exec -it mongodb-0 -n chat-engine -- mongosh

# List databases
> show dbs

# Use chatengine database
> use chatengine

# List collections
> show collections

# View indexes
> db.messages.getIndexes()

# Check document count
> db.messages.countDocuments()

# Export data
kubectl exec mongodb-0 -n chat-engine -- mongodump --out /tmp/backup

# Restore data
kubectl exec mongodb-0 -n chat-engine -- mongorestore /tmp/backup

# Connect to Redis
kubectl exec -it redis-<pod-id> -n chat-engine -- redis-cli

# Check Redis memory
> INFO memory

# Flush Redis (WARNING!)
> FLUSHALL
```

---

## 🎯 Performance Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Generate report
artillery report load-test-results.json --output report.html

# Run with custom phases
artillery run load-test.yml --target http://localhost:8080

# Stress test (5-minute ramp-up)
artillery run -t http://localhost:8080 -d 300 -r 10 load-test.yml
```

---

## 📝 Useful Configs

### Enable debug logging (backend)
```properties
logging.level.com.chatengine=DEBUG
logging.level.org.springframework.web.socket=DEBUG
logging.level.org.springframework.security=DEBUG
```

### Increase memory (backend)
```bash
export JAVA_OPTS="-Xmx2g -Xms1g"
```

### Increase connection limits (MongoDB)
```yaml
mongodb:
  # In deployment
  command: ["mongod", "--maxConnections=5000"]
```

### Redis performance tuning
```yaml
redis:
  command: ["redis-server", 
    "--maxmemory", "2gb",
    "--maxmemory-policy", "allkeys-lru",
    "--tcp-backlog", "511"
  ]
```

---

## 🎓 Tips & Tricks

1. **Use aliases for long commands**
   ```bash
   alias k=kubectl
   alias k-logs='kubectl logs -n chat-engine -f'
   alias k-pods='kubectl get pods -n chat-engine'
   ```

2. **Search Docker history**
   ```bash
   docker history chat-engine:latest | grep -i "build"
   ```

3. **Export Kubernetes config**
   ```bash
   kubectl get -n chat-engine all -o yaml > backup.yaml
   ```

4. **Batch edit multiple resources**
   ```bash
   kubectl edit deployment -n chat-engine
   ```

5. **Port forward multiple services**
   ```bash
   kubectl port-forward svc/chat-engine-service 8080:80 &
   kubectl port-forward svc/mongo-service 27017:27017 &
   kubectl port-forward svc/redis-service 6379:6379 &
   ```

---

## 📚 Documentation Links

- Spring Boot: https://spring.io/projects/spring-boot
- React: https://react.dev
- Kubernetes: https://kubernetes.io/docs/
- Docker: https://docs.docker.com/
- MongoDB: https://docs.mongodb.com/
- Redis: https://redis.io/documentation
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/

---

**Bookmark this page for quick reference!** ⭐
