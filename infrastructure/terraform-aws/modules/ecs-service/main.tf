# =============================================================================
# ECS Service Module
# =============================================================================
# This is a reusable module for deploying services to ECS Fargate.
# It creates a task definition and service with auto-scaling.
# =============================================================================

data "aws_region" "current" {}

locals {
  container_name = var.service_name

  # Build container definitions
  container_definitions = [
    {
      name      = local.container_name
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          name          = var.service_name
          containerPort = var.container_port
          protocol      = "tcp"
          appProtocol   = "http"
        }
      ]

      environment = [
        for k, v in var.environment_variables : {
          name  = k
          value = v
        }
      ]

      secrets = [
        for k, v in var.secrets : {
          name      = k
          valueFrom = v
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = var.enable_container_health_check ? {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${var.container_port}${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = var.health_check_start_period
      } : null

      linuxParameters = {
        initProcessEnabled = true
      }

      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
    }
  ]
}

# -----------------------------------------------------------------------------
# Task Definition
# -----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project}-${var.service_name}-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode(local.container_definitions)

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.service_name}-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Service     = var.service_name
  })
}

# -----------------------------------------------------------------------------
# ECS Service
# -----------------------------------------------------------------------------
resource "aws_ecs_service" "main" {
  name                              = var.service_name
  cluster                           = var.cluster_arn
  task_definition                   = aws_ecs_task_definition.main.arn
  desired_count                     = var.desired_count
  launch_type                       = var.use_spot ? null : "FARGATE"
  platform_version                  = var.platform_version
  health_check_grace_period_seconds = var.health_check_grace_period
  enable_execute_command            = var.enable_execute_command
  propagate_tags                    = "SERVICE"
  enable_ecs_managed_tags           = true

  # Capacity provider strategy (for Spot support)
  dynamic "capacity_provider_strategy" {
    for_each = var.use_spot ? [1] : []
    content {
      capacity_provider = "FARGATE"
      weight            = var.spot_weight_fargate
      base              = var.spot_base_fargate
    }
  }

  dynamic "capacity_provider_strategy" {
    for_each = var.use_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = var.spot_weight_spot
    }
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  # ALB integration
  dynamic "load_balancer" {
    for_each = var.target_group_arn != "" ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = local.container_name
      container_port   = var.container_port
    }
  }

  # Service Connect
  dynamic "service_connect_configuration" {
    for_each = var.enable_service_connect ? [1] : []
    content {
      enabled   = true
      namespace = var.service_connect_namespace_arn

      service {
        port_name      = var.service_name
        discovery_name = var.service_name

        client_alias {
          port     = var.container_port
          dns_name = var.service_name
        }
      }
    }
  }

  deployment_maximum_percent         = var.deployment_maximum_percent
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [
      desired_count, # Allow auto-scaling to manage this
    ]
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.service_name}-${var.environment}"
    Environment = var.environment
    Project     = var.project
    Service     = var.service_name
  })
}

# -----------------------------------------------------------------------------
# Auto Scaling
# -----------------------------------------------------------------------------
resource "aws_appautoscaling_target" "main" {
  count = var.enable_autoscaling ? 1 : 0

  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${var.cluster_name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based scaling
resource "aws_appautoscaling_policy" "cpu" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${var.project}-${var.service_name}-${var.environment}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Memory-based scaling
resource "aws_appautoscaling_policy" "memory" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${var.project}-${var.service_name}-${var.environment}-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.memory_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

# Request count scaling (for ALB-connected services)
resource "aws_appautoscaling_policy" "requests" {
  count = var.enable_autoscaling && var.target_group_arn != "" ? 1 : 0

  name               = "${var.project}-${var.service_name}-${var.environment}-requests"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.requests_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = var.alb_resource_label
    }
  }
}
