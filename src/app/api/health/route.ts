import { NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { redis } from '@/lib/redis'
import { serverMonitor } from '@/lib/server-monitoring'

export async function GET() {
  const startTime = Date.now()
  
  serverMonitor.log({
    level: 'info',
    source: 'api',
    message: 'Health check started'
  })

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking',
      redis: 'checking',
      uploadthing: 'checking'
    }
  }

  // Check database
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbDuration = Date.now() - dbStart
    health.services.database = 'healthy'
    
    serverMonitor.logDatabaseOperation('health_check', 'system', 'SELECT 1', dbDuration)
  } catch (error: any) {
    health.services.database = 'error'
    health.status = 'degraded'
    
    serverMonitor.logDatabaseOperation('health_check', 'system', 'SELECT 1', undefined, error)
  }

  // Check Redis
  try {
    const redisStart = Date.now()
    const redisClient = redis()
    if (redisClient) {
      await redisClient.ping()
      const redisDuration = Date.now() - redisStart
      health.services.redis = 'healthy'
      
      serverMonitor.logRedisOperation('PING', 'health_check', redisDuration)
    } else {
      health.services.redis = 'not-configured'
      serverMonitor.log({
        level: 'info',
        source: 'redis',
        message: 'Redis not configured'
      })
    }
  } catch (error: any) {
    health.services.redis = 'error'
    health.status = 'degraded'
    
    serverMonitor.logRedisOperation('PING', 'health_check', undefined, error)
  }

  // Check UploadThing
  try {
    if (process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_TOKEN) {
      health.services.uploadthing = 'configured'
    } else {
      health.services.uploadthing = 'not-configured'
    }
    
    serverMonitor.log({
      level: 'info',
      source: 'api',
      message: `UploadThing status: ${health.services.uploadthing}`
    })
  } catch (error: any) {
    health.services.uploadthing = 'error'
    
    serverMonitor.log({
      level: 'error',
      source: 'api',
      message: `UploadThing check failed: ${error.message}`
    })
  }

  const totalDuration = Date.now() - startTime
  
  serverMonitor.log({
    level: 'info',
    source: 'api',
    message: `Health check completed (${totalDuration}ms) - Status: ${health.status}`,
    duration: totalDuration,
    data: health
  })

  return NextResponse.json(health)
}