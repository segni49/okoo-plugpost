"use client"

import { useState, useEffect } from "react"
import { SimpleTextEditor } from "./simple-text-editor"
import dynamic from "next/dynamic"

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

// Dynamically import the RichTextEditor with no SSR
const DynamicRichTextEditor = dynamic(
  () => import("./rich-text-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-4 min-h-[200px] flex items-center justify-center text-gray-500">
          Loading rich text editor...
        </div>
      </div>
    ),
  }
)

export function RichTextEditorWrapper(props: RichTextEditorProps) {
  const [useRichEditor, setUseRichEditor] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // For now, always use the simple editor to avoid SSR issues
  // TODO: Re-enable rich editor once SSR issues are fully resolved
  return (
    <div className="space-y-3">
      <SimpleTextEditor {...props} />
      <div className="text-center">
        <button
          onClick={() => setUseRichEditor(true)}
          disabled
          className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed text-sm"
          title="Rich text editor temporarily disabled due to SSR issues"
        >
          🎨 Rich Text Editor (Coming Soon)
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Markdown formatting supported in the text area above
        </p>
      </div>
    </div>
  )
}
