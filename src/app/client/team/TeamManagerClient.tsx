'use client'

import { useEffect, useState } from 'react'

type Member = {
  id: string
  user_id: string
  role: 'owner' | 'manager' | 'editor' | 'viewer'
  status: 'invited' | 'active' | 'disabled'
  created_at: string
}

const roleOptions = ['owner', 'manager', 'editor', 'viewer'] as const

export default function TeamManagerClient({
  initialMembers,
  myRole,
}: {
  initialMembers: Member[]
  myRole: 'owner' | 'manager' | 'editor' | 'viewer'
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'owner' | 'manager' | 'editor' | 'viewer'>('viewer')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canManage = myRole === 'owner' || myRole === 'manager'

  async function refreshMembers() {
    setLoading(true)
    try {
      const res = await fetch('/api/client/members')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load members')
      setMembers(data.members || [])
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  async function addMember() {
    setMessage('')
    if (!userId.trim()) {
      setMessage('Error: user_id is required')
      return
    }

    try {
      const res = await fetch('/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add member')
      setMessage('Member added/updated successfully.')
      setUserId('')
      await refreshMembers()
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    }
  }

  async function changeRole(memberId: string, nextRole: Member['role']) {
    setBusyId(memberId)
    setMessage('')
    try {
      const res = await fetch(`/api/client/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      setMessage('Role updated.')
      await refreshMembers()
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function setStatus(memberId: string, status: 'active' | 'disabled') {
    setBusyId(memberId)
    setMessage('')
    try {
      const res = await fetch(`/api/client/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      setMessage('Status updated.')
      await refreshMembers()
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function removeMember(memberId: string) {
    setBusyId(memberId)
    setMessage('')
    try {
      const res = await fetch(`/api/client/members/${memberId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove member')
      setMessage('Member removed.')
      await refreshMembers()
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const assignableRoles = myRole === 'owner' ? roleOptions : (['editor', 'viewer'] as const)

  return (
    <div className="space-y-4">
      {message && <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">{message}</div>}

      {canManage && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Add team member</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Auth user_id (UUID)"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={addMember} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add member
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">For now this uses user_id directly. Invite-by-email flow will be added next.</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-mono text-xs">{m.user_id}</td>
                <td className="px-4 py-3">{m.role}</td>
                <td className="px-4 py-3">{m.status}</td>
                <td className="px-4 py-3">{new Date(m.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      {assignableRoles.map((r) => (
                        <button
                          key={r}
                          disabled={busyId === m.id || m.role === r}
                          onClick={() => changeRole(m.id, r)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                        >
                          role:{r}
                        </button>
                      ))}
                      <button
                        disabled={busyId === m.id || m.status === 'active'}
                        onClick={() => setStatus(m.id, 'active')}
                        className="rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        enable
                      </button>
                      <button
                        disabled={busyId === m.id || m.status === 'disabled'}
                        onClick={() => setStatus(m.id, 'disabled')}
                        className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        disable
                      </button>
                      <button
                        disabled={busyId === m.id}
                        onClick={() => removeMember(m.id)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">read only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && !loading && (
          <div className="p-4 text-sm text-gray-500">No team members yet.</div>
        )}
      </div>
    </div>
  )
}
