import { NextRequest } from 'next/server'

const clients = new Map<string, WebSocket>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response('Missing userId parameter', { status: 400 })
  }

  // For Next.js API routes, we need to handle WebSocket upgrade differently
  // This is a placeholder - in production, you'd use a WebSocket server
  // like ws library or integrate with a service like Pusher, Ably, or Socket.io

  return new Response('WebSocket endpoint - use a proper WebSocket server in production', {
    status: 501,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Utility functions (not exported as route handlers)
function broadcastNotification(userId: string, notification: any) {
  const client = clients.get(userId)
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(notification))
  }
}

function broadcastToAll(notification: any) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification))
    }
  })
}