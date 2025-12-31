FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download pre-trained models at build time
RUN python -c "from transformers import CLIPProcessor, CLIPModel; \
    CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); \
    CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')"

# Copy application code
COPY src/ ./src/

# Create non-root user for security
RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

# Create directories for models with proper ownership
RUN mkdir -p /app/models /app/cache && \
    chown -R nexus:nexus /app

# Switch to non-root user
USER nexus

# Expose port
EXPOSE 8001

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')"

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
