import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

import { GET, POST } from '@/app/api/posts/route'
import { prisma } from '@/lib/prisma'

// Mock the auth utility
jest.mock('@/lib/auth-utils', () => ({
  getCurrentUser: jest.fn(),
}))

const { getCurrentUser } = require('@/lib/auth-utils')

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/posts', () => {
    it('should return published posts', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          content: 'Test content',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          author: { id: '1', name: 'Test Author' },
          category: { id: '1', name: 'Test Category', slug: 'test-category', color: '#000000' },
          tags: [],
          _count: { comments: 0, likes: 0 },
          viewCount: 0,
          readTime: 5,
        },
      ]

      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(1)

      const req = new NextRequest('http://localhost/api/posts')

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].title).toBe('Test Post')
      expect(data.pagination.totalItems).toBe(1)
    })

    it('should filter posts by category', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          content: 'Test content',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          author: { id: '1', name: 'Test Author' },
          category: { id: '1', name: 'Test Category', slug: 'test-category', color: '#000000' },
          tags: [],
          _count: { comments: 0, likes: 0 },
          viewCount: 0,
          readTime: 5,
        },
      ]

      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(1)

      const req = new NextRequest('http://localhost/api/posts?categoryId=1')

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: '1',
          }),
        })
      )
    })

    it('should search posts by title and content', async () => {
      const mockPosts: any[] = []
      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(0)

      const req = new NextRequest('http://localhost/api/posts?search=test')

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
              { content: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })
  })

  describe('POST /api/posts', () => {
    it('should create a new post when authenticated', async () => {
      const mockUser = {
        id: '1',
        role: 'EDITOR',
        name: 'Test Author',
      }

      const mockPost = {
        id: '1',
        title: 'New Post',
        slug: 'new-post',
        content: 'New content',
        status: 'DRAFT',
        authorId: '1',
      }

      getCurrentUser.mockResolvedValue(mockUser)
      ;(prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

      const req = new NextRequest('http://localhost/api/posts', {
        body: {
          title: 'New Post',
          content: 'New content',
          status: 'DRAFT',
        },
      } as any)

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Post')
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Post',
            content: 'New content',
            status: 'DRAFT',
            authorId: '1',
          }),
        })
      )
    })

    it('should return 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          title: 'New Post',
          content: 'New content',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 when user lacks permissions', async () => {
      const mockUser = {
        id: '1',
        role: 'SUBSCRIBER',
        name: 'Test User',
      }

      getCurrentUser.mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          title: 'New Post',
          content: 'New content',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should validate required fields', async () => {
      const mockUser = {
        id: '1',
        role: 'AUTHOR',
        name: 'Test Author',
      }

      getCurrentUser.mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          title: '', // Empty title should fail validation
          content: 'New content',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })
  })
})
