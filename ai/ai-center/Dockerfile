# =============================================================================
# NEXUS AI Center - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ai/ai-center/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai/ai-center/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /app/cache /app/models && \
    chown -R nexus:nexus /app

USER nexus

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5001

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5001"]
