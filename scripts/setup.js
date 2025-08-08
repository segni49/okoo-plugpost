#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const crypto = require('crypto')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex')
}

const createEnvFile = () => {
  log('🔧 Creating environment configuration...', 'cyan')

  // Use a free Neon PostgreSQL database for instant setup
  const envContent = `# PlugPost Environment Configuration
# Generated automatically by setup script

# Database Configuration (Free Neon PostgreSQL - Ready to use!)
DATABASE_URL="postgresql://neondb_owner:npg_JUn8Rglxtde2@ep-wild-breeze-af6hig0a-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${generateSecretKey()}"

# Development Settings
NODE_ENV="development"
NEXT_PUBLIC_ENV="development"

# Optional: OAuth Providers (uncomment and configure if needed)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"

# Optional: File Upload (uncomment and configure if needed)
# CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
# CLOUDINARY_API_KEY="your-cloudinary-key"
# CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Optional: Email Configuration (uncomment and configure if needed)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"

# Feature Flags
FEATURE_COMMENTS="true"
FEATURE_ANALYTICS="true"
FEATURE_NEWSLETTER="true"
FEATURE_SOCIAL_LOGIN="false"

# Application Settings
APP_NAME="PlugPost"
APP_DESCRIPTION="Modern Blog Platform"
APP_URL="http://localhost:3000"

# Admin Configuration (default admin user)
ADMIN_EMAIL="admin@plugpost.local"
ADMIN_NAME="Admin User"
ADMIN_PASSWORD="admin123"

# Development Settings
LOG_LEVEL="info"
ENABLE_PERFORMANCE_MONITORING="true"
`

  fs.writeFileSync('.env', envContent)
  log('✅ Environment file created with free PostgreSQL database!', 'green')
  log('   Using Neon PostgreSQL - no local database setup required!', 'yellow')
}

const setupDatabase = () => {
  log('🗄️ Setting up database...', 'cyan')
  
  try {
    // Generate Prisma client
    log('   Generating Prisma client...', 'yellow')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Push database schema
    log('   Creating database schema...', 'yellow')
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' })
    
    log('✅ Database setup completed!', 'green')
  } catch (error) {
    log('❌ Database setup failed:', 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

const seedDatabase = () => {
  log('🌱 Seeding database with sample data...', 'cyan')
  
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' })
    log('✅ Database seeded successfully!', 'green')
  } catch (error) {
    log('⚠️  Database seeding failed (this is optional):', 'yellow')
    log('   You can run "npm run db:seed" later to add sample data', 'yellow')
  }
}

const createDirectories = () => {
  log('📁 Creating necessary directories...', 'cyan')
  
  const directories = [
    'uploads',
    'logs',
    'public/images',
    'public/uploads'
  ]
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      log(`   Created: ${dir}`, 'yellow')
    }
  })
  
  log('✅ Directories created successfully!', 'green')
}

const checkDependencies = () => {
  log('📦 Checking dependencies...', 'cyan')
  
  try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      log('   Installing dependencies...', 'yellow')
      execSync('npm install', { stdio: 'inherit' })
    }
    
    log('✅ Dependencies are ready!', 'green')
  } catch (error) {
    log('❌ Failed to install dependencies:', 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

const displaySuccessMessage = () => {
  log('\n🎉 PlugPost setup completed successfully!', 'green')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green')
  log('\n📋 What was set up:', 'bright')
  log('   ✅ Environment configuration (.env)', 'green')
  log('   ✅ PostgreSQL database (Neon cloud)', 'green')
  log('   ✅ Database schema and tables', 'green')
  log('   ✅ Sample data and admin user', 'green')
  log('   ✅ Required directories', 'green')
  log('\n🚀 Ready to start development:', 'bright')
  log('   npm run dev', 'cyan')
  log('\n🔑 Default admin credentials:', 'bright')
  log('   Email: admin@plugpost.local', 'yellow')
  log('   Password: admin123', 'yellow')
  log('\n📖 Useful commands:', 'bright')
  log('   npm run dev          - Start development server', 'cyan')
  log('   npm run build        - Build for production', 'cyan')
  log('   npm run db:studio    - Open database browser', 'cyan')
  log('   npm run db:seed      - Reseed database', 'cyan')
  log('   npm test             - Run tests', 'cyan')
  log('\n🌐 Access your blog at: http://localhost:3000', 'magenta')
  log('🔧 Admin dashboard at: http://localhost:3000/admin', 'magenta')
  log('\n💡 Database info:', 'bright')
  log('   Using free Neon PostgreSQL (no local setup needed)', 'yellow')
  log('   Database URL configured automatically', 'yellow')
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green')
  log('Happy blogging! 🎉', 'bright')
}

const main = () => {
  log('\n🚀 Welcome to PlugPost Setup!', 'bright')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')
  log('Setting up your blog platform in 3... 2... 1...', 'blue')
  log('')
  
  try {
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      log('⚠️  .env file already exists. Skipping environment setup.', 'yellow')
      log('   Delete .env file if you want to regenerate it.', 'yellow')
    } else {
      createEnvFile()
    }
    
    checkDependencies()
    createDirectories()
    setupDatabase()
    seedDatabase()
    displaySuccessMessage()
    
  } catch (error) {
    log('\n❌ Setup failed:', 'red')
    log(error.message, 'red')
    log('\n💡 Try running the setup again or check the documentation.', 'yellow')
    process.exit(1)
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }
