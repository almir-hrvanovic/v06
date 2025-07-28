import { initializeCronJobs } from './cron-jobs'
import { createDefaultEmailTemplates } from './email-service'

let initialized = false

export async function initializeAutomation() {
  if (initialized) return
  
  try {
    // Initialize cron jobs
    if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_CRON === 'true') {
      console.log('Initializing automation cron jobs...')
      initializeCronJobs()
    }
    
    // Create default email templates if they don't exist
    console.log('Creating default email templates...')
    await createDefaultEmailTemplates()
    
    initialized = true
    console.log('Automation system initialized successfully')
  } catch (error) {
    console.error('Failed to initialize automation:', error)
  }
}