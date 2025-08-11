# PlugPost Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue: Testing Users Not Working

**Problem**: Cannot login with test user credentials (admin@plugpost.dev, editor@plugpost.dev, etc.)

**Root Cause**: Database connection failure or database not seeded with test users.

#### Solution Steps:

1. **Check Database Connection**
   ```bash
   # Test database connection
   npx prisma db push
   ```

2. **If Database Connection Fails**:
   
   **Option A: Fix Neon Database**
   - Go to [Neon Console](https://console.neon.tech/)
   - Check if your database is active (not paused/deleted)
   - Get a new connection string if needed
   - Update `DATABASE_URL` in `.env` file

   **Option B: Use Local PostgreSQL**
   ```bash
   # Install PostgreSQL locally
   # Create database: plugpost
   # Update .env file:
   DATABASE_URL="postgresql://postgres:password@localhost:5432/plugpost"
   ```

3. **Seed the Database**
   ```bash
   # Push schema to database
   npx prisma db push
   
   # Seed with test users
   npx prisma db seed
   ```

4. **Verify Test Users Created**
   ```bash
   # Open Prisma Studio to check users
   npx prisma studio
   ```

#### Test User Credentials:
- **Admin**: admin@plugpost.dev / Admin123!
- **Editor**: editor@plugpost.dev / Editor123!
- **Contributor**: contributor@plugpost.dev / Contributor123!
- **Subscriber**: subscriber@plugpost.dev / Subscriber123!

---

### Issue: Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:

1. **Check Environment Variables**
   - Ensure `.env` file exists with correct DATABASE_URL
   - Verify connection string format

2. **Database Provider Issues**:
   - **Neon**: Database might be paused (free tier limitation)
   - **Supabase**: Check project status
   - **Local**: Ensure PostgreSQL service is running

3. **Network Issues**:
   - Check firewall settings
   - Verify internet connection for cloud databases

---

### Issue: Dependency Installation Errors

**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Install with legacy peer deps
npm install --legacy-peer-deps

# Or force install
npm install --force
```

---

### Issue: Seeding Script Fails

**Error**: `'tsx' is not recognized`

**Solutions**:

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run Seed Directly**
   ```bash
   npx tsx prisma/seed.ts
   ```

3. **Alternative Seeding**
   ```bash
   # Compile TypeScript first
   npx tsc prisma/seed.ts --outDir dist
   node dist/prisma/seed.js
   ```

---

### Issue: Authentication Not Working

**Problem**: Login form shows "Invalid credentials" for correct test user credentials

**Debugging Steps**:

1. **Check Database Users**
   ```bash
   npx prisma studio
   # Verify users exist in database
   ```

2. **Check Password Hashing**
   - Ensure bcryptjs is properly hashing passwords
   - Verify hash comparison in auth.ts

3. **Check NextAuth Configuration**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain

---

### Issue: Development Server Won't Start

**Error**: Various startup errors

**Solutions**:

1. **Clear Next.js Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   npm run dev
   ```

3. **Check Port Conflicts**
   ```bash
   # Use different port
   npm run dev -- -p 3001
   ```

---

## 🔧 Quick Fixes

### Reset Everything
```bash
# Complete reset (use with caution)
rm -rf node_modules .next
npm install --legacy-peer-deps
npx prisma db push
npx prisma db seed
npm run dev
```

### Database Reset
```bash
# Reset database and reseed
npx prisma db push --force-reset
npx prisma db seed
```

### Environment Setup
```bash
# Copy example environment
cp .env.example .env.local
# Edit .env.local with your values
```

---

## 📞 Getting Help

If issues persist:

1. **Check Logs**: Look at terminal output for specific error messages
2. **Database Status**: Verify your database provider's status page
3. **GitHub Issues**: Search existing issues or create a new one
4. **Documentation**: Review setup guides in `/docs` folder

---

## 🚀 Quick Start Checklist

- [ ] Database connection working (`npx prisma db push`)
- [ ] Dependencies installed (`npm install --legacy-peer-deps`)
- [ ] Environment variables set (`.env` file)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Development server running (`npm run dev`)
- [ ] Test users can login

---

*Last updated: August 2025*
