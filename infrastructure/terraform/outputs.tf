# =============================================================================
# TERRAFORM OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "s3_app_assets_bucket" {
  description = "Name of the S3 bucket for app assets"
  value       = aws_s3_bucket.app_assets.bucket
}

output "s3_kyc_documents_bucket" {
  description = "Name of the S3 bucket for KYC documents"
  value       = aws_s3_bucket.kyc_documents.bucket
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    for k, v in aws_ecr_repository.microservices : k => v.repository_url
  }
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    for k, v in aws_cloudwatch_log_group.microservices : k => v.name
  }
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

# =============================================================================
# SERVICE ENDPOINTS
# =============================================================================

output "service_endpoints" {
  description = "Service endpoint URLs"
  value = {
    api_gateway     = "https://api.${var.domain_name}"
    blockchain      = "https://api.${var.domain_name}/api/blockchain"
    trading         = "https://api.${var.domain_name}/api/trading"
    pool            = "https://api.${var.domain_name}/api/pools"
    quote           = "https://api.${var.domain_name}/api/quotes"
    wallet          = "https://api.${var.domain_name}/api/wallet"
    auth            = "https://api.${var.domain_name}/api/auth"
    security        = "https://api.${var.domain_name}/api/security"
    kyc             = "https://api.${var.domain_name}/api/kyc"
    aml             = "https://api.${var.domain_name}/api/aml"
    chart           = "https://api.${var.domain_name}/api/charts"
  }
}

# =============================================================================
# DEPLOYMENT INFORMATION
# =============================================================================

output "deployment_info" {
  description = "Deployment information"
  value = {
    region              = var.aws_region
    environment         = var.environment
    project_name        = var.project_name
    vpc_id              = aws_vpc.main.id
    cluster_name        = aws_ecs_cluster.main.name
    load_balancer_arn   = aws_lb.main.arn
    certificate_arn     = aws_acm_certificate.main.arn
    cloudfront_id       = aws_cloudfront_distribution.main.id
  }
}

# =============================================================================
# ENVIRONMENT VARIABLES FOR APPLICATIONS
# =============================================================================

output "environment_variables" {
  description = "Environment variables for application deployment"
  value = {
    # Database Configuration
    POSTGRES_HOST     = split(":", aws_db_instance.main.endpoint)[0]
    POSTGRES_PORT     = aws_db_instance.main.port
    POSTGRES_DB       = aws_db_instance.main.db_name
    POSTGRES_USER     = aws_db_instance.main.username
    
    # Redis Configuration
    REDIS_HOST        = aws_elasticache_replication_group.main.primary_endpoint_address
    REDIS_PORT        = aws_elasticache_replication_group.main.port
    
    # AWS Resources
    AWS_REGION        = var.aws_region
    S3_ASSETS_BUCKET  = aws_s3_bucket.app_assets.bucket
    S3_KYC_BUCKET     = aws_s3_bucket.kyc_documents.bucket
    
    # Service URLs
    API_BASE_URL      = "https://api.${var.domain_name}"
    CLOUDFRONT_URL    = "https://${aws_cloudfront_distribution.main.domain_name}"
    
    # Monitoring
    CLOUDWATCH_LOG_GROUP_PREFIX = "/ecs/${var.project_name}"
    SNS_ALERTS_TOPIC_ARN        = aws_sns_topic.alerts.arn
  }
  sensitive = true
}

# =============================================================================
# TERRAFORM STATE INFORMATION
# =============================================================================

output "terraform_state" {
  description = "Terraform state information"
  value = {
    workspace = terraform.workspace
    version   = "1.0.0"
    timestamp = timestamp()
    caller_identity = {
      account_id = data.aws_caller_identity.current.account_id
      arn        = data.aws_caller_identity.current.arn
      user_id    = data.aws_caller_identity.current.user_id
    }
  }
}
