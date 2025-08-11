"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"

export default function AdminProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    location: "",
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setForm({
      name: session.user.name || "",
      email: session.user.email || "",
      bio: "",
      website: "",
      location: "",
    })
  }, [session, status, router])

  if (status === "loading") return <div className="p-6"><Loading text="Loading profile..." /></div>
  if (!session) return null

  const saveProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          website: form.website,
          location: form.location,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save profile")
      }
      alert("Profile saved")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/users/${session.user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to change password")
      }
      setPasswordForm({ currentPassword: "", newPassword: "" })
      alert("Password changed")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          onClick={saveProfile}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input value={form.email} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="profile-bio">Bio</label>
            <textarea id="profile-bio" className="w-full border rounded-md p-2" rows={3} placeholder="Tell us about yourself" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
          </div>
          <div>
            <button type="button" className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={changePassword}>Update Password</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

