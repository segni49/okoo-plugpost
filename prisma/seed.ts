import { PrismaClient, UserRole, UserStatus, PostStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use UNPOOLED connection for seeding if available (Neon often requires direct URL for long-running operations)
const datasourceUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
const prisma = new PrismaClient({ datasources: { db: { url: datasourceUrl } } })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create test users
  console.log('👥 Creating test users...')
  
  const hashedPassword = await bcrypt.hash('Admin123!', 12)
  
  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@plugpost.dev' },
    update: {},
    create: {
      email: 'admin@plugpost.dev',
      name: 'Segni Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      bio: 'Platform administrator with full system access. Passionate about content management and community building.',
      website: 'https://alexadmin.dev',
      location: 'Addis ababa, et',
      emailVerified: new Date(),
    },
  })

  // Editor user
  const editorPassword = await bcrypt.hash('Editor123!', 12)
  const editor = await prisma.user.upsert({
    where: { email: 'editor@plugpost.dev' },
    update: {},
    create: {
      email: 'editor@plugpost.dev',
      name: 'Hojiwak Editor',
      password: editorPassword,
      role: UserRole.EDITOR,
      status: UserStatus.ACTIVE,
      bio: 'Content editor and moderator. Specializes in technical writing and community management.',
      website: 'https://emmaeditor.blog',
      location: 'Addis Ababa, et',
      emailVerified: new Date(),
    },
  })

  // Contributor user
  const contributorPassword = await bcrypt.hash('Contributor123!', 12)
  const contributor = await prisma.user.upsert({
    where: { email: 'contributor@plugpost.dev' },
    update: {},
    create: {
      email: 'contributor@plugpost.dev',
      name: 'mulugeta Contributor',
      password: contributorPassword,
      role: UserRole.CONTRIBUTOR,
      status: UserStatus.ACTIVE,
      bio: 'Full-stack developer and technical writer. Loves sharing knowledge about web development and programming.',
      website: 'https://chriscontributor.dev',
      location: 'Addis Ababa, ethiopia',
      emailVerified: new Date(),
    },
  })

  // Subscriber user
  const subscriberPassword = await bcrypt.hash('Subscriber123!', 12)
  const subscriber = await prisma.user.upsert({
    where: { email: 'subscriber@plugpost.dev' },
    update: {},
    create: {
      email: 'subscriber@plugpost.dev',
      name: 'Sam Subscriber',
      password: subscriberPassword,
      role: UserRole.SUBSCRIBER,
      status: UserStatus.ACTIVE,
      bio: 'Avid reader and learner. Interested in technology, programming, and web development.',
      website: 'https://samsubscriber.com',
      location: 'Seattle, WA',
      emailVerified: new Date(),
    },
  })

  // Additional test users
  const suspendedPassword = await bcrypt.hash('Suspended123!', 12)
  const suspended = await prisma.user.upsert({
    where: { email: 'suspended@plugpost.dev' },
    update: {},
    create: {
      email: 'suspended@plugpost.dev',
      name: 'Suspended User',
      password: suspendedPassword,
      role: UserRole.SUBSCRIBER,
      status: UserStatus.SUSPENDED,
      bio: 'Test account for suspended user behavior.',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Test users created successfully')

  // Create categories
  console.log('📁 Creating categories...')
  
  const programmingCategory = await prisma.category.upsert({
    where: { slug: 'programming' },
    update: {},
    create: {
      name: 'Programming',
      slug: 'programming',
      description: 'Programming tutorials, guides, and best practices',
      color: '#3B82F6',
    },
  })

  const webDevCategory = await prisma.category.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Frontend and backend web development content',
      color: '#10B981',
    },
  })

  const jsCategory = await prisma.category.upsert({
    where: { slug: 'javascript' },
    update: {},
    create: {
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JavaScript tutorials and advanced concepts',
      color: '#F59E0B',
    },
  })

  const reactCategory = await prisma.category.upsert({
    where: { slug: 'react' },
    update: {},
    create: {
      name: 'React',
      slug: 'react',
      description: 'React framework tutorials and best practices',
      color: '#06B6D4',
    },
  })

  const tutorialCategory = await prisma.category.upsert({
    where: { slug: 'tutorial' },
    update: {},
    create: {
      name: 'Tutorial',
      slug: 'tutorial',
      description: 'Step-by-step tutorials and learning guides',
      color: '#8B5CF6',
    },
  })

  console.log('✅ Categories created successfully')

  // Create tags
  console.log('🏷️ Creating tags...')
  
  const tags = [
    'javascript', 'react', 'nodejs', 'typescript', 'nextjs',
    'tutorial', 'beginner', 'advanced', 'frontend', 'backend',
    'api', 'database', 'authentication', 'deployment', 'testing'
  ]

  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: {
        name: tagName.charAt(0).toUpperCase() + tagName.slice(1),
        slug: tagName,
      },
    })
  }

  console.log('✅ Tags created successfully')

  // Create sample posts
  console.log('📝 Creating sample posts...')

  // Admin posts
  await prisma.post.upsert({
    where: { slug: 'welcome-to-plugpost' },
    update: {},
    create: {
      title: 'Welcome to PlugPost Platform',
      slug: 'welcome-to-plugpost',
      excerpt: 'Welcome to PlugPost, the modern blogging platform built for developers and content creators.',
      content: `<h2>Welcome to PlugPost!</h2>
      <p>PlugPost is a modern, feature-rich blogging platform designed for developers, writers, and content creators. Built with Next.js, TypeScript, and modern web technologies.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>Rich text editor with advanced formatting</li>
        <li>User authentication and role management</li>
        <li>Comment system with threading</li>
        <li>Analytics and performance tracking</li>
        <li>SEO optimization</li>
        <li>Responsive design</li>
      </ul>
      
      <p>Get started by exploring the platform and creating your first post!</p>`,
      featuredImage: '/uploads/images/welcome.jpg',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: tutorialCategory.id,
      seoTitle: 'Welcome to PlugPost - Modern Blogging Platform',
      seoDescription: 'Discover PlugPost, the modern blogging platform built for developers and content creators with advanced features and seamless user experience.',
      readTime: 3,
      viewCount: 150,
    },
  })

  // Editor posts
  await prisma.post.upsert({
    where: { slug: 'getting-started-with-javascript' },
    update: {},
    create: {
      title: 'Getting Started with JavaScript',
      slug: 'getting-started-with-javascript',
      excerpt: 'Learn the fundamentals of JavaScript programming with practical examples and best practices.',
      content: `<h2>Introduction to JavaScript</h2>
      <p>JavaScript is a versatile programming language that powers the modern web. In this comprehensive guide, we'll cover the fundamentals you need to get started.</p>
      
      <h3>Variables and Data Types</h3>
      <pre><code>// Variables
let name = "John";
const age = 25;
var isStudent = true;

// Data types
let number = 42;
let string = "Hello World";
let boolean = true;
let array = [1, 2, 3];
let object = { name: "John", age: 25 };</code></pre>
      
      <h3>Functions</h3>
      <pre><code>// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Arrow function
const greetArrow = (name) => {
  return \`Hello, \${name}!\`;
};</code></pre>
      
      <p>This is just the beginning! JavaScript has much more to offer.</p>`,
      featuredImage: '/uploads/images/javascript-guide.jpg',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      authorId: editor.id,
      categoryId: jsCategory.id,
      seoTitle: 'JavaScript Tutorial for Beginners - Complete Guide',
      seoDescription: 'Learn JavaScript from scratch with this comprehensive tutorial covering variables, functions, objects, and more.',
      readTime: 8,
      viewCount: 320,
    },
  })

  console.log('✅ Sample posts created successfully')

  console.log('🎉 Database seeding completed!')
  console.log('\n📋 Test User Accounts:')
  console.log('Admin: admin@plugpost.dev / Admin123!')
  console.log('Editor: editor@plugpost.dev / Editor123!')
  console.log('Contributor: contributor@plugpost.dev / Contributor123!')
  console.log('Subscriber: subscriber@plugpost.dev / Subscriber123!')
  console.log('\n🚀 Start the development server: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
