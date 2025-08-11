"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2 } from "lucide-react"
import { Modal, ConfirmModal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import styles from "@/app/page.module.css"
import { DataTable } from "@/components/ui/data-table"


interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  _count?: { posts: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)

  const [form, setForm] = useState({ name: "", slug: "", description: "", color: "#1E40AF" })

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ includePostCount: "true" })
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/categories?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch categories")
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Failed to fetch categories")
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ name: "", slug: "", description: "", color: "#1E40AF" })
    setIsCreateOpen(true)
  }

  const openEdit = (cat: Category) => {
    setSelected(cat)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", color: cat.color || "#1E40AF" })
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create category")
      }
      setIsCreateOpen(false)
      fetchCategories()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error creating category")
    }
  }

  const handleUpdate = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/categories/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update category")
      }
      setIsEditOpen(false)
      setSelected(null)
      fetchCategories()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error updating category")
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/categories/${selected.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete category")
      }
      setIsDeleteOpen(false)
      setSelected(null)
      fetchCategories()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error deleting category")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage post categories</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" /> New Category
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCategories()}
          />
        </div>
        <button
          type="button"
          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
          onClick={fetchCategories}
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="p-6"><Loading text="Loading categories..." /></div>
      ) : error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (cat: Category) => (
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${styles.categoryColorIndicator}`} data-color={cat.color || "#D1D5DB"} />
                  <span className="font-medium">{cat.name}</span>
                </div>
              ),
            },
            { key: "slug", header: "Slug", render: (cat: Category) => <span>/{cat.slug}</span> },
            { key: "posts", header: "Posts", render: (cat: Category) => <span>{cat._count?.posts ?? 0}</span> },
            {
              key: "actions",
              header: "Actions",
              render: (cat: Category) => (
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    onClick={() => openEdit(cat)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800 inline-flex items-center"
                    onClick={() => { setSelected(cat); setIsDeleteOpen(true) }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={categories}
          getRowKey={(row) => row.id}
          emptyMessage="No categories found"
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Category">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Describe this category"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input aria-label="Category color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="button" className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={handleCreate}>Create</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Category">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Describe this category"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input aria-label="Category color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
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
        title="Delete category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  )
}

