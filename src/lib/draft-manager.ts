// Client-side draft management for auto-saving posts
export interface DraftData {
  id?: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  categoryId?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  lastSaved: number
}

const DRAFT_STORAGE_KEY = "plugpost_drafts"
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export class DraftManager {
  private static instance: DraftManager
  private drafts: Map<string, DraftData> = new Map()
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.loadDrafts()
  }

  static getInstance(): DraftManager {
    if (!DraftManager.instance) {
      DraftManager.instance = new DraftManager()
    }
    return DraftManager.instance
  }

  private loadDrafts(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (stored) {
        const draftsArray: DraftData[] = JSON.parse(stored)
        draftsArray.forEach(draft => {
          const key = draft.id || `draft_${Date.now()}_${Math.random()}`
          this.drafts.set(key, draft)
        })
      }
    } catch (error) {
      console.error("Failed to load drafts:", error)
    }
  }

  private saveDrafts(): void {
    if (typeof window === "undefined") return

    try {
      const draftsArray = Array.from(this.drafts.values())
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftsArray))
    } catch (error) {
      console.error("Failed to save drafts:", error)
    }
  }

  saveDraft(key: string, data: Omit<DraftData, "lastSaved">): void {
    const draftData: DraftData = {
      ...data,
      lastSaved: Date.now(),
    }

    this.drafts.set(key, draftData)
    this.saveDrafts()
  }

  getDraft(key: string): DraftData | null {
    return this.drafts.get(key) || null
  }

  getAllDrafts(): DraftData[] {
    return Array.from(this.drafts.values()).sort((a, b) => b.lastSaved - a.lastSaved)
  }

  deleteDraft(key: string): void {
    this.drafts.delete(key)
    this.clearAutoSave(key)
    this.saveDrafts()
  }

  startAutoSave(key: string, getData: () => Omit<DraftData, "lastSaved">): void {
    this.clearAutoSave(key)

    const timer = setInterval(() => {
      try {
        const data = getData()
        if (data.title.trim() || data.content.trim()) {
          this.saveDraft(key, data)
        }
      } catch (error) {
        console.error("Auto-save failed:", error)
      }
    }, AUTO_SAVE_INTERVAL)

    this.autoSaveTimers.set(key, timer)
  }

  clearAutoSave(key: string): void {
    const timer = this.autoSaveTimers.get(key)
    if (timer) {
      clearInterval(timer)
      this.autoSaveTimers.delete(key)
    }
  }

  // Clean up old drafts (older than 30 days)
  cleanupOldDrafts(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    let hasChanges = false

    for (const [key, draft] of this.drafts.entries()) {
      if (draft.lastSaved < thirtyDaysAgo) {
        this.drafts.delete(key)
        hasChanges = true
      }
    }

    if (hasChanges) {
      this.saveDrafts()
    }
  }

  // Get draft key for a post
  static getDraftKey(postId?: string): string {
    return postId ? `post_${postId}` : `new_post_${Date.now()}`
  }

  // Check if there are unsaved changes
  hasUnsavedChanges(key: string, currentData: Omit<DraftData, "lastSaved">): boolean {
    const draft = this.getDraft(key)
    if (!draft) return false

    return (
      draft.title !== currentData.title ||
      draft.content !== currentData.content ||
      draft.excerpt !== currentData.excerpt ||
      draft.slug !== currentData.slug ||
      draft.featuredImage !== currentData.featuredImage ||
      draft.categoryId !== currentData.categoryId ||
      JSON.stringify(draft.tags) !== JSON.stringify(currentData.tags) ||
      draft.seoTitle !== currentData.seoTitle ||
      draft.seoDescription !== currentData.seoDescription
    )
  }
}

// Hook for using draft manager in React components
export function useDraftManager() {
  return DraftManager.getInstance()
}
