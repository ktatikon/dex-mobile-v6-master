# 🚀 DEX Mobile v6 - AWS Cloud Deployment Guide

## 📋 Overview

This comprehensive guide provides step-by-step instructions for deploying the DEX Mobile v6 microservices architecture to AWS cloud infrastructure using a hybrid approach with EC2, ECS, and EKS services.

## 🏗️ Architecture Summary

### Service Distribution
- **EKS**: blockchain-service (high-scale, complex networking)
- **ECS**: kyc-service, aml-service, chart-api-service (moderate scale)
- **EC2**: monitoring-service, Prometheus, Grafana (persistent monitoring)
- **Managed Services**: RDS PostgreSQL, ElastiCache Redis

## 📋 Prerequisites

### Required Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Install Docker
sudo yum update -y && sudo yum install -y docker
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -a -G docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### AWS Account Setup
```bash
# Configure AWS CLI
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-west-2
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

## 🔧 Phase 1: Infrastructure Setup (Week 1)

### Step 1.1: VPC and Networking
```bash
# Deploy VPC infrastructure
aws cloudformation create-stack \
  --stack-name dex-vpc-infrastructure \
  --template-body file://aws/shared/vpc-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=VPCCidr,ParameterValue=10.0.0.0/16 \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name dex-vpc-infrastructure
```

### Step 1.2: Managed Services (RDS & ElastiCache)
```bash
# Deploy database infrastructure
aws cloudformation create-stack \
  --stack-name dex-database-infrastructure \
  --template-body file://aws/shared/database-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=VPCId,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' --output text) \
               ParameterKey=PrivateSubnetIds,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text) \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name dex-database-infrastructure
```

### Step 1.3: Secrets Management
```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "dex-mobile-database" \
  --description "Database credentials for DEX Mobile" \
  --secret-string '{"username":"postgres","password":"your-secure-password"}'

aws secretsmanager create-secret \
  --name "dex-mobile-redis" \
  --description "Redis credentials for DEX Mobile" \
  --secret-string '{"password":"your-redis-password"}'

aws secretsmanager create-secret \
  --name "dex-mobile-supabase" \
  --description "Supabase credentials for DEX Mobile" \
  --secret-string '{"url":"your-supabase-url","service_role_key":"your-service-role-key"}'

aws secretsmanager create-secret \
  --name "dex-mobile-idfy" \
  --description "IDfy API credentials for KYC" \
  --secret-string '{"api_key":"your-idfy-api-key","account_id":"your-account-id"}'

aws secretsmanager create-secret \
  --name "dex-mobile-encryption" \
  --description "Encryption keys for DEX Mobile" \
  --secret-string '{"encryption_key":"your-32-character-encryption-key","jwt_secret":"your-jwt-secret"}'
```

## 🐳 Phase 2: Container Services Deployment (Week 2)

### Step 2.1: ECR Repository Setup
```bash
# Create ECR repositories for each service
services=("blockchain-service" "kyc-service" "aml-service" "chart-api-service" "monitoring-service")

for service in "${services[@]}"; do
  aws ecr create-repository \
    --repository-name "dex-mobile/$service" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
done

# Get ECR login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com
```

### Step 2.2: Build and Push Container Images
```bash
# Build and push each service
cd /path/to/dex-mobile-v6-master

# Blockchain Service
docker build -t dex-blockchain-service ./microservices/blockchain-service
docker tag dex-blockchain-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/blockchain-service:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/blockchain-service:latest

# KYC Service
docker build -t dex-kyc-service ./microservices/kyc-service
docker tag dex-kyc-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/kyc-service:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/kyc-service:latest

# AML Service
docker build -t dex-aml-service ./microservices/aml-service
docker tag dex-aml-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/aml-service:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/aml-service:latest

# Chart API Service
docker build -t dex-chart-api-service ./microservices/chart-api-service
docker tag dex-chart-api-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/chart-api-service:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/chart-api-service:latest

# Monitoring Service
docker build -t dex-monitoring-service ./microservices/monitoring-service
docker tag dex-monitoring-service:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/monitoring-service:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile/monitoring-service:latest
```

### Step 2.3: ECS Cluster Deployment
```bash
# Deploy ECS infrastructure
aws cloudformation create-stack \
  --stack-name dex-ecs-infrastructure \
  --template-body file://aws/ecs/ecs-deployment.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=VPCId,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' --output text) \
               ParameterKey=PrivateSubnetIds,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text) \
               ParameterKey=PublicSubnetIds,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnetIds`].OutputValue' --output text) \
               ParameterKey=ECRRepositoryURI,ParameterValue=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com/dex-mobile \
               ParameterKey=DatabaseEndpoint,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-database-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text) \
               ParameterKey=RedisEndpoint,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-database-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text) \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name dex-ecs-infrastructure
```

### Step 2.4: EKS Cluster Deployment
```bash
# Deploy EKS infrastructure
aws cloudformation create-stack \
  --stack-name dex-eks-infrastructure \
  --template-body file://aws/eks/eks-deployment.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=VPCId,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' --output text) \
               ParameterKey=PrivateSubnetIds,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text) \
               ParameterKey=NodeInstanceType,ParameterValue=t3.medium \
               ParameterKey=MinNodes,ParameterValue=2 \
               ParameterKey=MaxNodes,ParameterValue=10 \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name dex-eks-infrastructure

# Configure kubectl
aws eks update-kubeconfig \
  --region us-west-2 \
  --name production-dex-eks-cluster

# Verify cluster access
kubectl get nodes
```

### Step 2.5: Deploy Blockchain Service to EKS
```bash
# Update image URI in Kubernetes manifest
sed -i "s|your-account.dkr.ecr.region.amazonaws.com|$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com|g" aws/eks/blockchain-service-k8s.yaml

# Deploy blockchain service
kubectl apply -f aws/eks/blockchain-service-k8s.yaml

# Verify deployment
kubectl get pods -n dex-blockchain
kubectl get services -n dex-blockchain
```

## 🖥️ Phase 3: EC2 Monitoring Stack (Week 2)

### Step 3.1: Deploy EC2 Monitoring Infrastructure
```bash
# Deploy EC2 monitoring stack
aws cloudformation create-stack \
  --stack-name dex-ec2-monitoring \
  --template-body file://aws/ec2/ec2-deployment.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=VPCId,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' --output text) \
               ParameterKey=PrivateSubnetIds,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-vpc-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnetIds`].OutputValue' --output text) \
               ParameterKey=InstanceType,ParameterValue=t3.medium \
  --capabilities CAPABILITY_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name dex-ec2-monitoring
```

## 📊 Phase 4: Monitoring and Observability Setup

### Step 4.1: Configure Monitoring Stack
```bash
# SSH into monitoring instance
MONITORING_INSTANCE_IP=$(aws cloudformation describe-stacks \
  --stack-name dex-ec2-monitoring \
  --query 'Stacks[0].Outputs[?OutputKey==`MonitoringInstanceIP`].OutputValue' \
  --output text)

ssh -i your-key-pair.pem ec2-user@$MONITORING_INSTANCE_IP

# On the monitoring instance
cd /opt/dex-mobile

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services
docker-compose -f docker-compose.monitoring.yml ps
```

### Step 4.2: Configure Grafana Dashboards
```bash
# Access Grafana at http://monitoring-alb-dns:3000
# Default credentials: admin/admin123

# Import pre-configured dashboards
curl -X POST \
  http://admin:admin123@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @aws/monitoring/grafana/dashboards/dex-overview.json
```

## 🔐 Phase 5: Security and Compliance

### Step 5.1: Configure WAF
```bash
# Deploy WAF for application protection
aws cloudformation create-stack \
  --stack-name dex-waf-protection \
  --template-body file://aws/shared/waf-configuration.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=ALBArn,ParameterValue=$(aws cloudformation describe-stacks --stack-name dex-ecs-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerArn`].OutputValue' --output text) \
  --capabilities CAPABILITY_IAM
```

### Step 5.2: Enable CloudTrail and Config
```bash
# Enable AWS CloudTrail for audit logging
aws cloudformation create-stack \
  --stack-name dex-compliance-logging \
  --template-body file://aws/shared/compliance-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_IAM
```

## 🧪 Phase 6: Testing and Validation

### Step 6.1: Health Check Validation
```bash
# Test ECS services
ECS_ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name dex-ecs-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
  --output text)

curl -f http://$ECS_ALB_DNS/api/kyc/health
curl -f http://$ECS_ALB_DNS/api/aml/health
curl -f http://$ECS_ALB_DNS/api/v1/chart/health

# Test EKS service
EKS_SERVICE_URL=$(kubectl get service blockchain-service -n dex-blockchain -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -f http://$EKS_SERVICE_URL/health

# Test monitoring
MONITORING_ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name dex-ec2-monitoring \
  --query 'Stacks[0].Outputs[?OutputKey==`MonitoringALBDNS`].OutputValue' \
  --output text)

curl -f http://$MONITORING_ALB_DNS:3001/health
curl -f http://$MONITORING_ALB_DNS:9090/-/healthy
curl -f http://$MONITORING_ALB_DNS:3000/api/health
```

### Step 6.2: Load Testing
```bash
# Install Apache Bench for load testing
sudo yum install -y httpd-tools

# Test KYC service
ab -n 1000 -c 10 http://$ECS_ALB_DNS/api/kyc/health

# Test Chart API service
ab -n 1000 -c 20 http://$ECS_ALB_DNS/api/v1/chart/health

# Test Blockchain service
ab -n 500 -c 5 http://$EKS_SERVICE_URL/health
```

## 🚨 Troubleshooting Common Issues

### Issue 1: ECS Service Not Starting
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster production-dex-cluster \
  --services production-dex-kyc-service \
  --query 'services[0].events'

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/production-dex"
aws logs get-log-events \
  --log-group-name "/ecs/production-dex-kyc-service" \
  --log-stream-name "ecs/kyc-service/task-id"
```

### Issue 2: EKS Pods Not Scheduling
```bash
# Check pod status
kubectl get pods -n dex-blockchain -o wide

# Describe pod for events
kubectl describe pod <pod-name> -n dex-blockchain

# Check node resources
kubectl top nodes
kubectl describe nodes
```

### Issue 3: Database Connection Issues
```bash
# Test database connectivity from ECS task
aws ecs run-task \
  --cluster production-dex-cluster \
  --task-definition production-dex-kyc-service \
  --overrides '{
    "containerOverrides": [{
      "name": "kyc-service",
      "command": ["sh", "-c", "pg_isready -h $DATABASE_ENDPOINT -p 5432"]
    }]
  }'
```

### Issue 4: Monitoring Stack Issues
```bash
# Check monitoring instance logs
ssh -i your-key-pair.pem ec2-user@$MONITORING_INSTANCE_IP
sudo journalctl -u docker -f

# Check container logs
docker logs dex-prometheus
docker logs dex-grafana
docker logs dex-monitoring-service
```

## 📈 Performance Optimization

### Auto Scaling Configuration
```bash
# Configure ECS auto scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/production-dex-cluster/production-dex-kyc-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Configure EKS auto scaling (already configured in Kubernetes manifests)
kubectl get hpa -n dex-blockchain
```

### Database Performance Tuning
```bash
# Enable Performance Insights for RDS
aws rds modify-db-instance \
  --db-instance-identifier production-dex-postgres \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

## 🔄 CI/CD Pipeline Setup

### Step 1: Create CodePipeline
```bash
# Deploy CI/CD infrastructure
aws cloudformation create-stack \
  --stack-name dex-cicd-pipeline \
  --template-body file://aws/shared/cicd-pipeline.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=GitHubRepo,ParameterValue=ktatikon/dex-mobile-v6-master \
               ParameterKey=GitHubBranch,ParameterValue=master \
  --capabilities CAPABILITY_IAM
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review CloudWatch metrics and alerts
2. **Monthly**: Update container images and security patches
3. **Quarterly**: Review and optimize costs
4. **Annually**: Security audit and compliance review

### Monitoring Dashboards
- **Grafana**: http://monitoring-alb-dns:3000
- **Prometheus**: http://monitoring-alb-dns:9090
- **CloudWatch**: AWS Console → CloudWatch

### Log Locations
- **ECS Logs**: CloudWatch Logs → /ecs/production-dex-*
- **EKS Logs**: CloudWatch Logs → /aws/eks/production-dex-eks-cluster
- **EC2 Logs**: CloudWatch Logs → /aws/ec2/dex-mobile

---

**🎉 Deployment Complete!** Your DEX Mobile v6 application is now running on AWS with enterprise-grade scalability, security, and monitoring.
