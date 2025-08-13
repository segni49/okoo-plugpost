# PlugPost Developer Documentation

Welcome to the Okoo-PlugPost platform developer documentation. This comprehensive guide will help you understand, set up, and contribute to the PlugPost blogging platform.

## 📚 Documentation Index

### 🚀 Getting Started

- **[Developer Setup Guide](./docs//DEVELOPER_SETUP.md)** - Complete setup instructions for new developers
- **[Test Users & Credentials](./docs/TEST_USERS.md)** - Pre-configured test accounts for all user roles
- **[Environment Configuration](../.env.example)** - Comprehensive environment variable guide

[![Watch the Demo](/Okoo-PlugPost.png)](https://www.youtube.com/watch?v=vNWuQGS_hrk)

### 📖 API Reference

- **[Complete API Documentation](./docs/API_DOCUMENTATION.md)** - All 50+ API endpoints with examples

### 🏗 Architecture & Development



### 🚀 Deployment & Operations

- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions


---

## 🎯 Quick Start for Developers

### 1. Instant Setup (Recommended)

```bash
# Clone and setup in one command
git clone https://github.com/segni49/okoo-plugpost && cd okoo-plugpost && npm install && npm run setup
```

### 2. Manual Setup

```bash
# Clone repository
git clone https://github.com/segni49/okoo-plugpost
cd plugpost

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL

# Set up database
npx prisma db push
npx prisma db seed

# Start development
npm run dev
```

### 3. Test the Platform

Visit `http://localhost:3000` and login with:

- **Admin**: admin@plugpost.dev / Admin123!
- **Editor**: editor@plugpost.dev / Editor123!

---

## 🏗 Platform Architecture

### Technology Stack

**Frontend:**

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Radix UI patterns
- **Icons**: Lucide React
- **Rich Text Editor**: TipTap with extensions

**Backend:**

- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multiple providers
- **File Upload**: Cloudinary integration
- **Validation**: Zod schemas
- **Security**: bcryptjs, DOMPurify, rate limiting

**Development:**

- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

### Key Features

**Content Management:**

- Rich text editor with advanced formatting
- Post scheduling and version control
- Category and tag management
- SEO optimization
- Analytics tracking

**User Management:**

- Role-based access control (Admin, Editor, Contributor, Subscriber)
- OAuth authentication (Google, GitHub, Discord)
- User profiles and social features
- Follow system and notifications

**Social Features:**

- Comment system with threading
- Like and bookmark functionality
- User following and notifications
- Newsletter subscription
- Social sharing

**Admin Features:**

- Comprehensive admin dashboard
- User management and moderation
- Content management and bulk operations
- Analytics and performance monitoring
- System configuration

---

## 🔧 Development Workflow

### 1. Local Development

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Open database browser
npm run db:studio

# Check types
npm run type-check
```

### 2. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test

# Commit changes
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

### 3. Database Changes

```bash
# Modify schema in prisma/schema.prisma
# Then push changes
npx prisma db push

# Or create migration for production
npx prisma migrate dev --name your-migration-name
```

---

## 📊 Platform Statistics

### Codebase Metrics

- **Total Files**: 200+ TypeScript/React files
- **API Endpoints**: 50+ RESTful endpoints
- **UI Components**: 30+ reusable components
- **Database Models**: 15+ Prisma models
- **Test Coverage**: 70%+ coverage target

### Feature Count

- **Authentication**: 5+ providers and methods
- **Content Management**: 20+ content features
- **Social Features**: 10+ interaction features
- **Admin Features**: 15+ administrative tools
- **API Features**: 50+ endpoints
- **Security Features**: 10+ security measures

---

## 🎨 UI Component Library

### Available Components

**Layout Components:**

- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Container`, `Section`, `Grid`
- `Sidebar`, `Header`, `Footer`

**Form Components:**

- `Button`, `Input`, `Textarea`, `Select`
- `Checkbox`, `Radio`, `Switch`
- `Form`, `FormField`, `FormError`

**Feedback Components:**

- `Toast`, `Modal`, `Alert`
- `Loading`, `Skeleton`, `Progress`
- `Badge`, `Tooltip`, `Popover`

**Navigation Components:**

- `Pagination`, `Breadcrumb`, `Tabs`
- `Dropdown`, `Menu`, `Search`

**Content Components:**

- `RichTextEditor`, `CodeBlock`, `Image`
- `CommentSection`, `UserProfile`, `PostCard`

---

## 🔍 API Overview

### Endpoint Categories

**Authentication** (4 endpoints)

- User registration, login, logout, password reset

**Posts** (15 endpoints)

- CRUD operations, analytics, versioning, scheduling

**Comments** (5 endpoints)

- Threaded comments, moderation, likes

**Users** (6 endpoints)

- Profile management, following, admin operations

**Categories & Tags** (8 endpoints)

- Content organization and management

**Search** (3 endpoints)

- Global search, suggestions, filtering

**Admin** (10 endpoints)

- Dashboard stats, user management, bulk operations

**File Upload** (2 endpoints)

- Image upload and management

**Analytics** (5 endpoints)

- Performance tracking, user behavior

**Newsletter** (2 endpoints)

- Subscription management

---

## 🧪 Testing Strategy

### Test Types

**Unit Tests:**
- Component testing with React Testing Library
- Utility function testing
- API endpoint testing

**Integration Tests:**

- Authentication flows
- Database operations
- API endpoint integration

**E2E Tests:**

- User workflows
- Admin operations
- Content creation flows

### Test Data

The platform includes comprehensive test data:

- 4 test user accounts (one for each role)
- Sample posts and comments
- Categories and tags
- User interactions (likes, follows, bookmarks)

---

## 🔐 Security Considerations

### Built-in Security Features

**Authentication Security:**

- Secure password hashing with bcryptjs
- JWT session management
- OAuth provider integration
- Session timeout and refresh

**Input Validation:**

- Zod schema validation for all inputs
- HTML sanitization with DOMPurify
- File upload validation
- SQL injection prevention via Prisma

**API Security:**

- Rate limiting
- CORS configuration
- Role-based access control
- Request/response validation

**Data Protection:**

- Environment variable security
- Database connection encryption
- Secure headers configuration
- Content Security Policy

---

## 📈 Performance Features

### Optimization Techniques

**Frontend Performance:**

- Next.js automatic code splitting
- Image optimization with next/image
- Lazy loading for components
- Bundle size optimization

**Backend Performance:**

- Database query optimization
- Connection pooling
- Caching strategies
- API response optimization

**Monitoring:**

- Core Web Vitals tracking
- Performance metrics collection
- Error tracking with Sentry
- Analytics integration

---

## 🤝 Contributing

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new features**
5. **Ensure all tests pass**
6. **Submit a pull request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration
- **Prettier**: Automatic code formatting
- **Testing**: Minimum 70% coverage
- **Documentation**: Update docs for new features

---

## 📞 Support & Resources

### Getting Help

- **Documentation**: Check this docs folder first
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Community**: Join our Discord server

### Useful Links

- **Live Demo**: <https://plugpost-demo.vercel.app>
- **GitHub Repository**: <https://github.com/your-username/plugpost>
- **Documentation Site**: <https://docs.plugpost.com>
- **Community Discord**: <https://discord.gg/plugpost>

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

*Last updated: Augest 2025*
