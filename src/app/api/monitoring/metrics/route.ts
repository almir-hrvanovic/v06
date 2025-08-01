import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createOptimizationLogger } from '@/lib/optimization-logger';

const logger = createOptimizationLogger('metrics-api', 'foundation');

export async function GET(request: NextRequest) {
  try {
    logger.startOperation('collect-metrics');
    
    // Collect real-time metrics
    const metrics = await performanceMonitor.measurePageLoad();
    
    logger.endOperation('collect-metrics', true, {
      pageLoadTime: metrics.pageLoadTime,
      cacheHitRate: metrics.cacheHitRate
    });
    
    // Get active alerts
    const alerts = performanceMonitor.getActiveAlerts();
    
    // Log critical metrics
    if (metrics.pageLoadTime > 5000) {
      logger.logIssue('CRITICAL', 'Page load time exceeds threshold', {
        current: metrics.pageLoadTime,
        threshold: 5000
      });
    }
    
    return NextResponse.json({
      success: true,
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.endOperation('collect-metrics', false, { error });
    logger.log('ERROR', 'Failed to collect metrics', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get performance report
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'generate-report') {
      const report = performanceMonitor.generateReport();
      const loggerReport = logger.generateReport();
      
      return NextResponse.json({
        success: true,
        performanceReport: report,
        loggerReport: loggerReport
      });
    }
    
    if (action === 'clear-alerts') {
      performanceMonitor.clearAlerts();
      return NextResponse.json({
        success: true,
        message: 'Alerts cleared'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}