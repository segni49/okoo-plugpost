// WebSocket API endpoint for real-time features
import { NextRequest } from 'next/server'
import { webSocketManager } from '@/lib/websocket-server'

// This endpoint handles WebSocket upgrade requests
export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade')
  
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  // WebSocket connections are handled by the WebSocket server
  // This endpoint is mainly for documentation and health checks
  return new Response(JSON.stringify({
    message: 'WebSocket endpoint active',
    stats: webSocketManager.getStats(),
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Health check for WebSocket server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'broadcast':
        // Broadcast message to all connected clients
        webSocketManager.emitToAll('system_maintenance', {
          message: data.message,
          scheduledAt: data.scheduledAt,
        })
        return new Response(JSON.stringify({ success: true }))

      case 'stats':
        // Get WebSocket server statistics
        return new Response(JSON.stringify({
          stats: webSocketManager.getStats(),
          timestamp: new Date().toISOString(),
        }))

      case 'notify_user':
        // Send notification to specific user
        webSocketManager.emitToUser(data.userId, 'notification', data.notification)
        return new Response(JSON.stringify({ success: true }))

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
    }
  } catch (error) {
    console.error('WebSocket API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
