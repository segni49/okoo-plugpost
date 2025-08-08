"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPostSchema } from "@/lib/validations"
import { RichTextEditor } from "./rich-text-editor"
import { PostStatus } from "@prisma/client"
import { z } from "zod"

type PostFormData = z.infer<typeof createPostSchema>

interface PostEditorProps {
  initialData?: Partial<PostFormData>
  onSave: (data: PostFormData) => Promise<void>
  onPublish: (data: PostFormData) => Promise<void>
  isLoading?: boolean
  categories?: Array<{ id: string; name: string }>
}

export function PostEditor({
  initialData,
  onSave,
  onPublish,
  isLoading = false,
  categories = [],
}: PostEditorProps) {
  const [content, setContent] = useState(initialData?.content || "")
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      excerpt: initialData?.excerpt || "",
      content: initialData?.content || "",
      featuredImage: initialData?.featuredImage || "",
      status: initialData?.status || PostStatus.DRAFT,
      categoryId: initialData?.categoryId || "",
      tags: initialData?.tags || [],
      seoTitle: initialData?.seoTitle || "",
      seoDescription: initialData?.seoDescription || "",
    },
  })

  const title = watch("title")

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !initialData?.slug) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-")
      setValue("slug", slug)
    }
  }, [title, setValue, initialData?.slug])

  // Update content in form when editor changes
  useEffect(() => {
    setValue("content", content)
  }, [content, setValue])

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || !initialData) return

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        const formData = {
          ...watch(),
          content,
          status: PostStatus.DRAFT,
        }
        await onSave(formData)
      } catch (error) {
        console.error("Auto-save failed:", error)
      } finally {
        setIsAutoSaving(false)
      }
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [isDirty, content, watch, onSave, initialData])

  const handleSaveDraft = async (data: PostFormData) => {
    await onSave({ ...data, content, status: PostStatus.DRAFT })
  }

  const handlePublish = async (data: PostFormData) => {
    await onPublish({ ...data, content, status: PostStatus.PUBLISHED })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {initialData ? "Edit Post" : "Create New Post"}
          </h1>
          <div className="flex items-center gap-2">
            {isAutoSaving && (
              <span className="text-sm text-gray-500">Auto-saving...</span>
            )}
            <button
              type="button"
              onClick={handleSubmit(handleSaveDraft)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleSubmit(handlePublish)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            {...register("title")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter post title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug *
          </label>
          <input
            {...register("slug")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="post-slug"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt
          </label>
          <textarea
            {...register("excerpt")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of the post..."
          />
          {errors.excerpt && (
            <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
          )}
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image URL
          </label>
          <input
            {...register("featuredImage")}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          {errors.featuredImage && (
            <p className="mt-1 text-sm text-red-600">{errors.featuredImage.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            {...register("categoryId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your post..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* SEO Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                {...register("seoTitle")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO optimized title (max 60 characters)"
              />
              {errors.seoTitle && (
                <p className="mt-1 text-sm text-red-600">{errors.seoTitle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                {...register("seoDescription")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO meta description (max 160 characters)"
              />
              {errors.seoDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.seoDescription.message}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
