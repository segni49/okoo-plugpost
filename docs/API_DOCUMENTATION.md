# PlugPost API Documentation

## Overview

PlugPost provides a comprehensive RESTful API with 50+ endpoints for managing content, users, and platform features. All endpoints return JSON responses and follow standard HTTP status codes.

## Base URL

- **Development**: `<http://localhost:3000/api>`
- **Production**: `<https://yourdomain.com/api>`

## Authentication

Most endpoints require authentication via NextAuth.js session cookies. Include session cookies in requests to authenticated endpoints.

### Authentication Levels

- **Public**: No authentication required
- **Authenticated**: Valid session required
- **Role-based**: Specific user roles required

### User Roles

- **ADMIN**: Full system access
- **EDITOR**: Content management and moderation
- **CONTRIBUTOR**: Create and manage own content
- **SUBSCRIBER**: Basic user access

## Response Format

All API responses follow this structure:

```json
{
  "data": {}, // Response data
  "error": "Error message", // Only present on errors
  "pagination": { // Only present on paginated responses
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Register a new user account.

**Authentication**: Public

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (201):

```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SUBSCRIBER",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Posts Endpoints

### Get Posts

**GET** `/api/posts`

Retrieve posts with filtering and pagination.

**Authentication**: Public (shows only published posts for non-authenticated users)

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `status` (string): Filter by status (DRAFT, PUBLISHED, ARCHIVED, SCHEDULED)
- `categoryId` (string): Filter by category ID
- `authorId` (string): Filter by author ID
- `search` (string): Search in title, content, excerpt
- `sortBy` (string): Sort field (createdAt, publishedAt, viewCount, title)
- `sortOrder` (string): Sort direction (asc, desc)

**Example Request**:

```http
GET /api/posts?page=1&limit=10&status=PUBLISHED&categoryId=clx123&search=javascript
```

**Response** (200):

```json
{
  "posts": [
    {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "slug": "getting-started-with-javascript",
      "excerpt": "Learn the basics of JavaScript programming...",
      "content": "Full post content here...",
      "featuredImage": "/uploads/images/featured.jpg",
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:30:00Z",
      "viewCount": 150,
      "readTime": 5,
      "seoTitle": "JavaScript Tutorial for Beginners",
      "seoDescription": "Complete guide to JavaScript...",
      "author": {
        "id": "clx0987654321",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "image": "/uploads/avatars/jane.jpg"
      },
      "category": {
        "id": "clx1111111111",
        "name": "Programming",
        "slug": "programming",
        "color": "#3B82F6"
      },
      "tags": [
        {
          "id": "clx2222222222",
          "name": "JavaScript",
          "slug": "javascript"
        }
      ],
      "_count": {
        "comments": 12,
        "likes": 45,
        "bookmarks": 8
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Create Post

**POST** `/api/posts`

Create a new post.

**Authentication**: Authenticated (ADMIN, EDITOR, CONTRIBUTOR)

**Request Body**:

```json
{
  "title": "My New Post",
  "slug": "my-new-post", // Optional, auto-generated if not provided
  "excerpt": "Brief description of the post",
  "content": "Full post content in HTML",
  "featuredImage": "/uploads/images/featured.jpg",
  "status": "DRAFT",
  "categoryId": "clx1111111111",
  "tags": ["javascript", "tutorial"],
  "seoTitle": "Custom SEO Title",
  "seoDescription": "Custom SEO description",
  "scheduledAt": "2024-01-20T10:00:00Z" // Optional, for scheduled posts
}
```

**Response** (201):

```json
{
  "id": "clx1234567890",
  "title": "My New Post",
  "slug": "my-new-post",
  "status": "DRAFT",
  "createdAt": "2024-01-15T10:30:00Z",
  // ... full post object
}
```

### Get Single Post

**GET** `/api/posts/[id]`

Get a specific post by ID.

**Authentication**: Public (for published posts), Authenticated (for own drafts), ADMIN/EDITOR (for all posts)

**Response** (200):

```json
{
  "id": "clx1234567890",
  "title": "Getting Started with JavaScript",
  // ... full post object with author, category, tags, counts
}
```

### Update Post

**PUT** `/api/posts/[id]`

Update an existing post.

**Authentication**: Authenticated (own posts), ADMIN/EDITOR (any post)

**Request Body**: Same as Create Post

**Response** (200): Updated post object

### Delete Post

**DELETE** `/api/posts/[id]`

Delete a post.

**Authentication**: Authenticated (own posts), ADMIN/EDITOR (any post)

**Response** (200):

```json
{
  "message": "Post deleted successfully"
}
```

### Get Post by Slug

**GET** `/api/posts/slug/[slug]`

Get a post by its slug.

**Authentication**: Public

**Response** (200): Full post object

### Like Post

**POST** `/api/posts/[id]/like`

Toggle like on a post.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "liked": true,
  "likeCount": 46
}
```

### Bookmark Post

**POST** `/api/posts/[id]/bookmark`

Toggle bookmark on a post.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "bookmarked": true,
  "bookmarkCount": 9
}
```

### Get Post Analytics

**GET** `/api/posts/[id]/analytics`

Get analytics data for a post.

**Authentication**: Authenticated (own posts), ADMIN/EDITOR (any post)

**Query Parameters**:

- `range` (string): Time range (7d, 30d, 90d, all)

**Response** (200):

```json
{
  "views": 150,
  "uniqueViews": 120,
  "comments": 12,
  "likes": 45,
  "bookmarks": 8,
  "shares": 5,
  "avgReadTime": 240,
  "bounceRate": 0.25,
  "publishedAt": "2024-01-15T10:30:00Z",
  "lastViewed": "2024-01-16T15:45:00Z"
}
```

### Track Analytics Event

**POST** `/api/posts/[id]/analytics`

Track an analytics event for a post.

**Authentication**: Public

**Request Body**:

```json
{
  "event": "view",
  "data": {
    "isUnique": true,
    "readTime": 180,
    "scrollDepth": 0.8
  }
}
```

**Response** (200):

```json
{
  "success": true
}
```

### Get Post Versions

**GET** `/api/posts/[id]/versions`

Get version history for a post.

**Authentication**: Authenticated (own posts), ADMIN/EDITOR (any post)

**Response** (200):

```json
{
  "versions": [
    {
      "id": "clx3333333333",
      "postId": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "content": "Version content...",
      "version": 2,
      "createdAt": "2024-01-16T09:00:00Z"
    }
  ]
}
```

### Create Post Version

**POST** `/api/posts/[id]/versions`

Create a new version of a post.

**Authentication**: Authenticated (own posts), ADMIN/EDITOR (any post)

**Response** (201): New version object

---

## Comments Endpoints

### Get Post Comments

**GET** `/api/posts/[id]/comments`

Get comments for a specific post.

**Authentication**: Public

**Query Parameters**:

- `page` (number): Page number
- `limit` (number): Items per page
- `sortBy` (string): Sort field (createdAt, updatedAt)
- `sortOrder` (string): Sort direction (asc, desc)

**Response** (200):

```json
{
  "comments": [
    {
      "id": "clx4444444444",
      "content": "Great post! Very helpful.",
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "deletedAt": null,
      "author": {
        "id": "clx0987654321",
        "name": "Jane Smith",
        "image": "/uploads/avatars/jane.jpg"
      },
      "replies": [
        {
          "id": "clx5555555555",
          "content": "Thanks for the feedback!",
          "createdAt": "2024-01-15T11:30:00Z",
          "author": {
            "id": "clx1234567890",
            "name": "John Doe",
            "image": "/uploads/avatars/john.jpg"
          },
          "_count": {
            "likes": 3,
            "replies": 0
          }
        }
      ],
      "_count": {
        "likes": 8,
        "replies": 1
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 12,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Create Comment

**POST** `/api/posts/[id]/comments`

Create a new comment on a post.

**Authentication**: Authenticated

**Request Body**:

```json
{
  "content": "This is a great post!",
  "parentId": "clx4444444444" // Optional, for replies
}
```

**Response** (201):

```json
{
  "id": "clx6666666666",
  "content": "This is a great post!",
  "createdAt": "2024-01-15T12:00:00Z",
  "author": {
    "id": "clx0987654321",
    "name": "Jane Smith",
    "image": "/uploads/avatars/jane.jpg"
  },
  "_count": {
    "likes": 0,
    "replies": 0
  }
}
```

### Update Comment

**PUT** `/api/comments/[id]`

Update an existing comment.

**Authentication**: Authenticated (own comments), ADMIN/EDITOR (any comment)

**Request Body**:

```json
{
  "content": "Updated comment content"
}
```

**Response** (200): Updated comment object

### Delete Comment

**DELETE** `/api/comments/[id]`

Delete a comment.

**Authentication**: Authenticated (own comments), ADMIN/EDITOR (any comment)

**Response** (200):

```json
{
  "message": "Comment deleted successfully"
}
```

### Like Comment

**POST** `/api/comments/[id]/like`

Toggle like on a comment.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "liked": true,
  "likeCount": 9
}
```

---

## Users Endpoints

### Get Users

**GET** `/api/users`

Get all users (admin only).

**Authentication**: ADMIN

**Query Parameters**:

- `page` (number): Page number
- `limit` (number): Items per page
- `role` (string): Filter by role
- `status` (string): Filter by status
- `search` (string): Search in name, email

**Response** (200):

```json
{
  "users": [
    {
      "id": "clx0987654321",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "image": "/uploads/avatars/jane.jpg",
      "role": "EDITOR",
      "status": "ACTIVE",
      "createdAt": "2024-01-10T08:00:00Z",
      "_count": {
        "posts": 15,
        "comments": 42,
        "followers": 8,
        "following": 12
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get User Profile

**GET** `/api/users/[id]`

Get a specific user's profile.

**Authentication**: Public (limited data), Authenticated (full data for own profile), ADMIN (full data for any user)

**Response** (200):

```json
{
  "id": "clx0987654321",
  "name": "Jane Smith",
  "email": "jane@example.com", // Only if own profile or admin
  "bio": "Passionate developer and writer",
  "website": "<https://janesmith.dev>",
  "location": "San Francisco, CA",
  "role": "EDITOR", // Only if admin
  "status": "ACTIVE", // Only if admin
  "createdAt": "2024-01-10T08:00:00Z",
  "posts": [
    {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "slug": "getting-started-with-javascript",
      "excerpt": "Learn the basics...",
      "featuredImage": "/uploads/images/featured.jpg",
      "publishedAt": "2024-01-15T10:30:00Z",
      "viewCount": 150,
      "readTime": 5,
      "category": {
        "id": "clx1111111111",
        "name": "Programming",
        "slug": "programming",
        "color": "#3B82F6"
      },
      "_count": {
        "comments": 12,
        "likes": 45
      }
    }
  ],
  "_count": {
    "posts": 15,
    "comments": 42,
    "followers": 8,
    "following": 12
  }
}
```

### Update User

**PUT** `/api/users/[id]`

Update user profile.

**Authentication**: Authenticated (own profile), ADMIN (any user)

**Request Body**:

```json
{
  "name": "Jane Smith Updated",
  "bio": "Updated bio",
  "website": "<https://newwebsite.com>",
  "location": "New York, NY",
  "role": "ADMIN", // Only admins can change roles
  "status": "SUSPENDED" // Only admins can change status
}
```

**Response** (200): Updated user object

### Delete User

**DELETE** `/api/users/[id]`

Delete a user account.

**Authentication**: ADMIN

**Response** (200):

```json
{
  "message": "User deleted successfully"
}
```

### Follow User

**POST** `/api/users/[id]/follow`

Follow or unfollow a user.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "following": true,
  "followerCount": 9
}
```

---

## Categories Endpoints

### Get Categories

**GET** `/api/categories`

Get all categories.

**Authentication**: Public

**Query Parameters**:

- `includePostCount` (boolean): Include post counts

**Response** (200):

```json
[
  {
    "id": "clx1111111111",
    "name": "Programming",
    "slug": "programming",
    "description": "Programming tutorials and guides",
    "color": "#3B82F6",
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": {
      "posts": 25 // Only if includePostCount=true
    }
  }
]
```

### Create Category

**POST** `/api/categories`

Create a new category.

**Authentication**: ADMIN, EDITOR

**Request Body**:

```json
{
  "name": "Web Development",
  "slug": "web-development", // Optional
  "description": "Web development tutorials",
  "color": "#10B981"
}
```

**Response** (201): Created category object

### Update Category

**PUT** `/api/categories/[id]`

Update a category.

**Authentication**: ADMIN, EDITOR

**Request Body**: Same as Create Category

**Response** (200): Updated category object

### Delete Category

**DELETE** `/api/categories/[id]`

Delete a category.

**Authentication**: ADMIN, EDITOR

**Response** (200):

```json
{
  "message": "Category deleted successfully"
}
```

---

## Tags Endpoints

### Get Tags

**GET** `/api/tags`

Get all tags.

**Authentication**: Public

**Query Parameters**:

- `includePostCount` (boolean): Include post counts
- `search` (string): Search tag names

**Response** (200):

```json
[
  {
    "id": "clx2222222222",
    "name": "JavaScript",
    "slug": "javascript",
    "createdAt": "2024-01-01T00:00:00Z",
    "_count": {
      "posts": 15 // Only if includePostCount=true
    }
  }
]
```

### Create Tag

**POST** `/api/tags`

Create a new tag.

**Authentication**: ADMIN, EDITOR, CONTRIBUTOR

**Request Body**:

```json
{
  "name": "React",
  "slug": "react" // Optional
}
```

**Response** (201): Created tag object

---

## Search Endpoints

### Global Search

**GET** `/api/search`

Search across posts, categories, tags, and users.

**Authentication**: Public

**Query Parameters**:

- `q` (string): Search query (required)
- `type` (string): Filter by type (posts, categories, tags, users)
- `limit` (number): Results per type (default: 10)

**Response** (200):

```json
{
  "posts": [
    {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "slug": "getting-started-with-javascript",
      "excerpt": "Learn the basics...",
      "featuredImage": "/uploads/images/featured.jpg",
      "publishedAt": "2024-01-15T10:30:00Z",
      "author": {
        "name": "Jane Smith",
        "image": "/uploads/avatars/jane.jpg"
      },
      "category": {
        "name": "Programming",
        "slug": "programming"
      }
    }
  ],
  "categories": [
    {
      "id": "clx1111111111",
      "name": "Programming",
      "slug": "programming",
      "description": "Programming tutorials and guides"
    }
  ],
  "tags": [
    {
      "id": "clx2222222222",
      "name": "JavaScript",
      "slug": "javascript"
    }
  ],
  "users": [
    {
      "id": "clx0987654321",
      "name": "Jane Smith",
      "image": "/uploads/avatars/jane.jpg",
      "bio": "Passionate developer and writer"
    }
  ]
}
```

### Search Suggestions

**GET** `/api/search/suggestions`

Get search suggestions.

**Authentication**: Public

**Query Parameters**:

- `q` (string): Partial search query

**Response** (200):

```json
{
  "suggestions": [
    "JavaScript",
    "JavaScript Tutorial",
    "JavaScript Basics"
  ]
}
```

---

## Admin Endpoints

### Get Dashboard Stats

**GET** `/api/admin/stats`

Get dashboard statistics.

**Authentication**: ADMIN, EDITOR

**Response** (200):

```json
{
  "posts": {
    "total": 150,
    "published": 120,
    "drafts": 25,
    "scheduled": 5
  },
  "users": {
    "total": 500,
    "active": 450,
    "suspended": 5,
    "newThisMonth": 25
  },
  "comments": {
    "total": 1250,
    "thisMonth": 180,
    "pending": 5
  },
  "analytics": {
    "totalViews": 15000,
    "uniqueVisitors": 8500,
    "avgSessionDuration": 240,
    "bounceRate": 0.35
  }
}
```

### Get Recent Posts

**GET** `/api/admin/recent-posts`

Get recent posts for admin dashboard.

**Authentication**: ADMIN, EDITOR

**Query Parameters**:

- `limit` (number): Number of posts (default: 10)

**Response** (200):

```json
{
  "posts": [
    {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:30:00Z",
      "viewCount": 150,
      "author": {
        "name": "Jane Smith",
        "image": "/uploads/avatars/jane.jpg"
      },
      "_count": {
        "comments": 12,
        "likes": 45
      }
    }
  ]
}
```

### Get Recent Comments

**GET** `/api/admin/recent-comments`

Get recent comments for admin dashboard.

**Authentication**: ADMIN, EDITOR

**Query Parameters**:

- `limit` (number): Number of comments (default: 10)

**Response** (200):

```json
{
  "comments": [
    {
      "id": "clx4444444444",
      "content": "Great post! Very helpful.",
      "createdAt": "2024-01-15T11:00:00Z",
      "author": {
        "name": "John Doe",
        "image": "/uploads/avatars/john.jpg"
      },
      "post": {
        "id": "clx1234567890",
        "title": "Getting Started with JavaScript",
        "slug": "getting-started-with-javascript"
      }
    }
  ]
}
```

---

## Bulk Operations

### Bulk Post Operations

**POST** `/api/posts/bulk`

Perform bulk operations on posts.

**Authentication**: ADMIN, EDITOR

**Request Body**:

```json
{
  "action": "publish", // publish, archive, delete, updateCategory, addTags
  "postIds": ["clx1234567890", "clx0987654321"],
  "data": {
    "categoryId": "clx1111111111", // For updateCategory
    "tags": ["javascript", "tutorial"] // For addTags
  }
}
```

**Response** (200):

```json
{
  "success": true,
  "updated": 2,
  "message": "Posts updated successfully"
}
```

### Schedule Posts

**POST** `/api/posts/schedule`

Schedule multiple posts for publication.

**Authentication**: ADMIN, EDITOR

**Request Body**:

```json
{
  "posts": [
    {
      "id": "clx1234567890",
      "scheduledAt": "2024-01-20T10:00:00Z"
    },
    {
      "id": "clx0987654321",
      "scheduledAt": "2024-01-21T14:00:00Z"
    }
  ]
}
```

**Response** (200):

```json
{
  "success": true,
  "scheduled": 2,
  "message": "Posts scheduled successfully"
}
```

---

## File Upload

### Upload Image

**POST** `/api/upload/image`

Upload an image file.

**Authentication**: Authenticated

**Request**: Multipart form data with `file` field

**Response** (200):

```json
{
  "url": "/uploads/images/1642234567890-image.jpg",
  "filename": "1642234567890-image.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg"
}
```

---

## Analytics

### Get Platform Analytics

**GET** `/api/analytics`

Get platform-wide analytics.

**Authentication**: ADMIN, EDITOR

**Query Parameters**:

- `range` (string): Time range (7d, 30d, 90d, all)
- `metric` (string): Specific metric (views, users, posts, comments)

**Response** (200):

```json
{
  "overview": {
    "totalViews": 15000,
    "uniqueVisitors": 8500,
    "totalPosts": 150,
    "totalUsers": 500,
    "totalComments": 1250
  },
  "trends": {
    "views": [
      { "date": "2024-01-15", "value": 450 },
      { "date": "2024-01-16", "value": 520 }
    ],
    "users": [
      { "date": "2024-01-15", "value": 12 },
      { "date": "2024-01-16", "value": 8 }
    ]
  },
  "topPosts": [
    {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "views": 1500,
      "likes": 45,
      "comments": 12
    }
  ]
}
```

### Track Performance Metrics

**POST** `/api/analytics/performance`

Track performance metrics.

**Authentication**: Public

**Request Body**:

```json
{
  "url": "/posts/getting-started-with-javascript",
  "metrics": {
    "lcp": 1200,
    "fid": 50,
    "cls": 0.1,
    "ttfb": 200
  },
  "userAgent": "Mozilla/5.0...",
  "connection": "4g"
}
```

**Response** (200):

```json
{
  "success": true
}
```

---

## Newsletter

### Subscribe to Newsletter

**POST** `/api/newsletter/subscribe`

Subscribe to newsletter.

**Authentication**: Public

**Request Body**:

```json
{
  "email": "user@example.com",
  "name": "John Doe" // Optional
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter"
}
```

### Unsubscribe from Newsletter

**POST** `/api/newsletter/unsubscribe`

Unsubscribe from newsletter.

**Authentication**: Public

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter"
}
```

---

## Notifications

### Get User Notifications

**GET** `/api/notifications`

Get notifications for the authenticated user.

**Authentication**: Authenticated

**Query Parameters**:

- `page` (number): Page number
- `limit` (number): Items per page
- `unreadOnly` (boolean): Show only unread notifications

**Response** (200):

```json
{
  "notifications": [
    {
      "id": "clx7777777777",
      "type": "POST_LIKED",
      "message": "Jane Smith liked your post",
      "read": false,
      "createdAt": "2024-01-15T12:00:00Z",
      "data": {
        "postId": "clx1234567890",
        "postTitle": "Getting Started with JavaScript",
        "userId": "clx0987654321",
        "userName": "Jane Smith"
      }
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Mark Notification as Read

**PUT** `/api/notifications/[id]/read`

Mark a notification as read.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "success": true
}
```

### Mark All Notifications as Read

**PUT** `/api/notifications/read-all`

Mark all notifications as read.

**Authentication**: Authenticated

**Response** (200):

```json
{
  "success": true,
  "updated": 5
}
```

---

## Health Check

### Application Health

**GET** `/api/health`

Check application health status.

**Authentication**: Public

**Response** (200):

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 3600
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Default Limit**: 100 requests per 15 minutes per IP
- **Authenticated Users**: 200 requests per 15 minutes
- **Admin Users**: 500 requests per 15 minutes

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "validation": "Validation details"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: User must be logged in
- `INSUFFICIENT_PERMISSIONS`: User lacks required role
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `DATABASE_ERROR`: Database operation failed
- `FILE_UPLOAD_ERROR`: File upload failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Pagination

List endpoints support pagination with these parameters:

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)

**Response Format:**

```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false,
    "limit": 10
  }
}
```

---

## Filtering & Sorting

Most list endpoints support filtering and sorting:

**Common Filter Parameters:**

- `search` (string): Search in relevant fields
- `status` (string): Filter by status
- `categoryId` (string): Filter by category
- `authorId` (string): Filter by author
- `startDate` (string): Filter from date (ISO format)
- `endDate` (string): Filter to date (ISO format)

**Sorting Parameters:**

- `sortBy` (string): Field to sort by
- `sortOrder` (string): `asc` or `desc`

**Example:**

```http
GET /api/posts?search=javascript&status=PUBLISHED&sortBy=publishedAt&sortOrder=desc&page=1&limit=20
```

---

## Webhooks (Future Feature)

The platform is designed to support webhooks for external integrations:

**Planned Webhook Events:**

- `post.published` - When a post is published
- `post.updated` - When a post is updated
- `comment.created` - When a comment is added
- `user.registered` - When a user registers
- `user.followed` - When a user is followed

**Webhook Payload Example:**

```json
{
  "event": "post.published",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "post": {
      "id": "clx1234567890",
      "title": "Getting Started with JavaScript",
      "slug": "getting-started-with-javascript",
      "author": {
        "id": "clx0987654321",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  }
}
```

---

## API Versioning

Currently using v1 API. Future versions will be supported via URL versioning:

- **Current**: `/api/posts` (v1 default)
- **Future**: `/api/v2/posts` (explicit versioning)

---

## SDK & Client Libraries

### JavaScript/TypeScript SDK (Planned)

```typescript
import { PlugPostClient } from '@plugpost/sdk'

const client = new PlugPostClient({
  baseUrl: '<https://api.plugpost.com>',
  apiKey: 'your-api-key'
})

// Get posts
const posts = await client.posts.list({
  page: 1,
  limit: 10,
  status: 'PUBLISHED'
})

// Create post
const newPost = await client.posts.create({
  title: 'My New Post',
  content: 'Post content...',
  categoryId: 'category-id'
})
```

### Python SDK (Planned)

```python
from plugpost import PlugPostClient

client = PlugPostClient(
    base_url='<https://api.plugpost.com>',
    api_key='your-api-key'
)

# Get posts
posts = client.posts.list(page=1, limit=10, status='PUBLISHED')

# Create post
new_post = client.posts.create({
    'title': 'My New Post',
    'content': 'Post content...',
    'category_id': 'category-id'
})
```

---

## Development Best Practices

### API Development

1. **Always validate inputs** with Zod schemas
2. **Handle errors gracefully** with proper error responses
3. **Use TypeScript** for type safety
4. **Include proper authentication** checks
5. **Add rate limiting** for public endpoints
6. **Document new endpoints** in this file

## Database Operations

1. **Use Prisma** for all database operations
2. **Include proper relations** in queries
3. **Handle database errors** gracefully
4. **Use transactions** for complex operations
5. **Optimize queries** for performance

## Security

1. **Validate all inputs** on both client and server
2. **Sanitize HTML content** before storing
3. **Use proper authentication** for protected routes
4. **Implement rate limiting** for public APIs
5. **Log security events** for monitoring

---

## API Testing

### Using curl

```bash
# Get posts
curl -X GET "<http://localhost:3000/api/posts?page=1&limit=5>"

# Create post (requires authentication)
curl -X POST "<http://localhost:3000/api/posts>" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "title": "Test Post",
    "content": "Test content",
    "status": "DRAFT"
  }'
```

## Using Postman

Import the Postman collection (coming soon) for easy API testing with pre-configured requests and authentication.

## Using Thunder Client (VS Code)

Install Thunder Client extension and import the provided collection for in-editor API testing.

---

## Monitoring & Debugging

### Development Debugging

```bash
# Enable debug logging
DEBUG=true npm run dev

# View database queries
DEBUG=prisma:query npm run dev

# Monitor performance
ENABLE_PERFORMANCE_MONITORING=true npm run dev
```

## Production Monitoring

- **Error Tracking**: Sentry integration
- **Performance**: Core Web Vitals tracking
- **Analytics**: Google Analytics integration
- **Uptime**: Health check endpoints
- **Logs**: Structured logging with levels

---

## Support

For technical support and questions:

1. **Check Documentation**: Start with this docs folder
2. **Search Issues**: Look for existing GitHub issues
3. **Create Issue**: Report bugs or request features
4. **Community**: Join discussions in GitHub Discussions
5. **Contact**: Reach out to the development team

---

**Note:** This documentation is continuously updated. Last revision: January 2024
