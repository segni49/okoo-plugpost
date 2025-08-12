"use client"

import { SimpleTextEditor } from "./simple-text-editor"

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function RichTextEditorWrapper(props: RichTextEditorProps) {
  // For now, always use the simple editor to avoid SSR issues
  // TODO: Re-enable rich editor once SSR issues are fully resolved
  return (
    <div className="space-y-3">
      <SimpleTextEditor {...props} />
      <div className="text-center">
        <button
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
