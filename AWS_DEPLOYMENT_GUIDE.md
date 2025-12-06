# AWS ECS Deployment Guide for Nalanda Library API

This guide outlines the steps for deploying the Nalanda Library Management System API to AWS using ECS (Elastic Container Service) with Fargate.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Steps](#deployment-steps)
4. [MongoDB Atlas Setup](#mongodb-atlas-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Cost Estimation](#cost-estimation)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI v2 installed and configured
- Docker installed locally
- MongoDB Atlas account (for production database)
- Domain name (optional, for custom domain)

---

## Architecture Overview

```
                            AWS Cloud
    ┌────────────────────────────────────────────────────────┐
    │                         VPC                            │
    │   ┌──────────────┐         ┌──────────────┐           │
    │   │Public Subnet │         │Public Subnet │           │
    │   │   (AZ-1a)    │         │   (AZ-1b)    │           │
    │   │     ALB      │         │     ALB      │           │
    │   └──────┬───────┘         └──────┬───────┘           │
    │          │                        │                    │
    │   ┌──────┴───────┐         ┌──────┴───────┐           │
    │   │Private Subnet│         │Private Subnet│           │
    │   │   (AZ-1a)    │         │   (AZ-1b)    │           │
    │   │ ECS Fargate  │         │ ECS Fargate  │           │
    │   │    Task      │         │    Task      │           │
    │   └──────────────┘         └──────────────┘           │
    └────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  MongoDB Atlas  │
                   │   (External)    │
                   └─────────────────┘
```

**Components:**
- Application Load Balancer (ALB) - Distributes traffic across ECS tasks
- ECS Fargate - Serverless container orchestration
- ECR - Container registry for Docker images
- Secrets Manager - Secure storage for credentials
- CloudWatch - Logging and monitoring
- MongoDB Atlas - Managed database service

---

## Deployment Steps

1. Configure AWS CLI with credentials and default region
2. Create ECR repository for Docker images
3. Build and push Docker image to ECR
4. Store secrets in AWS Secrets Manager (MongoDB URI, JWT keys)
5. Create IAM roles with ECS and Secrets Manager permissions
6. Set up VPC networking with public/private subnets and security groups
7. Create ECS Fargate cluster
8. Register task definition using `aws/task-definition.json`
9. Create Application Load Balancer with target group
10. Create ECS service with load balancer integration
11. Configure auto scaling policies
12. Set up CloudWatch logging and alarms

---

## MongoDB Atlas Setup

1. Create MongoDB Atlas account and cluster (M0 free tier or M10+ for production)
2. Create database user with read/write privileges
3. Configure network access (whitelist IPs or allow all for ECS)
4. Get connection string and store in AWS Secrets Manager

---

## CI/CD Pipeline

GitHub Actions workflow provided at `.github/workflows/deploy.yml`

Pipeline: Test → Build → Push to ECR → Update task definition → Deploy to ECS

Required GitHub Secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

---

## Cost Estimation

Estimated monthly cost for ap-south-1: $35-45

- ECS Fargate (2 tasks): $15-20
- Application Load Balancer: $16-20
- ECR, CloudWatch, Secrets Manager: ~$4
- MongoDB Atlas M0: Free

---

## Troubleshooting

**Tasks failing:** Check stopped reason and CloudWatch logs

**Health check failures:** Verify /health endpoint and security group rules

**MongoDB connection issues:** Check Atlas IP whitelist and secrets configuration

**Permission issues:** Verify IAM role policies

---

## Clean Up

Delete resources in order: ECS Service → Cluster → Load Balancer → ECR → Secrets → CloudWatch Logs → IAM Roles
