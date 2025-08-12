"use client"

import { useState, useRef } from "react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
} from "lucide-react"

interface SimpleTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function SimpleTextEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className = "",
}: SimpleTextEditorProps) {
  const [value, setValue] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onChange?.(newValue)
  }

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    handleChange(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const ToolbarButton = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {editable && (
        <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
          <ToolbarButton onClick={() => insertText("**", "**")} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("*", "*")} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("~~", "~~")} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("`", "`")} title="Code">
            <Code className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <ToolbarButton onClick={() => insertText("# ")} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("## ")} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("### ")} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <ToolbarButton onClick={() => insertText("- ")} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("1. ")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertText("> ")} title="Quote">
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <ToolbarButton 
            onClick={() => {
              const url = window.prompt("Enter URL:")
              const text = window.prompt("Enter link text:")
              if (url && text) {
                insertText(`[${text}](${url})`)
              }
            }} 
            title="Link"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => {
              const url = window.prompt("Enter image URL:")
              const alt = window.prompt("Enter alt text:")
              if (url) {
                insertText(`![${alt || "Image"}](${url})`)
              }
            }} 
            title="Image"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={!editable}
          className={`w-full min-h-[400px] resize-none border-none outline-none prose prose-lg max-w-none ${className}`}
          style={{ fontFamily: 'inherit' }}
        />
      </div>
    </div>
  )
}
