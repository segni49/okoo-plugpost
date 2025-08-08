# PlugPost - Modern Blog Platform

A comprehensive, feature-rich blog platform built with Next.js 14, TypeScript, Prisma, and NextAuth.js. PlugPost provides a complete solution for content management, user authentication, and blog administration.

## 🚀 Features

### Core Features
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, Tailwind CSS, and Prisma
- **Authentication**: Secure authentication with NextAuth.js supporting multiple providers
- **Content Management**: Rich text editor with image uploads and media management
- **User Roles**: Multi-level user system (Admin, Editor, Author, Subscriber)
- **Responsive Design**: Mobile-first design that works on all devices

### Advanced Features
- **Search & Discovery**: Full-text search with autocomplete and advanced filtering
- **Comment System**: Threaded comments with moderation and like functionality
- **Analytics**: Comprehensive analytics dashboard with performance monitoring
- **Security**: Advanced security features including rate limiting and input validation
- **Performance**: Optimized for Core Web Vitals with performance monitoring
- **SEO Optimized**: Built-in SEO features with meta tags and structured data

## 🛠 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/plugpost.git
   cd plugpost
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/plugpost"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # File Upload (optional)
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-cloudinary-key"
   CLOUDINARY_API_SECRET="your-cloudinary-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### User Roles

- **Admin**: Full system access, user management, system settings
- **Editor**: Content management, user moderation, analytics access
- **Author**: Create and manage own posts, basic analytics
- **Subscriber**: Read posts, comment, like content

### Content Management

1. **Creating Posts**
   - Navigate to `/admin/posts/new`
   - Use the rich text editor to create content
   - Add categories, tags, and featured images
   - Set publication status and scheduling

2. **Managing Categories**
   - Go to `/admin/categories`
   - Create, edit, and organize content categories
   - Set category colors and descriptions

3. **User Management**
   - Access `/admin/users`
   - Manage user roles and permissions
   - View user activity and statistics

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register - Register new user
POST /api/auth/signin - Sign in user
POST /api/auth/signout - Sign out user
POST /api/auth/reset-password - Reset password
```

### Posts Endpoints

```
GET /api/posts - Get posts with filtering and pagination
POST /api/posts - Create new post (authenticated)
GET /api/posts/[id] - Get specific post
PUT /api/posts/[id] - Update post (authenticated)
DELETE /api/posts/[id] - Delete post (authenticated)
GET /api/posts/slug/[slug] - Get post by slug
```

### Comments Endpoints

```
GET /api/posts/[id]/comments - Get post comments
POST /api/posts/[id]/comments - Create comment (authenticated)
PUT /api/comments/[id] - Update comment (authenticated)
DELETE /api/comments/[id] - Delete comment (authenticated)
POST /api/comments/[id]/like - Toggle comment like (authenticated)
```

### Search Endpoints

```
GET /api/search - Global search across content
GET /api/search/suggestions - Get search suggestions
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set Environment Variables**
   Configure all environment variables in the Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔧 Development

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database commands
npx prisma studio      # Open Prisma Studio
npx prisma db push     # Push schema changes
npx prisma generate    # Generate Prisma client
npx prisma db seed     # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by the PlugPost team
