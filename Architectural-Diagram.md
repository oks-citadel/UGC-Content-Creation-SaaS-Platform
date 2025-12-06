# UGC Creator Studio - System Architecture

## Executive Architecture Overview

This document outlines the complete technical architecture for the AI-Powered UGC Content Creation SaaS Platform, designed for scalability, security, and high-performance content generation.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>React/Next.js]
        MOB[Mobile Apps<br/>iOS/Android]
        API_CLIENT[API Consumers<br/>Enterprise]
    end

    subgraph "CDN & Edge Layer"
        CDN[Azure CDN<br/>Global Distribution]
        WAF[Azure WAF<br/>Security Layer]
    end

    subgraph "API Gateway Layer"
        APIM[Azure API Management]
        AUTH[Auth Service<br/>JWT/OAuth 2.0]
        RATE[Rate Limiter]
    end

    subgraph "Application Layer - AKS Cluster"
        subgraph "Core Services"
            USER_SVC[User Service]
            CONTENT_SVC[Content Service]
            BILLING_SVC[Billing Service]
            ANALYTICS_SVC[Analytics Service]
        end
        
        subgraph "AI Orchestration"
            ORCHESTRATOR[Multi-Agent<br/>Orchestrator]
            SCRIPT_AGENT[Script Generation<br/>Agent]
            VIDEO_AGENT[Video Generation<br/>Agent]
            VOICE_AGENT[Voice Synthesis<br/>Agent]
            EDIT_AGENT[Auto-Edit<br/>Agent]
        end

        subgraph "Processing Workers"
            QUEUE_PROCESSOR[Queue Processor]
            VIDEO_ENCODER[Video Encoder]
            THUMBNAIL_GEN[Thumbnail Generator]
        end
    end

    subgraph "AI Services Layer"
        CLAUDE[Claude API<br/>Script Generation]
        OPENAI[OpenAI GPT<br/>Content Variation]
        ELEVEN[ElevenLabs<br/>Voice Synthesis]
        CUSTOM_VIDEO[Custom Video AI<br/>UGC Generation]
    end

    subgraph "Data Layer"
        subgraph "Databases"
            POSTGRES[(PostgreSQL<br/>User/Content Data)]
            MONGO[(MongoDB<br/>Templates/Analytics)]
            REDIS[(Redis<br/>Cache/Sessions)]
        end
        
        subgraph "Storage"
            BLOB[Azure Blob Storage<br/>Video Assets]
            QUEUE[Azure Service Bus<br/>Job Queue]
        end
    end

    subgraph "Observability"
        MONITOR[Azure Monitor]
        INSIGHTS[Application Insights]
        LOG[Log Analytics]
    end

    WEB --> CDN
    MOB --> CDN
    API_CLIENT --> APIM
    CDN --> WAF
    WAF --> APIM
    APIM --> AUTH
    AUTH --> RATE
    
    RATE --> USER_SVC
    RATE --> CONTENT_SVC
    RATE --> BILLING_SVC
    RATE --> ANALYTICS_SVC
    
    CONTENT_SVC --> ORCHESTRATOR
    ORCHESTRATOR --> SCRIPT_AGENT
    ORCHESTRATOR --> VIDEO_AGENT
    ORCHESTRATOR --> VOICE_AGENT
    ORCHESTRATOR --> EDIT_AGENT
    
    SCRIPT_AGENT --> CLAUDE
    SCRIPT_AGENT --> OPENAI
    VOICE_AGENT --> ELEVEN
    VIDEO_AGENT --> CUSTOM_VIDEO
    
    ORCHESTRATOR --> QUEUE
    QUEUE --> QUEUE_PROCESSOR
    QUEUE_PROCESSOR --> VIDEO_ENCODER
    QUEUE_PROCESSOR --> THUMBNAIL_GEN
    
    USER_SVC --> POSTGRES
    CONTENT_SVC --> POSTGRES
    CONTENT_SVC --> MONGO
    BILLING_SVC --> POSTGRES
    ANALYTICS_SVC --> MONGO
    
    VIDEO_ENCODER --> BLOB
    CONTENT_SVC --> REDIS
    AUTH --> REDIS
    
    USER_SVC --> INSIGHTS
    CONTENT_SVC --> INSIGHTS
    INSIGHTS --> MONITOR
    MONITOR --> LOG
```

---

## 2. Multi-Agent Content Orchestration Architecture

```mermaid
graph LR
    subgraph "Request Intake"
        REQ[Content Request]
        VALIDATOR[Request Validator]
        PLANNER[Content Planner]
    end

    subgraph "Agent Pool"
        subgraph "Script Agents"
            SCRIPT_UGC[UGC Script Agent]
            SCRIPT_AD[Ad Copy Agent]
            SCRIPT_REVIEW[Review Script Agent]
        end
        
        subgraph "Media Agents"
            AVATAR[Avatar Selection Agent]
            SCENE[Scene Composition Agent]
            MOTION[Motion/Gesture Agent]
        end
        
        subgraph "Audio Agents"
            VOICE_SELECT[Voice Selection Agent]
            VOICE_GEN[Voice Generation Agent]
            MUSIC[Background Music Agent]
        end
        
        subgraph "Post-Production Agents"
            CAPTION[Caption Agent]
            EFFECTS[Effects Agent]
            RESIZE[Multi-Platform Resize Agent]
        end
    end

    subgraph "Coordination"
        COORD[Agent Coordinator]
        STATE[State Manager]
        CONFLICT[Conflict Resolver]
    end

    subgraph "Output"
        ASSEMBLER[Video Assembler]
        QA[Quality Assurance]
        DELIVERY[Delivery Manager]
    end

    REQ --> VALIDATOR
    VALIDATOR --> PLANNER
    PLANNER --> COORD
    
    COORD --> SCRIPT_UGC
    COORD --> SCRIPT_AD
    COORD --> SCRIPT_REVIEW
    COORD --> AVATAR
    COORD --> SCENE
    COORD --> MOTION
    COORD --> VOICE_SELECT
    COORD --> VOICE_GEN
    COORD --> MUSIC
    COORD --> CAPTION
    COORD --> EFFECTS
    COORD --> RESIZE
    
    SCRIPT_UGC --> STATE
    AVATAR --> STATE
    VOICE_GEN --> STATE
    CAPTION --> STATE
    
    STATE --> CONFLICT
    CONFLICT --> COORD
    
    STATE --> ASSEMBLER
    ASSEMBLER --> QA
    QA --> DELIVERY
```

---

## 3. Microservices Architecture Detail

```mermaid
graph TB
    subgraph "User Domain"
        USER_API[User API Gateway]
        USER_CORE[User Core Service]
        USER_PROFILE[Profile Service]
        USER_PREFS[Preferences Service]
        BRAND_KIT[Brand Kit Service]
    end

    subgraph "Content Domain"
        CONTENT_API[Content API Gateway]
        TEMPLATE_SVC[Template Service]
        SCRIPT_SVC[Script Service]
        VIDEO_SVC[Video Service]
        CALENDAR_SVC[Calendar Service]
    end

    subgraph "AI Domain"
        AI_GATEWAY[AI Gateway]
        PROMPT_MGR[Prompt Manager]
        MODEL_ROUTER[Model Router]
        RESULT_PROCESSOR[Result Processor]
    end

    subgraph "Commerce Domain"
        COMMERCE_API[Commerce API]
        SUBSCRIPTION_SVC[Subscription Service]
        PAYMENT_SVC[Payment Service]
        USAGE_SVC[Usage Tracking]
        MARKETPLACE_SVC[Marketplace Service]
    end

    subgraph "Analytics Domain"
        ANALYTICS_API[Analytics API]
        METRICS_SVC[Metrics Service]
        PREDICTION_SVC[Performance Prediction]
        REPORTING_SVC[Reporting Service]
    end

    subgraph "Shared Services"
        NOTIFICATION[Notification Service]
        STORAGE[Storage Service]
        SEARCH[Search Service<br/>Elasticsearch]
        AUDIT[Audit Service]
    end

    USER_API --> USER_CORE
    USER_CORE --> USER_PROFILE
    USER_CORE --> USER_PREFS
    USER_CORE --> BRAND_KIT

    CONTENT_API --> TEMPLATE_SVC
    CONTENT_API --> SCRIPT_SVC
    CONTENT_API --> VIDEO_SVC
    CONTENT_API --> CALENDAR_SVC
    
    VIDEO_SVC --> AI_GATEWAY
    SCRIPT_SVC --> AI_GATEWAY
    AI_GATEWAY --> PROMPT_MGR
    AI_GATEWAY --> MODEL_ROUTER
    MODEL_ROUTER --> RESULT_PROCESSOR

    COMMERCE_API --> SUBSCRIPTION_SVC
    COMMERCE_API --> PAYMENT_SVC
    COMMERCE_API --> USAGE_SVC
    COMMERCE_API --> MARKETPLACE_SVC

    ANALYTICS_API --> METRICS_SVC
    ANALYTICS_API --> PREDICTION_SVC
    ANALYTICS_API --> REPORTING_SVC

    USER_CORE --> NOTIFICATION
    VIDEO_SVC --> STORAGE
    TEMPLATE_SVC --> SEARCH
    SUBSCRIPTION_SVC --> AUDIT
```

---

## 4. Azure Infrastructure Architecture

```mermaid
graph TB
    subgraph "Azure Subscription"
        subgraph "Network Layer"
            VNET[Virtual Network<br/>10.0.0.0/16]
            
            subgraph "Subnets"
                AKS_SUBNET[AKS Subnet<br/>10.0.1.0/24]
                DB_SUBNET[Database Subnet<br/>10.0.2.0/24]
                PRIV_SUBNET[Private Endpoints<br/>10.0.3.0/24]
            end
            
            NSG[Network Security Groups]
            BASTION[Azure Bastion]
        end

        subgraph "Compute - AKS"
            AKS[Azure Kubernetes Service]
            
            subgraph "Node Pools"
                SYS_POOL[System Pool<br/>Standard_D4s_v3]
                APP_POOL[Application Pool<br/>Standard_D8s_v3]
                GPU_POOL[GPU Pool<br/>Standard_NC6s_v3]
            end
            
            HPA[Horizontal Pod Autoscaler]
            KEDA[KEDA Event Autoscaler]
        end

        subgraph "Data Services"
            PSQL[Azure PostgreSQL<br/>Flexible Server]
            COSMOS[Azure Cosmos DB<br/>MongoDB API]
            REDIS_CACHE[Azure Cache<br/>for Redis]
        end

        subgraph "Storage & Messaging"
            STORAGE_ACCT[Storage Account]
            BLOB_CONTAINER[Blob Containers<br/>Videos/Assets]
            SERVICE_BUS[Azure Service Bus<br/>Premium]
        end

        subgraph "Security"
            KV[Azure Key Vault]
            MI[Managed Identities]
            AAD[Azure AD B2C]
        end

        subgraph "DevOps"
            ACR[Azure Container Registry]
            DEVOPS[Azure DevOps<br/>Pipelines]
        end

        subgraph "Monitoring"
            MONITOR_WS[Azure Monitor<br/>Workspace]
            APP_INSIGHTS[Application Insights]
            ALERTS[Azure Alerts]
        end
    end

    VNET --> AKS_SUBNET
    VNET --> DB_SUBNET
    VNET --> PRIV_SUBNET
    
    AKS --> AKS_SUBNET
    AKS --> SYS_POOL
    AKS --> APP_POOL
    AKS --> GPU_POOL
    AKS --> HPA
    AKS --> KEDA
    
    PSQL --> DB_SUBNET
    COSMOS --> PRIV_SUBNET
    REDIS_CACHE --> PRIV_SUBNET
    
    STORAGE_ACCT --> BLOB_CONTAINER
    STORAGE_ACCT --> PRIV_SUBNET
    
    KV --> MI
    MI --> AKS
    AAD --> AKS
    
    ACR --> AKS
    DEVOPS --> ACR
    
    AKS --> APP_INSIGHTS
    APP_INSIGHTS --> MONITOR_WS
    MONITOR_WS --> ALERTS
```

---

## 5. Video Generation Pipeline

```mermaid
sequenceDiagram
    participant User
    participant API as API Gateway
    participant Content as Content Service
    participant Orch as Orchestrator
    participant Script as Script Agent
    participant Claude as Claude API
    participant Voice as Voice Agent
    participant Eleven as ElevenLabs
    participant Video as Video Agent
    participant GPU as GPU Worker
    participant Storage as Blob Storage
    participant Queue as Service Bus

    User->>API: Create UGC Video Request
    API->>Content: Validate & Process Request
    Content->>Queue: Enqueue Job
    Queue->>Orch: Receive Job
    
    Orch->>Script: Generate Script
    Script->>Claude: Prompt for UGC Script
    Claude-->>Script: Script Response
    Script-->>Orch: Script Ready
    
    Orch->>Voice: Generate Voiceover
    Voice->>Eleven: Synthesize Voice
    Eleven-->>Voice: Audio File
    Voice->>Storage: Store Audio
    Voice-->>Orch: Audio Ready
    
    Orch->>Video: Generate Video
    Video->>GPU: Render UGC Video
    GPU->>GPU: Apply Avatar/Persona
    GPU->>GPU: Sync Audio
    GPU->>GPU: Add Effects
    GPU-->>Video: Raw Video
    
    Video->>GPU: Post-Process
    GPU->>GPU: Auto-Captions
    GPU->>GPU: Platform Resize
    GPU->>Storage: Store Final Videos
    GPU-->>Video: Processing Complete
    
    Video-->>Orch: All Assets Ready
    Orch->>Content: Update Job Status
    Content->>API: Notify Completion
    API->>User: Content Ready + Download Links
```

---

## 6. Data Flow Architecture

```mermaid
graph LR
    subgraph "Data Ingestion"
        USER_INPUT[User Input<br/>Brand/Preferences]
        TEMPLATE_SELECT[Template Selection]
        ASSET_UPLOAD[Asset Upload]
    end

    subgraph "Processing Pipeline"
        VALIDATE[Data Validation]
        ENRICH[Data Enrichment]
        TRANSFORM[Data Transformation]
    end

    subgraph "Storage Layers"
        subgraph "Hot Storage"
            REDIS_HOT[Redis Cache<br/>Active Sessions]
            POSTGRES_HOT[PostgreSQL<br/>Transactional]
        end
        
        subgraph "Warm Storage"
            COSMOS_WARM[Cosmos DB<br/>Templates/Analytics]
            BLOB_WARM[Blob Storage<br/>Recent Content]
        end
        
        subgraph "Cold Storage"
            ARCHIVE[Archive Storage<br/>Historical Data]
        end
    end

    subgraph "Analytics Pipeline"
        STREAM[Event Stream<br/>Event Hub]
        PROCESS[Stream Analytics]
        AGGREGATE[Data Aggregation]
        ML_TRAIN[ML Training Data]
    end

    subgraph "Output"
        DASHBOARD[Analytics Dashboard]
        REPORTS[Scheduled Reports]
        API_OUT[API Responses]
        PREDICTIONS[Performance Predictions]
    end

    USER_INPUT --> VALIDATE
    TEMPLATE_SELECT --> VALIDATE
    ASSET_UPLOAD --> VALIDATE
    
    VALIDATE --> ENRICH
    ENRICH --> TRANSFORM
    
    TRANSFORM --> REDIS_HOT
    TRANSFORM --> POSTGRES_HOT
    TRANSFORM --> COSMOS_WARM
    TRANSFORM --> BLOB_WARM
    
    POSTGRES_HOT --> ARCHIVE
    BLOB_WARM --> ARCHIVE
    
    TRANSFORM --> STREAM
    STREAM --> PROCESS
    PROCESS --> AGGREGATE
    AGGREGATE --> COSMOS_WARM
    AGGREGATE --> ML_TRAIN
    
    COSMOS_WARM --> DASHBOARD
    AGGREGATE --> REPORTS
    POSTGRES_HOT --> API_OUT
    ML_TRAIN --> PREDICTIONS
```

---

## 7. Security Architecture

```mermaid
graph TB
    subgraph "Perimeter Security"
        DDOS[Azure DDoS Protection]
        WAF_SEC[Web Application Firewall]
        FW[Azure Firewall]
    end

    subgraph "Identity & Access"
        AAD_SEC[Azure AD B2C]
        MFA[Multi-Factor Auth]
        RBAC[Role-Based Access]
        CONDITIONAL[Conditional Access]
    end

    subgraph "Application Security"
        JWT[JWT Tokens]
        OAUTH[OAuth 2.0]
        API_KEY[API Key Management]
        RATE_LIMIT[Rate Limiting]
    end

    subgraph "Data Security"
        ENCRYPT_TRANSIT[TLS 1.3<br/>In-Transit]
        ENCRYPT_REST[AES-256<br/>At-Rest]
        KEY_VAULT[Azure Key Vault]
        SECRETS[Secret Management]
    end

    subgraph "Network Security"
        PRIVATE_LINK[Private Endpoints]
        NSG_SEC[Network Security Groups]
        VNET_SEC[VNet Isolation]
        SERVICE_ENDPOINT[Service Endpoints]
    end

    subgraph "Monitoring & Compliance"
        DEFENDER[Microsoft Defender]
        SENTINEL[Azure Sentinel]
        AUDIT_LOG[Audit Logging]
        COMPLIANCE[Compliance Manager]
    end

    DDOS --> WAF_SEC
    WAF_SEC --> FW
    
    AAD_SEC --> MFA
    AAD_SEC --> RBAC
    MFA --> CONDITIONAL
    
    CONDITIONAL --> JWT
    JWT --> OAUTH
    OAUTH --> API_KEY
    API_KEY --> RATE_LIMIT
    
    KEY_VAULT --> ENCRYPT_TRANSIT
    KEY_VAULT --> ENCRYPT_REST
    KEY_VAULT --> SECRETS
    
    VNET_SEC --> PRIVATE_LINK
    VNET_SEC --> NSG_SEC
    NSG_SEC --> SERVICE_ENDPOINT
    
    DEFENDER --> SENTINEL
    SENTINEL --> AUDIT_LOG
    AUDIT_LOG --> COMPLIANCE
```

---

## 8. CI/CD Pipeline Architecture

```mermaid
graph LR
    subgraph "Source Control"
        GITHUB[GitHub Repository]
        BRANCH[Branch Strategy<br/>GitFlow]
        PR[Pull Requests]
    end

    subgraph "CI Pipeline"
        TRIGGER[Pipeline Trigger]
        BUILD[Build Stage]
        UNIT[Unit Tests]
        LINT[Linting/SAST]
        SCAN[Security Scan<br/>Trivy/Snyk]
        DOCKER[Docker Build]
    end

    subgraph "Registry"
        ACR_CI[Azure Container Registry]
        TAG[Image Tagging]
        SIGN[Image Signing]
    end

    subgraph "CD Pipeline"
        HELM[Helm Charts]
        
        subgraph "Environments"
            DEV[Development]
            STAGING[Staging]
            PROD[Production]
        end
        
        APPROVAL[Manual Approval]
        CANARY[Canary Deployment]
        ROLLBACK[Rollback Strategy]
    end

    subgraph "Infrastructure"
        TF[Terraform]
        TF_PLAN[Plan Stage]
        TF_APPLY[Apply Stage]
        STATE[Remote State<br/>Azure Storage]
    end

    GITHUB --> BRANCH
    BRANCH --> PR
    PR --> TRIGGER
    
    TRIGGER --> BUILD
    BUILD --> UNIT
    UNIT --> LINT
    LINT --> SCAN
    SCAN --> DOCKER
    
    DOCKER --> ACR_CI
    ACR_CI --> TAG
    TAG --> SIGN
    
    SIGN --> HELM
    HELM --> DEV
    DEV --> STAGING
    STAGING --> APPROVAL
    APPROVAL --> CANARY
    CANARY --> PROD
    PROD --> ROLLBACK
    
    TF --> TF_PLAN
    TF_PLAN --> TF_APPLY
    TF_APPLY --> STATE
```

---

## 9. Scalability Architecture

```mermaid
graph TB
    subgraph "Load Balancing"
        GLB[Azure Front Door<br/>Global Load Balancer]
        REGION_1[Region: East US]
        REGION_2[Region: West Europe]
        REGION_3[Region: Southeast Asia]
    end

    subgraph "Auto-Scaling Triggers"
        CPU[CPU Threshold<br/>> 70%]
        MEMORY[Memory Threshold<br/>> 80%]
        QUEUE_DEPTH[Queue Depth<br/>> 100 jobs]
        LATENCY[Response Latency<br/>> 500ms]
    end

    subgraph "Scaling Actions"
        HPA_SCALE[HPA: Pod Scaling<br/>3-50 replicas]
        KEDA_SCALE[KEDA: Event-Based<br/>0-100 workers]
        NODE_SCALE[Cluster Autoscaler<br/>3-20 nodes]
        GPU_SCALE[GPU Pool Scaling<br/>1-10 nodes]
    end

    subgraph "Resource Pools"
        API_POOL[API Tier<br/>Min: 3, Max: 20]
        WORKER_POOL[Worker Tier<br/>Min: 5, Max: 50]
        GPU_POOL_RES[GPU Tier<br/>Min: 1, Max: 10]
    end

    GLB --> REGION_1
    GLB --> REGION_2
    GLB --> REGION_3
    
    CPU --> HPA_SCALE
    MEMORY --> HPA_SCALE
    QUEUE_DEPTH --> KEDA_SCALE
    LATENCY --> NODE_SCALE
    
    HPA_SCALE --> API_POOL
    KEDA_SCALE --> WORKER_POOL
    NODE_SCALE --> API_POOL
    NODE_SCALE --> WORKER_POOL
    GPU_SCALE --> GPU_POOL_RES
```

---

## 10. Disaster Recovery Architecture

```mermaid
graph TB
    subgraph "Primary Region - East US"
        PRIMARY_AKS[AKS Cluster]
        PRIMARY_DB[(PostgreSQL<br/>Primary)]
        PRIMARY_COSMOS[(Cosmos DB)]
        PRIMARY_STORAGE[Blob Storage]
    end

    subgraph "Secondary Region - West US"
        SECONDARY_AKS[AKS Cluster<br/>Standby]
        SECONDARY_DB[(PostgreSQL<br/>Read Replica)]
        SECONDARY_COSMOS[(Cosmos DB<br/>Multi-Region)]
        SECONDARY_STORAGE[Blob Storage<br/>GRS Replica]
    end

    subgraph "Replication"
        DB_REPL[Async Replication<br/>RPO: < 5 min]
        COSMOS_REPL[Multi-Master<br/>RPO: < 1 min]
        BLOB_REPL[Geo-Redundant<br/>Storage]
    end

    subgraph "Failover"
        TRAFFIC_MGR[Azure Traffic Manager]
        HEALTH_PROBE[Health Probes]
        AUTO_FAILOVER[Automatic Failover]
        DNS_UPDATE[DNS Update<br/>< 60 seconds]
    end

    subgraph "Recovery Targets"
        RTO[RTO: < 15 minutes]
        RPO[RPO: < 5 minutes]
        SLA[SLA: 99.95%]
    end

    PRIMARY_DB --> DB_REPL
    DB_REPL --> SECONDARY_DB
    
    PRIMARY_COSMOS --> COSMOS_REPL
    COSMOS_REPL --> SECONDARY_COSMOS
    
    PRIMARY_STORAGE --> BLOB_REPL
    BLOB_REPL --> SECONDARY_STORAGE
    
    TRAFFIC_MGR --> HEALTH_PROBE
    HEALTH_PROBE --> PRIMARY_AKS
    HEALTH_PROBE --> SECONDARY_AKS
    
    HEALTH_PROBE --> AUTO_FAILOVER
    AUTO_FAILOVER --> DNS_UPDATE
    
    DNS_UPDATE --> RTO
    DB_REPL --> RPO
    RTO --> SLA
```

---

## Architecture Decision Records

### ADR-001: Multi-Agent Orchestration Pattern
**Decision:** Implement autonomous AI agents with a central coordinator.  
**Rationale:** Enables parallel content generation, reduces processing time by 60%, allows specialized optimization per content type.

### ADR-002: Azure Kubernetes Service
**Decision:** Use AKS with dedicated GPU node pools.  
**Rationale:** Provides container orchestration, native Azure integration, cost-effective GPU scaling for video rendering.

### ADR-003: Event-Driven Architecture
**Decision:** Use Azure Service Bus for job queuing with KEDA autoscaling.  
**Rationale:** Handles bursty workloads, ensures reliable job processing, enables zero-to-scale worker patterns.

### ADR-004: Polyglot Persistence
**Decision:** PostgreSQL for transactions, Cosmos DB for templates/analytics, Redis for caching.  
**Rationale:** Optimizes each data type for its access pattern, balances consistency and performance requirements.

### ADR-005: Multi-Region Active-Passive
**Decision:** Primary region with warm standby for DR.  
**Rationale:** Achieves 99.95% SLA with cost-effective disaster recovery, supports global user base expansion.

---

## Component Specifications

| Component | Technology | Specifications |
|-----------|------------|----------------|
| API Gateway | Azure API Management | Premium tier, 99.95% SLA |
| Compute | AKS 1.28+ | 3 node pools, 50+ pods |
| GPU Workers | NC6s_v3 | NVIDIA Tesla V100, 16GB |
| Primary Database | PostgreSQL 15 | 8 vCores, 64GB RAM |
| Document Store | Cosmos DB | 10K RU/s, MongoDB API |
| Cache | Redis Enterprise | 6GB, P1 tier |
| Storage | Blob Storage | Hot tier, GRS replication |
| Message Queue | Service Bus | Premium, 1000 msg/s |
| CDN | Azure Front Door | Standard tier, global PoPs |

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Architecture Owner: Platform Engineering Team*
