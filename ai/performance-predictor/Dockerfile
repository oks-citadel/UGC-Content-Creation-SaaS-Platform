# =============================================================================
# NEXUS Performance Predictor - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ai/performance-predictor/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from transformers import CLIPProcessor, CLIPModel; \
    CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); \
    CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')"

COPY ai/performance-predictor/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /app/models /app/cache && \
    chown -R nexus:nexus /app

USER nexus

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5005

EXPOSE 5005

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5005/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5005"]
