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
  return <SimpleTextEditor {...props} />
}
