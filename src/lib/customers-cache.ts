/**
 * Customer list cache for reducing API calls
 * Customers don't change frequently, so we can cache them
 */

interface Customer {
  id: string
  name: string
  email: string
}

let customersCache: {
  data: Customer[] | null
  timestamp: number
} | null = null

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Get customers with caching
 */
export async function getCachedCustomers(): Promise<Customer[]> {
  // Check cache
  if (customersCache && Date.now() - customersCache.timestamp < CACHE_DURATION) {
    return customersCache.data || []
  }

  try {
    const response = await fetch('/api/customers', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      console.error('Failed to fetch customers:', response.status)
      return customersCache?.data || []
    }

    const result = await response.json()
    const customers = result.data || (Array.isArray(result) ? result : [])

    // Update cache
    customersCache = {
      data: customers,
      timestamp: Date.now()
    }

    return customers
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return customersCache?.data || []
  }
}

/**
 * Clear the cache (useful when customers are updated)
 */
export function clearCustomersCache() {
  customersCache = null
}