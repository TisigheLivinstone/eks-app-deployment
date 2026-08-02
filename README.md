# EKS App Deployment

Deploying and scaling a Node.js API on the EKS cluster from [eks-terraform-foundation](https://github.com/TisigheLivinstone/eks-terraform-foundation). Covers Helm packaging, HPA, ALB Ingress, and AWS Secrets Manager integration.

Part of the Production EKS on AWS series:
- [Part 1 — Networking foundation](https://www.livinstone.dev/blog/terraform-multi-environment-iac)
- [Part 2 — EKS cluster deployment](https://www.livinstone.dev/blog/building-production-eks-cluster-from-scratch)
- **Part 3 — Application deployment (this repo)**

## Structure

```
eks-app-deployment/
├── apps/
│   └── api/
│       ├── src/index.js          # Express API with readiness/liveness probes
│       ├── Dockerfile            # Multi-stage build
│       └── package.json
├── helm/
│   └── api-chart/
│       ├── Chart.yaml
│       ├── values.yaml           # Defaults
│       ├── values-dev.yaml       # Dev overrides
│       ├── values-prod.yaml      # Prod overrides — HPA enabled
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           └── hpa.yaml
└── k8s/
    ├── ingress.yaml              # ALB Ingress with SSL
    └── secret-provider.yaml      # AWS Secrets Manager via CSI driver
```

## Before You Start

Update these before deploying:

1. **ECR repository URI** — in `helm/api-chart/values.yaml`, replace `YOUR_ACCOUNT_ID` with your AWS account ID
2. **ACM certificate ARN** — in `k8s/ingress.yaml`, replace `YOUR_ACM_CERT_ARN`
3. **Domain** — in `k8s/ingress.yaml`, replace `api.yourdomain.com`

## Prerequisites

- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured against your EKS cluster
- [Helm 3](https://helm.sh/docs/intro/install/)
- [Docker](https://docs.docker.com/engine/install/)
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## Deploy

**Step 1 — Build and push the image:**
```bash
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com

aws ecr create-repository --repository-name api --region eu-west-1

docker build -t api ./apps/api
docker tag api:latest YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/api:latest
```

**Step 2 — Deploy with Helm:**
```bash
kubectl create namespace production

# Dry run first
helm install api ./helm/api-chart \
  --namespace production \
  --values helm/api-chart/values-prod.yaml \
  --dry-run --debug

# Deploy
helm install api ./helm/api-chart \
  --namespace production \
  --values helm/api-chart/values-prod.yaml

kubectl get pods -n production -w
```

**Step 3 — Apply Ingress and Secrets:**
```bash
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/secret-provider.yaml

kubectl get ingress -n production   # Wait for ALB address (~90 seconds)
```

**Step 4 — Verify:**
```bash
kubectl get pods -n production
kubectl get hpa -n production
kubectl get ingress -n production
curl https://api.yourdomain.com/healthz/ready
```

## Updating

```bash
docker build -t api:v1.1 ./apps/api
docker tag api:v1.1 YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/api:v1.1
docker push YOUR_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/api:v1.1

helm upgrade api ./helm/api-chart \
  --namespace production \
  --values helm/api-chart/values-prod.yaml \
  --set image.tag=v1.1

# Roll back if needed
helm rollback api -n production
```

## Screenshots

![Architecture](screenshots/architecture.png)
*Application deployment architecture — user traffic → ALB → pods → ECR + Secrets Manager*

![Pods running](screenshots/pods-running.png)
*kubectl get pods -n production — all replicas Running*

![HPA active](screenshots/hpa-active.png)
*kubectl get hpa -n production — autoscaler watching CPU*

## Full write-up

[EKS Platform Engineering — Deploying and Scaling Applications on Kubernetes](https://www.livinstone.dev/blog/eks-deploying-scaling-applications)
