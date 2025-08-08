/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'SUBSCRIBER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // User doesn't exist
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.name).toBe('Test User')
      expect(data.user).not.toHaveProperty('password')
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd123', 12)
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedpassword',
          role: 'SUBSCRIBER',
          status: 'ACTIVE',
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }),
      })
    })

    it('should reject registration with existing email', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User already exists')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should validate input data', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: not a valid email
          password: 'weak', // Invalid: too weak
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
      ;(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create user')
    })
  })

  describe('Password Security', () => {
    it('should hash passwords with sufficient rounds', async () => {
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SUBSCRIBER',
      })

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
        },
      })

      await POST(req)

      expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd123', 12)
    })

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password', // No uppercase, numbers, or special chars
        'Password', // No numbers or special chars
        'Password123', // No special chars
        'Pass@1', // Too short
        'PASSWORD123!', // No lowercase
      ]

      for (const password of weakPasswords) {
        const { req } = createMocks({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: {
            name: 'Test User',
            email: 'test@example.com',
            password,
          },
        })

        const response = await POST(req)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid input')
      }
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize user input', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SUBSCRIBER',
      }

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: '  Test User  ', // Should be trimmed
          email: 'TEST@EXAMPLE.COM', // Should be lowercased
          password: 'StrongP@ssw0rd123',
        },
      })

      const response = await POST(req)

      expect(response.status).toBe(201)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test User', // Trimmed
          email: 'test@example.com', // Lowercased
        }),
        select: expect.any(Object),
      })
    })

    it('should prevent XSS in user input', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: '<script>alert("xss")</script>Test User',
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
        },
      })

      const response = await POST(req)
      const data = await response.json()

      // Should either sanitize the input or reject it
      if (response.status === 201) {
        expect(data.user.name).not.toContain('<script>')
      } else {
        expect(response.status).toBe(400)
      }
    })
  })
})
