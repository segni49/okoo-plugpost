# PlugPost Deployment Guide

This guide covers various deployment options for PlugPost, from development to production environments.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Environment Configuration](#️-environment-configuration)
- [Deployment Options](#-deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Docker](#docker)
  - [Manual Deployment](#manual-deployment)
  - [AWS](#aws)
  - [DigitalOcean](#digitalocean)
- [Database Setup](#️-database-setup)
- [Environment Variables](#-environment-variables)
- [Security Considerations](#-security-considerations)
- [Monitoring and Logging](#-monitoring-and-logging)
- [Troubleshooting](#-troubleshooting)

## 🔧 Prerequisites

- Node.js 18+
- PostgreSQL database
- Git
- Domain name (for production)
- SSL certificate (for production)

## ⚙️ Environment Configuration

### Development

```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

### Staging

```bash
NODE_ENV=production
NEXTAUTH_URL=https://staging.yourdomain.com
```

### Production

```bash
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
```

## 🚀 Deployment Options

### Vercel (Recommended)

Vercel provides the easiest deployment experience for Next.js applications.

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# Development deployment
vercel

# Production deployment
vercel --prod
```

#### 4. Configure Environment Variables

Set environment variables in the Vercel dashboard:

- Go to your project settings
- Navigate to "Environment Variables"
- Add all required variables from `.env.example`

#### 5. Custom Domain

- Add your domain in the Vercel dashboard
- Configure DNS records as instructed

### Docker

Deploy using Docker for containerized environments.

#### 1. Build Docker Image

```bash
docker build -t plugpost:latest .
```

#### 2. Run Container

```bash
docker run -d \
  --name plugpost \
  --env-file .env.production \
  -p 3000:3000 \
  plugpost:latest
```

#### 3. Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app
```

### Manual Deployment

For VPS or dedicated server deployment.

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/plugpost.git
cd plugpost

# Install dependencies
npm ci

# Build application
npm run build

# Start with PM2
pm2 start npm --name "plugpost" -- start
pm2 save
pm2 startup
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### AWS

Deploy to AWS using various services.

#### Option 1: AWS App Runner

1. Create App Runner service
2. Connect to GitHub repository
3. Configure build settings:

   ```yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - npm ci
         - npm run build
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3000
       env: PORT
   ```

#### Option 2: AWS ECS with Fargate

1. Create ECR repository
2. Build and push Docker image
3. Create ECS cluster and service
4. Configure load balancer and auto-scaling

#### Option 3: AWS Elastic Beanstalk

1. Create Elastic Beanstalk application
2. Upload deployment package
3. Configure environment variables
4. Deploy

### DigitalOcean

Deploy using DigitalOcean App Platform.

#### 1. Create App

```yaml
name: plugpost
services:
- name: web
  source_dir: /
  github:
    repo: yourusername/plugpost
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
databases:
- name: db
  engine: PG
  version: "13"
```

## 🗄️ Database Setup

### PostgreSQL on Neon (Recommended)

1. Create account at [Neon](https://neon.tech)
2. Create new project
3. Copy connection string
4. Set `DATABASE_URL` environment variable

### Self-hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE plugpost;
CREATE USER plugpost_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE plugpost TO plugpost_user;
```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## 🔐 Environment Variables

### Required Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
```

### Optional Variables

```env
# OAuth
GOOGLE_CLIENT_ID="..."
GITHUB_CLIENT_ID="..."

# File Upload
CLOUDINARY_CLOUD_NAME="..."

# Email
SMTP_HOST="..."
SMTP_USER="..."
```

## 🔒 Security Considerations

### SSL/TLS

- Always use HTTPS in production
- Configure proper SSL certificates
- Enable HSTS headers

### Environment Variables

- Never commit secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly

### Database Security

- Use connection pooling
- Enable SSL for database connections
- Regular backups

### Rate Limiting

- Configure rate limiting in production
- Monitor for suspicious activity
- Implement IP blocking for abuse

## 📊 Monitoring and Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs plugpost

# Restart application
pm2 restart plugpost
```

### Health Checks

Create health check endpoint:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
}
```

### Error Tracking

Configure Sentry for error tracking:

```env
SENTRY_DSN="your-sentry-dsn"
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache
npm run clean
rm -rf .next node_modules
npm install
npm run build
```

#### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Performance Optimization

#### Enable Compression

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

#### Caching

```nginx
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Database Optimization

- Enable connection pooling
- Add database indexes
- Monitor query performance

## 📝 Deployment Checklist

### Pre-deployment

- [ ] Run tests (`npm test`)
- [ ] Check build (`npm run build`)
- [ ] Update environment variables
- [ ] Backup database
- [ ] Review security settings

### Post-deployment

- [ ] Verify application is running
- [ ] Test critical functionality
- [ ] Check logs for errors
- [ ] Monitor performance
- [ ] Update DNS if needed

### Rollback Plan

- [ ] Keep previous version available
- [ ] Database backup ready
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

## 🆘 Support

For deployment issues:

- Check the [troubleshooting section](#-troubleshooting)
- Review application logs
- Contact support at <support@plugpost.com>

---

**Note**: Always test deployments in a staging environment before deploying to production.
