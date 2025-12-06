# AWS ECS Deployment Guide for Nalanda Library API

This guide provides comprehensive instructions for deploying the Nalanda Library Management System API to AWS using ECS (Elastic Container Service) with Fargate.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: AWS CLI Setup](#step-1-aws-cli-setup)
4. [Step 2: Create ECR Repository](#step-2-create-ecr-repository)
5. [Step 3: Build and Push Docker Image](#step-3-build-and-push-docker-image)
6. [Step 4: Set Up MongoDB Atlas](#step-4-set-up-mongodb-atlas)
7. [Step 5: Create AWS Secrets](#step-5-create-aws-secrets)
8. [Step 6: Create IAM Roles](#step-6-create-iam-roles)
9. [Step 7: Create VPC and Networking](#step-7-create-vpc-and-networking)
10. [Step 8: Create ECS Cluster](#step-8-create-ecs-cluster)
11. [Step 9: Register Task Definition](#step-9-register-task-definition)
12. [Step 10: Create Application Load Balancer](#step-10-create-application-load-balancer)
13. [Step 11: Create ECS Service](#step-11-create-ecs-service)
14. [Step 12: Set Up Auto Scaling](#step-12-set-up-auto-scaling)
15. [Monitoring and Logging](#monitoring-and-logging)
16. [CI/CD Pipeline](#cicd-pipeline)
17. [Cost Optimization](#cost-optimization)
18. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] AWS Account with appropriate permissions
- [ ] AWS CLI v2 installed and configured
- [ ] Docker installed locally
- [ ] MongoDB Atlas account (for production database)
- [ ] Domain name (optional, for custom domain)

### Install AWS CLI

```bash
# macOS
brew install awscli

# Verify installation
aws --version
```

### Configure AWS CLI

```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., ap-south-1)
# - Default output format (json)
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        VPC                                 │  │
│  │  ┌─────────────────┐    ┌─────────────────┐              │  │
│  │  │  Public Subnet  │    │  Public Subnet  │              │  │
│  │  │   (AZ-1a)       │    │   (AZ-1b)       │              │  │
│  │  │                 │    │                 │              │  │
│  │  │  ┌───────────┐  │    │  ┌───────────┐  │              │  │
│  │  │  │    ALB    │  │    │  │    ALB    │  │              │  │
│  │  │  └─────┬─────┘  │    │  └─────┬─────┘  │              │  │
│  │  └────────┼────────┘    └────────┼────────┘              │  │
│  │           │                      │                        │  │
│  │  ┌────────┼────────┐    ┌────────┼────────┐              │  │
│  │  │ Private Subnet  │    │ Private Subnet  │              │  │
│  │  │   (AZ-1a)       │    │   (AZ-1b)       │              │  │
│  │  │                 │    │                 │              │  │
│  │  │  ┌───────────┐  │    │  ┌───────────┐  │              │  │
│  │  │  │ECS Fargate│  │    │  │ECS Fargate│  │              │  │
│  │  │  │  Task     │  │    │  │  Task     │  │              │  │
│  │  │  └───────────┘  │    │  └───────────┘  │              │  │
│  │  └─────────────────┘    └─────────────────┘              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  MongoDB Atlas  │                          │
│                    │   (External)    │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: AWS CLI Setup

Set environment variables for consistency:

```bash
# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=ap-south-1
export ECR_REPO_NAME=nalanda-api
export ECS_CLUSTER_NAME=nalanda-cluster
export ECS_SERVICE_NAME=nalanda-service

# Verify
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
```

---

## Step 2: Create ECR Repository

Amazon Elastic Container Registry (ECR) stores your Docker images.

```bash
# Create ECR repository
aws ecr create-repository \
    --repository-name $ECR_REPO_NAME \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256

# Get the repository URI
export ECR_REPO_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME
echo "ECR Repository URI: $ECR_REPO_URI"
```

---

## Step 3: Build and Push Docker Image

### Authenticate Docker to ECR

```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

### Build and Push Image

```bash
# Build the Docker image
docker build -t $ECR_REPO_NAME:latest .

# Tag for ECR
docker tag $ECR_REPO_NAME:latest $ECR_REPO_URI:latest
docker tag $ECR_REPO_NAME:latest $ECR_REPO_URI:v1.0.0

# Push to ECR
docker push $ECR_REPO_URI:latest
docker push $ECR_REPO_URI:v1.0.0

# Verify image was pushed
aws ecr describe-images --repository-name $ECR_REPO_NAME --region $AWS_REGION
```

---

## Step 4: Set Up MongoDB Atlas

For production, use MongoDB Atlas instead of self-hosted MongoDB.

### Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new project: `nalanda-library`
4. Build a cluster:
   - Choose **M0 Sandbox** (Free) for testing or **M10+** for production
   - Select region: **Mumbai (ap-south-1)** for lowest latency
   - Name: `nalanda-cluster`

### Configure Database Access

1. Go to **Database Access** → **Add New Database User**
   - Username: `nalanda_admin`
   - Password: Generate a strong password
   - Database User Privileges: `Read and write to any database`

### Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. For development: Add your current IP
3. For production with ECS: Add `0.0.0.0/0` (Allow access from anywhere) 
   - Note: In production, use VPC Peering for better security

### Get Connection String

1. Go to **Clusters** → **Connect** → **Connect your application**
2. Copy the connection string:
```
mongodb+srv://nalanda_admin:<password>@nalanda-cluster.xxxxx.mongodb.net/nalanda_library?retryWrites=true&w=majority
```

---

## Step 5: Create AWS Secrets

Store sensitive data in AWS Secrets Manager.

```bash
# Create secret for MongoDB URI
aws secretsmanager create-secret \
    --name nalanda/mongodb-uri \
    --description "MongoDB connection string for Nalanda API" \
    --secret-string "mongodb+srv://nalanda_admin:YOUR_PASSWORD@nalanda-cluster.xxxxx.mongodb.net/nalanda_library?retryWrites=true&w=majority" \
    --region $AWS_REGION

# Create secret for JWT Secret (generate a strong random string)
JWT_SECRET=$(openssl rand -base64 48)
aws secretsmanager create-secret \
    --name nalanda/jwt-secret \
    --description "JWT signing secret for Nalanda API" \
    --secret-string "$JWT_SECRET" \
    --region $AWS_REGION

# Create secret for JWT Encryption Key (exactly 32 characters)
JWT_ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)
aws secretsmanager create-secret \
    --name nalanda/jwt-encryption-key \
    --description "JWT encryption key for Nalanda API" \
    --secret-string "$JWT_ENCRYPTION_KEY" \
    --region $AWS_REGION

# List created secrets
aws secretsmanager list-secrets --region $AWS_REGION --query "SecretList[?contains(Name, 'nalanda')]"
```

---

## Step 6: Create IAM Roles

### Create ECS Task Execution Role

```bash
# Create trust policy document
cat > ecs-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the execution role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-trust-policy.json

# Attach the managed policy
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create policy for Secrets Manager access
cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:nalanda/*"
      ]
    }
  ]
}
EOF

# Create and attach the secrets policy
aws iam create-policy \
    --policy-name NalandaSecretsAccess \
    --policy-document file://secrets-policy.json

aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/NalandaSecretsAccess

# Clean up temporary files
rm ecs-trust-policy.json secrets-policy.json
```

---

## Step 7: Create VPC and Networking

### Option A: Use Default VPC (Quick Start)

```bash
# Get default VPC ID
export VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
echo "VPC ID: $VPC_ID"

# Get subnet IDs
export SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
echo "Subnet IDs: $SUBNET_IDS"
```

### Option B: Create Custom VPC (Recommended for Production)

```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nalanda-vpc}]' \
    --query 'Vpc.VpcId' --output text

export VPC_ID=<vpc-id-from-above>

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=nalanda-igw}]' \
    --query 'InternetGateway.InternetGatewayId' --output text

export IGW_ID=<igw-id-from-above>

# Attach IGW to VPC
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Create public subnets in different AZs
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nalanda-public-1a}]'

aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=nalanda-public-1b}]'

# Create and configure route table
aws ec2 create-route-table --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=nalanda-public-rt}]'

# Add route to Internet Gateway
# aws ec2 create-route --route-table-id <rt-id> --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# Associate subnets with route table
# aws ec2 associate-route-table --subnet-id <subnet-id> --route-table-id <rt-id>
```

### Create Security Groups

```bash
# Create ALB Security Group
aws ec2 create-security-group \
    --group-name nalanda-alb-sg \
    --description "Security group for Nalanda ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text

export ALB_SG_ID=<sg-id-from-above>

# Allow HTTP and HTTPS inbound
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create ECS Tasks Security Group
aws ec2 create-security-group \
    --group-name nalanda-ecs-sg \
    --description "Security group for Nalanda ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text

export ECS_SG_ID=<sg-id-from-above>

# Allow traffic from ALB only
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp --port 3000 --source-group $ALB_SG_ID
```

---

## Step 8: Create ECS Cluster

```bash
# Create ECS Cluster
aws ecs create-cluster \
    --cluster-name $ECS_CLUSTER_NAME \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy \
        capacityProvider=FARGATE,weight=1 \
        capacityProvider=FARGATE_SPOT,weight=1 \
    --settings name=containerInsights,value=enabled \
    --region $AWS_REGION

# Verify cluster creation
aws ecs describe-clusters --clusters $ECS_CLUSTER_NAME --region $AWS_REGION
```

---

## Step 9: Register Task Definition

### Update Task Definition File

First, update the `aws/task-definition.json` file with your AWS Account ID:

```bash
# Update the task definition with your account ID
sed -i '' "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/task-definition.json
```

### Register Task Definition

```bash
aws ecs register-task-definition \
    --cli-input-json file://aws/task-definition.json \
    --region $AWS_REGION

# Verify registration
aws ecs describe-task-definition --task-definition nalanda-api --region $AWS_REGION
```

---

## Step 10: Create Application Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
    --name nalanda-alb \
    --subnets subnet-xxxxx subnet-yyyyy \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text

export ALB_ARN=<alb-arn-from-above>
export ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)

# Create Target Group
aws elbv2 create-target-group \
    --name nalanda-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-enabled \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' --output text

export TG_ARN=<tg-arn-from-above>

# Create Listener (HTTP)
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN

echo "ALB DNS: $ALB_DNS"
```

---

## Step 11: Create ECS Service

```bash
# Create ECS Service
aws ecs create-service \
    --cluster $ECS_CLUSTER_NAME \
    --service-name $ECS_SERVICE_NAME \
    --task-definition nalanda-api \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=nalanda-api,containerPort=3000" \
    --deployment-configuration "minimumHealthyPercent=50,maximumPercent=200" \
    --enable-execute-command \
    --region $AWS_REGION

# Check service status
aws ecs describe-services \
    --cluster $ECS_CLUSTER_NAME \
    --services $ECS_SERVICE_NAME \
    --region $AWS_REGION
```

---

## Step 12: Set Up Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/$ECS_CLUSTER_NAME/$ECS_SERVICE_NAME \
    --min-capacity 1 \
    --max-capacity 10

# Create scaling policy - Scale based on CPU utilization
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/$ECS_CLUSTER_NAME/$ECS_SERVICE_NAME \
    --policy-name nalanda-cpu-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleOutCooldown": 60,
        "ScaleInCooldown": 60
    }'

# Create scaling policy - Scale based on memory utilization
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/$ECS_CLUSTER_NAME/$ECS_SERVICE_NAME \
    --policy-name nalanda-memory-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
        },
        "ScaleOutCooldown": 60,
        "ScaleInCooldown": 60
    }'
```

---

## Monitoring and Logging

### Create CloudWatch Log Group

```bash
aws logs create-log-group \
    --log-group-name /ecs/nalanda-api \
    --region $AWS_REGION

# Set retention period (30 days)
aws logs put-retention-policy \
    --log-group-name /ecs/nalanda-api \
    --retention-in-days 30 \
    --region $AWS_REGION
```

### View Logs

```bash
# View recent logs
aws logs tail /ecs/nalanda-api --follow --region $AWS_REGION

# Get specific log stream
aws logs get-log-events \
    --log-group-name /ecs/nalanda-api \
    --log-stream-name ecs/nalanda-api/<task-id> \
    --region $AWS_REGION
```

### Create CloudWatch Alarms

```bash
# Alarm for high CPU
aws cloudwatch put-metric-alarm \
    --alarm-name nalanda-high-cpu \
    --alarm-description "Alarm when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ClusterName,Value=$ECS_CLUSTER_NAME Name=ServiceName,Value=$ECS_SERVICE_NAME \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:$AWS_REGION:$AWS_ACCOUNT_ID:nalanda-alerts

# Alarm for unhealthy tasks
aws cloudwatch put-metric-alarm \
    --alarm-name nalanda-unhealthy-tasks \
    --alarm-description "Alarm when running tasks count drops below desired" \
    --metric-name RunningTaskCount \
    --namespace AWS/ECS \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --dimensions Name=ClusterName,Value=$ECS_CLUSTER_NAME Name=ServiceName,Value=$ECS_SERVICE_NAME \
    --evaluation-periods 2
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: nalanda-api
  ECS_SERVICE: nalanda-service
  ECS_CLUSTER: nalanda-cluster
  CONTAINER_NAME: nalanda-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Download task definition
        run: |
          aws ecs describe-task-definition --task-definition nalanda-api \
            --query taskDefinition > task-definition.json

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

### Required GitHub Secrets

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## Cost Optimization

### Estimated Monthly Costs (ap-south-1)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| ECS Fargate | 2 tasks (0.25 vCPU, 0.5GB) | ~$15-20 |
| Application Load Balancer | 1 ALB | ~$16-20 |
| ECR | 2GB storage | ~$0.20 |
| CloudWatch Logs | 5GB/month | ~$2.50 |
| Secrets Manager | 3 secrets | ~$1.20 |
| **MongoDB Atlas M0** | Free tier | $0 |
| **Total** | | **~$35-45/month** |

### Cost Saving Tips

1. **Use Fargate Spot** for non-critical workloads (up to 70% savings)
2. **Right-size tasks** - Start with 0.25 vCPU, scale up if needed
3. **Use MongoDB Atlas Free Tier** for development
4. **Set log retention** to avoid excessive CloudWatch costs
5. **Use Reserved Capacity** for predictable workloads

---

## Troubleshooting

### Common Issues

#### 1. Tasks Failing to Start

```bash
# Check task stopped reason
aws ecs describe-tasks \
    --cluster $ECS_CLUSTER_NAME \
    --tasks <task-id> \
    --query 'tasks[0].stoppedReason'

# Check CloudWatch logs
aws logs tail /ecs/nalanda-api --since 1h
```

#### 2. Health Check Failures

```bash
# Verify health endpoint
curl http://$ALB_DNS/health

# Check target group health
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

#### 3. Cannot Connect to MongoDB

- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check secret values in AWS Secrets Manager
- Verify task has internet access (NAT Gateway or public IP)

#### 4. Permission Issues

```bash
# Verify IAM role policies
aws iam list-attached-role-policies --role-name ecsTaskExecutionRole
```

### Useful Commands

```bash
# List running tasks
aws ecs list-tasks --cluster $ECS_CLUSTER_NAME --service-name $ECS_SERVICE_NAME

# Force new deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --force-new-deployment

# Execute command in running container
aws ecs execute-command \
    --cluster $ECS_CLUSTER_NAME \
    --task <task-id> \
    --container nalanda-api \
    --interactive \
    --command "/bin/sh"

# Scale service manually
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --desired-count 3
```

---

## Clean Up Resources

To avoid ongoing charges, delete resources when no longer needed:

```bash
# Delete ECS Service
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --desired-count 0
aws ecs delete-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME

# Delete ECS Cluster
aws ecs delete-cluster --cluster $ECS_CLUSTER_NAME

# Delete Load Balancer
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
aws elbv2 delete-target-group --target-group-arn $TG_ARN

# Delete ECR Repository
aws ecr delete-repository --repository-name $ECR_REPO_NAME --force

# Delete Secrets
aws secretsmanager delete-secret --secret-id nalanda/mongodb-uri --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id nalanda/jwt-secret --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id nalanda/jwt-encryption-key --force-delete-without-recovery

# Delete CloudWatch Log Group
aws logs delete-log-group --log-group-name /ecs/nalanda-api
```

---

## Next Steps

1. ✅ Set up SSL/TLS with AWS Certificate Manager
2. ✅ Configure custom domain with Route 53
3. ✅ Implement blue/green deployments
4. ✅ Set up AWS WAF for security
5. ✅ Configure VPC Peering with MongoDB Atlas

---

## Support

For issues related to:
- **AWS Services**: [AWS Support](https://aws.amazon.com/support/)
- **MongoDB Atlas**: [MongoDB Support](https://www.mongodb.com/support)
- **Application**: Create an issue in the GitHub repository
