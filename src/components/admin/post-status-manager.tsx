"use client"

import { useState } from "react"
import { PostStatus } from "@prisma/client"
import { 
  CheckCircle, 
  Edit, 
  Clock, 
  Archive, 
  Calendar,
  Eye,
  EyeOff
} from "lucide-react"

interface PostStatusManagerProps {
  currentStatus: PostStatus
  scheduledAt?: string | null
  onStatusChange: (status: PostStatus, scheduledAt?: string) => Promise<void>
}

export function PostStatusManager({
  currentStatus,
  scheduledAt,
  onStatusChange,
}: PostStatusManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  const statusOptions = [
    {
      value: PostStatus.DRAFT,
      label: "Draft",
      icon: Edit,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "Save as draft - not visible to public",
    },
    {
      value: PostStatus.PUBLISHED,
      label: "Published",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Publish immediately - visible to public",
    },
    {
      value: PostStatus.SCHEDULED,
      label: "Scheduled",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Schedule for future publication",
    },
    {
      value: PostStatus.ARCHIVED,
      label: "Archived",
      icon: Archive,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Archive - hidden from public but accessible via direct link",
    },
  ]

  const handleStatusChange = async (newStatus: PostStatus) => {
    if (newStatus === PostStatus.SCHEDULED) {
      setShowScheduler(true)
      return
    }

    setIsLoading(true)
    try {
      await onStatusChange(newStatus)
    } catch (error) {
      console.error("Error changing status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert("Please select both date and time")
      return
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`)
    if (scheduledDateTime <= new Date()) {
      alert("Scheduled time must be in the future")
      return
    }

    setIsLoading(true)
    try {
      await onStatusChange(PostStatus.SCHEDULED, scheduledDateTime.toISOString())
      setShowScheduler(false)
      setScheduleDate("")
      setScheduleTime("")
    } catch (error) {
      console.error("Error scheduling post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStatusInfo = () => {
    return statusOptions.find(option => option.value === currentStatus)
  }

  const currentStatusInfo = getCurrentStatusInfo()

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Post Status</h3>
      
      {/* Current Status Display */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          {currentStatusInfo && (
            <>
              <currentStatusInfo.icon className={`w-5 h-5 mr-2 ${currentStatusInfo.color}`} />
              <span className="font-medium text-gray-900">{currentStatusInfo.label}</span>
            </>
          )}
        </div>
        {currentStatus === PostStatus.SCHEDULED && scheduledAt && (
          <div className="text-sm text-gray-600 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Scheduled for: {new Date(scheduledAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Status Options */}
      <div className="space-y-3">
        {statusOptions.map((option) => {
          const Icon = option.icon
          const isActive = option.value === currentStatus
          
          return (
            <div key={option.value}>
              <button
                type="button"
                onClick={() => handleStatusChange(option.value)}
                disabled={isLoading || isActive}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isActive
                    ? `${option.bgColor} border-current ${option.color}`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? option.color : "text-gray-400"}`} />
                    <div>
                      <div className={`font-medium ${isActive ? option.color : "text-gray-900"}`}>
                        {option.label}
                        {isActive && " (Current)"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <CheckCircle className={`w-5 h-5 ${option.color}`} />
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Schedule Date"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Schedule Time"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowScheduler(false)
                  setScheduleDate("")
                  setScheduleTime("")
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSchedule}
                disabled={isLoading || !scheduleDate || !scheduleTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Scheduling..." : "Schedule Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex space-x-2">
          {currentStatus !== PostStatus.PUBLISHED && (
            <button
              type="button"
              onClick={() => handleStatusChange(PostStatus.PUBLISHED)}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Eye className="w-4 h-4 mr-1" />
              Publish Now
            </button>
          )}
          
          {currentStatus === PostStatus.PUBLISHED && (
            <button
              type="button"
              onClick={() => handleStatusChange(PostStatus.DRAFT)}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Unpublish
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setShowScheduler(true)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Clock className="w-4 h-4 mr-1" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
