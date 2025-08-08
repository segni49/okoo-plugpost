"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, 
  Trash2, 
  Eye,
  MessageSquare,
  User,
  ExternalLink
} from "lucide-react"
import { Loading } from "@/components/ui/loading"
import { ConfirmModal } from "@/components/ui/modal"

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    image: string | null
  }
  post: {
    id: string
    title: string
    slug: string
  }
  replies?: Comment[]
}

export default function CommentsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; comment: Comment | null }>({
    isOpen: false,
    comment: null,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
      router.push("/admin")
      return
    }
    fetchComments()
  }, [session, status, router, currentPage, searchTerm])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/comments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId))
      } else {
        alert("Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert("Error deleting comment")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedComments.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedComments.length} comments?`)) return

    try {
      await Promise.all(
        selectedComments.map(commentId =>
          fetch(`/api/comments/${commentId}`, { method: "DELETE" })
        )
      )
      setComments(comments.filter(comment => !selectedComments.includes(comment.id)))
      setSelectedComments([])
    } catch (error) {
      console.error("Error deleting comments:", error)
      alert("Error deleting comments")
    }
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading comments..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
            <p className="text-gray-600">Moderate and manage user comments</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedComments.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedComments.length} comments selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedComments([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {comments.map((comment) => (
            <div key={comment.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedComments.includes(comment.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComments([...selectedComments, comment.id])
                      } else {
                        setSelectedComments(selectedComments.filter(id => id !== comment.id))
                      }
                    }}
                    className="rounded border-gray-300 mt-1"
                  />
                </div>
                
                <div className="flex-shrink-0">
                  {comment.author.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={comment.author.image}
                      alt={comment.author.name}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.author.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/posts/${comment.post.slug}`}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        target="_blank"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Post
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, comment })}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700">
                      {truncateContent(comment.content)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      On: <Link 
                        href={`/posts/${comment.post.slug}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {comment.post.title}
                      </Link>
                    </div>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {comment.replies.length} replies
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {reply.author.image ? (
                              <img
                                className="h-6 w-6 rounded-full"
                                src={reply.author.image}
                                alt={reply.author.name}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-3 w-3 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-xs font-medium text-gray-900">
                                {reply.author.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-xs text-gray-700">
                              {truncateContent(reply.content, 80)}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, comment: reply })}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Reply"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, comment: null })}
        onConfirm={() => {
          if (deleteModal.comment) {
            handleDeleteComment(deleteModal.comment.id)
          }
        }}
        title="Delete Comment"
        message={`Are you sure you want to delete this comment? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
