// Advanced database optimization utilities
import { PrismaClient } from '@prisma/client'
import { getCacheManager } from './cache'

// Database connection pool configuration
const DATABASE_CONFIG = {
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
  timeout: parseInt(process.env.DATABASE_TIMEOUT || '60000'),
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
}

// Query performance monitoring
class QueryPerformanceMonitor {
  private slowQueries: Array<{
    query: string
    duration: number
    timestamp: Date
    params?: any
  }> = []

  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second

  logQuery(query: string, duration: number, params?: any) {
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push({
        query,
        duration,
        timestamp: new Date(),
        params,
      })

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100)
      }

      console.warn(`Slow query detected (${duration}ms):`, query)
    }
  }

  getSlowQueries() {
    return [...this.slowQueries]
  }

  clearSlowQueries() {
    this.slowQueries = []
  }
}

const queryMonitor = new QueryPerformanceMonitor()

// Enhanced Prisma client with caching and monitoring
export class OptimizedPrismaClient extends PrismaClient {
  private cache = getCacheManager()

  constructor() {
    super({
      log: DATABASE_CONFIG.log as any,
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })

    // Add query monitoring middleware
    this.$use(async (params, next) => {
      const start = Date.now()
      const result = await next(params)
      const duration = Date.now() - start

      queryMonitor.logQuery(
        `${params.model}.${params.action}`,
        duration,
        params.args
      )

      return result
    })
  }

  // Cached post queries
  async findPostWithCache(id: string) {
    const cacheKey = `post:${id}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        return await this.post.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                bio: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
                bookmarks: true,
              },
            },
          },
        })
      },
      300 // 5 minutes cache
    )
  }

  // Optimized posts listing with pagination and caching
  async findPostsOptimized(params: {
    page?: number
    limit?: number
    status?: string
    categoryId?: string
    authorId?: string
    search?: string
  }) {
    const { page = 1, limit = 10, status, categoryId, authorId, search } = params
    const offset = (page - 1) * limit

    // Create cache key based on parameters
    const cacheKey = `posts:${JSON.stringify(params)}`

    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = {}

        if (status) where.status = status
        if (categoryId) where.categoryId = categoryId
        if (authorId) where.authorId = authorId
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
          ]
        }

        const [posts, total] = await Promise.all([
          this.post.findMany({
            where,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          this.post.count({ where }),
        ])

        return {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        }
      },
      180 // 3 minutes cache
    )
  }

  // Cached user queries
  async findUserWithCache(id: string) {
    const cacheKey = `user:${id}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        return await this.user.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                posts: true,
                comments: true,
                followers: true,
                following: true,
              },
            },
          },
        })
      },
      600 // 10 minutes cache
    )
  }

  // Cached categories
  async findCategoriesWithCache() {
    return await this.cache.getOrSet(
      'categories:all',
      async () => {
        return await this.category.findMany({
          include: {
            _count: {
              select: {
                posts: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        })
      },
      1800 // 30 minutes cache
    )
  }

  // Optimized search with full-text search capabilities
  async searchContent(query: string, options: {
    limit?: number
    offset?: number
    type?: 'posts' | 'users' | 'all'
  } = {}) {
    const { limit = 20, offset = 0, type = 'all' } = options
    const cacheKey = `search:${query}:${JSON.stringify(options)}`

    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const results: any = {}

        if (type === 'posts' || type === 'all') {
          results.posts = await this.post.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
              ],
              status: 'PUBLISHED',
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          })
        }

        if (type === 'users' || type === 'all') {
          results.users = await this.user.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { bio: { contains: query, mode: 'insensitive' } },
              ],
              status: 'ACTIVE',
            },
            select: {
              id: true,
              name: true,
              bio: true,
              _count: {
                select: {
                  posts: true,
                  followers: true,
                },
              },
            },
            take: limit,
            skip: offset,
          })
        }

        return results
      },
      300 // 5 minutes cache
    )
  }

  // Analytics queries with caching
  async getAnalyticsData(timeframe: 'day' | 'week' | 'month' = 'week') {
    const cacheKey = `analytics:${timeframe}`

    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        let startDate: Date

        switch (timeframe) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        }

        const [
          totalPosts,
          totalUsers,
          totalComments,
          recentPosts,
          recentUsers,
          recentComments,
        ] = await Promise.all([
          this.post.count(),
          this.user.count(),
          this.comment.count(),
          this.post.count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          }),
          this.user.count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          }),
          this.comment.count({
            where: {
              createdAt: {
                gte: startDate,
              },
            },
          }),
        ])

        return {
          totals: {
            posts: totalPosts,
            users: totalUsers,
            comments: totalComments,
          },
          recent: {
            posts: recentPosts,
            users: recentUsers,
            comments: recentComments,
          },
          timeframe,
          generatedAt: new Date(),
        }
      },
      60 // 1 minute cache
    )
  }

  // Clear related caches when data changes
  async invalidatePostCache(postId: string) {
    await this.cache.del(`post:${postId}`)
    await this.cache.delPattern('posts:*')
    await this.cache.delPattern('analytics:*')
  }

  async invalidateUserCache(userId: string) {
    await this.cache.del(`user:${userId}`)
    await this.cache.delPattern('analytics:*')
  }

  async invalidateCategoryCache() {
    await this.cache.delPattern('categories:*')
  }

  // Get query performance statistics
  getQueryStats() {
    return {
      slowQueries: queryMonitor.getSlowQueries(),
      cacheStats: this.cache.getStats(),
    }
  }
}

// Export singleton instance
export const optimizedPrisma = new OptimizedPrismaClient()

// Database health check
export async function checkDatabaseHealth() {
  try {
    const start = Date.now()
    await optimizedPrisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start

    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date(),
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    }
  }
}

export { queryMonitor }
