#!/bin/bash

# =============================================================================
# DEX Mobile v6 - Microservices Deployment Script
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="dex-mobile-v6"
AWS_REGION="ap-south-1"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Services to deploy
SERVICES=(
    "blockchain-service"
    "trading-service"
    "pool-service"
    "quote-service"
    "wallet-service"
    "auth-service"
    "security-service"
)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    # Load environment variables from .env file if it exists
    if [ -f ".env.${ENVIRONMENT}" ]; then
        export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
        log_success "Environment variables loaded from .env.${ENVIRONMENT}"
    else
        log_warning ".env.${ENVIRONMENT} file not found. Using default values."
    fi
    
    # Set default values if not provided
    export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
    export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
    log_info "ECR Registry: ${ECR_REGISTRY}"
}

create_ecr_repositories() {
    log_info "Creating ECR repositories..."
    
    for service in "${SERVICES[@]}"; do
        REPO_NAME="${PROJECT_NAME}-${service}"
        
        # Check if repository exists
        if aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${AWS_REGION}" &> /dev/null; then
            log_info "ECR repository ${REPO_NAME} already exists"
        else
            log_info "Creating ECR repository: ${REPO_NAME}"
            aws ecr create-repository \
                --repository-name "${REPO_NAME}" \
                --region "${AWS_REGION}" \
                --image-scanning-configuration scanOnPush=true \
                --encryption-configuration encryptionType=AES256
            
            # Set lifecycle policy
            aws ecr put-lifecycle-policy \
                --repository-name "${REPO_NAME}" \
                --region "${AWS_REGION}" \
                --lifecycle-policy-text '{
                    "rules": [
                        {
                            "rulePriority": 1,
                            "description": "Keep last 10 images",
                            "selection": {
                                "tagStatus": "tagged",
                                "tagPrefixList": ["v"],
                                "countType": "imageCountMoreThan",
                                "countNumber": 10
                            },
                            "action": {
                                "type": "expire"
                            }
                        }
                    ]
                }'
            
            log_success "ECR repository ${REPO_NAME} created"
        fi
    done
}

build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
    
    for service in "${SERVICES[@]}"; do
        if [ -d "microservices/${service}" ]; then
            log_info "Building ${service}..."
            
            REPO_NAME="${PROJECT_NAME}-${service}"
            IMAGE_TAG="${ECR_REGISTRY}/${REPO_NAME}:latest"
            
            # Build Docker image
            docker build \
                --target production \
                --tag "${IMAGE_TAG}" \
                --build-arg NODE_ENV=production \
                "microservices/${service}"
            
            # Push to ECR
            docker push "${IMAGE_TAG}"
            
            log_success "${service} image built and pushed"
        else
            log_warning "Service directory microservices/${service} not found, skipping..."
        fi
    done
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f "terraform.tfvars" ]; then
        log_info "Creating terraform.tfvars file..."
        cat > terraform.tfvars << EOF
aws_region = "${AWS_REGION}"
environment = "${ENVIRONMENT}"
project_name = "${PROJECT_NAME}"
domain_name = "${DOMAIN_NAME:-dex-mobile.com}"
db_password = "${DB_PASSWORD:-$(openssl rand -base64 32)}"
redis_auth_token = "${REDIS_AUTH_TOKEN:-$(openssl rand -base64 32)}"
jwt_secret = "${JWT_SECRET:-$(openssl rand -base64 64)}"
encryption_key = "${ENCRYPTION_KEY:-$(openssl rand -base64 32)}"
alert_email = "${ALERT_EMAIL:-admin@techvitta.com}"
EOF
        log_success "terraform.tfvars created"
    fi
    
    # Plan and apply
    terraform plan -out=tfplan
    terraform apply -auto-approve tfplan
    
    # Save outputs
    terraform output -json > terraform-outputs.json
    
    cd ../..
    
    log_success "Infrastructure deployed successfully"
}

update_ecs_services() {
    log_info "Updating ECS services..."
    
    CLUSTER_NAME="${PROJECT_NAME}-cluster"
    
    for service in "${SERVICES[@]}"; do
        SERVICE_NAME="${PROJECT_NAME}-${service}"
        
        # Check if service exists
        if aws ecs describe-services \
            --cluster "${CLUSTER_NAME}" \
            --services "${SERVICE_NAME}" \
            --region "${AWS_REGION}" &> /dev/null; then
            
            log_info "Updating ECS service: ${SERVICE_NAME}"
            
            # Force new deployment
            aws ecs update-service \
                --cluster "${CLUSTER_NAME}" \
                --service "${SERVICE_NAME}" \
                --force-new-deployment \
                --region "${AWS_REGION}" > /dev/null
            
            log_success "ECS service ${SERVICE_NAME} updated"
        else
            log_warning "ECS service ${SERVICE_NAME} not found, skipping..."
        fi
    done
}

wait_for_deployments() {
    log_info "Waiting for deployments to complete..."
    
    CLUSTER_NAME="${PROJECT_NAME}-cluster"
    
    for service in "${SERVICES[@]}"; do
        SERVICE_NAME="${PROJECT_NAME}-${service}"
        
        if aws ecs describe-services \
            --cluster "${CLUSTER_NAME}" \
            --services "${SERVICE_NAME}" \
            --region "${AWS_REGION}" &> /dev/null; then
            
            log_info "Waiting for ${SERVICE_NAME} to stabilize..."
            
            aws ecs wait services-stable \
                --cluster "${CLUSTER_NAME}" \
                --services "${SERVICE_NAME}" \
                --region "${AWS_REGION}"
            
            log_success "${SERVICE_NAME} deployment completed"
        fi
    done
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Get API Gateway URL from Terraform outputs
    if [ -f "infrastructure/terraform/terraform-outputs.json" ]; then
        API_URL=$(jq -r '.service_endpoints.value.api_gateway' infrastructure/terraform/terraform-outputs.json)
        
        for service in "${SERVICES[@]}"; do
            HEALTH_URL="${API_URL}/api/${service}/health"
            
            log_info "Checking health of ${service}..."
            
            # Retry health check up to 5 times
            for i in {1..5}; do
                if curl -f -s "${HEALTH_URL}" > /dev/null; then
                    log_success "${service} health check passed"
                    break
                else
                    if [ $i -eq 5 ]; then
                        log_error "${service} health check failed after 5 attempts"
                        exit 1
                    else
                        log_warning "${service} health check failed, retrying in 30 seconds..."
                        sleep 30
                    fi
                fi
            done
        done
    else
        log_warning "Terraform outputs not found, skipping health checks"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove temporary Docker images
    docker system prune -f
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting DEX Mobile v6 Microservices Deployment"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "AWS Region: ${AWS_REGION}"
    
    check_prerequisites
    setup_environment
    create_ecr_repositories
    build_and_push_images
    deploy_infrastructure
    update_ecs_services
    wait_for_deployments
    run_health_checks
    cleanup
    
    log_success "🚀 Deployment completed successfully!"
    log_info "API Gateway URL: $(jq -r '.service_endpoints.value.api_gateway' infrastructure/terraform/terraform-outputs.json 2>/dev/null || echo 'Check Terraform outputs')"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
