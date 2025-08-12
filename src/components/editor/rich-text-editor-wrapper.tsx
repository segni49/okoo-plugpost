"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

// Dynamically import the RichTextEditor to ensure it only loads on the client
const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((mod) => ({ default: mod.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-4 min-h-[200px] flex items-center justify-center text-gray-500">
          Loading editor...
        </div>
      </div>
    ),
  }
)

export function RichTextEditorWrapper(props: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-4 min-h-[200px] flex items-center justify-center text-gray-500">
          Loading editor...
        </div>
      </div>
    )
  }

  return <RichTextEditor {...props} />
}
