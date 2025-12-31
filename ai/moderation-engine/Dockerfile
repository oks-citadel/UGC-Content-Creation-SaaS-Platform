FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model with explicit version
RUN pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Copy application code
COPY src/ ./src/

# Create non-root user for security
RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

# Create directories for models and cache with proper ownership
RUN mkdir -p /app/models /app/cache && \
    chown -R nexus:nexus /app

# Switch to non-root user
USER nexus

# Expose port
EXPOSE 8003

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check using curl for reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003"]
