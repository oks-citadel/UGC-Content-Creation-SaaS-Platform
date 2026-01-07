# =============================================================================
# NEXUS Customer Agent - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ai/customer-agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai/customer-agent/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /app/cache /app/data && \
    chown -R nexus:nexus /app

USER nexus

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5002

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5002/health')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5002"]
