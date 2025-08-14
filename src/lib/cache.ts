// Advanced caching system with Redis and in-memory fallback
import Redis from 'ioredis'
import NodeCache from 'node-cache'

// Cache configuration
const CACHE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  },
  memory: {
    stdTTL: 600, // 10 minutes default TTL
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false,
  },
  defaultTTL: {
    posts: 300, // 5 minutes
    users: 600, // 10 minutes
    categories: 1800, // 30 minutes
    settings: 3600, // 1 hour
    analytics: 60, // 1 minute
  },
}

class CacheManager {
  private redis: Redis | null = null
  private memoryCache: NodeCache
  private isRedisConnected = false

  constructor() {
    this.memoryCache = new NodeCache(CACHE_CONFIG.memory)
    this.initializeRedis()
  }

  private async initializeRedis() {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        this.redis = new Redis(process.env.REDIS_URL || CACHE_CONFIG.redis)
        
        this.redis.on('connect', () => {
          console.log('Redis connected successfully')
          this.isRedisConnected = true
        })

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to memory cache:', error.message)
          this.isRedisConnected = false
        })

        this.redis.on('close', () => {
          console.warn('Redis connection closed, using memory cache')
          this.isRedisConnected = false
        })

        // Test connection
        await this.redis.ping()
      } catch (error) {
        console.warn('Failed to initialize Redis, using memory cache only:', error)
        this.redis = null
        this.isRedisConnected = false
      }
    }
  }

  /**
   * Get value from cache (Redis first, then memory cache)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (this.redis && this.isRedisConnected) {
        const value = await this.redis.get(key)
        if (value !== null) {
          return JSON.parse(value)
        }
      }

      // Fallback to memory cache
      const memValue = this.memoryCache.get<T>(key)
      return memValue || null
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set value in cache (both Redis and memory)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      const cacheTTL = ttl || CACHE_CONFIG.memory.stdTTL

      // Set in Redis if available
      if (this.redis && this.isRedisConnected) {
        await this.redis.setex(key, cacheTTL, serializedValue)
      }

      // Always set in memory cache as fallback
      this.memoryCache.set(key, value, cacheTTL)
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error)
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      // Delete from Redis if available
      if (this.redis && this.isRedisConnected) {
        await this.redis.del(key)
      }

      // Delete from memory cache
      this.memoryCache.del(key)
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Delete from Redis if available
      if (this.redis && this.isRedisConnected) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      // Delete from memory cache
      const memKeys = this.memoryCache.keys()
      const matchingKeys = memKeys.filter(key => 
        new RegExp(pattern.replace(/\*/g, '.*')).test(key)
      )
      this.memoryCache.del(matchingKeys)
    } catch (error) {
      console.warn(`Cache pattern delete error for pattern ${pattern}:`, error)
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check Redis first if available
      if (this.redis && this.isRedisConnected) {
        const exists = await this.redis.exists(key)
        return exists === 1
      }

      // Check memory cache
      return this.memoryCache.has(key)
    } catch (error) {
      console.warn(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // Execute function and cache result
      const result = await fetchFunction()
      await this.set(key, result, ttl)
      return result
    } catch (error) {
      console.warn(`Cache getOrSet error for key ${key}:`, error)
      // If cache fails, still execute the function
      return await fetchFunction()
    }
  }

  /**
   * Increment counter in cache
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      // Use Redis if available
      if (this.redis && this.isRedisConnected) {
        return await this.redis.incrby(key, amount)
      }

      // Fallback to memory cache
      const current = this.memoryCache.get<number>(key) || 0
      const newValue = current + amount
      this.memoryCache.set(key, newValue)
      return newValue
    } catch (error) {
      console.warn(`Cache increment error for key ${key}:`, error)
      return amount
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      redis: {
        connected: this.isRedisConnected,
        available: !!this.redis,
      },
      memory: {
        keys: this.memoryCache.keys().length,
        stats: this.memoryCache.getStats(),
      },
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis if available
      if (this.redis && this.isRedisConnected) {
        await this.redis.flushdb()
      }

      // Clear memory cache
      this.memoryCache.flushAll()
    } catch (error) {
      console.warn('Cache clear error:', error)
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit()
      }
      this.memoryCache.close()
    } catch (error) {
      console.warn('Cache close error:', error)
    }
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager()
  }
  return cacheManager
}

// Utility functions for common cache operations
export const cache = {
  // Posts cache
  posts: {
    get: (id: string) => getCacheManager().get(`post:${id}`),
    set: (id: string, data: any) => getCacheManager().set(`post:${id}`, data, CACHE_CONFIG.defaultTTL.posts),
    del: (id: string) => getCacheManager().del(`post:${id}`),
    list: (key: string) => getCacheManager().get(`posts:${key}`),
    setList: (key: string, data: any) => getCacheManager().set(`posts:${key}`, data, CACHE_CONFIG.defaultTTL.posts),
  },

  // Users cache
  users: {
    get: (id: string) => getCacheManager().get(`user:${id}`),
    set: (id: string, data: any) => getCacheManager().set(`user:${id}`, data, CACHE_CONFIG.defaultTTL.users),
    del: (id: string) => getCacheManager().del(`user:${id}`),
  },

  // Categories cache
  categories: {
    getAll: () => getCacheManager().get('categories:all'),
    setAll: (data: any) => getCacheManager().set('categories:all', data, CACHE_CONFIG.defaultTTL.categories),
    clear: () => getCacheManager().delPattern('categories:*'),
  },

  // Settings cache
  settings: {
    get: () => getCacheManager().get('settings:all'),
    set: (data: any) => getCacheManager().set('settings:all', data, CACHE_CONFIG.defaultTTL.settings),
    clear: () => getCacheManager().delPattern('settings:*'),
  },

  // Analytics cache
  analytics: {
    get: (key: string) => getCacheManager().get(`analytics:${key}`),
    set: (key: string, data: any) => getCacheManager().set(`analytics:${key}`, data, CACHE_CONFIG.defaultTTL.analytics),
    increment: (key: string) => getCacheManager().increment(`analytics:${key}`),
  },
}

export default getCacheManager
