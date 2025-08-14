// AI-powered content recommendation system
import { optimizedPrisma } from './database-optimization'
import { getCacheManager } from './cache'

// Recommendation types
export type RecommendationType = 
  | 'similar_content' 
  | 'user_interest' 
  | 'trending' 
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'

// Content similarity calculation
interface ContentVector {
  postId: string
  title: string
  content: string
  category: string
  tags: string[]
  authorId: string
  publishedAt: Date
  viewCount: number
  likeCount: number
  commentCount: number
}

class ContentRecommendationEngine {
  private cache = getCacheManager()

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    limit = 10,
    types: RecommendationType[] = ['hybrid']
  ): Promise<Array<{
    postId: string
    score: number
    reason: RecommendationType
    metadata?: any
  }>> {
    const cacheKey = `recommendations:${userId}:${types.join(',')}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const recommendations = new Map<string, { score: number; reason: RecommendationType; metadata?: any }>()

        // Get user's interaction history
        const userProfile = await this.getUserProfile(userId)
        
        for (const type of types) {
          const typeRecommendations = await this.getRecommendationsByType(userId, userProfile, type, limit * 2)
          
          for (const rec of typeRecommendations) {
            const existing = recommendations.get(rec.postId)
            if (!existing || rec.score > existing.score) {
              recommendations.set(rec.postId, rec)
            }
          }
        }

        // Convert to array and sort by score
        return Array.from(recommendations.entries())
          .map(([postId, data]) => ({ postId, ...data }))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      },
      300 // 5 minutes cache
    )
  }

  /**
   * Get user profile for recommendations
   */
  private async getUserProfile(userId: string) {
    const cacheKey = `user_profile:${userId}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const [user, interactions] = await Promise.all([
          optimizedPrisma.user.findUnique({
            where: { id: userId },
            include: {
              posts: {
                select: { categoryId: true, tags: { include: { tag: true } } },
                take: 50,
              },
            },
          }),
          this.getUserInteractions(userId),
        ])

        if (!user) return null

        // Extract user interests from their posts and interactions
        const categoryInterests = new Map<string, number>()
        const tagInterests = new Map<string, number>()
        const authorInterests = new Map<string, number>()

        // From user's own posts
        user.posts.forEach(post => {
          if (post.categoryId) {
            categoryInterests.set(post.categoryId, (categoryInterests.get(post.categoryId) || 0) + 1)
          }
          post.tags.forEach(({ tag }) => {
            tagInterests.set(tag.id, (tagInterests.get(tag.id) || 0) + 1)
          })
        })

        // From user interactions (likes, comments, bookmarks)
        interactions.forEach(interaction => {
          if (interaction.categoryId) {
            const weight = interaction.type === 'bookmark' ? 3 : interaction.type === 'like' ? 2 : 1
            categoryInterests.set(interaction.categoryId, (categoryInterests.get(interaction.categoryId) || 0) + weight)
          }
          
          interaction.tags.forEach(tagId => {
            const weight = interaction.type === 'bookmark' ? 3 : interaction.type === 'like' ? 2 : 1
            tagInterests.set(tagId, (tagInterests.get(tagId) || 0) + weight)
          })

          if (interaction.authorId !== userId) {
            const weight = interaction.type === 'bookmark' ? 3 : interaction.type === 'like' ? 2 : 1
            authorInterests.set(interaction.authorId, (authorInterests.get(interaction.authorId) || 0) + weight)
          }
        })

        return {
          userId,
          categoryInterests: Object.fromEntries(categoryInterests),
          tagInterests: Object.fromEntries(tagInterests),
          authorInterests: Object.fromEntries(authorInterests),
          totalInteractions: interactions.length,
        }
      },
      600 // 10 minutes cache
    )
  }

  /**
   * Get user interactions for profiling
   */
  private async getUserInteractions(userId: string) {
    const [likes, comments, bookmarks] = await Promise.all([
      optimizedPrisma.like.findMany({
        where: { userId },
        include: {
          post: {
            select: {
              id: true,
              authorId: true,
              categoryId: true,
              tags: { select: { tagId: true } },
            },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      optimizedPrisma.comment.findMany({
        where: { userId },
        include: {
          post: {
            select: {
              id: true,
              authorId: true,
              categoryId: true,
              tags: { select: { tagId: true } },
            },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      optimizedPrisma.bookmark.findMany({
        where: { userId },
        include: {
          post: {
            select: {
              id: true,
              authorId: true,
              categoryId: true,
              tags: { select: { tagId: true } },
            },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return [
      ...likes.map(like => ({
        type: 'like' as const,
        postId: like.post.id,
        authorId: like.post.authorId,
        categoryId: like.post.categoryId,
        tags: like.post.tags.map(t => t.tagId),
        createdAt: like.createdAt,
      })),
      ...comments.map(comment => ({
        type: 'comment' as const,
        postId: comment.post.id,
        authorId: comment.post.authorId,
        categoryId: comment.post.categoryId,
        tags: comment.post.tags.map(t => t.tagId),
        createdAt: comment.createdAt,
      })),
      ...bookmarks.map(bookmark => ({
        type: 'bookmark' as const,
        postId: bookmark.post.id,
        authorId: bookmark.post.authorId,
        categoryId: bookmark.post.categoryId,
        tags: bookmark.post.tags.map(t => t.tagId),
        createdAt: bookmark.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get recommendations by specific type
   */
  private async getRecommendationsByType(
    userId: string,
    userProfile: any,
    type: RecommendationType,
    limit: number
  ) {
    switch (type) {
      case 'similar_content':
        return await this.getSimilarContentRecommendations(userId, userProfile, limit)
      case 'user_interest':
        return await this.getUserInterestRecommendations(userId, userProfile, limit)
      case 'trending':
        return await this.getTrendingRecommendations(userId, limit)
      case 'collaborative_filtering':
        return await this.getCollaborativeFilteringRecommendations(userId, userProfile, limit)
      case 'content_based':
        return await this.getContentBasedRecommendations(userId, userProfile, limit)
      case 'hybrid':
        return await this.getHybridRecommendations(userId, userProfile, limit)
      default:
        return []
    }
  }

  /**
   * Content-based recommendations using user interests
   */
  private async getUserInterestRecommendations(userId: string, userProfile: any, limit: number) {
    if (!userProfile) return []

    const posts = await optimizedPrisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        authorId: { not: userId },
        OR: [
          { categoryId: { in: Object.keys(userProfile.categoryInterests) } },
          { tags: { some: { tagId: { in: Object.keys(userProfile.tagInterests) } } } },
          { authorId: { in: Object.keys(userProfile.authorInterests) } },
        ],
      },
      include: {
        tags: { select: { tagId: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
      take: limit * 2,
      orderBy: { publishedAt: 'desc' },
    })

    return posts.map(post => {
      let score = 0

      // Category interest score
      if (post.categoryId && userProfile.categoryInterests[post.categoryId]) {
        score += userProfile.categoryInterests[post.categoryId] * 0.3
      }

      // Tag interest score
      post.tags.forEach(({ tagId }) => {
        if (userProfile.tagInterests[tagId]) {
          score += userProfile.tagInterests[tagId] * 0.2
        }
      })

      // Author interest score
      if (userProfile.authorInterests[post.authorId]) {
        score += userProfile.authorInterests[post.authorId] * 0.4
      }

      // Engagement boost
      const engagementScore = (post._count.likes * 2 + post._count.comments * 3 + post._count.bookmarks * 5) / 10
      score += engagementScore * 0.1

      return {
        postId: post.id,
        score,
        reason: 'user_interest' as RecommendationType,
        metadata: {
          categoryMatch: !!post.categoryId && !!userProfile.categoryInterests[post.categoryId],
          tagMatches: post.tags.filter(({ tagId }) => userProfile.tagInterests[tagId]).length,
          authorMatch: !!userProfile.authorInterests[post.authorId],
        },
      }
    }).filter(rec => rec.score > 0)
  }

  /**
   * Trending content recommendations
   */
  private async getTrendingRecommendations(userId: string, limit: number) {
    const cacheKey = 'trending_posts'
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const posts = await optimizedPrisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            authorId: { not: userId },
            publishedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          include: {
            _count: { select: { likes: true, comments: true, bookmarks: true, views: true } },
          },
          take: limit * 2,
        })

        return posts.map(post => {
          // Calculate trending score based on recent engagement
          const daysSincePublished = Math.max(1, (Date.now() - post.publishedAt!.getTime()) / (24 * 60 * 60 * 1000))
          const engagementScore = (
            post._count.likes * 1 +
            post._count.comments * 2 +
            post._count.bookmarks * 3 +
            post._count.views * 0.1
          ) / daysSincePublished

          return {
            postId: post.id,
            score: engagementScore,
            reason: 'trending' as RecommendationType,
            metadata: {
              daysSincePublished,
              totalEngagement: post._count.likes + post._count.comments + post._count.bookmarks,
            },
          }
        }).sort((a, b) => b.score - a.score)
      },
      300 // 5 minutes cache
    )
  }

  /**
   * Similar content recommendations based on content analysis
   */
  private async getSimilarContentRecommendations(userId: string, userProfile: any, limit: number) {
    // This would typically use more sophisticated NLP/ML techniques
    // For now, we'll use a simplified approach based on categories and tags
    
    if (!userProfile || userProfile.totalInteractions === 0) return []

    const recentInteractions = await optimizedPrisma.like.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            tags: { include: { tag: true } },
            category: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    if (recentInteractions.length === 0) return []

    // Find posts similar to recently liked posts
    const similarPosts = await optimizedPrisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        authorId: { not: userId },
        OR: recentInteractions.map(interaction => ({
          AND: [
            { categoryId: interaction.post.categoryId },
            {
              tags: {
                some: {
                  tagId: {
                    in: interaction.post.tags.map(t => t.tag.id),
                  },
                },
              },
            },
          ],
        })),
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
        _count: { select: { likes: true, comments: true } },
      },
      take: limit * 2,
    })

    return similarPosts.map(post => ({
      postId: post.id,
      score: Math.random() * 0.5 + 0.5, // Simplified similarity score
      reason: 'similar_content' as RecommendationType,
      metadata: {
        similarTo: recentInteractions[0].post.id,
        sharedTags: post.tags.length,
      },
    }))
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeFilteringRecommendations(userId: string, userProfile: any, limit: number) {
    // Find users with similar interests
    const similarUsers = await this.findSimilarUsers(userId, 10)
    
    if (similarUsers.length === 0) return []

    // Get posts liked by similar users that current user hasn't interacted with
    const recommendations = await optimizedPrisma.like.findMany({
      where: {
        userId: { in: similarUsers.map(u => u.userId) },
        post: {
          status: 'PUBLISHED',
          authorId: { not: userId },
          likes: { none: { userId } },
          comments: { none: { userId } },
          bookmarks: { none: { userId } },
        },
      },
      include: {
        post: {
          include: {
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      take: limit * 2,
    })

    const postScores = new Map<string, number>()
    
    recommendations.forEach(like => {
      const similarUser = similarUsers.find(u => u.userId === like.userId)
      if (similarUser) {
        const currentScore = postScores.get(like.post.id) || 0
        postScores.set(like.post.id, currentScore + similarUser.similarity)
      }
    })

    return Array.from(postScores.entries()).map(([postId, score]) => ({
      postId,
      score,
      reason: 'collaborative_filtering' as RecommendationType,
      metadata: {
        similarUsersCount: similarUsers.length,
      },
    }))
  }

  /**
   * Content-based recommendations using post content analysis
   */
  private async getContentBasedRecommendations(userId: string, userProfile: any, limit: number) {
    // This is a simplified version - in production, you'd use more sophisticated NLP
    return await this.getUserInterestRecommendations(userId, userProfile, limit)
  }

  /**
   * Hybrid recommendations combining multiple approaches
   */
  private async getHybridRecommendations(userId: string, userProfile: any, limit: number) {
    const [userInterest, trending, collaborative] = await Promise.all([
      this.getUserInterestRecommendations(userId, userProfile, Math.ceil(limit * 0.5)),
      this.getTrendingRecommendations(userId, Math.ceil(limit * 0.3)),
      this.getCollaborativeFilteringRecommendations(userId, userProfile, Math.ceil(limit * 0.2)),
    ])

    // Combine and weight the recommendations
    const combined = [
      ...userInterest.map(r => ({ ...r, score: r.score * 0.5 })),
      ...trending.map(r => ({ ...r, score: r.score * 0.3 })),
      ...collaborative.map(r => ({ ...r, score: r.score * 0.2 })),
    ]

    // Remove duplicates and sort by score
    const unique = new Map<string, typeof combined[0]>()
    combined.forEach(rec => {
      const existing = unique.get(rec.postId)
      if (!existing || rec.score > existing.score) {
        unique.set(rec.postId, { ...rec, reason: 'hybrid' })
      }
    })

    return Array.from(unique.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Find users with similar interests
   */
  private async findSimilarUsers(userId: string, limit: number) {
    // This is a simplified similarity calculation
    // In production, you'd use more sophisticated algorithms
    
    const userLikes = await optimizedPrisma.like.findMany({
      where: { userId },
      select: { postId: true },
      take: 100,
    })

    if (userLikes.length === 0) return []

    const likedPostIds = userLikes.map(like => like.postId)

    const similarUsers = await optimizedPrisma.like.findMany({
      where: {
        postId: { in: likedPostIds },
        userId: { not: userId },
      },
      select: { userId: true },
    })

    // Count common likes
    const userSimilarity = new Map<string, number>()
    similarUsers.forEach(like => {
      const count = userSimilarity.get(like.userId) || 0
      userSimilarity.set(like.userId, count + 1)
    })

    return Array.from(userSimilarity.entries())
      .map(([userId, commonLikes]) => ({
        userId,
        similarity: commonLikes / likedPostIds.length,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  /**
   * Store recommendations in database for tracking
   */
  async storeRecommendations(userId: string, recommendations: Array<{
    postId: string
    score: number
    reason: RecommendationType
    metadata?: any
  }>) {
    try {
      await optimizedPrisma.contentRecommendation.createMany({
        data: recommendations.map(rec => ({
          userId,
          postId: rec.postId,
          score: rec.score,
          reason: rec.reason,
          metadata: rec.metadata,
        })),
        skipDuplicates: true,
      })
    } catch (error) {
      console.error('Failed to store recommendations:', error)
    }
  }
}

// Singleton instance
export const recommendationEngine = new ContentRecommendationEngine()

// Helper functions
export const recommendationHelpers = {
  // Get recommendations for user
  getRecommendations: (userId: string, limit?: number, types?: RecommendationType[]) =>
    recommendationEngine.generateRecommendations(userId, limit, types),

  // Track recommendation interaction
  trackInteraction: async (userId: string, postId: string, action: 'view' | 'click' | 'like' | 'share') => {
    try {
      // Update recommendation score based on interaction
      await optimizedPrisma.contentRecommendation.updateMany({
        where: { userId, postId },
        data: {
          metadata: {
            lastInteraction: new Date(),
            interactionType: action,
          },
        },
      })
    } catch (error) {
      console.error('Failed to track recommendation interaction:', error)
    }
  },

  // Get recommendation performance metrics
  getMetrics: async (userId?: string) => {
    try {
      const where = userId ? { userId } : {}
      
      const [total, byReason, avgScore] = await Promise.all([
        optimizedPrisma.contentRecommendation.count({ where }),
        optimizedPrisma.contentRecommendation.groupBy({
          by: ['reason'],
          where,
          _count: { _all: true },
          _avg: { score: true },
        }),
        optimizedPrisma.contentRecommendation.aggregate({
          where,
          _avg: { score: true },
        }),
      ])

      return {
        total,
        byReason: Object.fromEntries(
          byReason.map(r => [r.reason, { count: r._count._all, avgScore: r._avg.score }])
        ),
        overallAvgScore: avgScore._avg.score,
      }
    } catch (error) {
      console.error('Failed to get recommendation metrics:', error)
      return null
    }
  },
}

export default recommendationEngine
