# NEXUS AI Services

AI-powered microservices for the NEXUS UGC Content Creation Platform.

## Services Overview

### 1. Video Generator Service (Port 8000)
AI-powered UGC video generation from images, scripts, and templates.

**Capabilities:**
- Generate complete UGC videos from images + script + voice
- Create multiple video variants for A/B testing
- Add captions with custom styling
- Add background music with beat synchronization
- Apply professional video templates
- Support multiple aspect ratios (vertical, square, horizontal)

**Key Endpoints:**
- `POST /generate` - Generate a complete UGC video
- `POST /variants` - Generate multiple variants for testing
- `POST /captions` - Add captions to existing video
- `POST /music` - Add background music
- `GET /templates` - List available templates

**Tech Stack:**
- FastAPI
- FFmpeg for video processing
- OpenAI TTS for voiceover
- Replicate for AI video generation
- Pillow for image processing

### 2. Performance Predictor Service (Port 8001)
Predict content performance before publishing using ML models.

**Capabilities:**
- Predict engagement metrics (views, likes, comments, shares)
- Calculate viral potential scores
- Analyze content quality (visual, emotional, trending alignment)
- Generate optimization suggestions
- Compare variants to determine best performer

**Key Endpoints:**
- `POST /predict` - Predict engagement and performance
- `POST /predict/virality` - Predict viral potential
- `POST /optimize` - Get optimization suggestions
- `POST /compare` - Compare two variants

**Tech Stack:**
- FastAPI
- PyTorch + Transformers (CLIP model)
- scikit-learn for ML models
- OpenAI for advanced analysis

### 3. Recommendation Engine Service (Port 8002)
Match creators to campaigns and content to products using semantic search.

**Capabilities:**
- Match creators to campaigns based on audience, style, performance
- Match content to products for optimal placement
- Find similar creators using vector similarity
- Identify trending content in real-time

**Key Endpoints:**
- `POST /match/creators` - Match creators to campaign
- `POST /match/content` - Match content to products
- `GET /similar/{creator_id}` - Find similar creators
- `GET /trending` - Get trending content

**Tech Stack:**
- FastAPI
- Sentence Transformers for embeddings
- FAISS for vector similarity search
- Redis for caching
- Optional: Pinecone or Qdrant for production vector DB

### 4. Moderation Engine Service (Port 8003)
Comprehensive content moderation and compliance checking.

**Capabilities:**
- Brand safety detection (violence, hate speech, adult content, etc.)
- FTC compliance checking (disclosure requirements)
- Brand guidelines validation
- Competitor mention detection

**Key Endpoints:**
- `POST /moderate` - Comprehensive moderation
- `POST /check-compliance` - FTC compliance check
- `POST /check-guidelines` - Brand guidelines validation

**Tech Stack:**
- FastAPI
- OpenAI Moderation API
- spaCy for NLP
- Custom detection algorithms

## Getting Started

### Prerequisites
- Python 3.11+
- Docker (optional)
- API Keys:
  - OpenAI API key
  - Replicate API token (for video generation)
  - ElevenLabs API key (optional, for advanced TTS)

### Installation

#### Option 1: Docker (Recommended)

Each service has its own Dockerfile. Build and run:

```bash
# Video Generator
cd ai/video-generator
docker build -t nexus-video-generator .
docker run -p 8000:8000 --env-file .env nexus-video-generator

# Performance Predictor
cd ai/performance-predictor
docker build -t nexus-performance-predictor .
docker run -p 8001:8001 --env-file .env nexus-performance-predictor

# Recommendation Engine
cd ai/recommendation-engine
docker build -t nexus-recommendation-engine .
docker run -p 8002:8002 --env-file .env nexus-recommendation-engine

# Moderation Engine
cd ai/moderation-engine
docker build -t nexus-moderation-engine .
docker run -p 8003:8003 --env-file .env nexus-moderation-engine
```

#### Option 2: Local Development

Each service can be run locally:

```bash
# Example: Video Generator
cd ai/video-generator
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with API keys
cp .env.example .env

# Run the service
uvicorn src.main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file in each service directory:

```env
# Common
DEBUG=false
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_openai_key
REPLICATE_API_TOKEN=your_replicate_token
ELEVENLABS_API_KEY=your_elevenlabs_key

# Storage
S3_BUCKET=your_s3_bucket
AWS_REGION=us-east-1

# Service-specific settings
# See individual service configs for more options
```

## API Documentation

Each service provides interactive API documentation:

- Video Generator: http://localhost:8000/docs
- Performance Predictor: http://localhost:8001/docs
- Recommendation Engine: http://localhost:8002/docs
- Moderation Engine: http://localhost:8003/docs

## Usage Examples

### Video Generation

```python
import httpx

async def generate_video():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/generate",
            json={
                "images": [
                    "https://example.com/image1.jpg",
                    "https://example.com/image2.jpg"
                ],
                "script": "Check out this amazing product! It's changed my life.",
                "voice_settings": {
                    "voice_id": "alloy",
                    "stability": 0.5,
                    "speed": 1.0
                },
                "template": "ugc_review",
                "aspect_ratio": "9:16",
                "add_captions": true
            }
        )
        return response.json()
```

### Performance Prediction

```python
async def predict_performance():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8001/predict",
            json={
                "content_url": "https://example.com/video.mp4",
                "content_type": "video",
                "platform": "tiktok",
                "caption": "Amazing product review! #ad #sponsored",
                "hashtags": ["ad", "sponsored", "review"]
            }
        )
        return response.json()
```

### Creator Matching

```python
async def match_creators():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8002/match/creators",
            json={
                "campaign": {
                    "campaign_id": "camp_123",
                    "brand_name": "BrandX",
                    "product_category": "beauty",
                    "target_audience": {
                        "age_range": [18, 35],
                        "gender": "female",
                        "interests": ["beauty", "skincare"]
                    },
                    "required_niche": ["beauty", "skincare"],
                    "min_engagement_rate": 0.03,
                    "min_followers": 10000
                },
                "creator_pool": [
                    # List of creator profiles
                ],
                "limit": 10
            }
        )
        return response.json()
```

### Content Moderation

```python
async def moderate_content():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8003/moderate",
            json={
                "content_id": "content_123",
                "content_url": "https://example.com/video.mp4",
                "content_type": "video",
                "text_content": "Check out this product! #ad",
                "check_brand_safety": true,
                "check_compliance": true
            }
        )
        return response.json()
```

## Architecture

### Service Communication

Services communicate via:
- REST API calls (synchronous)
- Redis pub/sub (asynchronous events)
- Shared database for data persistence

### Scalability

Each service can be scaled independently:
- Horizontal scaling via Docker/Kubernetes
- Load balancing with nginx
- Caching with Redis
- Queue-based processing for heavy operations (Celery)

### Monitoring

Services include:
- Health check endpoints (`/health`)
- Structured logging
- Metrics collection (Prometheus-compatible)
- Error tracking integration

## Production Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  video-generator:
    build: ./ai/video-generator
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis

  performance-predictor:
    build: ./ai/performance-predictor
    ports:
      - "8001:8001"
    depends_on:
      - redis

  recommendation-engine:
    build: ./ai/recommendation-engine
    ports:
      - "8002:8002"
    depends_on:
      - redis

  moderation-engine:
    build: ./ai/moderation-engine
    ports:
      - "8003:8003"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Kubernetes

See `infrastructure/k8s/` for Kubernetes deployment manifests.

## Development

### Testing

```bash
# Install dev dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

### Code Quality

```bash
# Format code
black src/

# Lint
flake8 src/
mypy src/
```

## Roadmap

- [ ] Add video editing capabilities (trim, merge, effects)
- [ ] Implement real-time trend detection
- [ ] Add multi-language support
- [ ] Integrate more ML models for better predictions
- [ ] Add voice cloning capabilities
- [ ] Implement advanced A/B testing framework

## License

Proprietary - NEXUS Platform

## Support

For issues and questions:
- Documentation: See individual service READMEs
- API Issues: Check `/docs` endpoint for each service
- Email: support@nexus.ai
