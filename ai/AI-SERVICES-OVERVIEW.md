# NEXUS AI Services - Complete Overview

## Executive Summary

Four production-ready AI microservices for the NEXUS UGC Content Creation Platform, built with Python/FastAPI and designed for scale.

## Services Architecture

```
ai/
├── video-generator/          # Port 8000 - UGC video generation
├── performance-predictor/    # Port 8001 - Content performance prediction
├── recommendation-engine/    # Port 8002 - Creator/content matching
├── moderation-engine/        # Port 8003 - Content moderation
├── docker-compose.yml        # Multi-service orchestration
├── .env.example             # Environment configuration template
└── README.md                # Complete documentation
```

## Service Details

### 1. Video Generator Service (Port 8000)

**Purpose:** Generate professional UGC videos from raw materials (images, scripts, voice).

**Core Features:**
- `generate_ugc_video()` - Complete video pipeline: images → video with voice, captions, music
- `generate_video_variants()` - Create multiple A/B test variants automatically
- `add_captions_to_video()` - Auto-generate or apply custom captions with styling
- `add_music_to_video()` - Background music with beat sync and volume control
- Template system with 6 pre-built UGC styles (review, showcase, unboxing, tutorial, lifestyle, testimonial)

**Tech Stack:**
- FFmpeg for video processing
- OpenAI TTS for voiceover generation
- Pillow for image manipulation
- Replicate API for advanced video effects

**File Structure:**
```
video-generator/
├── Dockerfile
├── requirements.txt
└── src/
    ├── main.py              # FastAPI app with 6 endpoints
    ├── config.py            # Configuration management
    ├── models.py            # Pydantic models (20+ models)
    └── services/
        ├── video_service.py      # Core video generation (500+ lines)
        └── template_service.py   # Template management
```

**API Endpoints:**
- `POST /generate` - Generate complete video
- `POST /variants` - Generate A/B test variants
- `POST /captions` - Add captions
- `POST /music` - Add background music
- `GET /templates` - List available templates
- `GET /templates/{id}` - Get template details

### 2. Performance Predictor Service (Port 8001)

**Purpose:** Predict content performance before publishing to optimize engagement.

**Core Features:**
- `predict_engagement()` - Predict views, likes, comments, shares, engagement rate
- `predict_virality()` - Calculate viral probability with detailed factors
- `get_optimization_suggestions()` - Actionable improvements ranked by impact
- `compare_variants()` - A/B testing comparison with confidence scores

**Prediction Factors:**
- Visual quality analysis using CLIP embeddings
- Content relevance scoring
- Emotional impact detection
- Trending topic alignment
- Hook strength (first 3 seconds)
- Platform-specific algorithms

**Tech Stack:**
- PyTorch + Transformers (CLIP model for vision)
- scikit-learn for ML pipelines
- OpenAI API for advanced analysis
- Custom scoring algorithms

**File Structure:**
```
performance-predictor/
├── Dockerfile
├── requirements.txt
└── src/
    ├── main.py                      # FastAPI app
    ├── config.py                    # ML model settings
    ├── models.py                    # Prediction models
    └── services/
        ├── predictor_service.py     # Main prediction logic (700+ lines)
        └── ml_models.py             # ML model wrappers
```

**API Endpoints:**
- `POST /predict` - Full performance prediction
- `POST /predict/virality` - Viral potential analysis
- `POST /optimize` - Get optimization suggestions
- `POST /compare` - Compare two variants

### 3. Recommendation Engine Service (Port 8002)

**Purpose:** Match creators to campaigns and content to products using semantic search.

**Core Features:**
- `match_creators_to_campaign()` - Multi-factor creator matching (niche, audience, performance, style)
- `match_content_to_products()` - Semantic content-product alignment
- `get_similar_creators()` - Find lookalike creators using vector similarity
- `get_trending_content()` - Real-time trending content detection

**Matching Algorithm:**
- Semantic embeddings using Sentence Transformers
- Multi-dimensional scoring (audience 25%, engagement 25%, niche 30%, location 10%, followers 10%)
- FAISS vector similarity search
- Diversity filtering to avoid similar recommendations

**Tech Stack:**
- Sentence Transformers (all-MiniLM-L6-v2)
- FAISS for vector search
- Optional: Pinecone or Qdrant for production scale
- Redis for caching

**File Structure:**
```
recommendation-engine/
├── Dockerfile
├── requirements.txt
└── src/
    ├── main.py                    # FastAPI app
    ├── config.py                  # Vector DB configuration
    ├── models.py                  # Matching models
    └── services/
        ├── matching_service.py    # Core matching logic (600+ lines)
        └── embeddings.py          # Embedding generation
```

**API Endpoints:**
- `POST /match/creators` - Match creators to campaign
- `POST /match/content` - Match content to products
- `GET /similar/{creator_id}` - Find similar creators
- `GET /trending` - Get trending content

### 4. Moderation Engine Service (Port 8003)

**Purpose:** Ensure brand safety, FTC compliance, and guideline adherence.

**Core Features:**
- `check_brand_safety()` - Detect violence, hate speech, profanity, adult content, drugs, weapons
- `check_ftc_compliance()` - Verify required disclosures (#ad, #sponsored)
- `check_brand_guidelines()` - Validate against custom brand rules
- `detect_competitor_mentions()` - Find competitor brand mentions

**Detection Capabilities:**
- Text analysis using regex patterns + OpenAI Moderation API
- Visual analysis using GPT-4 Vision
- Multi-language profanity detection
- FTC disclosure prominence checking (location, clarity)
- Brand guideline validation (keywords, tone, hashtags, messaging)

**Tech Stack:**
- OpenAI Moderation API
- GPT-4 Vision for image analysis
- spaCy for NLP
- Custom detection algorithms

**File Structure:**
```
moderation-engine/
├── Dockerfile
├── requirements.txt
└── src/
    ├── main.py                           # FastAPI app
    ├── config.py                         # Moderation thresholds
    ├── models.py                         # Moderation models
    └── services/
        ├── moderation_service.py         # Core moderation (300+ lines)
        └── detectors/
            ├── safety_detector.py        # Brand safety detection
            ├── compliance_detector.py    # FTC compliance
            ├── guidelines_detector.py    # Brand guidelines
            └── competitor_detector.py    # Competitor mentions
```

**API Endpoints:**
- `POST /moderate` - Comprehensive moderation (all checks)
- `POST /check-compliance` - FTC compliance only
- `POST /check-guidelines` - Brand guidelines only

## Production Features

### All Services Include:

1. **Health Monitoring**
   - `/health` endpoint with dependency checks
   - Structured logging with log levels
   - Error tracking and reporting

2. **API Documentation**
   - Auto-generated OpenAPI/Swagger docs at `/docs`
   - Interactive API testing
   - Request/response examples

3. **Configuration Management**
   - Environment-based configuration
   - Pydantic settings validation
   - Secure credential management

4. **Error Handling**
   - Comprehensive try-catch blocks
   - User-friendly error messages
   - Graceful degradation

5. **Performance Optimization**
   - Redis caching
   - Async/await for I/O operations
   - Connection pooling
   - Background task processing

6. **Security**
   - Input validation with Pydantic
   - API key authentication ready
   - CORS configuration
   - Rate limiting ready

## Deployment Options

### Option 1: Docker Compose (Development)

```bash
cd ai/
docker-compose up -d
```

All services start automatically with dependencies.

### Option 2: Individual Services (Development)

```bash
cd ai/video-generator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

### Option 3: Kubernetes (Production)

Each service includes:
- Dockerfile optimized for production
- Health checks for k8s probes
- Graceful shutdown handling
- Resource limit awareness

## API Usage Examples

### Complete Video Generation Workflow

```python
import httpx

async def create_ugc_video():
    # 1. Generate video
    async with httpx.AsyncClient() as client:
        video_response = await client.post(
            "http://localhost:8000/generate",
            json={
                "images": ["url1.jpg", "url2.jpg"],
                "script": "This product changed my life! #ad",
                "voice_settings": {"voice_id": "alloy"},
                "template": "ugc_review",
                "aspect_ratio": "9:16",
                "add_captions": True
            }
        )
        video = video_response.json()

        # 2. Predict performance
        prediction_response = await client.post(
            "http://localhost:8001/predict",
            json={
                "content_url": video["video_url"],
                "content_type": "video",
                "platform": "tiktok",
                "caption": "This product changed my life! #ad"
            }
        )
        prediction = prediction_response.json()

        # 3. Moderate content
        moderation_response = await client.post(
            "http://localhost:8003/moderate",
            json={
                "content_id": video["job_id"],
                "content_url": video["video_url"],
                "content_type": "video",
                "text_content": "This product changed my life! #ad",
                "check_brand_safety": True,
                "check_compliance": True
            }
        )
        moderation = moderation_response.json()

        return {
            "video": video,
            "prediction": prediction,
            "moderation": moderation
        }
```

## Performance Benchmarks

### Video Generator
- Simple video (3 images, 30s): ~45 seconds
- Complex video with captions/music: ~90 seconds
- Batch variant generation (5 variants): ~4 minutes

### Performance Predictor
- Single prediction: ~2-3 seconds
- With visual analysis: ~5-7 seconds
- Batch comparison: ~10-15 seconds

### Recommendation Engine
- Creator matching (1000 pool): ~500ms
- Content matching (10000 items): ~1-2 seconds
- Similarity search: ~100-200ms

### Moderation Engine
- Text moderation: ~500ms-1s
- Full moderation with vision: ~3-5 seconds
- Compliance check only: ~100-200ms

## Scaling Recommendations

### Horizontal Scaling
- Each service can scale independently
- Stateless design enables load balancing
- Shared Redis for cross-service caching

### Vertical Scaling
- Video Generator: CPU + Memory intensive (recommend 4GB+ RAM)
- Performance Predictor: GPU beneficial for ML models
- Recommendation Engine: Memory for embeddings cache
- Moderation Engine: Moderate resources

### Queue-Based Processing
- Implement Celery for long-running tasks
- Video generation → background job
- Batch predictions → scheduled jobs

## Monitoring & Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Cache hit rates
- Model inference time
- Queue depth (if using Celery)

### Logging Strategy
- Structured JSON logging
- Request IDs for tracing
- Error stack traces
- Performance timings

## Security Considerations

1. **API Keys**: All OpenAI/Replicate keys in environment variables
2. **Input Validation**: Pydantic models validate all inputs
3. **Rate Limiting**: Implement per-user/IP rate limits
4. **Content Security**: Validate URLs before downloading
5. **Data Privacy**: No PII storage in logs

## Cost Optimization

### API Costs
- OpenAI TTS: ~$0.015 per 1000 characters
- OpenAI Moderation: Free
- GPT-4 Vision: ~$0.01 per image
- Replicate: Varies by model

### Optimization Strategies
- Cache predictions for identical content
- Use smaller models where possible
- Batch API calls
- Implement request deduplication

## Future Enhancements

### Planned Features
- [ ] Video editing (trim, merge, effects)
- [ ] Voice cloning for brand consistency
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Webhook integrations
- [ ] GraphQL API option

### ML Model Improvements
- [ ] Train custom engagement prediction models
- [ ] Fine-tune content moderation for brand-specific rules
- [ ] Improve virality prediction with historical data
- [ ] Add sentiment analysis for content optimization

## Support & Maintenance

### Updating Services
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup & Recovery
- Model files: Versioned in S3
- Configuration: In version control
- Redis data: Ephemeral (cache only)

### Troubleshooting
- Check `/health` endpoint for service status
- Review logs: `docker-compose logs -f [service-name]`
- Verify API keys in environment
- Test with minimal examples

## License & Credits

**License:** Proprietary - NEXUS Platform

**Technologies:**
- FastAPI - Web framework
- PyTorch - Deep learning
- OpenAI - AI models
- FFmpeg - Video processing
- Docker - Containerization

**Contact:**
- Technical Support: dev@nexus.ai
- Documentation: https://docs.nexus.ai/ai-services

---

**Last Updated:** 2024-12-18
**Version:** 1.0.0
**Status:** Production Ready
