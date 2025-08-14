'use client'

// Live comments component with real-time updates
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { Send, Edit, Trash2, Reply } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt?: string
  parentId?: string
  replies?: Comment[]
}

interface LiveCommentsProps {
  postId: string
  initialComments: Comment[]
}

export default function LiveComments({ postId, initialComments }: LiveCommentsProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user) return

    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Connected to live comments')
      // Join post room for real-time updates
      newSocket.emit('join_post', postId)
    })

    // Listen for new comments
    newSocket.on('new_comment', (data: { postId: string; comment: Comment }) => {
      if (data.postId === postId) {
        setComments(prev => {
          if (data.comment.parentId) {
            // Handle reply
            return prev.map(comment => {
              if (comment.id === data.comment.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), data.comment],
                }
              }
              return comment
            })
          } else {
            // Handle top-level comment
            return [...prev, data.comment]
          }
        })
        
        // Scroll to bottom for new comments
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    })

    // Listen for comment updates
    newSocket.on('comment_updated', (data: { postId: string; commentId: string; content: string }) => {
      if (data.postId === postId) {
        setComments(prev =>
          prev.map(comment => {
            if (comment.id === data.commentId) {
              return { ...comment, content: data.content, updatedAt: new Date().toISOString() }
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === data.commentId
                    ? { ...reply, content: data.content, updatedAt: new Date().toISOString() }
                    : reply
                ),
              }
            }
            return comment
          })
        )
      }
    })

    // Listen for comment deletions
    newSocket.on('comment_deleted', (data: { postId: string; commentId: string }) => {
      if (data.postId === postId) {
        setComments(prev =>
          prev.filter(comment => {
            if (comment.id === data.commentId) return false
            if (comment.replies) {
              comment.replies = comment.replies.filter(reply => reply.id !== data.commentId)
            }
            return true
          })
        )
      }
    })

    // Listen for typing indicators
    newSocket.on('typing_start', (data: { postId: string; userId: string; userName: string }) => {
      if (data.postId === postId && data.userId !== session.user.id) {
        setTypingUsers(prev => [...prev.filter(user => user !== data.userName), data.userName])
      }
    })

    newSocket.on('typing_stop', (data: { postId: string; userId: string }) => {
      if (data.postId === postId && data.userId !== session.user.id) {
        setTypingUsers(prev => prev.filter(user => user !== data.userId))
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from live comments')
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave_post', postId)
      newSocket.close()
    }
  }, [session?.user, postId])

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !session?.user) return

    socket.emit('typing_start', {
      postId,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { postId, userId: session.user.id })
    }, 2000)
  }

  const submitComment = async (content: string, parentId?: string) => {
    if (!content.trim() || !session?.user || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId,
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        
        // Clear form
        if (parentId) {
          setReplyTo(null)
        } else {
          setNewComment('')
        }

        // Stop typing indicator
        if (socket) {
          socket.emit('typing_stop', { postId, userId: session.user.id })
        }
      } else {
        console.error('Failed to submit comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateComment = async (commentId: string, content: string) => {
    if (!content.trim() || !session?.user) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      })

      if (response.ok) {
        setEditingComment(null)
        setEditContent('')
      } else {
        console.error('Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!session?.user) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        console.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mb-4'} p-4 bg-gray-50 rounded-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">{comment.author.name}</span>
            <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          
          {editingComment === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => updateComment(comment.id, editContent)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null)
                    setEditContent('')
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        {session?.user && (
          <div className="flex items-center space-x-2 ml-4">
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-gray-500 hover:text-blue-600"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>
            )}
            
            {session.user.id === comment.author.id && (
              <>
                <button
                  onClick={() => {
                    setEditingComment(comment.id)
                    setEditContent(comment.content)
                  }}
                  className="text-gray-500 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="text-gray-500 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reply form */}
      {replyTo === comment.id && (
        <div className="mt-4 ml-8">
          <textarea
            placeholder={`Reply to ${comment.author.name}...`}
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            onChange={(e) => {
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                submitComment(e.currentTarget.value, comment.id)
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">Ctrl+Enter to submit</span>
            <div className="space-x-2">
              <button
                onClick={() => setReplyTo(null)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const textarea = e.currentTarget.parentElement?.parentElement?.querySelector('textarea')
                  if (textarea) {
                    submitComment(textarea.value, comment.id)
                  }
                }}
                disabled={isSubmitting}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">
        Comments ({comments.length})
      </h3>

      {/* New comment form */}
      {session?.user ? (
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value)
              handleTyping()
            }}
            placeholder="Write a comment..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                submitComment(newComment)
              }
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Ctrl+Enter to submit</span>
            <button
              onClick={() => submitComment(newComment)}
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-100 rounded-md text-center">
          <p className="text-gray-600">
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in
            </a>{' '}
            to join the conversation
          </p>
        </div>
      )}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500 italic">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      <div ref={commentsEndRef} />
    </div>
  )
}
