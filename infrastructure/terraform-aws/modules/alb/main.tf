# =============================================================================
# Application Load Balancer Module
# =============================================================================
# This module creates a shared ALB for all ECS services with path-based
# routing to direct traffic to appropriate target groups.
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod"
  enable_http2               = true
  idle_timeout               = var.idle_timeout

  access_logs {
    bucket  = var.logs_bucket
    prefix  = "alb"
    enabled = var.enable_access_logs
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-alb"
    Environment = var.environment
    Project     = var.project
  })
}

# -----------------------------------------------------------------------------
# ALB Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.environment}-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTP from anywhere (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-alb-sg"
    Environment = var.environment
    Project     = var.project
  })

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# HTTPS Listener
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.default.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-https-listener"
  })
}

# -----------------------------------------------------------------------------
# HTTP Listener (Redirect to HTTPS)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-http-listener"
  })
}

# -----------------------------------------------------------------------------
# Default Target Group (404 fallback)
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "default" {
  name        = "${var.project}-${var.environment}-default"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-404"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-default-tg"
    Environment = var.environment
    Project     = var.project
  })
}

# -----------------------------------------------------------------------------
# Service Target Groups
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "services" {
  for_each = var.services

  name        = "${var.project}-${var.environment}-${each.key}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = each.value.health_check_interval
    matcher             = each.value.health_check_matcher
    path                = each.value.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = each.value.health_check_timeout
    unhealthy_threshold = 3
  }

  deregistration_delay = each.value.deregistration_delay

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = each.value.stickiness_enabled
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-${each.key}-tg"
    Environment = var.environment
    Project     = var.project
    Service     = each.key
  })

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Path-Based Listener Rules
# -----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "services" {
  for_each = var.services

  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-rule"
    Service = each.key
  })
}

# -----------------------------------------------------------------------------
# Host-Based Listener Rules (for subdomains)
# -----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "hosts" {
  for_each = var.host_rules

  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.value.target_service].arn
  }

  condition {
    host_header {
      values = each.value.host_headers
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-${each.key}-host-rule"
  })
}
