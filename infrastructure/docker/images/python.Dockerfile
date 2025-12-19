# =============================================================================
# NEXUS Platform - Base Python Image
# =============================================================================
# Multi-stage base image for Python AI services
# =============================================================================

# Development stage
FROM python:3.11-slim AS development

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    wget \
    git \
    libmagic1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install common Python packages
RUN pip install --upgrade pip setuptools wheel

# Create non-root user
RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus --create-home nexus

# Set ownership
RUN chown -R nexus:nexus /app

USER nexus

# Default development command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =============================================================================
# Builder stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --user --no-warn-script-location -r requirements.txt

# =============================================================================
# Production runner stage
FROM python:3.11-slim AS runner

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH=/home/nexus/.local/bin:$PATH

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    libgomp1 \
    curl \
    wget \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus --create-home nexus

# Copy Python packages from builder
COPY --from=builder --chown=nexus:nexus /root/.local /home/nexus/.local

# Copy application code
COPY --chown=nexus:nexus . .

# Set ownership
RUN chown -R nexus:nexus /app

USER nexus

# Use tini as init system
ENTRYPOINT ["/usr/bin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
