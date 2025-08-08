import {
  sanitizeHtml,
  sanitizeText,
  escapeHtml,
  validateImageFile,
  moderateContent,
  emailSchema,
  passwordSchema,
  slugSchema,
} from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous scripts', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHtml(input)
      
      expect(result).toBe('<p>Hello</p>')
      expect(result).not.toContain('script')
    })

    it('should preserve safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeHtml(input)
      
      expect(result).toBe('<p>Hello <strong>world</strong></p>')
    })

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert(\'xss\')">Hello</p>'
      const result = sanitizeHtml(input)
      
      expect(result).toBe('<p>Hello</p>')
      expect(result).not.toContain('onclick')
    })

    it('should preserve safe attributes', () => {
      const input = '<a href="https://example.com" title="Example">Link</a>'
      const result = sanitizeHtml(input)
      
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('title="Example"')
    })
  })

  describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
      const input = 'Hello <script>alert("xss")</script> world'
      const result = sanitizeText(input)
      
      expect(result).toBe('Hello scriptalert("xss")/script world')
    })

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeText(input)
      
      expect(result).toBe('alert("xss")')
    })

    it('should trim whitespace', () => {
      const input = '  hello world  '
      const result = sanitizeText(input)
      
      expect(result).toBe('hello world')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>'
      const result = escapeHtml(input)
      
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry'
      const result = escapeHtml(input)
      
      expect(result).toBe('Tom &amp; Jerry')
    })

    it('should escape quotes', () => {
      const input = `He said "Hello" and 'Goodbye'`
      const result = escapeHtml(input)
      
      expect(result).toBe('He said &quot;Hello&quot; and &#39;Goodbye&#39;')
    })
  })

  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = validateImageFile(file)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject files that are too large', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB
      
      const result = validateImageFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size must be less than 5MB')
    })

    it('should reject invalid file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1024 })
      
      const result = validateImageFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject invalid file extensions', () => {
      const file = new File([''], 'test.exe', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })
      
      const result = validateImageFile(file)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file extension')
    })
  })

  describe('moderateContent', () => {
    it('should approve clean content', () => {
      const content = 'This is a nice, clean article about technology.'
      const result = moderateContent(content)
      
      expect(result.approved).toBe(true)
      expect(result.flags).toHaveLength(0)
      expect(result.score).toBe(0)
    })

    it('should flag spam content', () => {
      const content = 'Buy now! Limited time offer! Click here to make money fast!'
      const result = moderateContent(content)
      
      expect(result.approved).toBe(false)
      expect(result.flags).toContain('potential_spam')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should flag profanity', () => {
      const content = 'This is a damn good article, but fuck the critics!'
      const result = moderateContent(content)
      
      expect(result.flags).toContain('profanity')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should flag excessive caps', () => {
      const content = 'THIS IS ALL CAPS AND VERY ANNOYING TO READ!'
      const result = moderateContent(content)
      
      expect(result.flags).toContain('excessive_caps')
      expect(result.score).toBeGreaterThan(0)
    })

    it('should flag excessive links', () => {
      const content = `
        Check out https://example1.com and https://example2.com 
        and https://example3.com and https://example4.com
      `
      const result = moderateContent(content)
      
      expect(result.flags).toContain('excessive_links')
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('Schema Validation', () => {
    describe('emailSchema', () => {
      it('should validate correct emails', () => {
        expect(() => emailSchema.parse('test@example.com')).not.toThrow()
        expect(() => emailSchema.parse('user.name+tag@domain.co.uk')).not.toThrow()
      })

      it('should reject invalid emails', () => {
        expect(() => emailSchema.parse('invalid-email')).toThrow()
        expect(() => emailSchema.parse('test@')).toThrow()
        expect(() => emailSchema.parse('@example.com')).toThrow()
        expect(() => emailSchema.parse('')).toThrow()
      })
    })

    describe('passwordSchema', () => {
      it('should validate strong passwords', () => {
        expect(() => passwordSchema.parse('StrongP@ssw0rd')).not.toThrow()
        expect(() => passwordSchema.parse('MySecure123!')).not.toThrow()
      })

      it('should reject weak passwords', () => {
        expect(() => passwordSchema.parse('weak')).toThrow() // Too short
        expect(() => passwordSchema.parse('password123')).toThrow() // No uppercase
        expect(() => passwordSchema.parse('PASSWORD123')).toThrow() // No lowercase
        expect(() => passwordSchema.parse('Password')).toThrow() // No number
        expect(() => passwordSchema.parse('Password123')).toThrow() // No special char
      })
    })

    describe('slugSchema', () => {
      it('should validate correct slugs', () => {
        expect(() => slugSchema.parse('hello-world')).not.toThrow()
        expect(() => slugSchema.parse('my-blog-post-123')).not.toThrow()
        expect(() => slugSchema.parse('simple')).not.toThrow()
      })

      it('should reject invalid slugs', () => {
        expect(() => slugSchema.parse('Hello World')).toThrow() // Spaces
        expect(() => slugSchema.parse('hello_world')).toThrow() // Underscores
        expect(() => slugSchema.parse('HELLO-WORLD')).toThrow() // Uppercase
        expect(() => slugSchema.parse('hello--world')).toThrow() // Double hyphens
        expect(() => slugSchema.parse('-hello-world')).toThrow() // Leading hyphen
        expect(() => slugSchema.parse('hello-world-')).toThrow() // Trailing hyphen
      })
    })
  })
})
