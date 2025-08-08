import { prisma } from "@/lib/prisma"
import { PostStatus } from "@prisma/client"

export class PostScheduler {
  private static instance: PostScheduler
  private intervalId: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 60000 // Check every minute

  private constructor() {}

  static getInstance(): PostScheduler {
    if (!PostScheduler.instance) {
      PostScheduler.instance = new PostScheduler()
    }
    return PostScheduler.instance
  }

  start(): void {
    if (this.intervalId) {
      return // Already running
    }

    console.log("Starting post scheduler...")
    this.intervalId = setInterval(() => {
      this.publishScheduledPosts().catch(error => {
        console.error("Error in post scheduler:", error)
      })
    }, this.CHECK_INTERVAL)

    // Run immediately on start
    this.publishScheduledPosts().catch(error => {
      console.error("Error in initial post scheduler run:", error)
    })
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log("Post scheduler stopped")
    }
  }

  private async publishScheduledPosts(): Promise<void> {
    try {
      const now = new Date()
      
      // Find posts that are scheduled and due for publishing
      const postsToPublish = await prisma.post.findMany({
        where: {
          status: PostStatus.SCHEDULED,
          scheduledAt: {
            lte: now,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (postsToPublish.length === 0) {
        return
      }

      console.log(`Publishing ${postsToPublish.length} scheduled posts...`)

      // Update posts to published status
      const updatePromises = postsToPublish.map(post =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.PUBLISHED,
            publishedAt: now,
            scheduledAt: null, // Clear the scheduled date
          },
        })
      )

      await Promise.all(updatePromises)

      // Log successful publications
      for (const post of postsToPublish) {
        console.log(`Published post: "${post.title}" by ${post.author.name}`)
        
        // Here you could add additional logic like:
        // - Sending notifications
        // - Updating search indexes
        // - Triggering webhooks
        // - Social media posting
        await this.onPostPublished(post)
      }
    } catch (error) {
      console.error("Error publishing scheduled posts:", error)
    }
  }

  private async onPostPublished(post: any): Promise<void> {
    try {
      // Create notification for the author
      await prisma.notification.create({
        data: {
          type: "POST_PUBLISHED",
          title: "Post Published",
          message: `Your post "${post.title}" has been published successfully.`,
          userId: post.authorId,
          postId: post.id,
        },
      })

      // You can add more post-publication logic here:
      // - Send email notifications
      // - Update analytics
      // - Trigger webhooks
      // - Post to social media
      // - Update search indexes
    } catch (error) {
      console.error(`Error in post-publication tasks for post ${post.id}:`, error)
    }
  }

  // Method to manually trigger publishing (useful for testing)
  async publishNow(): Promise<number> {
    await this.publishScheduledPosts()
    
    // Return count of published posts
    const publishedCount = await prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: {
          gte: new Date(Date.now() - 60000), // Published in the last minute
        },
      },
    })

    return publishedCount
  }

  // Get next scheduled post
  async getNextScheduledPost(): Promise<any | null> {
    return await prisma.post.findFirst({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          gte: new Date(),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    })
  }

  // Get count of scheduled posts
  async getScheduledPostsCount(): Promise<number> {
    return await prisma.post.count({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          gte: new Date(),
        },
      },
    })
  }
}

// Initialize scheduler in production
if (process.env.NODE_ENV === "production") {
  const scheduler = PostScheduler.getInstance()
  scheduler.start()

  // Graceful shutdown
  process.on("SIGTERM", () => {
    scheduler.stop()
  })

  process.on("SIGINT", () => {
    scheduler.stop()
  })
}

export const postScheduler = PostScheduler.getInstance()
