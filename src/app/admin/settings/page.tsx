"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setSettings(data.settings || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      await load()
      alert("Settings saved")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6"><Loading text="Loading settings..." /></div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">App Name</label>
            <Input
              value={settings.APP_NAME || ""}
              onChange={(e) => setSettings({ ...settings, APP_NAME: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">App Description</label>
            <input
              className="w-full border rounded-md p-2"
              value={settings.APP_DESCRIPTION || ""}
              onChange={(e) => setSettings({ ...settings, APP_DESCRIPTION: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">App URL</label>
            <Input
              value={settings.APP_URL || ""}
              onChange={(e) => setSettings({ ...settings, APP_URL: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "FEATURE_COMMENTS", label: "Comments" },
            { key: "FEATURE_ANALYTICS", label: "Analytics" },
            { key: "FEATURE_NEWSLETTER", label: "Newsletter" },
          ].map(f => (
            <label key={f.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings[f.key] === "true"}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.checked ? "true" : "false" })}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

