"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2 } from "lucide-react"
import { Modal, ConfirmModal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { DataTable } from "@/components/ui/data-table"

interface Tag {
  id: string
  name: string
  slug: string
  _count?: { posts: number }
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Tag | null>(null)

  const [form, setForm] = useState({ name: "", slug: "" })

  useEffect(() => {
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ includePostCount: "true" })
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/tags?${params}`)
      if (!res.ok) throw new Error("Failed to fetch tags")
      const data = await res.json()
      setTags(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch tags")
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ name: "", slug: "" })
    setIsCreateOpen(true)
  }

  const openEdit = (tag: Tag) => {
    setSelected(tag)
    setForm({ name: tag.name, slug: tag.slug })
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create tag")
      }
      setIsCreateOpen(false)
      fetchTags()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error creating tag")
    }
  }

  const handleUpdate = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/tags/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update tag")
      }
      setIsEditOpen(false)
      setSelected(null)
      fetchTags()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error updating tag")
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/tags/${selected.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete tag")
      }
      setIsDeleteOpen(false)
      setSelected(null)
      fetchTags()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error deleting tag")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600">Manage post tags</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" /> New Tag
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tags..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTags()}
          />
        </div>
        <button
          type="button"
          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
          onClick={fetchTags}
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="p-6"><Loading text="Loading tags..." /></div>
      ) : error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "slug", header: "Slug", render: (t: Tag) => <span>/{t.slug}</span> },
            { key: "posts", header: "Posts", render: (t: Tag) => <span>{t._count?.posts ?? 0}</span> },
            {
              key: "actions",
              header: "Actions",
              render: (t: Tag) => (
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    onClick={() => openEdit(t)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800 inline-flex items-center"
                    onClick={() => { setSelected(t); setIsDeleteOpen(true) }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={tags}
          getRowKey={(row) => row.id}
          emptyMessage="No tags found"
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Tag">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={handleCreate}>Create</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Tag">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={handleUpdate}>Save Changes</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
      />
    </div>
  )
}

