'use client'

import { useState, useEffect } from 'react'

type StaffMember = {
  id: string
  user_id?: string
  email: string
  role: 'admin' | 'staff' | 'viewer'
  name?: string
  created_at: string
  invitation_accepted?: boolean
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  
  // Add staff form
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'staff' | 'viewer'>('viewer')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const res = await fetch('/api/client/staff')
      const data = await res.json()
      if (res.ok) {
        setStaff(data.staff || [])
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addStaff() {
    if (!newEmail) {
      setMessage('❌ Email is required')
      return
    }

    setAdding(true)
    setMessage('')

    try {
      const res = await fetch('/api/client/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`✅ ${data.message}`)
        setNewEmail('')
        setNewRole('viewer')
        loadStaff()
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`)
    } finally {
      setAdding(false)
    }
  }

  async function removeStaff(id: string) {
    if (!confirm('Are you sure you want to remove this staff member? They will lose access to this client immediately.')) {
      return
    }

    setBusyId(id)
    setMessage('')

    try {
      const res = await fetch(`/api/client/staff/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`✅ ${data.message}`)
        loadStaff()
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function updateRole(id: string, newRole: 'admin' | 'staff' | 'viewer') {
    setBusyId(id)
    setMessage('')

    try {
      const res = await fetch(`/api/client/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`✅ ${data.message}`)
        loadStaff()
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    staff: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Dashboard
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-2 text-gray-600">
            Manage team members with access to this client account
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Add Staff Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Staff Member</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="team@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              If they don&apos;t have an account, they&apos;ll receive an invitation
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            onClick={addStaff}
            disabled={adding || !newEmail}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add Staff'}
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Current Staff</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No staff members yet. Add your first team member above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {staff.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                    {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{member.name || member.email}</p>
                      {!member.invitation_accepted && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.name && member.email !== member.name && (
                      <p className="text-xs text-gray-400">{member.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value as any)}
                    disabled={busyId === member.id}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>

                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${roleColors[member.role]}`}>
                    {member.role}
                  </span>

                  <button
                    onClick={() => removeStaff(member.id)}
                    disabled={busyId === member.id}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    {busyId === member.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Role Permissions</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Viewer:</strong> Can view posts and scheduled content (read-only)</p>
          <p><strong>Staff:</strong> Can create posts, upload content, and schedule (full posting access)</p>
          <p><strong>Admin:</strong> Full access including staff management and client settings</p>
        </div>
      </div>
    </div>
  )
}
