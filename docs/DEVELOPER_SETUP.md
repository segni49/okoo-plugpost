# PlugPost Developer Setup Guide

## 🚀 Quick Start (3 Steps)

Get PlugPost running locally in under 5 minutes:

```bash
# 1. Clone the repository
git clone <https://github.com/your-username/plugpost.git>
cd plugpost

# 2. Install dependencies
npm install

# 3. Set up environment and database
npm run setup
```

That's it! The platform will be running at `<http://localhost:3000>`

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** 18.17 or later ([Download](<https://nodejs.org/>))
- **npm** 9.0 or later (comes with Node.js)
- **Git** ([Download](<https://git-scm.com/>))
- **PostgreSQL** database (local or cloud)

### Database Options

Choose one of these database options:

#### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Windows: Download from <https://www.postgresql.org/download/windows/>
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb plugpost
```

#### Option 2: Cloud Database (Recommended)

- **Neon** (Free tier): [https://neon.tech/](<https://neon.tech/>)
- **Supabase** (Free tier): [https://supabase.com/](<https://supabase.com/>)
- **Railway** (Free tier): [https://railway.app/](<https://railway.app/>)
- **PlanetScale** (Free tier): [https://planetscale.com/](<https://planetscale.com/>)

---

## 🛠 Detailed Setup

### Step 1: Clone Repository

```bash
git clone <https://github.com/your-username/plugpost.git>
cd plugpost
```

### Step 2: Install Dependencies

The `package.json` includes all required dependencies:

```bash
npm install
```

**Included Dependencies:**

- **Framework**: Next.js 15.4.6, React 19.1.0
- **Authentication**: NextAuth.js 4.24.11
- **Database**: Prisma 6.13.0, @prisma/client
- **UI**: Tailwind CSS 4, Lucide React icons
- **Editor**: TipTap rich text editor with extensions
- **Validation**: Zod 4.0.15, React Hook Form
- **Security**: bcryptjs, DOMPurify
- **Testing**: Jest, React Testing Library
- **Development**: TypeScript, ESLint, Prettier

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Use your preferred editor to fill in the values
```

**Required Variables:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/plugpost"
NEXTAUTH_URL="<http://localhost:3000>"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Step 4: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed with sample data (optional)
npx prisma db seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at `<http://localhost:3000>`

---

## 🔧 Automated Setup

The platform includes an automated setup script that handles everything:

```bash
npm run setup
```

This script will:

1. ✅ Check Node.js version compatibility
2. ✅ Verify environment variables
3. ✅ Test database connection
4. ✅ Generate Prisma client
5. ✅ Push database schema
6. ✅ Seed database with sample data
7. ✅ Create test user accounts
8. ✅ Verify all dependencies are installed
9. ✅ Run initial health checks

### Setup Verification

```bash
# Check if setup is complete
npm run setup:check

# View setup status
npm run setup:status
```

---

## 🗄 Database Management

### Prisma Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create and run migrations (production)
npx prisma migrate dev

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with sample data
npx prisma db seed
```

### Database Schema

The platform uses these main models:

- **User**: User accounts and profiles
- **Post**: Blog posts and articles
- **Comment**: Post comments with threading
- **Category**: Content categories
- **Tag**: Content tags
- **Like**: Post and comment likes
- **Bookmark**: Saved posts
- **Follow**: User following relationships
- **Notification**: User notifications
- **Newsletter**: Email subscriptions
- **Analytics**: Performance tracking
- **PostVersion**: Content versioning

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Type checking
npm run type-check
```

### Test Structure

```text
__tests__/
├── components/          # Component tests
│   ├── ui/             # UI component tests
│   └── comments/       # Comment system tests
├── api/                # API endpoint tests
├── integration/        # Integration tests
└── lib/                # Utility function tests
```

### Test Users

After running `npm run setup`, these test accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@plugpost.dev | Admin123! |
| Editor | editor@plugpost.dev | Editor123! |
| Contributor | contributor@plugpost.dev | Contributor123! |
| Subscriber | subscriber@plugpost.dev | Subscriber123! |

---

## 🔍 Development Tools

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Database
npm run db:push         # Push schema to database
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio
npm run db:generate     # Generate Prisma client
npm run db:reset        # Reset database (WARNING: deletes data)

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Setup
npm run setup           # Complete automated setup
npm run setup:check     # Verify setup status
```

### IDE Configuration

**VS Code Extensions (Recommended):**

- Prisma
- Tailwind CSS IntelliSense
- TypeScript Importer
- ESLint
- Prettier
- Auto Rename Tag

**VS Code Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 🌐 Environment Setup

### Local Development

1. **Database**: Use local PostgreSQL or cloud database
2. **File Storage**: Local file system (uploads to `./public/uploads`)
3. **Email**: Optional (console logging for development)
4. **OAuth**: Optional but recommended for testing

### Production Environment

1. **Database**: Cloud PostgreSQL (Neon, Supabase, Railway)
2. **File Storage**: Cloudinary or AWS S3
3. **Email**: SMTP service or SendGrid
4. **OAuth**: Required for production
5. **Monitoring**: Sentry for error tracking
6. **Analytics**: Google Analytics

---

## 🔐 Security Setup

### Required Security Measures

1. **Environment Variables**

   ```bash
   # Generate secure NextAuth secret
   openssl rand -base64 32
   ```

2. **Database Security**
   - Use SSL connections in production
   - Enable connection pooling
   - Regular backups

3. **OAuth Configuration**
   - Set up proper redirect URIs
   - Use environment-specific client IDs
   - Secure client secrets

### Optional Security Enhancements

1. **Rate Limiting**: Enable in production
2. **CORS**: Configure allowed origins
3. **CSP**: Content Security Policy headers
4. **API Keys**: For additional API protection

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check database URL format
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Reset and try again
npx prisma migrate reset
npx prisma db push
```

#### Missing Dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### TypeScript Errors

```bash
# Regenerate Prisma client
npx prisma generate

# Check types
npm run type-check
```

### Getting Help

1. **Check the logs**: Look at console output for specific errors
2. **Verify environment**: Run `npm run setup:check`
3. **Database issues**: Use `npx prisma studio` to inspect data
4. **Test connection**: Try the test user accounts
5. **Documentation**: Check `/docs` folder for detailed guides

---

## 📁 Project Structure

```text
plugpost/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── posts/          # Post pages
│   │   └── auth/           # Authentication pages
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── comments/       # Comment system
│   │   ├── editor/         # Rich text editor
│   │   └── admin/          # Admin components
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── __tests__/              # Test files
├── docs/                   # Documentation
└── scripts/                # Setup and utility scripts
```

---

## 🎯 Next Steps

After successful setup:

1. **Explore the Platform**
   - Visit `<http://localhost:3000>`
   - Login with test accounts
   - Create sample content

2. **Development Workflow**
   - Make changes to code
   - Tests run automatically
   - Database changes via Prisma

3. **Customization**
   - Modify UI components in `/src/components/ui/`
   - Add new API endpoints in `/src/app/api/`
   - Customize styling in `tailwind.config.ts`

4. **Deployment**
   - See `DEPLOYMENT.md` for deployment guides
   - Configure production environment variables
   - Set up monitoring and analytics

---

## 📚 Additional Resources

- **API Documentation**: `/docs/API_DOCUMENTATION.md`
- **Test Users**: `/docs/TEST_USERS.md`
- **Deployment Guide**: `/DEPLOYMENT.md`
- **Contributing**: `/CONTRIBUTING.md`
- **Prisma Documentation**: [https://www.prisma.io/docs](<https://www.prisma.io/docs>)
- **Next.js Documentation**: [https://nextjs.org/docs](<https://nextjs.org/docs>)
- **NextAuth.js Documentation**: [https://next-auth.js.org/](<https://next-auth.js.org/>)
