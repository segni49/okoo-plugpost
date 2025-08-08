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

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  status: string
  categoryId: string | null
  tags: Array<{ id: string; name: string }>
  seoTitle: string | null
  seoDescription: string | null
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

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
    fetchPost()
    fetchCategories()
  }, [session, status, router, params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else if (response.status === 404) {
        router.push("/admin/posts")
      }
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setLoading(false)
    }
  }

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
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        // Show success message
        alert("Post saved successfully!")
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
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "PUBLISHED",
        }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        router.push("/admin/posts")
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

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/admin/posts")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Posts
          </button>
        </div>
      </div>
    )
  }

  const initialData: Partial<PostFormData> = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content,
    featuredImage: post.featuredImage || "",
    status: post.status as any,
    categoryId: post.categoryId || "",
    tags: post.tags.map(tag => tag.name),
    seoTitle: post.seoTitle || "",
    seoDescription: post.seoDescription || "",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PostEditor
        initialData={initialData}
        onSave={handleSave}
        onPublish={handlePublish}
        isLoading={isLoading}
        categories={categories}
      />
    </div>
  )
}
