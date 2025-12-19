# Redis Key Patterns & Usage Documentation

## Overview
Redis is used in the NEXUS platform for caching, session management, real-time features, and rate limiting.

## Database Allocation

- **DB 0**: Sessions and Authentication
- **DB 1**: Application Cache
- **DB 2**: Rate Limiting
- **DB 3**: Real-time Features (Pub/Sub)
- **DB 4**: Queue Management
- **DB 5**: Analytics Cache
- **DB 6-15**: Reserved for future use

## Key Naming Conventions

All keys follow the pattern: `{namespace}:{entity}:{identifier}:{field}`

### Example
```
nexus:session:user:abc123:data
nexus:cache:campaign:xyz789:details
nexus:ratelimit:api:user123:60
```

## Key Patterns by Feature

### 1. Sessions (DB 0)

#### User Sessions
```
nexus:session:{sessionId}
- Type: Hash
- TTL: 24 hours
- Fields: userId, email, role, ip, lastActivity
- Example: nexus:session:sess_abc123
```

#### Session Index by User
```
nexus:session:user:{userId}:sessions
- Type: Set
- TTL: 30 days
- Members: sessionId1, sessionId2, ...
- Example: nexus:session:user:user_123:sessions
```

#### Refresh Tokens
```
nexus:refresh:{tokenId}
- Type: String
- TTL: 7 days
- Value: userId
- Example: nexus:refresh:token_xyz789
```

#### Active Users (online presence)
```
nexus:presence:user:{userId}
- Type: String
- TTL: 5 minutes (heartbeat)
- Value: timestamp
- Example: nexus:presence:user:user_123
```

### 2. Cache (DB 1)

#### User Cache
```
nexus:cache:user:{userId}
- Type: Hash
- TTL: 1 hour
- Fields: Full user object
- Example: nexus:cache:user:user_123
```

#### Campaign Cache
```
nexus:cache:campaign:{campaignId}
- Type: Hash
- TTL: 15 minutes
- Fields: Campaign details
- Example: nexus:cache:campaign:camp_456
```

#### Creator Profile Cache
```
nexus:cache:creator:{creatorId}
- Type: Hash
- TTL: 30 minutes
- Fields: Creator profile and metrics
- Example: nexus:cache:creator:creator_789
```

#### Content Cache
```
nexus:cache:content:{contentId}
- Type: Hash
- TTL: 1 hour
- Fields: Content details and metadata
- Example: nexus:cache:content:content_abc
```

#### Organization Cache
```
nexus:cache:org:{organizationId}
- Type: Hash
- TTL: 30 minutes
- Fields: Organization details
- Example: nexus:cache:org:org_xyz
```

#### List/Search Results Cache
```
nexus:cache:list:{type}:{params_hash}
- Type: String (JSON)
- TTL: 5 minutes
- Value: Serialized array of results
- Example: nexus:cache:list:campaigns:hash_123
```

#### Cache Tags (for invalidation)
```
nexus:cache:tag:{tag}
- Type: Set
- TTL: 24 hours
- Members: Keys associated with this tag
- Example: nexus:cache:tag:campaign:camp_456
```

### 3. Rate Limiting (DB 2)

#### API Rate Limit (per user)
```
nexus:ratelimit:api:{userId}:{window}
- Type: String (counter)
- TTL: window duration (e.g., 60s)
- Value: request count
- Example: nexus:ratelimit:api:user_123:60
```

#### IP-based Rate Limit
```
nexus:ratelimit:ip:{ipAddress}:{endpoint}
- Type: String (counter)
- TTL: 1 minute
- Value: request count
- Example: nexus:ratelimit:ip:192.168.1.1:/api/login
```

#### Organization Rate Limit
```
nexus:ratelimit:org:{organizationId}:{resource}
- Type: String (counter)
- TTL: 1 hour
- Value: usage count
- Example: nexus:ratelimit:org:org_123:api_calls
```

#### Failed Login Attempts
```
nexus:ratelimit:login:fail:{email}
- Type: String (counter)
- TTL: 15 minutes
- Value: attempt count
- Example: nexus:ratelimit:login:fail:user@example.com
```

### 4. Real-time Features (DB 3)

#### Pub/Sub Channels
```
nexus:channel:notifications:{userId}
- Type: Pub/Sub Channel
- Purpose: User-specific notifications
- Example: nexus:channel:notifications:user_123

nexus:channel:campaign:{campaignId}
- Type: Pub/Sub Channel
- Purpose: Campaign updates
- Example: nexus:channel:campaign:camp_456

nexus:channel:system:broadcast
- Type: Pub/Sub Channel
- Purpose: System-wide announcements
```

#### Live Stats
```
nexus:stats:live:campaign:{campaignId}
- Type: Hash
- TTL: 1 minute
- Fields: views, clicks, conversions (real-time counters)
- Example: nexus:stats:live:campaign:camp_456
```

#### Active Connections
```
nexus:connections:websocket
- Type: Set
- TTL: None
- Members: connectionId1, connectionId2, ...
```

### 5. Queue Management (DB 4)

#### Job Queues (BullMQ/Redis)
```
nexus:queue:{queueName}
- Type: List
- TTL: None
- Purpose: Job queue
- Example: nexus:queue:email-sending

nexus:queue:{queueName}:active
nexus:queue:{queueName}:completed
nexus:queue:{queueName}:failed
```

#### Background Jobs
```
nexus:job:{jobId}
- Type: Hash
- TTL: 24 hours (after completion)
- Fields: status, progress, result, error
- Example: nexus:job:job_abc123
```

#### Scheduled Tasks
```
nexus:schedule:{taskType}
- Type: Sorted Set
- TTL: None
- Score: timestamp
- Members: taskId
- Example: nexus:schedule:campaign_reminder
```

### 6. Analytics Cache (DB 5)

#### Aggregated Metrics
```
nexus:analytics:campaign:{campaignId}:{period}
- Type: Hash
- TTL: 1 hour
- Fields: metrics (views, clicks, conversions)
- Example: nexus:analytics:campaign:camp_456:daily

nexus:analytics:creator:{creatorId}:{period}
- Type: Hash
- TTL: 1 hour
- Fields: performance metrics
```

#### Leaderboards
```
nexus:leaderboard:creators:{metric}
- Type: Sorted Set
- TTL: 1 hour
- Score: metric value
- Members: creatorId
- Example: nexus:leaderboard:creators:engagement
```

#### Trending Content
```
nexus:trending:content:{period}
- Type: Sorted Set
- TTL: 15 minutes
- Score: trending score
- Members: contentId
- Example: nexus:trending:content:24h
```

### 7. Feature Flags & Configuration

#### Feature Flags
```
nexus:feature:{featureName}
- Type: String
- TTL: None
- Value: enabled/disabled or config JSON
- Example: nexus:feature:new_dashboard
```

#### Organization Features
```
nexus:feature:org:{organizationId}
- Type: Set
- TTL: None
- Members: enabled feature names
- Example: nexus:feature:org:org_123
```

### 8. Locks & Semaphores

#### Distributed Locks
```
nexus:lock:{resource}:{resourceId}
- Type: String
- TTL: 30 seconds (with renewal)
- Value: lockId
- Example: nexus:lock:campaign:camp_456
```

#### Semaphores
```
nexus:semaphore:{resource}:{limit}
- Type: Sorted Set
- TTL: None
- Score: timestamp
- Example: nexus:semaphore:video_processing:10
```

### 9. Temporary Data

#### Email Verification Codes
```
nexus:verify:email:{code}
- Type: String
- TTL: 15 minutes
- Value: userId
- Example: nexus:verify:email:ABC123
```

#### Password Reset Tokens
```
nexus:reset:password:{token}
- Type: String
- TTL: 1 hour
- Value: userId
- Example: nexus:reset:password:token_xyz
```

#### One-Time Tokens
```
nexus:otp:{purpose}:{identifier}
- Type: String
- TTL: 10 minutes
- Value: token value
- Example: nexus:otp:mfa:user_123
```

### 10. Search & Autocomplete

#### Search Suggestions
```
nexus:search:suggest:{type}
- Type: Sorted Set
- TTL: 24 hours
- Score: popularity
- Members: search terms
- Example: nexus:search:suggest:campaigns
```

#### Recent Searches (per user)
```
nexus:search:recent:{userId}
- Type: List (LPUSH/LTRIM to keep last 10)
- TTL: 7 days
- Members: search queries
- Example: nexus:search:recent:user_123
```

## Cache Invalidation Strategies

### Tag-based Invalidation
```javascript
// When campaign is updated
await redis.del(`nexus:cache:campaign:${campaignId}`);
const keys = await redis.smembers(`nexus:cache:tag:campaign:${campaignId}`);
await redis.del(...keys);
await redis.del(`nexus:cache:tag:campaign:${campaignId}`);
```

### Pattern-based Invalidation
```javascript
// Invalidate all user caches
const keys = await redis.keys('nexus:cache:user:*');
await redis.del(...keys);
```

## Best Practices

### 1. Key Expiration
- Always set TTL on cache keys
- Use appropriate TTL based on data volatility
- Implement cache warming for critical data

### 2. Memory Management
- Monitor memory usage
- Use appropriate data structures
- Implement LRU eviction policy

### 3. Connection Pooling
```javascript
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});
```

### 4. Pipeline Operations
```javascript
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

### 5. Lua Scripts for Atomic Operations
```lua
-- Rate limiting script
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, ttl)
end

if current > limit then
  return 0
end

return 1
```

## Monitoring Commands

```bash
# Monitor active commands
redis-cli MONITOR

# Get info
redis-cli INFO

# Check memory usage
redis-cli INFO memory

# Get slow queries
redis-cli SLOWLOG GET 10

# Get key count
redis-cli DBSIZE

# Scan for keys
redis-cli --scan --pattern 'nexus:cache:*'
```

## Backup & Recovery

### RDB Snapshots
```bash
# Manual save
redis-cli BGSAVE

# Get last save time
redis-cli LASTSAVE
```

### AOF Rewrite
```bash
# Trigger AOF rewrite
redis-cli BGREWRITEAOF
```

## Security

### Authentication
```bash
# Set password
CONFIG SET requirepass "your_strong_password"
```

### Rename Dangerous Commands
```
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_abc123"
```

## Performance Tips

1. Use pipelining for multiple operations
2. Implement connection pooling
3. Use appropriate data structures
4. Monitor slow queries
5. Set appropriate TTLs
6. Use lazy deletion for large keys
7. Implement cache warming
8. Monitor memory usage
9. Use Redis Cluster for horizontal scaling
10. Implement circuit breakers

## Troubleshooting

### High Memory Usage
```bash
# Find biggest keys
redis-cli --bigkeys

# Sample keys
redis-cli --memkeys
```

### Slow Performance
```bash
# Check slow log
redis-cli SLOWLOG GET 100

# Monitor latency
redis-cli --latency
```

### Connection Issues
```bash
# Check connections
redis-cli CLIENT LIST

# Kill specific client
redis-cli CLIENT KILL <ip:port>
```
