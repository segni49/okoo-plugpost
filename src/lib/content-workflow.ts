// Advanced content workflow and versioning system
import { optimizedPrisma } from './database-optimization'
import { getCacheManager } from './cache'
import { auditLogger } from './advanced-security'

// Workflow states and transitions
export enum WorkflowState {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED',
}

export enum WorkflowAction {
  SUBMIT_FOR_REVIEW = 'SUBMIT_FOR_REVIEW',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE',
  RETURN_TO_DRAFT = 'RETURN_TO_DRAFT',
}

// Workflow configuration
const WORKFLOW_CONFIG = {
  // Define allowed transitions
  transitions: {
    [WorkflowState.DRAFT]: [WorkflowAction.SUBMIT_FOR_REVIEW],
    [WorkflowState.REVIEW]: [WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.RETURN_TO_DRAFT],
    [WorkflowState.APPROVED]: [WorkflowAction.PUBLISH, WorkflowAction.RETURN_TO_DRAFT],
    [WorkflowState.PUBLISHED]: [WorkflowAction.ARCHIVE],
    [WorkflowState.REJECTED]: [WorkflowAction.RETURN_TO_DRAFT],
    [WorkflowState.ARCHIVED]: [], // No transitions from archived state
  },
  
  // Define who can perform actions
  permissions: {
    [WorkflowAction.SUBMIT_FOR_REVIEW]: ['CONTRIBUTOR', 'EDITOR', 'ADMIN'],
    [WorkflowAction.APPROVE]: ['EDITOR', 'ADMIN'],
    [WorkflowAction.REJECT]: ['EDITOR', 'ADMIN'],
    [WorkflowAction.PUBLISH]: ['EDITOR', 'ADMIN'],
    [WorkflowAction.ARCHIVE]: ['EDITOR', 'ADMIN'],
    [WorkflowAction.RETURN_TO_DRAFT]: ['EDITOR', 'ADMIN'],
  },
}

interface WorkflowTransition {
  id: string
  postId: string
  fromState: WorkflowState
  toState: WorkflowState
  action: WorkflowAction
  userId: string
  comment?: string
  timestamp: Date
}

interface ContentVersion {
  id: string
  postId: string
  version: number
  title: string
  content: string
  excerpt?: string
  metadata: Record<string, any>
  createdBy: string
  createdAt: Date
  isActive: boolean
}

class ContentWorkflowManager {
  private cache = getCacheManager()

  /**
   * Execute a workflow action on a post
   */
  async executeAction(
    postId: string,
    action: WorkflowAction,
    userId: string,
    userRole: string,
    comment?: string
  ): Promise<{ success: boolean; message: string; newState?: WorkflowState }> {
    try {
      // Get current post state
      const post = await optimizedPrisma.post.findUnique({
        where: { id: postId },
        select: { id: true, status: true, authorId: true, title: true },
      })

      if (!post) {
        return { success: false, message: 'Post not found' }
      }

      const currentState = post.status as WorkflowState

      // Check if action is allowed from current state
      const allowedActions = WORKFLOW_CONFIG.transitions[currentState] || []
      if (!allowedActions.includes(action)) {
        return {
          success: false,
          message: `Action ${action} is not allowed from state ${currentState}`,
        }
      }

      // Check user permissions
      const allowedRoles = WORKFLOW_CONFIG.permissions[action] || []
      if (!allowedRoles.includes(userRole)) {
        return {
          success: false,
          message: `User role ${userRole} is not allowed to perform action ${action}`,
        }
      }

      // Additional permission checks
      if (action === WorkflowAction.SUBMIT_FOR_REVIEW && post.authorId !== userId && userRole === 'CONTRIBUTOR') {
        return {
          success: false,
          message: 'Contributors can only submit their own posts for review',
        }
      }

      // Determine new state based on action
      const newState = this.getNewState(currentState, action)
      if (!newState) {
        return { success: false, message: 'Invalid state transition' }
      }

      // Execute the transition
      await this.performTransition(postId, currentState, newState, action, userId, comment)

      // Log the action
      await auditLogger.log({
        userId,
        action: `workflow_${action.toLowerCase()}`,
        resource: 'post',
        resourceId: postId,
        details: {
          fromState: currentState,
          toState: newState,
          comment,
          postTitle: post.title,
        },
        ipAddress: 'system',
        userAgent: 'workflow-system',
        severity: 'medium',
      })

      return {
        success: true,
        message: `Post ${action.toLowerCase().replace('_', ' ')} successfully`,
        newState,
      }
    } catch (error) {
      console.error('Workflow action error:', error)
      return { success: false, message: 'Failed to execute workflow action' }
    }
  }

  /**
   * Get workflow history for a post
   */
  async getWorkflowHistory(postId: string): Promise<WorkflowTransition[]> {
    const cacheKey = `workflow_history:${postId}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        return await optimizedPrisma.workflowTransition.findMany({
          where: { postId },
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        })
      },
      300 // 5 minutes cache
    )
  }

  /**
   * Get posts by workflow state
   */
  async getPostsByState(
    state: WorkflowState,
    options: {
      limit?: number
      offset?: number
      authorId?: string
      categoryId?: string
    } = {}
  ) {
    const { limit = 20, offset = 0, authorId, categoryId } = options
    
    const where: any = { status: state }
    if (authorId) where.authorId = authorId
    if (categoryId) where.categoryId = categoryId

    const [posts, total] = await Promise.all([
      optimizedPrisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          category: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      optimizedPrisma.post.count({ where }),
    ])

    return {
      posts,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Create a new version of content
   */
  async createVersion(
    postId: string,
    userId: string,
    changes: {
      title?: string
      content?: string
      excerpt?: string
      metadata?: Record<string, any>
    }
  ): Promise<ContentVersion> {
    // Get current version number
    const latestVersion = await optimizedPrisma.postVersion.findFirst({
      where: { postId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const newVersionNumber = (latestVersion?.version || 0) + 1

    // Get current post data
    const currentPost = await optimizedPrisma.post.findUnique({
      where: { id: postId },
      select: { title: true, content: true, excerpt: true },
    })

    if (!currentPost) {
      throw new Error('Post not found')
    }

    // Create new version
    const version = await optimizedPrisma.postVersion.create({
      data: {
        postId,
        version: newVersionNumber,
        title: changes.title || currentPost.title,
        content: changes.content || currentPost.content,
        excerpt: changes.excerpt || currentPost.excerpt,
        metadata: changes.metadata || {},
        createdBy: userId,
        isActive: true,
      },
    })

    // Deactivate previous versions
    await optimizedPrisma.postVersion.updateMany({
      where: {
        postId,
        id: { not: version.id },
      },
      data: { isActive: false },
    })

    // Update the main post with new content
    await optimizedPrisma.post.update({
      where: { id: postId },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
      },
    })

    // Clear cache
    await this.cache.delPattern(`post:${postId}*`)

    return version
  }

  /**
   * Get version history for a post
   */
  async getVersionHistory(postId: string): Promise<ContentVersion[]> {
    return await optimizedPrisma.postVersion.findMany({
      where: { postId },
      include: {
        createdByUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { version: 'desc' },
    })
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(postId: string, versionId: string, userId: string): Promise<boolean> {
    try {
      const version = await optimizedPrisma.postVersion.findUnique({
        where: { id: versionId },
      })

      if (!version || version.postId !== postId) {
        return false
      }

      // Update the main post
      await optimizedPrisma.post.update({
        where: { id: postId },
        data: {
          title: version.title,
          content: version.content,
          excerpt: version.excerpt,
        },
      })

      // Create a new version entry for this restoration
      await this.createVersion(postId, userId, {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        metadata: { restoredFrom: versionId },
      })

      // Log the restoration
      await auditLogger.log({
        userId,
        action: 'version_restored',
        resource: 'post',
        resourceId: postId,
        details: {
          restoredVersionId: versionId,
          restoredVersion: version.version,
        },
        ipAddress: 'system',
        userAgent: 'version-system',
        severity: 'medium',
      })

      return true
    } catch (error) {
      console.error('Version restoration error:', error)
      return false
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1: string, versionId2: string) {
    const [version1, version2] = await Promise.all([
      optimizedPrisma.postVersion.findUnique({ where: { id: versionId1 } }),
      optimizedPrisma.postVersion.findUnique({ where: { id: versionId2 } }),
    ])

    if (!version1 || !version2) {
      throw new Error('One or both versions not found')
    }

    return {
      version1: {
        id: version1.id,
        version: version1.version,
        title: version1.title,
        content: version1.content,
        createdAt: version1.createdAt,
      },
      version2: {
        id: version2.id,
        version: version2.version,
        title: version2.title,
        content: version2.content,
        createdAt: version2.createdAt,
      },
      differences: {
        title: version1.title !== version2.title,
        content: version1.content !== version2.content,
        excerpt: version1.excerpt !== version2.excerpt,
      },
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(timeframe: 'day' | 'week' | 'month' = 'week') {
    const cacheKey = `workflow_stats:${timeframe}`
    
    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        let startDate: Date

        switch (timeframe) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        }

        const [stateStats, actionStats, recentTransitions] = await Promise.all([
          // Posts by state
          optimizedPrisma.post.groupBy({
            by: ['status'],
            _count: { _all: true },
          }),
          
          // Actions in timeframe
          optimizedPrisma.workflowTransition.groupBy({
            by: ['action'],
            where: {
              timestamp: { gte: startDate },
            },
            _count: { _all: true },
          }),
          
          // Recent transitions
          optimizedPrisma.workflowTransition.findMany({
            where: {
              timestamp: { gte: startDate },
            },
            include: {
              post: {
                select: { title: true },
              },
              user: {
                select: { name: true },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 10,
          }),
        ])

        return {
          stateDistribution: Object.fromEntries(
            stateStats.map(stat => [stat.status, stat._count._all])
          ),
          actionCounts: Object.fromEntries(
            actionStats.map(stat => [stat.action, stat._count._all])
          ),
          recentTransitions,
          timeframe,
          generatedAt: new Date(),
        }
      },
      300 // 5 minutes cache
    )
  }

  /**
   * Private helper methods
   */
  private getNewState(currentState: WorkflowState, action: WorkflowAction): WorkflowState | null {
    const stateMap: Record<string, WorkflowState> = {
      [`${WorkflowState.DRAFT}_${WorkflowAction.SUBMIT_FOR_REVIEW}`]: WorkflowState.REVIEW,
      [`${WorkflowState.REVIEW}_${WorkflowAction.APPROVE}`]: WorkflowState.APPROVED,
      [`${WorkflowState.REVIEW}_${WorkflowAction.REJECT}`]: WorkflowState.REJECTED,
      [`${WorkflowState.REVIEW}_${WorkflowAction.RETURN_TO_DRAFT}`]: WorkflowState.DRAFT,
      [`${WorkflowState.APPROVED}_${WorkflowAction.PUBLISH}`]: WorkflowState.PUBLISHED,
      [`${WorkflowState.APPROVED}_${WorkflowAction.RETURN_TO_DRAFT}`]: WorkflowState.DRAFT,
      [`${WorkflowState.PUBLISHED}_${WorkflowAction.ARCHIVE}`]: WorkflowState.ARCHIVED,
      [`${WorkflowState.REJECTED}_${WorkflowAction.RETURN_TO_DRAFT}`]: WorkflowState.DRAFT,
    }

    return stateMap[`${currentState}_${action}`] || null
  }

  private async performTransition(
    postId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    action: WorkflowAction,
    userId: string,
    comment?: string
  ) {
    // Update post status
    await optimizedPrisma.post.update({
      where: { id: postId },
      data: {
        status: toState,
        publishedAt: toState === WorkflowState.PUBLISHED ? new Date() : undefined,
      },
    })

    // Record transition
    await optimizedPrisma.workflowTransition.create({
      data: {
        postId,
        fromState,
        toState,
        action,
        userId,
        comment,
        timestamp: new Date(),
      },
    })

    // Clear related caches
    await this.cache.delPattern(`post:${postId}*`)
    await this.cache.delPattern(`workflow_*`)
  }
}

// Singleton instance
export const contentWorkflowManager = new ContentWorkflowManager()

// Helper functions
export const workflowHelpers = {
  // Check if action is allowed
  canPerformAction: (currentState: WorkflowState, action: WorkflowAction, userRole: string): boolean => {
    const allowedActions = WORKFLOW_CONFIG.transitions[currentState] || []
    const allowedRoles = WORKFLOW_CONFIG.permissions[action] || []
    
    return allowedActions.includes(action) && allowedRoles.includes(userRole)
  },

  // Get available actions for current state and user
  getAvailableActions: (currentState: WorkflowState, userRole: string): WorkflowAction[] => {
    const allowedActions = WORKFLOW_CONFIG.transitions[currentState] || []
    
    return allowedActions.filter(action => {
      const allowedRoles = WORKFLOW_CONFIG.permissions[action] || []
      return allowedRoles.includes(userRole)
    })
  },

  // Get workflow state display name
  getStateDisplayName: (state: WorkflowState): string => {
    const displayNames: Record<WorkflowState, string> = {
      [WorkflowState.DRAFT]: 'Draft',
      [WorkflowState.REVIEW]: 'Under Review',
      [WorkflowState.APPROVED]: 'Approved',
      [WorkflowState.PUBLISHED]: 'Published',
      [WorkflowState.ARCHIVED]: 'Archived',
      [WorkflowState.REJECTED]: 'Rejected',
    }
    
    return displayNames[state] || state
  },

  // Get action display name
  getActionDisplayName: (action: WorkflowAction): string => {
    const displayNames: Record<WorkflowAction, string> = {
      [WorkflowAction.SUBMIT_FOR_REVIEW]: 'Submit for Review',
      [WorkflowAction.APPROVE]: 'Approve',
      [WorkflowAction.REJECT]: 'Reject',
      [WorkflowAction.PUBLISH]: 'Publish',
      [WorkflowAction.ARCHIVE]: 'Archive',
      [WorkflowAction.RETURN_TO_DRAFT]: 'Return to Draft',
    }
    
    return displayNames[action] || action
  },
}

export default contentWorkflowManager
