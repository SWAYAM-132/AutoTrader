# AWS Deployment Guide - AutoTraderX

This guide walks through deploying AutoTraderX to **AWS EKS** (Elastic Kubernetes Service).

## Prerequisites

- AWS CLI configured (`aws configure`)
- `kubectl` installed
- `eksctl` installed
- Docker installed locally
- An AWS ECR (Elastic Container Registry) repository

## Step 1: Create ECR Repositories

```bash
# Create repositories for backend and frontend images
aws ecr create-repository --repository-name autotraderx-backend --region us-east-1
aws ecr create-repository --repository-name autotraderx-frontend --region us-east-1
```

## Step 2: Build & Push Docker Images

```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push Backend
cd backend
docker build -t autotraderx-backend .
docker tag autotraderx-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/autotraderx-backend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/autotraderx-backend:latest

# Build and push Frontend
cd ../frontend
docker build -t autotraderx-frontend .
docker tag autotraderx-frontend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/autotraderx-frontend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/autotraderx-frontend:latest
```

## Step 3: Create EKS Cluster

```bash
eksctl create cluster \
  --name autotraderx-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed
```

This takes ~15 minutes. `eksctl` automatically configures `kubectl`.

## Step 4: Create Kubernetes Secrets

```bash
# Create secrets (replace with actual values!)
kubectl create secret generic autotraderx-secrets \
  --from-literal=POSTGRES_USER=user \
  --from-literal=POSTGRES_PASSWORD=<STRONG_PASSWORD> \
  --from-literal=POSTGRES_DB=autotraderx \
  --from-literal=DATABASE_URL="postgresql+asyncpg://user:<STRONG_PASSWORD>@autotraderx-postgres:5432/autotraderx" \
  --from-literal=SECRET_KEY="<RANDOM_SECRET_KEY>" \
  --from-literal=GROQ_API_KEY="<YOUR_GROQ_API_KEY>"
```

## Step 5: Deploy to K8s

```bash
# Update image references in k8s/*.yaml to your ECR URIs first!

# Apply all manifests
kubectl apply -f k8s/secrets.yaml       # Or use Step 4 command instead
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## Step 6: Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/aws/deploy.yaml
```

## Step 7: Verify Deployment

```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

## Step 8: Set Up RDS (Production Alternative)

For production, replace the K8s PostgreSQL with **Amazon RDS**:

```bash
aws rds create-db-instance \
  --db-instance-identifier autotraderx-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username user \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20
```

Then update the `DATABASE_URL` secret to point to the RDS endpoint.

## Cost Estimate (Monthly)

| Service | Estimate |
|---------|----------|
| EKS Control Plane | $72 |
| 3x t3.medium Nodes | ~$100 |
| RDS db.t3.micro | ~$15 |
| ECR Storage | ~$1 |
| **Total** | **~$188/mo** |

> [!TIP]
> Use Spot Instances for worker nodes to reduce costs by up to 90%.
