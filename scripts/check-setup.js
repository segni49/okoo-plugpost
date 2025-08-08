#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

const checkEnvFile = () => {
  if (!fs.existsSync('.env')) {
    return false
  }
  
  const envContent = fs.readFileSync('.env', 'utf8')
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      return false
    }
  }
  
  return true
}

const checkDatabase = () => {
  // Check if Prisma client is generated
  return fs.existsSync('node_modules/.prisma') || fs.existsSync('node_modules/@prisma/client')
}

const checkDirectories = () => {
  const requiredDirs = ['uploads', 'public/images']
  return requiredDirs.every(dir => fs.existsSync(dir))
}

const runSetup = () => {
  log('\n🔧 Running initial setup...', 'cyan')
  log('This will only take a moment!', 'yellow')
  
  try {
    const { main } = require('./setup.js')
    main()
  } catch (error) {
    log('\n❌ Setup failed. Please run manually:', 'red')
    log('npm run setup', 'yellow')
    process.exit(1)
  }
}

const main = () => {
  // Skip setup check in CI environments
  if (process.env.CI || process.env.NODE_ENV === 'production') {
    return
  }
  
  const envExists = checkEnvFile()
  const dbExists = checkDatabase()
  const dirsExist = checkDirectories()
  
  if (!envExists || !dbExists || !dirsExist) {
    log('\n🚀 Welcome to PlugPost!', 'blue')
    log('Setting up your development environment...', 'cyan')
    runSetup()
  }
}

// Run check if this script is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }
