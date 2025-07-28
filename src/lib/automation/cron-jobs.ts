import { checkDeadlines } from './deadline-service'

// Simple in-memory job scheduler
class CronJobManager {
  private jobs: Map<string, NodeJS.Timeout> = new Map()

  start(name: string, cronExpression: string, handler: () => Promise<void>) {
    // For now, we'll use simple intervals instead of cron expressions
    const intervals: Record<string, number> = {
      '*/15 * * * *': 15 * 60 * 1000, // Every 15 minutes
      '0 * * * *': 60 * 60 * 1000,    // Every hour
      '0 0 * * *': 24 * 60 * 60 * 1000, // Daily
    }

    const interval = intervals[cronExpression] || 60 * 60 * 1000 // Default to hourly

    // Clear existing job if any
    this.stop(name)

    // Create new interval
    const job = setInterval(async () => {
      try {
        console.log(`Running cron job: ${name}`)
        await handler()
      } catch (error) {
        console.error(`Error in cron job ${name}:`, error)
      }
    }, interval)

    this.jobs.set(name, job)
    console.log(`Started cron job: ${name} with interval ${interval}ms`)

    // Run immediately on start
    handler().catch(error => {
      console.error(`Error in initial run of cron job ${name}:`, error)
    })
  }

  stop(name: string) {
    const job = this.jobs.get(name)
    if (job) {
      clearInterval(job)
      this.jobs.delete(name)
      console.log(`Stopped cron job: ${name}`)
    }
  }

  stopAll() {
    for (const [name, job] of this.jobs.entries()) {
      clearInterval(job)
      console.log(`Stopped cron job: ${name}`)
    }
    this.jobs.clear()
  }
}

export const cronManager = new CronJobManager()

// Initialize cron jobs
export function initializeCronJobs() {
  // Check deadlines every 15 minutes
  cronManager.start('check-deadlines', '*/15 * * * *', checkDeadlines)

  // Add more cron jobs as needed
  // cronManager.start('cleanup-old-logs', '0 0 * * *', cleanupOldLogs)
  // cronManager.start('send-daily-reports', '0 9 * * *', sendDailyReports)
}

// Cleanup function for graceful shutdown
export function stopCronJobs() {
  cronManager.stopAll()
}