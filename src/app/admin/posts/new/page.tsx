"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PostEditor } from "@/components/editor/post-editor"
import { createPostSchema } from "@/lib/validations"
import { z } from "zod"

type PostFormData = z.infer<typeof createPostSchema>

interface Category {
  id: string
  name: string
}

export default function NewPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR" && session.user.role !== "CONTRIBUTOR") {
      router.push("/")
      return
    }
    fetchCategories()
  }, [session, status, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSave = async (data: PostFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/admin/posts/${post.id}/edit`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save post")
      }
    } catch (error) {
      console.error("Error saving post:", error)
      alert("Error saving post")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (data: PostFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "PUBLISHED",
        }),
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/admin/posts`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to publish post")
      }
    } catch (error) {
      console.error("Error publishing post:", error)
      alert("Error publishing post")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PostEditor
        onSave={handleSave}
        onPublish={handlePublish}
        isLoading={isLoading}
        categories={categories}
      />
    </div>
  )
}
