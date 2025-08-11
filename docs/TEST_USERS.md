# Test User Accounts

This document provides test user accounts for each role in the PlugPost platform. These accounts are pre-configured with realistic data for testing and development purposes.

## Quick Access Credentials

| Role | Email | Password | Name |
|------|-------|----------|------|
| **Admin** | `admin@plugpost.dev` | Admin123! | Alex Admin |
| **Editor** | `editor@plugpost.dev` | Editor123! | Emma Editor |
| **Contributor** | `contributor@plugpost.dev` | Contributor123! | Chris Contributor |
| **Subscriber** | `subscriber@plugpost.dev` | Subscriber123! | Sam Subscriber |

---

## Admin User

**Login Credentials:**

- **Email**: `admin@plugpost.dev`
- **Password**: `Admin123!`
- **Role**: `ADMIN`
- **Status**: `ACTIVE`

**Profile Information:**

- **Name**: Alex Admin
- **Bio**: Platform administrator with full system access. Passionate about content management and community building.
- **Website**: <https://alexadmin.dev>
- **Location**: San Francisco, CA

**Permissions & Access:**

- ✅ Full system administration
- ✅ User management (create, edit, delete, suspend users)
- ✅ Content management (all posts, comments, categories, tags)
- ✅ Analytics and reporting
- ✅ System settings and configuration
- ✅ Bulk operations
- ✅ Newsletter management
- ✅ Performance monitoring

**Sample Data:**

- **Posts Created**: 25 (mix of published, drafts, scheduled)
- **Comments**: 45
- **Followers**: 150
- **Following**: 75

---

## Editor User

**Login Credentials:**

- **Email**: `editor@plugpost.dev`
- **Password**: `Editor123!`
- **Role**: `EDITOR`
- **Status**: `ACTIVE`

**Profile Information:**

- **Name**: Emma Editor
- **Bio**: Content editor and moderator. Specializes in technical writing and community management.
- **Website**: <https://emmaeditor.blog>
- **Location**: New York, NY

**Permissions & Access:**

- ✅ Content management (create, edit, publish posts)
- ✅ Comment moderation
- ✅ Category and tag management
- ✅ User content oversight
- ✅ Analytics dashboard access
- ✅ Bulk content operations
- ❌ User role management
- ❌ System settings
- ❌ User account deletion

**Sample Data:**

- **Posts Created**: 40 (mostly published tutorials and guides)
- **Comments**: 120
- **Followers**: 200
- **Following**: 85

---

## Contributor User

**Login Credentials:**

- **Email**: `contributor@plugpost.dev`
- **Password**: `Contributor123!`
- **Role**: `CONTRIBUTOR`
- **Status**: `ACTIVE`

**Profile Information:**

- **Name**: Chris Contributor
- **Bio**: Full-stack developer and technical writer. Loves sharing knowledge about web development and programming.
- **Website**: <https://chriscontributor.dev>
- **Location**: Austin, TX

**Permissions & Access:**

- ✅ Create and manage own posts
- ✅ Comment on posts
- ✅ Create tags (for own posts)
- ✅ Basic analytics for own content
- ✅ Profile management
- ❌ Edit other users' posts
- ❌ Comment moderation
- ❌ Category management
- ❌ User management

**Sample Data:**

- **Posts Created**: 15 (technical tutorials and programming guides)
- **Comments**: 80
- **Followers**: 95
- **Following**: 120

---

## Subscriber User

**Login Credentials:**

- **Email**: `subscriber@plugpost.dev`
- **Password**: `Subscriber123!`
- **Role**: `SUBSCRIBER`
- **Status**: `ACTIVE`

**Profile Information:**

- **Name**: Sam Subscriber
- **Bio**: Avid reader and learner. Interested in technology, programming, and web development.
- **Website**: <https://samsubscriber.com>
- **Location**: Seattle, WA

**Permissions & Access:**

- ✅ Read published posts
- ✅ Comment on posts
- ✅ Like posts and comments
- ✅ Bookmark posts
- ✅ Follow other users
- ✅ Basic profile management
- ❌ Create posts
- ❌ Content management
- ❌ Analytics access
- ❌ Administrative functions

**Sample Data:**

- **Posts Created**: 0
- **Comments**: 35
- **Followers**: 25
- **Following**: 180
- **Bookmarks**: 45 posts

---

## Additional Test Users

### Suspended User

- **Email**: `suspended@plugpost.dev`
- **Password**: `Suspended123!`
- **Role**: `SUBSCRIBER`
- **Status**: `SUSPENDED`
- **Name**: Suspended User
- **Purpose**: Test suspended account behavior

### Inactive User

- **Email**: `inactive@plugpost.dev`
- **Password**: `Inactive123!`
- **Role**: `SUBSCRIBER`
- **Status**: `INACTIVE`
- **Name**: Inactive User
- **Purpose**: Test inactive account behavior

### Pending User

- **Email**: `pending@plugpost.dev`
- **Password**: `Pending123!`
- **Role**: `SUBSCRIBER`
- **Status**: `PENDING`
- **Name**: Pending User
- **Purpose**: Test pending verification behavior

---

## OAuth Test Accounts

### Google OAuth Test

- **Email**: `test.google@plugpost.dev`
- **Provider**: Google
- **Role**: `SUBSCRIBER`
- **Name**: Google Test User

### GitHub OAuth Test

- **Email**: `test.github@plugpost.dev`
- **Provider**: GitHub
- **Role**: `CONTRIBUTOR`
- **Name**: GitHub Test User

### Discord OAuth Test

- **Email**: `test.discord@plugpost.dev`
- **Provider**: Discord
- **Role**: `SUBSCRIBER`
- **Name**: Discord Test User

---

## Sample Content Data

### Categories (Created by Admin/Editor)

1. **Programming** - `#3B82F6` - 25 posts
2. **Web Development** - `#10B981` - 18 posts
3. **JavaScript** - `#F59E0B` - 15 posts
4. **React** - `#06B6D4` - 12 posts
5. **Node.js** - `#84CC16` - 8 posts
6. **Tutorial** - `#8B5CF6` - 30 posts

### Popular Tags

- `javascript` (45 posts)
- `react` (25 posts)
- `nodejs` (20 posts)
- `tutorial` (35 posts)
- `beginner` (28 posts)
- `advanced` (15 posts)
- `frontend` (22 posts)
- `backend` (18 posts)

### Sample Posts by Role

**Admin Posts:**

- "Platform Announcement: New Features"
- "Community Guidelines Update"
- "Monthly Platform Statistics"

**Editor Posts:**

- "Complete Guide to JavaScript ES6"
- "React Best Practices 2024"
- "Node.js Performance Optimization"

**Contributor Posts:**

- "Building Your First React App"
- "Understanding JavaScript Closures"
- "CSS Grid vs Flexbox: When to Use What"

---

## Testing Scenarios

### Authentication Testing

1. **Valid Login**: Use any of the main test accounts
2. **Invalid Credentials**: Try wrong password with valid email
3. **Suspended Account**: Login with `suspended@plugpost.dev`
4. **OAuth Flow**: Test with OAuth test accounts

### Role-Based Access Testing

1. **Admin Access**: Login as admin, test all admin features
2. **Editor Permissions**: Login as editor, verify content management access
3. **Contributor Limits**: Login as contributor, test post creation only
4. **Subscriber Restrictions**: Login as subscriber, verify read-only access

### Content Interaction Testing

1. **Post Creation**: Test with admin, editor, contributor accounts
2. **Comment System**: Test commenting with all account types
3. **Like/Bookmark**: Test engagement features
4. **Follow System**: Test user following between accounts

### Moderation Testing

1. **Comment Moderation**: Use editor account to moderate comments
2. **User Management**: Use admin account to manage user roles/status
3. **Content Approval**: Test content approval workflows

---

## Database Seeding

These test users and their associated data can be created using the database seeding script:

```bash
# Run the seeding script to create test users and sample data
npm run db:seed

# Or run specific seed for test users only
npm run db:seed:users
```

The seeding script will create all test users, sample posts, comments, categories, tags, and relationships between them.

---

## Security Notes

⚠️ **Important**: These are test accounts for development purposes only.

- **Never use these credentials in production**
- **Change all passwords before deploying to production**
- **Remove test accounts from production databases**
- **Use environment-specific test data**

For production testing, create separate test accounts with different credentials and limited access to production data.
