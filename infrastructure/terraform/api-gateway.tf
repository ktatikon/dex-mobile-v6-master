# =============================================================================
# APPLICATION LOAD BALANCER LISTENERS
# =============================================================================

# SSL Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "ws.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-certificate"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = jsonencode({
        message = "DEX Mobile v6 API Gateway"
        version = "1.0.0"
        status  = "healthy"
      })
      status_code = "200"
    }
  }

  tags = {
    Name = "${var.project_name}-https-listener"
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.project_name}-http-redirect-listener"
  }
}

# =============================================================================
# LISTENER RULES FOR MICROSERVICES ROUTING
# =============================================================================

# Blockchain Service Routes
resource "aws_lb_listener_rule" "blockchain_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["blockchain"].arn
  }

  condition {
    path_pattern {
      values = ["/api/blockchain/*", "/blockchain/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-blockchain-service-rule"
  }
}

# Trading Service Routes
resource "aws_lb_listener_rule" "trading_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 110

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["trading"].arn
  }

  condition {
    path_pattern {
      values = ["/api/trading/*", "/trading/*", "/api/swap/*", "/swap/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-trading-service-rule"
  }
}

# Pool Service Routes
resource "aws_lb_listener_rule" "pool_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 120

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["pool"].arn
  }

  condition {
    path_pattern {
      values = ["/api/pools/*", "/pools/*", "/api/liquidity/*", "/liquidity/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-pool-service-rule"
  }
}

# Quote Service Routes
resource "aws_lb_listener_rule" "quote_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 130

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["quote"].arn
  }

  condition {
    path_pattern {
      values = ["/api/quotes/*", "/quotes/*", "/api/prices/*", "/prices/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-quote-service-rule"
  }
}

# Wallet Service Routes
resource "aws_lb_listener_rule" "wallet_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 140

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["wallet"].arn
  }

  condition {
    path_pattern {
      values = ["/api/wallet/*", "/wallet/*", "/api/wallets/*", "/wallets/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-wallet-service-rule"
  }
}

# Auth Service Routes
resource "aws_lb_listener_rule" "auth_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 150

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["auth"].arn
  }

  condition {
    path_pattern {
      values = ["/api/auth/*", "/auth/*", "/api/login/*", "/login/*", "/api/register/*", "/register/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-auth-service-rule"
  }
}

# Security Service Routes
resource "aws_lb_listener_rule" "security_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 160

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["security"].arn
  }

  condition {
    path_pattern {
      values = ["/api/security/*", "/security/*", "/api/mfa/*", "/mfa/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-security-service-rule"
  }
}

# KYC Service Routes
resource "aws_lb_listener_rule" "kyc_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 170

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["kyc"].arn
  }

  condition {
    path_pattern {
      values = ["/api/kyc/*", "/kyc/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-kyc-service-rule"
  }
}

# AML Service Routes
resource "aws_lb_listener_rule" "aml_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 180

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["aml"].arn
  }

  condition {
    path_pattern {
      values = ["/api/aml/*", "/aml/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-aml-service-rule"
  }
}

# Chart Service Routes
resource "aws_lb_listener_rule" "chart_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 190

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.microservices["chart"].arn
  }

  condition {
    path_pattern {
      values = ["/api/charts/*", "/charts/*", "/api/market-data/*", "/market-data/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-chart-service-rule"
  }
}

# =============================================================================
# CLOUDFRONT DISTRIBUTION
# =============================================================================

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "${var.project_name}-alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled = true
  comment = "DEX Mobile v6 API Distribution"

  aliases = ["api.${var.domain_name}"]

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "X-Forwarded-For"]

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 86400
  }

  # Cache behavior for API endpoints (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project_name}-cloudfront"
  }
}
