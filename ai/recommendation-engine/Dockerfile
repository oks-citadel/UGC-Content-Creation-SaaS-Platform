# =============================================================================
# NEXUS Recommendation Engine - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

COPY ai/recommendation-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('all-MiniLM-L6-v2')"

COPY ai/recommendation-engine/src/ ./src/

RUN groupadd --system --gid 1001 nexus && \
    useradd --system --uid 1001 --gid nexus nexus

RUN mkdir -p /app/embeddings /app/cache && \
    chown -R nexus:nexus /app

USER nexus

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=5006

EXPOSE 5006

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5006/health')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5006"]
