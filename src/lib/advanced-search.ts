// Advanced search system with full-text search and intelligent ranking
import { optimizedPrisma } from './database-optimization'
import { getCacheManager } from './cache'

// Search configuration
const SEARCH_CONFIG = {
  // Minimum query length
  minQueryLength: 2,
  
  // Maximum results per category
  maxResults: {
    posts: 50,
    users: 20,
    categories: 10,
    tags: 15,
  },
  
  // Search weights for ranking
  weights: {
    title: 3.0,
    content: 1.0,
    excerpt: 2.0,
    tags: 2.5,
    category: 1.5,
    author: 1.2,
  },
  
  // Boost factors
  boosts: {
    recent: 1.2, // Posts from last 30 days
    popular: 1.5, // Posts with high engagement
    verified: 1.3, // Verified authors
    featured: 2.0, // Featured content
  },
  
  // Cache TTL in seconds
  cacheTTL: 300, // 5 minutes
}

// Search result types
export interface SearchResult {
  id: string
  type: 'post' | 'user' | 'category' | 'tag'
  title: string
  excerpt?: string
  url: string
  score: number
  highlights: string[]
  metadata: Record<string, any>
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  totalCount: number
  searchTime: number
  suggestions: string[]
  filters: {
    categories: Array<{ id: string; name: string; count: number }>
    tags: Array<{ id: string; name: string; count: number }>
    authors: Array<{ id: string; name: string; count: number }>
    dateRanges: Array<{ label: string; count: number }>
  }
  facets: Record<string, number>
}

export interface SearchOptions {
  type?: 'all' | 'posts' | 'users' | 'categories' | 'tags'
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title'
  sortOrder?: 'asc' | 'desc'
  filters?: {
    categoryIds?: string[]
    tagIds?: string[]
    authorIds?: string[]
    dateRange?: {
      from?: Date
      to?: Date
    }
    status?: string[]
  }
  includeHighlights?: boolean
  includeFacets?: boolean
}

class AdvancedSearchEngine {
  private cache = getCacheManager()

  /**
   * Main search function
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now()
    
    // Validate query
    if (!query || query.trim().length < SEARCH_CONFIG.minQueryLength) {
      return this.getEmptyResponse(query, startTime)
    }

    const normalizedQuery = this.normalizeQuery(query)
    const cacheKey = this.getCacheKey(normalizedQuery, options)

    // Try to get from cache first
    const cached = await this.cache.get<SearchResponse>(cacheKey)
    if (cached) {
      return { ...cached, searchTime: Date.now() - startTime }
    }

    // Perform search
    const results = await this.performSearch(normalizedQuery, options)
    const suggestions = await this.generateSuggestions(normalizedQuery)
    const filters = options.includeFacets ? await this.generateFilters(normalizedQuery, options) : this.getEmptyFilters()

    const response: SearchResponse = {
      query: normalizedQuery,
      results,
      totalCount: results.length,
      searchTime: Date.now() - startTime,
      suggestions,
      filters,
      facets: this.calculateFacets(results),
    }

    // Cache the response
    await this.cache.set(cacheKey, response, SEARCH_CONFIG.cacheTTL)

    return response
  }

  /**
   * Perform the actual search across different content types
   */
  private async performSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const { type = 'all', limit = 20, offset = 0, sortBy = 'relevance', filters } = options
    const searchTerms = this.extractSearchTerms(query)
    
    const results: SearchResult[] = []

    // Search posts
    if (type === 'all' || type === 'posts') {
      const postResults = await this.searchPosts(searchTerms, {
        limit: type === 'posts' ? limit : SEARCH_CONFIG.maxResults.posts,
        filters,
        includeHighlights: options.includeHighlights,
      })
      results.push(...postResults)
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const userResults = await this.searchUsers(searchTerms, {
        limit: type === 'users' ? limit : SEARCH_CONFIG.maxResults.users,
        filters,
      })
      results.push(...userResults)
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categoryResults = await this.searchCategories(searchTerms, {
        limit: type === 'categories' ? limit : SEARCH_CONFIG.maxResults.categories,
      })
      results.push(...categoryResults)
    }

    // Search tags
    if (type === 'all' || type === 'tags') {
      const tagResults = await this.searchTags(searchTerms, {
        limit: type === 'tags' ? limit : SEARCH_CONFIG.maxResults.tags,
      })
      results.push(...tagResults)
    }

    // Sort results
    const sortedResults = this.sortResults(results, sortBy, options.sortOrder)

    // Apply pagination
    return sortedResults.slice(offset, offset + limit)
  }

  /**
   * Search posts with advanced ranking
   */
  private async searchPosts(
    searchTerms: string[],
    options: {
      limit: number
      filters?: SearchOptions['filters']
      includeHighlights?: boolean
    }
  ): Promise<SearchResult[]> {
    const { filters } = options
    
    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: searchTerms.join(' '), mode: 'insensitive' } },
        { content: { contains: searchTerms.join(' '), mode: 'insensitive' } },
        { excerpt: { contains: searchTerms.join(' '), mode: 'insensitive' } },
      ],
    }

    // Apply filters
    if (filters?.categoryIds?.length) {
      where.categoryId = { in: filters.categoryIds }
    }
    if (filters?.authorIds?.length) {
      where.authorId = { in: filters.authorIds }
    }
    if (filters?.tagIds?.length) {
      where.tags = { some: { tagId: { in: filters.tagIds } } }
    }
    if (filters?.dateRange) {
      where.publishedAt = {}
      if (filters.dateRange.from) {
        where.publishedAt.gte = filters.dateRange.from
      }
      if (filters.dateRange.to) {
        where.publishedAt.lte = filters.dateRange.to
      }
    }

    const posts = await optimizedPrisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
            views: true,
          },
        },
      },
      take: options.limit * 2, // Get more for better ranking
    })

    return posts.map(post => {
      const score = this.calculatePostScore(post, searchTerms)
      const highlights = options.includeHighlights 
        ? this.generateHighlights(post, searchTerms)
        : []

      return {
        id: post.id,
        type: 'post' as const,
        title: post.title,
        excerpt: post.excerpt || this.generateExcerpt(post.content),
        url: `/posts/${post.slug}`,
        score,
        highlights,
        metadata: {
          author: post.author,
          category: post.category,
          tags: post.tags.map(pt => pt.tag),
          publishedAt: post.publishedAt,
          stats: post._count,
        },
      }
    }).sort((a, b) => b.score - a.score).slice(0, options.limit)
  }

  /**
   * Search users
   */
  private async searchUsers(
    searchTerms: string[],
    options: { limit: number; filters?: SearchOptions['filters'] }
  ): Promise<SearchResult[]> {
    const users = await optimizedPrisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: searchTerms.join(' '), mode: 'insensitive' } },
          { bio: { contains: searchTerms.join(' '), mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      take: options.limit,
    })

    return users.map(user => {
      const score = this.calculateUserScore(user, searchTerms)

      return {
        id: user.id,
        type: 'user' as const,
        title: user.name || 'Anonymous User',
        excerpt: user.bio || undefined,
        url: `/users/${user.id}`,
        score,
        highlights: [],
        metadata: {
          role: user.role,
          stats: user._count,
          joinedAt: user.createdAt,
        },
      }
    }).sort((a, b) => b.score - a.score)
  }

  /**
   * Search categories
   */
  private async searchCategories(
    searchTerms: string[],
    options: { limit: number }
  ): Promise<SearchResult[]> {
    const categories = await optimizedPrisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchTerms.join(' '), mode: 'insensitive' } },
          { description: { contains: searchTerms.join(' '), mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      take: options.limit,
    })

    return categories.map(category => ({
      id: category.id,
      type: 'category' as const,
      title: category.name,
      excerpt: category.description || undefined,
      url: `/categories/${category.slug}`,
      score: this.calculateCategoryScore(category, searchTerms),
      highlights: [],
      metadata: {
        postCount: category._count.posts,
        color: category.color,
      },
    })).sort((a, b) => b.score - a.score)
  }

  /**
   * Search tags
   */
  private async searchTags(
    searchTerms: string[],
    options: { limit: number }
  ): Promise<SearchResult[]> {
    const tags = await optimizedPrisma.tag.findMany({
      where: {
        name: { contains: searchTerms.join(' '), mode: 'insensitive' },
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      take: options.limit,
    })

    return tags.map(tag => ({
      id: tag.id,
      type: 'tag' as const,
      title: tag.name,
      url: `/tags/${tag.slug}`,
      score: this.calculateTagScore(tag, searchTerms),
      highlights: [],
      metadata: {
        postCount: tag._count.posts,
      },
    })).sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate relevance score for posts
   */
  private calculatePostScore(post: any, searchTerms: string[]): number {
    let score = 0
    const query = searchTerms.join(' ').toLowerCase()

    // Title match
    if (post.title.toLowerCase().includes(query)) {
      score += SEARCH_CONFIG.weights.title
      if (post.title.toLowerCase().startsWith(query)) {
        score += 1 // Bonus for title starting with query
      }
    }

    // Content match
    if (post.content.toLowerCase().includes(query)) {
      score += SEARCH_CONFIG.weights.content
    }

    // Excerpt match
    if (post.excerpt?.toLowerCase().includes(query)) {
      score += SEARCH_CONFIG.weights.excerpt
    }

    // Tag matches
    const tagMatches = post.tags.filter((pt: any) => 
      pt.tag.name.toLowerCase().includes(query)
    ).length
    score += tagMatches * SEARCH_CONFIG.weights.tags

    // Category match
    if (post.category?.name.toLowerCase().includes(query)) {
      score += SEARCH_CONFIG.weights.category
    }

    // Author match
    if (post.author.name?.toLowerCase().includes(query)) {
      score += SEARCH_CONFIG.weights.author
    }

    // Apply boosts
    const now = new Date()
    const daysSincePublished = (now.getTime() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    
    // Recent content boost
    if (daysSincePublished <= 30) {
      score *= SEARCH_CONFIG.boosts.recent
    }

    // Popularity boost
    const engagementScore = post._count.likes + post._count.comments * 2 + post._count.bookmarks * 3
    if (engagementScore > 10) {
      score *= SEARCH_CONFIG.boosts.popular
    }

    // Verified author boost
    if (post.author.role === 'ADMIN' || post.author.role === 'EDITOR') {
      score *= SEARCH_CONFIG.boosts.verified
    }

    return score
  }

  /**
   * Calculate relevance score for users
   */
  private calculateUserScore(user: any, searchTerms: string[]): number {
    let score = 0
    const query = searchTerms.join(' ').toLowerCase()

    // Name match
    if (user.name?.toLowerCase().includes(query)) {
      score += 3
      if (user.name.toLowerCase().startsWith(query)) {
        score += 2
      }
    }

    // Bio match
    if (user.bio?.toLowerCase().includes(query)) {
      score += 1
    }

    // Role boost
    if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      score *= 1.5
    }

    // Activity boost
    if (user._count.posts > 5) {
      score *= 1.2
    }

    return score
  }

  /**
   * Calculate relevance score for categories
   */
  private calculateCategoryScore(category: any, searchTerms: string[]): number {
    let score = 0
    const query = searchTerms.join(' ').toLowerCase()

    if (category.name.toLowerCase().includes(query)) {
      score += 3
    }

    if (category.description?.toLowerCase().includes(query)) {
      score += 1
    }

    // Boost based on post count
    score += Math.log(category._count.posts + 1)

    return score
  }

  /**
   * Calculate relevance score for tags
   */
  private calculateTagScore(tag: any, searchTerms: string[]): number {
    let score = 0
    const query = searchTerms.join(' ').toLowerCase()

    if (tag.name.toLowerCase().includes(query)) {
      score += 3
      if (tag.name.toLowerCase() === query) {
        score += 2 // Exact match bonus
      }
    }

    // Boost based on usage
    score += Math.log(tag._count.posts + 1)

    return score
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string): Promise<string[]> {
    const cacheKey = `search_suggestions:${query}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        // Get popular search terms and content titles
        const [popularPosts, popularTags] = await Promise.all([
          optimizedPrisma.post.findMany({
            where: {
              status: 'PUBLISHED',
              title: { contains: query, mode: 'insensitive' },
            },
            select: { title: true },
            orderBy: { viewCount: 'desc' },
            take: 5,
          }),
          optimizedPrisma.tag.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' },
            },
            select: { name: true },
            take: 5,
          }),
        ])

        const suggestions = [
          ...popularPosts.map(p => p.title),
          ...popularTags.map(t => t.name),
        ]

        return [...new Set(suggestions)].slice(0, 5)
      },
      600 // 10 minutes cache
    )
  }

  /**
   * Generate search filters/facets
   */
  private async generateFilters(query: string, options: SearchOptions) {
    // This would typically be more sophisticated
    return this.getEmptyFilters()
  }

  /**
   * Utility functions
   */
  private normalizeQuery(query: string): string {
    return query.trim().toLowerCase()
  }

  private extractSearchTerms(query: string): string[] {
    return query.split(/\s+/).filter(term => term.length >= 2)
  }

  private getCacheKey(query: string, options: SearchOptions): string {
    return `search:${query}:${JSON.stringify(options)}`
  }

  private generateHighlights(post: any, searchTerms: string[]): string[] {
    // Simplified highlight generation
    const highlights: string[] = []
    const query = searchTerms.join(' ')
    
    if (post.title.toLowerCase().includes(query.toLowerCase())) {
      highlights.push(`Title: ${post.title}`)
    }
    
    return highlights
  }

  private generateExcerpt(content: string, length = 150): string {
    return content.length > length 
      ? content.substring(0, length) + '...'
      : content
  }

  private sortResults(results: SearchResult[], sortBy: string, sortOrder = 'desc'): SearchResult[] {
    const multiplier = sortOrder === 'asc' ? 1 : -1

    return results.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aDate = a.metadata.publishedAt || a.metadata.joinedAt || new Date(0)
          const bDate = b.metadata.publishedAt || b.metadata.joinedAt || new Date(0)
          return (new Date(bDate).getTime() - new Date(aDate).getTime()) * multiplier
        case 'popularity':
          const aPopularity = a.metadata.stats?.likes || 0
          const bPopularity = b.metadata.stats?.likes || 0
          return (bPopularity - aPopularity) * multiplier
        case 'title':
          return a.title.localeCompare(b.title) * multiplier
        case 'relevance':
        default:
          return (b.score - a.score) * multiplier
      }
    })
  }

  private calculateFacets(results: SearchResult[]): Record<string, number> {
    const facets: Record<string, number> = {}
    
    results.forEach(result => {
      facets[result.type] = (facets[result.type] || 0) + 1
    })

    return facets
  }

  private getEmptyResponse(query: string, startTime: number): SearchResponse {
    return {
      query,
      results: [],
      totalCount: 0,
      searchTime: Date.now() - startTime,
      suggestions: [],
      filters: this.getEmptyFilters(),
      facets: {},
    }
  }

  private getEmptyFilters() {
    return {
      categories: [],
      tags: [],
      authors: [],
      dateRanges: [],
    }
  }
}

// Singleton instance
export const advancedSearchEngine = new AdvancedSearchEngine()

// Helper functions
export const searchHelpers = {
  // Quick search function
  search: (query: string, options?: SearchOptions) =>
    advancedSearchEngine.search(query, options),

  // Search suggestions
  getSuggestions: async (query: string) => {
    const response = await advancedSearchEngine.search(query, { limit: 0 })
    return response.suggestions
  },

  // Popular searches
  getPopularSearches: async () => {
    const cache = getCacheManager()
    return await cache.getOrSet(
      'popular_searches',
      async () => {
        // This would typically come from search analytics
        return [
          'javascript',
          'react',
          'typescript',
          'node.js',
          'web development',
        ]
      },
      3600 // 1 hour cache
    )
  },
}

export default advancedSearchEngine
