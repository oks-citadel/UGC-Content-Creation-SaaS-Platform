# =============================================================================
# NEXUS Video Generator - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ai/video-generator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai/video-generator/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /tmp/video-generator && \
    chown -R nexus:nexus /app /tmp/video-generator

USER nexus

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5007

EXPOSE 5007

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5007/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5007"]
