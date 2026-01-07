# =============================================================================
# NEXUS Marketing Agent - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY ai/marketing-agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai/marketing-agent/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /app/cache && \
    chown -R nexus:nexus /app

USER nexus

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5003

EXPOSE 5003

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5003/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5003"]
