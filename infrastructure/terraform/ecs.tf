# =============================================================================
# ECS TASK DEFINITIONS AND SERVICES
# =============================================================================

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks (Application Role)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# Policy for ECS tasks to access AWS services
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_assets.arn}/*",
          "${aws_s3_bucket.kyc_documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "microservices" {
  for_each = {
    blockchain = "blockchain-service"
    trading    = "trading-service"
    pool       = "pool-service"
    quote      = "quote-service"
    wallet     = "wallet-service"
    auth       = "auth-service"
    security   = "security-service"
    kyc        = "kyc-service"
    aml        = "aml-service"
    chart      = "chart-service"
  }

  name              = "/ecs/${var.project_name}/${each.value}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${each.value}-logs"
  }
}

# =============================================================================
# BLOCKCHAIN SERVICE
# =============================================================================

resource "aws_ecs_task_definition" "blockchain_service" {
  family                   = "${var.project_name}-blockchain-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "blockchain-service"
      image = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}-blockchain-service:latest"
      
      portMappings = [
        {
          containerPort = 5001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5001"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
        },
        {
          name  = "POSTGRES_URL"
          value = "postgresql://postgres:${var.db_password}@${aws_db_instance.main.endpoint}/dex_mobile"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.microservices["blockchain"].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-blockchain-service-task"
  }
}

resource "aws_ecs_service" "blockchain_service" {
  name            = "${var.project_name}-blockchain-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.blockchain_service.arn
  desired_count   = 2

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 100
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.microservices["blockchain"].arn
    container_name   = "blockchain-service"
    container_port   = 5001
  }

  depends_on = [aws_lb_listener.main]

  tags = {
    Name = "${var.project_name}-blockchain-service"
  }
}

# =============================================================================
# TRADING SERVICE
# =============================================================================

resource "aws_ecs_task_definition" "trading_service" {
  family                   = "${var.project_name}-trading-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "trading-service"
      image = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}-trading-service:latest"
      
      portMappings = [
        {
          containerPort = 5002
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5002"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
        },
        {
          name  = "POSTGRES_URL"
          value = "postgresql://postgres:${var.db_password}@${aws_db_instance.main.endpoint}/dex_mobile"
        },
        {
          name  = "BLOCKCHAIN_SERVICE_URL"
          value = "http://${aws_lb.main.dns_name}/api/blockchain"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.microservices["trading"].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5002/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-trading-service-task"
  }
}

resource "aws_ecs_service" "trading_service" {
  name            = "${var.project_name}-trading-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.trading_service.arn
  desired_count   = 2

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 100
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.microservices["trading"].arn
    container_name   = "trading-service"
    container_port   = 5002
  }

  depends_on = [aws_lb_listener.main]

  tags = {
    Name = "${var.project_name}-trading-service"
  }
}
