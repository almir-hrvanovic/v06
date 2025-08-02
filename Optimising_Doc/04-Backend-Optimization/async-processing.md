# Async Processing Implementation

## Overview
Implement asynchronous processing to handle heavy operations without blocking the main application thread, improving response times by 90%.

## Current Synchronous Bottlenecks
- Email sending blocking API responses
- Report generation timing out
- Image processing freezing UI
- Bulk operations causing 504 errors
- Analytics calculations blocking requests

## Async Processing Architecture

### 1. Message Queue Implementation

#### Bull Queue Setup (Redis-based)
```typescript
// src/lib/queue/setup.ts
import Bull from 'bull';
import Redis from 'ioredis';

// Create Redis connections for Bull
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
};

// Define queue types
export const queues = {
  email: new Bull('email', { redis: redisConfig }),
  reports: new Bull('reports', { redis: redisConfig }),
  images: new Bull('images', { redis: redisConfig }),
  analytics: new Bull('analytics', { redis: redisConfig }),
  bulk: new Bull('bulk-operations', { redis: redisConfig }),
};

// Queue configuration
Object.values(queues).forEach(queue => {
  queue.on('error', (error) => {
    console.error(`[Queue ${queue.name}] Error:`, error);
  });
  
  queue.on('failed', (job, err) => {
    console.error(`[Queue ${queue.name}] Job ${job.id} failed:`, err);
  });
});

// Export typed queues
export type EmailJob = {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
};

export type ReportJob = {
  userId: string;
  reportType: string;
  dateRange: { from: Date; to: Date };
  format: 'pdf' | 'excel' | 'csv';
};
```

### 2. Job Processors

#### Email Processor
```typescript
// src/workers/email-processor.ts
import { queues } from '@/lib/queue/setup';
import { sendEmail } from '@/lib/email/sender';

queues.email.process('send-email', async (job) => {
  const { to, subject, template, data } = job.data;
  
  console.log(`[Email] Processing job ${job.id}`);
  
  try {
    await sendEmail({
      to,
      subject,
      template,
      data,
    });
    
    console.log(`[Email] Job ${job.id} completed`);
    return { success: true, sentAt: new Date() };
  } catch (error) {
    console.error(`[Email] Job ${job.id} failed:`, error);
    throw error;
  }
});

// Batch email processing
queues.email.process('send-batch', 10, async (jobs) => {
  console.log(`[Email] Processing ${jobs.length} emails in batch`);
  
  const results = await Promise.allSettled(
    jobs.map(job => sendEmail(job.data))
  );
  
  return results.map((result, index) => ({
    jobId: jobs[index].id,
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : null,
  }));
});
```

#### Report Generator
```typescript
// src/workers/report-processor.ts
import { queues } from '@/lib/queue/setup';
import { generatePDF, generateExcel, generateCSV } from '@/lib/reports';

queues.reports.process('generate-report', async (job) => {
  const { userId, reportType, dateRange, format } = job.data;
  
  // Update job progress
  await job.progress(10);
  
  // Fetch data
  const data = await fetchReportData(userId, reportType, dateRange);
  await job.progress(40);
  
  // Generate report
  let result;
  switch (format) {
    case 'pdf':
      result = await generatePDF(data, reportType);
      break;
    case 'excel':
      result = await generateExcel(data, reportType);
      break;
    case 'csv':
      result = await generateCSV(data, reportType);
      break;
  }
  await job.progress(80);
  
  // Upload to storage
  const fileUrl = await uploadToStorage(result.buffer, result.filename);
  await job.progress(100);
  
  // Notify user
  await queues.email.add('send-email', {
    to: await getUserEmail(userId),
    subject: 'Your report is ready',
    template: 'report-ready',
    data: { reportType, downloadUrl: fileUrl },
  });
  
  return { fileUrl, generatedAt: new Date() };
});
```

### 3. Image Processing Pipeline

```typescript
// src/workers/image-processor.ts
import sharp from 'sharp';
import { queues } from '@/lib/queue/setup';

queues.images.process('resize-image', async (job) => {
  const { inputPath, sizes } = job.data;
  
  const results = [];
  
  for (const size of sizes) {
    const outputPath = getOutputPath(inputPath, size);
    
    await sharp(inputPath)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);
    
    results.push({
      size: `${size.width}x${size.height}`,
      path: outputPath,
    });
    
    // Update progress
    const progress = (results.length / sizes.length) * 100;
    await job.progress(progress);
  }
  
  return { processedImages: results };
});

// Batch image optimization
queues.images.process('optimize-batch', 5, async (jobs) => {
  return Promise.all(
    jobs.map(async (job) => {
      const { imagePath } = job.data;
      
      const optimized = await sharp(imagePath)
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
      
      await saveOptimized(imagePath, optimized);
      
      return {
        original: await getFileSize(imagePath),
        optimized: optimized.length,
        saved: Math.round((1 - optimized.length / await getFileSize(imagePath)) * 100),
      };
    })
  );
});
```

### 4. Analytics Processing

```typescript
// src/workers/analytics-processor.ts
import { queues } from '@/lib/queue/setup';

queues.analytics.process('calculate-metrics', async (job) => {
  const { userId, metricType, timeRange } = job.data;
  
  console.log(`[Analytics] Calculating ${metricType} for user ${userId}`);
  
  // Heavy computation
  const result = await calculateMetrics({
    userId,
    metricType,
    timeRange,
  });
  
  // Cache result
  await cache.set(
    `analytics:${userId}:${metricType}`,
    result,
    3600 // 1 hour TTL
  );
  
  // Store in database for historical data
  await db.analyticsResult.create({
    data: {
      userId,
      metricType,
      timeRange,
      result,
      calculatedAt: new Date(),
    },
  });
  
  return result;
});

// Scheduled analytics aggregation
export function scheduleAnalytics() {
  // Daily aggregation at 2 AM
  queues.analytics.add(
    'daily-aggregation',
    { type: 'daily' },
    {
      repeat: {
        cron: '0 2 * * *',
      },
    }
  );
  
  // Hourly metrics update
  queues.analytics.add(
    'hourly-metrics',
    { type: 'hourly' },
    {
      repeat: {
        cron: '0 * * * *',
      },
    }
  );
}
```

### 5. API Integration

#### Async Endpoints
```typescript
// src/app/api/reports/generate/route.ts
import { queues } from '@/lib/queue/setup';

export async function POST(request: Request) {
  const { reportType, dateRange, format } = await request.json();
  const userId = await getUserId(request);
  
  // Add job to queue
  const job = await queues.reports.add('generate-report', {
    userId,
    reportType,
    dateRange,
    format,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  });
  
  return Response.json({
    jobId: job.id,
    status: 'queued',
    message: 'Report generation started. You will receive an email when ready.',
  });
}

// Check job status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  const job = await queues.reports.getJob(jobId);
  
  if (!job) {
    return Response.json({ error: 'Job not found' }, { status: 404 });
  }
  
  const state = await job.getState();
  const progress = job.progress();
  
  return Response.json({
    jobId: job.id,
    state,
    progress,
    result: state === 'completed' ? job.returnvalue : null,
    error: state === 'failed' ? job.failedReason : null,
  });
}
```

### 6. Real-time Updates with SSE

```typescript
// src/app/api/jobs/[jobId]/stream/route.ts
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };
      
      // Poll job status
      const interval = setInterval(async () => {
        const job = await queues.reports.getJob(params.jobId);
        
        if (!job) {
          sendUpdate({ error: 'Job not found' });
          controller.close();
          clearInterval(interval);
          return;
        }
        
        const state = await job.getState();
        const progress = job.progress();
        
        sendUpdate({
          state,
          progress,
          result: state === 'completed' ? job.returnvalue : null,
        });
        
        if (state === 'completed' || state === 'failed') {
          controller.close();
          clearInterval(interval);
        }
      }, 1000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 7. Queue Management Dashboard

```typescript
// src/lib/queue/dashboard.ts
import { queues } from './setup';

export async function getQueueStats() {
  const stats = {};
  
  for (const [name, queue] of Object.entries(queues)) {
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    const delayed = await queue.getDelayedCount();
    
    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
  
  return stats;
}

// Clean old jobs
export async function cleanQueues(olderThan: number = 7 * 24 * 60 * 60 * 1000) {
  for (const queue of Object.values(queues)) {
    await queue.clean(olderThan, 'completed');
    await queue.clean(olderThan, 'failed');
  }
}
```

## Deployment Configuration

### Worker Process
```typescript
// src/workers/index.ts
import './email-processor';
import './report-processor';
import './image-processor';
import './analytics-processor';

console.log('[Workers] Starting job processors...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Workers] Shutting down...');
  
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
  
  process.exit(0);
});
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
    },
    {
      name: 'worker',
      script: './dist/workers/index.js',
      instances: 1,
      max_memory_restart: '1G',
    },
  ],
};
```

## Performance Impact

### Before Async Processing
- API response time: 5-30 seconds
- Timeouts on heavy operations
- Poor user experience
- Server blocking

### After Async Processing
- API response time: < 200ms
- All operations complete successfully
- Real-time progress updates
- Scalable architecture

## Success Metrics
- [ ] All heavy operations moved to queues
- [ ] API response time < 500ms for all endpoints
- [ ] Zero timeout errors
- [ ] Job failure rate < 1%
- [ ] Queue monitoring dashboard active
- [ ] Auto-scaling workers implemented

---
*Priority: HIGH for user experience*