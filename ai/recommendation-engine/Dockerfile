FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download sentence transformer model at build time
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY src/ ./src/

# Create directories for embeddings cache
RUN mkdir -p /app/embeddings /app/cache

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8002/health')"

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]
