/**
 * Storage settings cache for file upload components
 * Reduces API calls by caching settings that rarely change
 */

interface StorageSettings {
  storageProvider: 'UPLOADTHING' | 'LOCAL'
  maxFileSize: number
  allowedFileTypes: string[]
}

let settingsCache: {
  data: StorageSettings | null
  timestamp: number
} | null = null

// Cache duration (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000

/**
 * Fetch storage settings from API with caching
 */
export async function getStorageSettings(): Promise<StorageSettings | null> {
  // Check cache
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_DURATION) {
    return settingsCache.data
  }

  try {
    const response = await fetch('/api/system-settings', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      console.error('Failed to fetch storage settings:', response.status)
      return null
    }

    const data = await response.json()
    
    const settings: StorageSettings = {
      storageProvider: data.storageProvider || 'UPLOADTHING',
      maxFileSize: data.maxFileSize || 16777216, // 16MB default
      allowedFileTypes: data.allowedFileTypes || ['image/*', 'application/pdf']
    }

    // Update cache
    settingsCache = {
      data: settings,
      timestamp: Date.now()
    }

    return settings
  } catch (error) {
    console.error('Failed to fetch storage settings:', error)
    return null
  }
}

/**
 * Clear the cache (useful when settings are updated)
 */
export function clearStorageSettingsCache() {
  settingsCache = null
}