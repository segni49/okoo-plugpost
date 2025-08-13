# 🚀 Getting Started with PlugPost

Welcome to PlugPost! This guide will get you up and running in under 2 minutes.

## ⚡ Quick Start (2 Commands)

```bash
git clone https://github.com/your-repo/plugpost.git
npm install 
npm run dev
```

**That's it!** Your blog is now running at [http://localhost:3000](http://localhost:3000)

## 🔑 First Login

1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Login with:
   - **Email**: `admin@plugpost.dev`
   - **Password**: `Admin123!`

## 📝 Create Your First Post

1. **Login to Admin Dashboard**
   - Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)
   - Use the default credentials above

2. **Create a New Post**
   - Click "Posts" in the sidebar
   - Click "New Post" button
   - Write your content using the rich text editor
   - Add categories and tags
   - Click "Publish" or "Save Draft"

3. **View Your Post**
   - Go to [http://localhost:3000](http://localhost:3000)
   - Your post will appear on the homepage

## 🎨 Customize Your Blog

### Change Site Settings
1. Go to Admin Dashboard → Settings
2. Update:
   - Site name and description
   - Logo and favicon
   - Social media links
   - SEO settings

### Create Categories
1. Go to Admin Dashboard → Categories
2. Click "New Category"
3. Add name, description, and color
4. Save and use in your posts

### Manage Users
1. Go to Admin Dashboard → Users
2. Invite new authors and editors
3. Assign roles and permissions

## 🔧 Configuration

### Environment Variables
The setup automatically creates a `.env` file with:
- Free PostgreSQL database (Neon)
- Authentication secrets
- Default configuration

### Custom Database (Optional)
To use your own PostgreSQL database:

1. Update `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_db"
   ```

2. Reset database:
   ```bash
   npm run db:reset
   ```

### OAuth Providers (Optional)
To enable Google/GitHub login:

1. Get OAuth credentials from providers
2. Update `.env` file:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   ```

3. Restart the development server

## 📚 Key Features

### For Content Creators
- **Rich Text Editor**: Full-featured editor with formatting, images, and media
- **Draft System**: Save drafts and publish when ready
- **Categories & Tags**: Organize your content
- **SEO Tools**: Built-in SEO optimization
- **Analytics**: Track views and engagement

### For Developers
- **Modern Stack**: Next.js 14, TypeScript, Prisma, PostgreSQL
- **API-First**: Complete REST API for all functionality
- **Extensible**: Easy to customize and extend
- **Production Ready**: Security, performance, and deployment configured

### For Administrators
- **User Management**: Role-based access control
- **Content Moderation**: Comment moderation and spam protection
- **Analytics Dashboard**: Comprehensive insights and reporting
- **Security**: Rate limiting, input validation, and monitoring

## 🛠 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Open database browser
npm run db:studio

# Reset database
npm run db:reset

# Manual setup (if needed)
npm run setup
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically

### Docker
```bash
docker build -t plugpost .
docker run -p 3000:3000 plugpost
```

### Manual Server
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🆘 Troubleshooting

### Setup Issues
If setup fails, try:
```bash
npm run setup
```

### Database Issues
Reset the database:
```bash
npm run db:reset
```

### Port Already in Use
Change the port:
```bash
PORT=3001 npm run dev
```

### Clear Cache
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📖 Documentation

- **API Documentation**: See `/api` endpoints in your browser
- **Component Library**: Explore `src/components/ui/`
- **Database Schema**: Check `prisma/schema.prisma`
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 Support

- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check the full README.md

---

**🎉 You're all set! Start creating amazing content with PlugPost!**
