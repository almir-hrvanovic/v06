import { NextRequest, NextResponse } from 'next/server'
import { ApiOptimizer } from '@/lib/api-optimization'
import { z } from 'zod'

// Schema for batch request validation
const batchRequestSchema = z.object({
  operations: z.array(z.object({
    id: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    url: z.string(),
    body: z.any().optional()
  })).min(1).max(10) // Limit to 10 operations per batch
})

/**
 * Batch API endpoint for handling multiple operations in a single request
 * This reduces the number of HTTP requests and improves performance
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { optimizedAuth } = await import('@/utils/supabase/optimized-auth');
    const user = await optimizedAuth.getUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json()
    const validatedData = batchRequestSchema.parse(body)

    // Log the batch request
    console.log(`[Batch API] Processing ${validatedData.operations.length} operations for user ${user.email}`)

    // Use the ApiOptimizer's batch handler
    return await ApiOptimizer.handleBatchRequest(request, validatedData.operations)

  } catch (error) {
    console.error('[Batch API] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid batch request format', 
          details: error.errors,
          example: {
            operations: [
              {
                id: 'get-users',
                method: 'GET',
                url: '/api/users'
              },
              {
                id: 'get-inquiries',
                method: 'GET', 
                url: '/api/inquiries?limit=5'
              }
            ]
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Batch request failed' },
      { status: 500 }
    )
  }
}