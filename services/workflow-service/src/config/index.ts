export const config = {
  serviceName: 'workflow-service',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3010', 10),
  cors: { origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'] },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  workflow: {
    maxExecutionTime: parseInt(process.env.WORKFLOW_MAX_EXECUTION_TIME || '300000', 10), // 5 minutes
    maxSteps: parseInt(process.env.WORKFLOW_MAX_STEPS || '100', 10),
  },
};
