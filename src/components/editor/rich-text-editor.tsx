"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { createLowlight } from "lowlight"
import { EditorToolbar } from "./editor-toolbar"
import { useCallback, useEffect, useState } from "react"

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className = "",
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const lowlight = createLowlight()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor(
    isMounted ? {
      extensions: [
        StarterKit.configure({
          codeBlock: false, // We'll use CodeBlockLowlight instead
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-lg",
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-600 hover:text-blue-800 underline",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: "bg-gray-100 rounded-md p-4 font-mono text-sm",
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content,
      editable,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        onChange?.(html)
      },
      editorProps: {
        attributes: {
          class: `prose prose-lg max-w-none focus:outline-none ${className}`,
        },
      },
    } : null,
    [isMounted, content, editable, placeholder, className, onChange]
  )

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:")
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!isMounted || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="p-4 min-h-[200px] flex items-center justify-center text-gray-500">
          {!isMounted ? "Loading editor..." : "Initializing editor..."}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {editable && (
        <EditorToolbar
          editor={editor}
          onAddImage={addImage}
          onSetLink={setLink}
        />
      )}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
