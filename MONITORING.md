# 📊 Monitoring & Observability Guide

Monitor your Pulse Chat Engine with **Prometheus** + **Grafana** + **Loki** (logs).

---

## 🚀 Quick Start with Docker Compose

Add to your `docker-compose.yml`:

```yaml
  # ─── Prometheus (Metrics collection) ───────────────
  prometheus:
    image: prom/prometheus:latest
    container_name: chat-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped
    networks:
      - chat-net

  # ─── Grafana (Dashboards & alerts) ────────────────
  grafana:
    image: grafana/grafana:latest
    container_name: chat-grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: 'false'
    volumes:
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - chat-net

  # ─── Loki (Log aggregation) ───────────────────────
  loki:
    image: grafana/loki:latest
    container_name: chat-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yml:ro
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yml
    restart: unless-stopped
    networks:
      - chat-net

  # ─── Promtail (Log shipper) ───────────────────────
  promtail:
    image: grafana/promtail:latest
    container_name: chat-promtail
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/promtail.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
    networks:
      - chat-net

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

---

## 📋 Configuration Files

### 1. Prometheus Config

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'pulse-chat'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - '/etc/prometheus/alerts.yml'

scrape_configs:
  # Spring Boot Actuator metrics
  - job_name: 'chat-engine'
    static_configs:
      - targets: ['chat-engine:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s

  # Redis metrics (via redis_exporter)
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # MongoDB metrics (via mongodb_exporter)
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # Kubernetes metrics (if using K8s)
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name]
        action: keep
        regex: default;kubernetes
```

### 2. Alert Rules

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: chat-engine
    interval: 30s
    rules:
      # Pod restart alert
      - alert: PodRestarting
        expr: rate(kube_pod_container_status_restarts_total[1h]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod {{ $labels.pod }} is restarting frequently"
          description: "Pod has restarted {{ $value }} times in the last hour"

      # High CPU usage
      - alert: HighCPUUsage
        expr: container_cpu_usage_seconds_total{pod=~"chat-engine.*"} > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
          description: "CPU usage is {{ $value | humanizePercentage }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{pod=~"chat-engine.*"} / container_spec_memory_limit_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # High latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "High request latency detected"
          description: "P95 latency is {{ $value }}s"

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Pod not ready
      - alert: PodNotReady
        expr: kube_pod_status_ready{namespace="chat-engine"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.pod }} is not ready"
          description: "Pod has been down for {{ $value }} minutes"

      # Disk usage
      - alert: DiskUsageHigh
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk usage is high"
          description: "Only {{ $value | humanizePercentage }} free"
```

### 3. Grafana Datasources

Create `monitoring/grafana/datasources/datasources.yml`:

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```

### 4. Loki Config

Create `monitoring/loki.yml`:

```yaml
auth_enabled: false

ingester:
  chunk_idle_period: 3m
  max_chunk_age: 1h
  chunk_retain_period: 1m
  max_streams_per_user: 10000

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema:
        version: v11
        index:
          prefix: index_
          period: 24h

server:
  http_listen_port: 3100
  grpc_listen_port: 50051
  log_level: info

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks
```

### 5. Promtail Config

Create `monitoring/promtail.yml`:

```yaml
server:
  http_listen_port: 3101
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker container logs
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: 'instance'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'

  # Kubernetes pod logs (if using K8s)
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
```

---

## 📈 Access Dashboards

### Local Development
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Loki**: http://localhost:3100 (via Grafana)

### Import Pre-Built Dashboards

In Grafana:
1. Go to **Dashboards** → **Import**
2. Search for and import:
   - `1860` — Node Exporter for Prometheus
   - `3662` — Prometheus 2.0 Overview
   - `6417` — Spring Boot 2.1 System Monitor
   - `8919` — Kubernetes Cluster Monitoring

### Create Custom Dashboard

Example queries:

```promql
# Message throughput (per second)
rate(http_requests_total{endpoint="/api/chat"}[1m])

# WebSocket connection count
ws_connections_active

# Average message latency
histogram_quantile(0.5, rate(http_request_duration_seconds_bucket[5m]))

# Pod restart count
increase(kube_pod_container_status_restarts_total[1h])

# Memory usage per pod
container_memory_usage_bytes{pod=~"chat-engine.*"} / 1024 / 1024 / 1024

# MongoDB query time
rate(mongodb_command_duration_seconds_total[1m])

# Redis command latency
redis_command_duration_seconds
```

---

## ☸️ Deploy to Kubernetes

### 1. Add Prometheus Helm Chart

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f monitoring/prometheus-values.yml
```

### 2. Create Monitoring Namespace Manifest

```yaml
# monitoring/k8s-monitoring.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    # (same as above)

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  datasources.yaml: |
    # (same as above)

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:latest
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
      volumes:
        - name: config
          configMap:
            name: prometheus-config

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f monitoring/k8s-monitoring.yaml
```

---

## 🔔 Setup Alerting

### Slack Alerts

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add to Prometheus alertmanager config:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'slack'
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#chat-engine-alerts'
        title: 'Pulse Chat Engine Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}: {{ .Annotations.description }}{{ end }}'
```

---

## 📚 Key Metrics to Monitor

| Metric | Query | Alert Threshold |
|--------|-------|---|
| Request latency (p95) | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | >500ms |
| Error rate | `rate(http_requests_total{status=~"5.."}[5m])` | >5% |
| Pod CPU | `rate(container_cpu_usage_seconds_total[5m])` | >80% |
| Pod memory | `container_memory_usage_bytes / 1024 / 1024` | >500MB |
| WebSocket connections | `ws_connections_active` | >5000 |
| Message throughput | `rate(messages_created_total[1m])` | <100 msg/s = low traffic |
| MongoDB slow queries | `mongodb_commands_duration_seconds_sum` | >100ms |
| Redis memory | `redis_memory_used_bytes / 1024 / 1024 / 1024` | >80% of max |

---

## 🚨 Common Alerts to Setup

1. **Pod is Down** — Alert if pod is not ready for >2 minutes
2. **High Memory** — Alert if memory >85% of limit
3. **High CPU** — Alert if CPU >80% sustained
4. **High Error Rate** — Alert if 5xx errors >5% for 5 minutes
5. **High Latency** — Alert if p95 latency >500ms
6. **Disk Full** — Alert if disk <15% free
7. **Database Connection Lost** — Alert if MongoDB/Redis unreachable
8. **Pod Restarting** — Alert if pod restarts >3 times per hour

---

See Prometheus docs: https://prometheus.io/docs/
See Grafana docs: https://grafana.com/docs/
