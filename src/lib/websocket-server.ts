// WebSocket server for real-time features
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { optimizedPrisma } from './database-optimization'

// WebSocket event types
export interface ServerToClientEvents {
  // Notification events
  notification: (data: {
    id: string
    type: 'like' | 'comment' | 'follow' | 'post_published'
    title: string
    message: string
    userId: string
    createdAt: string
    read: boolean
  }) => void

  // Comment events
  new_comment: (data: {
    postId: string
    comment: {
      id: string
      content: string
      author: {
        id: string
        name: string
      }
      createdAt: string
      parentId?: string
    }
  }) => void

  comment_updated: (data: {
    postId: string
    commentId: string
    content: string
    updatedAt: string
  }) => void

  comment_deleted: (data: {
    postId: string
    commentId: string
  }) => void

  // Like events
  post_liked: (data: {
    postId: string
    userId: string
    likeCount: number
  }) => void

  post_unliked: (data: {
    postId: string
    userId: string
    likeCount: number
  }) => void

  // User activity events
  user_online: (data: {
    userId: string
    name: string
  }) => void

  user_offline: (data: {
    userId: string
  }) => void

  // Analytics events
  analytics_update: (data: {
    type: 'page_view' | 'post_view' | 'user_action'
    data: any
  }) => void

  // System events
  system_maintenance: (data: {
    message: string
    scheduledAt?: string
  }) => void
}

export interface ClientToServerEvents {
  // Join/leave rooms
  join_post: (postId: string) => void
  leave_post: (postId: string) => void
  join_user: (userId: string) => void
  leave_user: (userId: string) => void

  // Comment events
  typing_start: (data: { postId: string; userId: string; userName: string }) => void
  typing_stop: (data: { postId: string; userId: string }) => void

  // Analytics events
  track_event: (data: {
    event: string
    properties: Record<string, any>
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  userName?: string
  userRole?: string
}

// WebSocket manager class
class WebSocketManager {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null

  private connectedUsers = new Map<string, Set<string>>() // userId -> Set of socketIds
  private typingUsers = new Map<string, Set<string>>() // postId -> Set of userIds

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    this.setupEventHandlers()
    console.log('WebSocket server initialized')
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', async (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      // Authenticate user
      const session = await this.authenticateSocket(socket)
      if (session?.user) {
        socket.data.userId = session.user.id
        socket.data.userName = session.user.name || 'Anonymous'
        socket.data.userRole = session.user.role

        // Track connected user
        this.addConnectedUser(session.user.id, socket.id)

        // Join user's personal room
        socket.join(`user:${session.user.id}`)

        // Notify others that user is online
        socket.broadcast.emit('user_online', {
          userId: session.user.id,
          name: session.user.name || 'Anonymous',
        })

        console.log(`User ${session.user.name} connected`)
      }

      // Handle joining post rooms
      socket.on('join_post', (postId) => {
        socket.join(`post:${postId}`)
        console.log(`Socket ${socket.id} joined post room: ${postId}`)
      })

      // Handle leaving post rooms
      socket.on('leave_post', (postId) => {
        socket.leave(`post:${postId}`)
        console.log(`Socket ${socket.id} left post room: ${postId}`)
      })

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        if (!socket.data.userId) return

        const { postId } = data
        if (!this.typingUsers.has(postId)) {
          this.typingUsers.set(postId, new Set())
        }
        this.typingUsers.get(postId)!.add(socket.data.userId)

        socket.to(`post:${postId}`).emit('typing_start', {
          postId,
          userId: socket.data.userId,
          userName: socket.data.userName || 'Anonymous',
        })
      })

      socket.on('typing_stop', (data) => {
        if (!socket.data.userId) return

        const { postId } = data
        const typingSet = this.typingUsers.get(postId)
        if (typingSet) {
          typingSet.delete(socket.data.userId)
          if (typingSet.size === 0) {
            this.typingUsers.delete(postId)
          }
        }

        socket.to(`post:${postId}`).emit('typing_stop', {
          postId,
          userId: socket.data.userId,
        })
      })

      // Handle analytics tracking
      socket.on('track_event', async (data) => {
        if (!socket.data.userId) return

        try {
          // Store analytics event in database
          await optimizedPrisma.analytics.create({
            data: {
              userId: socket.data.userId,
              event: data.event,
              properties: data.properties,
              timestamp: new Date(),
              sessionId: socket.id,
            },
          })

          // Broadcast analytics update to admin users
          this.io?.to('admin').emit('analytics_update', {
            type: 'user_action',
            data: {
              event: data.event,
              userId: socket.data.userId,
              properties: data.properties,
            },
          })
        } catch (error) {
          console.error('Error tracking analytics event:', error)
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)

        if (socket.data.userId) {
          this.removeConnectedUser(socket.data.userId, socket.id)

          // If user has no more connections, notify others they're offline
          if (!this.connectedUsers.has(socket.data.userId)) {
            socket.broadcast.emit('user_offline', {
              userId: socket.data.userId,
            })
          }

          // Clean up typing indicators
          for (const [postId, typingSet] of this.typingUsers.entries()) {
            if (typingSet.has(socket.data.userId)) {
              typingSet.delete(socket.data.userId)
              socket.to(`post:${postId}`).emit('typing_stop', {
                postId,
                userId: socket.data.userId,
              })
              
              if (typingSet.size === 0) {
                this.typingUsers.delete(postId)
              }
            }
          }
        }
      })
    })
  }

  private async authenticateSocket(socket: any) {
    try {
      // Get session from socket handshake
      const req = socket.request as NextApiRequest
      const session = await getServerSession(req, {} as any, authOptions)
      return session
    } catch (error) {
      console.error('Socket authentication error:', error)
      return null
    }
  }

  private addConnectedUser(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set())
    }
    this.connectedUsers.get(userId)!.add(socketId)
  }

  private removeConnectedUser(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId)
    if (userSockets) {
      userSockets.delete(socketId)
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId)
      }
    }
  }

  // Public methods for emitting events
  emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return
    this.io.to(`user:${userId}`).emit(event, data)
  }

  emitToPost(postId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return
    this.io.to(`post:${postId}`).emit(event, data)
  }

  emitToAll(event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return
    this.io.emit(event, data)
  }

  emitToAdmins(event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return
    this.io.to('admin').emit(event, data)
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  // Get users typing in a post
  getTypingUsers(postId: string): string[] {
    const typingSet = this.typingUsers.get(postId)
    return typingSet ? Array.from(typingSet) : []
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  // Get server statistics
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: Array.from(this.connectedUsers.values())
        .reduce((sum, sockets) => sum + sockets.size, 0),
      typingUsers: this.typingUsers.size,
    }
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager()

// Helper functions for common operations
export const websocketHelpers = {
  // Notify user about new comment
  notifyNewComment: async (postId: string, comment: any) => {
    const post = await optimizedPrisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true },
    })

    if (post && post.authorId !== comment.authorId) {
      webSocketManager.emitToUser(post.authorId, 'notification', {
        id: `comment-${comment.id}`,
        type: 'comment',
        title: 'New Comment',
        message: `${comment.author.name} commented on your post "${post.title}"`,
        userId: comment.authorId,
        createdAt: comment.createdAt,
        read: false,
      })
    }

    // Emit to post room
    webSocketManager.emitToPost(postId, 'new_comment', {
      postId,
      comment,
    })
  },

  // Notify about post like
  notifyPostLike: async (postId: string, userId: string) => {
    const [post, user] = await Promise.all([
      optimizedPrisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
      }),
      optimizedPrisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ])

    if (post && user && post.authorId !== userId) {
      webSocketManager.emitToUser(post.authorId, 'notification', {
        id: `like-${postId}-${userId}`,
        type: 'like',
        title: 'Post Liked',
        message: `${user.name} liked your post "${post.title}"`,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
      })
    }

    // Get updated like count
    const likeCount = await optimizedPrisma.like.count({
      where: { postId },
    })

    webSocketManager.emitToPost(postId, 'post_liked', {
      postId,
      userId,
      likeCount,
    })
  },

  // System maintenance notification
  notifyMaintenance: (message: string, scheduledAt?: Date) => {
    webSocketManager.emitToAll('system_maintenance', {
      message,
      scheduledAt: scheduledAt?.toISOString(),
    })
  },
}

export default webSocketManager
