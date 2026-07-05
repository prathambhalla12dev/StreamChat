# ☁️ Cloud Deployment Guide

Deploy Pulse Chat Engine to your favorite cloud platform with zero hassle.

---

## 🔵 Google Cloud Platform (GKE)

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed
- `kubectl` installed

### 1. Create GKE Cluster
```bash
export PROJECT_ID=your-project-id
export CLUSTER_NAME=pulse-chat-cluster
export REGION=us-central1
export ZONE=us-central1-a

# Create cluster (3 nodes, auto-scaling 3-10)
gcloud container clusters create $CLUSTER_NAME \
  --region $REGION \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10 \
  --machine-type n1-standard-2 \
  --enable-ip-alias \
  --network default \
  --subnetwork default

# Get credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION
```

### 2. Push Images to Google Container Registry (GCR)
```bash
# Configure Docker auth
gcloud auth configure-docker

# Build and push backend
docker build -t gcr.io/$PROJECT_ID/chat-engine:latest chat-engine/
docker push gcr.io/$PROJECT_ID/chat-engine:latest

# Build and push frontend
docker build -t gcr.io/$PROJECT_ID/chat-frontend:latest chat-frontend/
docker push gcr.io/$PROJECT_ID/chat-frontend:latest
```

### 3. Update Kubernetes Manifests
```bash
cd chat-engine/k8s/
sed -i "s|your-registry|gcr.io/$PROJECT_ID|g" *.yaml

cd ../../chat-frontend/k8s/
sed -i "s|your-registry|gcr.io/$PROJECT_ID|g" *.yaml
```

### 4. Deploy to GKE
```bash
# Backend
kubectl apply -f chat-engine/k8s/00-namespace.yaml
kubectl apply -f chat-engine/k8s/01-secrets.yaml
kubectl apply -f chat-engine/k8s/02-deployment.yaml
kubectl apply -f chat-engine/k8s/03-hpa.yaml
kubectl apply -f chat-engine/k8s/04-mongodb.yaml
kubectl apply -f chat-engine/k8s/05-redis.yaml

# Frontend
kubectl apply -f chat-frontend/k8s/deployment.yaml

# Ingress with Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-engine-ingress
  namespace: chat-engine
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "chat-ip"
    networking.gke.io/managed-certificates: "chat-cert"
spec:
  rules:
  - host: chat.yourdomain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: chat-frontend-service
            port:
              number: 80
      - path: /api/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: chat-engine-service
            port:
              number: 80
      - path: /ws/*
        pathType: ImplementationSpecific
        backend:
          service:
            name: chat-engine-service
            port:
              number: 80
EOF
```

### 5. Setup TLS with Cloud Armor (Optional)
```bash
# Create managed certificate
kubectl apply -f - <<EOF
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLCertificate
metadata:
  name: chat-cert
spec:
  managedConfig:
    domains:
    - chat.yourdomain.com
EOF
```

### 6. Monitor and Debug
```bash
# Check pods
kubectl get pods -n chat-engine

# View logs
kubectl logs -n chat-engine deployment/chat-engine -f
kubectl logs -n chat-engine deployment/chat-frontend -f

# Scale manually if needed
kubectl scale deployment chat-engine -n chat-engine --replicas=5

# Watch HPA
kubectl get hpa -n chat-engine -w
```

### Cost Estimation
- **Cluster**: 3 nodes (n1-standard-2) = ~$150/month
- **Load balancer**: ~$20/month
- **Storage (MongoDB)**: ~$5-50/month
- **Total**: ~$175-220/month for 1000+ concurrent users

---

## 🟠 Amazon Web Services (EKS)

### Prerequisites
- AWS account
- `aws` CLI, `kubectl`, `eksctl` installed

### 1. Create EKS Cluster
```bash
export CLUSTER_NAME=pulse-chat-cluster
export REGION=us-east-1

# Create cluster with eksctl (easiest)
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --nodegroup-name standard-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed

# Get credentials
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
```

### 2. Push Images to Amazon ECR
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Create repositories
aws ecr create-repository --repository-name chat-engine --region $REGION
aws ecr create-repository --repository-name chat-frontend --region $REGION

# Build and push backend
docker build -t $ECR_REGISTRY/chat-engine:latest chat-engine/
docker push $ECR_REGISTRY/chat-engine:latest

# Build and push frontend
docker build -t $ECR_REGISTRY/chat-frontend:latest chat-frontend/
docker push $ECR_REGISTRY/chat-frontend:latest
```

### 3. Update Kubernetes Manifests
```bash
sed -i "s|your-registry|$ECR_REGISTRY|g" chat-engine/k8s/*.yaml
sed -i "s|your-registry|$ECR_REGISTRY|g" chat-frontend/k8s/*.yaml
```

### 4. Install AWS Load Balancer Controller
```bash
# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts

# Install ALB controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME
```

### 5. Deploy to EKS
```bash
# Backend
kubectl apply -f chat-engine/k8s/

# Frontend
kubectl apply -f chat-frontend/k8s/

# Ingress with ALB
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-engine-ingress
  namespace: chat-engine
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:$REGION:$AWS_ACCOUNT_ID:certificate/YOUR_CERT_ID
spec:
  ingressClassName: alb
  rules:
  - host: chat.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chat-frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: chat-engine-service
            port:
              number: 80
      - path: /ws
        pathType: Prefix
        backend:
          service:
            name: chat-engine-service
            port:
              number: 80
EOF
```

### 6. Setup CloudWatch Monitoring
```bash
# Enable CloudWatch Container Insights
aws eks update-cluster-logging \
  --cluster-name $CLUSTER_NAME \
  --logging-config clusterLogging='[{enabled: true, types: ["api", "audit", "authenticator", "controllerManager", "scheduler"]}]'
```

### Cost Estimation
- **EKS cluster**: ~$73/month
- **EC2 nodes** (3x t3.medium): ~$45/month
- **ALB**: ~$16/month
- **RDS (MongoDB)**: ~$50-100/month (optional, use managed service)
- **Total**: ~$184-290/month

---

## 🔷 Microsoft Azure (AKS)

### Prerequisites
- Azure account
- `az` CLI, `kubectl` installed

### 1. Create AKS Cluster
```bash
export RESOURCE_GROUP=pulse-chat-rg
export CLUSTER_NAME=pulse-chat-cluster
export REGION=eastus

# Create resource group
az group create --name $RESOURCE_GROUP --location $REGION

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity \
  --network-plugin azure \
  --network-policy azure \
  --docker-bridge-cidr 172.17.0.1/16

# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME
```

### 2. Push Images to Azure Container Registry
```bash
export ACR_NAME=pulsechat
export REGION=eastus

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic

# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend
az acr build \
  --registry $ACR_NAME \
  --image chat-engine:latest \
  ./chat-engine

# Build and push frontend
az acr build \
  --registry $ACR_NAME \
  --image chat-frontend:latest \
  ./chat-frontend

# Attach ACR to AKS
az aks update \
  --name $CLUSTER_NAME \
  --resource-group $RESOURCE_GROUP \
  --attach-acr $ACR_NAME
```

### 3. Update Kubernetes Manifests
```bash
export ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)

sed -i "s|your-registry|$ACR_LOGIN_SERVER|g" chat-engine/k8s/*.yaml
sed -i "s|your-registry|$ACR_LOGIN_SERVER|g" chat-frontend/k8s/*.yaml
```

### 4. Deploy to AKS
```bash
# Backend
kubectl apply -f chat-engine/k8s/

# Frontend
kubectl apply -f chat-frontend/k8s/

# Application Gateway Ingress Controller
helm repo add application-gateway-kubernetes-ingress https://appgwk8s.blob.core.windows.net/helm/
helm install ingress-azure application-gateway-kubernetes-ingress/ingress-azure \
  --namespace kube-system \
  --set appgw.name=chat-appgw
```

### 5. Setup Application Insights (Monitoring)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app chat-insights \
  --location $REGION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app chat-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey
```

### Cost Estimation
- **AKS cluster**: ~$73/month
- **VM nodes** (3x Standard_B2s): ~$30/month
- **Application Gateway**: ~$20/month
- **ACR storage**: ~$5-10/month
- **Total**: ~$128-203/month

---

## 🟢 DigitalOcean Kubernetes (DOKS)

### 1. Create DOKS Cluster
```bash
# Via doctl CLI
export CLUSTER_NAME=pulse-chat-cluster
export REGION=nyc3

doctl kubernetes cluster create $CLUSTER_NAME \
  --region $REGION \
  --version latest \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3;auto-scale=true;min-nodes=3;max-nodes=10" \
  --enable-monitoring

# Get kubeconfig
doctl kubernetes cluster kubeconfig save $CLUSTER_NAME
```

### 2. Push Images to DigitalOcean Container Registry
```bash
# Create registry
doctl registry create pulse-chat-registry --region $REGION

# Login
doctl registry login

# Build and push
docker build -t registry.digitalocean.com/pulse-chat-registry/chat-engine:latest chat-engine/
docker push registry.digitalocean.com/pulse-chat-registry/chat-engine:latest

docker build -t registry.digitalocean.com/pulse-chat-registry/chat-frontend:latest chat-frontend/
docker push registry.digitalocean.com/pulse-chat-registry/chat-frontend:latest
```

### 3. Update Manifests & Deploy
```bash
sed -i 's|your-registry|registry.digitalocean.com/pulse-chat-registry|g' chat-engine/k8s/*.yaml
sed -i 's|your-registry|registry.digitalocean.com/pulse-chat-registry|g' chat-frontend/k8s/*.yaml

kubectl apply -f chat-engine/k8s/
kubectl apply -f chat-frontend/k8s/
```

### Cost Estimation
- **DOKS cluster**: Free
- **Nodes** (3x s-2vcpu-4gb): ~$30/month
- **Load Balancer**: ~$10/month
- **Block Storage** (MongoDB): ~$5-20/month
- **Total**: ~$45-60/month (cheapest option!)

---

## 📊 Cost Comparison

| Platform | Cluster | Nodes | LB | Storage | **Total/Month** |
|----------|---------|-------|----|---------|----|
| **GCP (GKE)** | $73 | ~$75 | $20 | $20 | **$188** |
| **AWS (EKS)** | $73 | ~$45 | $16 | $50 | **$184** |
| **Azure (AKS)** | $73 | ~$30 | $20 | $10 | **$133** |
| **DigitalOcean** | Free | $30 | $10 | $15 | **$55** |

**DigitalOcean DOKS is the most cost-effective for small-medium deployments.** 🏆

---

## 🔄 CI/CD Pipeline to Auto-Deploy

### GitHub Actions → Cloud Deployment

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # For GCP/GKE
      - name: Deploy to GKE
        if: ${{ secrets.GCP_PROJECT_ID }}
        run: |
          gcloud auth activate-service-account --key-file=${{ secrets.GCP_SA_KEY }}
          gcloud config set project ${{ secrets.GCP_PROJECT_ID }}
          gcloud container clusters get-credentials ${{ secrets.GKE_CLUSTER }} --zone ${{ secrets.GKE_ZONE }}
          kubectl set image deployment/chat-engine chat-engine=gcr.io/${{ secrets.GCP_PROJECT_ID }}/chat-engine:latest -n chat-engine
          kubectl rollout status deployment/chat-engine -n chat-engine

      # For AWS/EKS
      - name: Deploy to EKS
        if: ${{ secrets.AWS_ACCOUNT_ID }}
        run: |
          aws configure set aws_access_key_id ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws configure set aws_secret_access_key ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER }} --region ${{ secrets.AWS_REGION }}
          kubectl set image deployment/chat-engine chat-engine=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/chat-engine:latest -n chat-engine
          kubectl rollout status deployment/chat-engine -n chat-engine
```

---

## ✅ Post-Deployment Checklist

- [ ] Verify all pods are running: `kubectl get pods -n chat-engine`
- [ ] Check HPA is working: `kubectl get hpa -n chat-engine`
- [ ] Test frontend at your domain
- [ ] Verify backend API: `curl https://yourdomain.com/api/rooms`
- [ ] Check WebSocket connection in browser console
- [ ] Monitor resource usage: `kubectl top nodes` / `kubectl top pods -n chat-engine`
- [ ] Setup alerting for pod crashes
- [ ] Enable auto-backups for MongoDB
- [ ] Configure log aggregation (Cloud Logging, CloudWatch, or similar)
- [ ] Enable SSL/TLS certificate auto-renewal

---

Done! Your Pulse Chat Engine is now running at scale in the cloud. 🚀
