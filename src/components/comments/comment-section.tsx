"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  MessageSquare, 
  Heart, 
  Reply, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  User,
  Send
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Dropdown } from "@/components/ui/dropdown"
import { ConfirmModal } from "@/components/ui/modal"
import { useToastActions } from "@/components/ui/toast"
import { formatRelativeTime } from "@/lib/utils"

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  author: {
    id: string
    name: string
    image: string | null
  }
  replies?: Comment[]
  _count: {
    likes: number
    replies: number
  }
}

interface CommentSectionProps {
  postId: string
  initialComments?: Comment[]
}

export function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const { data: session } = useSession()
  const toast = useToastActions()
  
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; commentId: string | null }>({
    isOpen: false,
    commentId: null,
  })

  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments()
    }
  }, [postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      toast.error("Please sign in to comment")
      return
    }

    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment("")
        toast.success("Comment posted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast.error("Failed to post comment")
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!session) {
      toast.error("Please sign in to reply")
      return
    }

    if (!replyContent.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: replyContent,
          parentId,
        }),
      })

      if (response.ok) {
        const reply = await response.json()
        
        // Add reply to the parent comment
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
              _count: {
                ...comment._count,
                replies: comment._count.replies + 1,
              },
            }
          }
          return comment
        }))
        
        setReplyContent("")
        setReplyingTo(null)
        toast.success("Reply posted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to post reply")
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      toast.error("Failed to post reply")
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        const updatedComment = await response.json()
        
        // Update comment in the list
        const updateCommentInList = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
            }
            if (comment.replies) {
              return { ...comment, replies: updateCommentInList(comment.replies) }
            }
            return comment
          })
        }
        
        setComments(updateCommentInList(comments))
        setEditingComment(null)
        setEditContent("")
        toast.success("Comment updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update comment")
      }
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error("Failed to update comment")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove comment from the list or mark as deleted
        const removeCommentFromList = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment.id === commentId) {
              if (comment._count.replies > 0) {
                return { 
                  ...comment, 
                  content: "[This comment has been deleted]",
                  deletedAt: new Date().toISOString(),
                }
              }
              return null
            }
            if (comment.replies) {
              return { ...comment, replies: removeCommentFromList(comment.replies) }
            }
            return comment
          }).filter(Boolean) as Comment[]
        }
        
        setComments(removeCommentFromList(comments))
        toast.success("Comment deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!session) {
      toast.error("Please sign in to like comments")
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const { liked, likeCount } = await response.json()
        
        // Update like count in the comment
        const updateLikeInList = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, _count: { ...comment._count, likes: likeCount } }
            }
            if (comment.replies) {
              return { ...comment, replies: updateLikeInList(comment.replies) }
            }
            return comment
          })
        }
        
        setComments(updateLikeInList(comments))
      }
    } catch (error) {
      console.error("Error liking comment:", error)
      toast.error("Failed to like comment")
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isAuthor = session?.user?.id === comment.author.id
    const canEdit = isAuthor || session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR"
    const isDeleted = comment.deletedAt !== null

    return (
      <div className={`${isReply ? "ml-8 mt-4" : "mb-6"}`}>
        <Card className={isDeleted ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {comment.author.image ? (
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{comment.author.name}</span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>
                
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null)
                          setEditContent("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 mb-3">{comment.content}</p>
                )}
                
                {!isDeleted && editingComment !== comment.id && (
                  <div className="flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{comment._count.likes}</span>
                    </button>
                    
                    {!isReply && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    )}
                    
                    {canEdit && (
                      <Dropdown
                        trigger={
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            label: "Edit",
                            value: "edit",
                            icon: <Edit className="w-4 h-4" />,
                            onClick: () => {
                              setEditingComment(comment.id)
                              setEditContent(comment.content)
                            },
                          },
                          {
                            label: "Delete",
                            value: "delete",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => setDeleteModal({ isOpen: true, commentId: comment.id }),
                          },
                        ]}
                        align="right"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-4 ml-11">
                <div className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5" />
        <h3 className="text-xl font-bold">Comments ({comments.length})</h3>
      </div>
      
      {/* Comment Form */}
      {session ? (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <Button type="submit" disabled={!newComment.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to leave a comment</p>
            <Button onClick={() => window.location.href = "/auth/signin"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loading text="Loading comments..." />
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, commentId: null })}
        onConfirm={() => {
          if (deleteModal.commentId) {
            handleDeleteComment(deleteModal.commentId)
          }
        }}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
