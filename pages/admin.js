// pages/admin.js
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setStatus('Loading users…');
    try {
      const res = await fetch('/api/admin/list-users', {
        headers: {
          // Client can only read NEXT_PUBLIC_ env vars; set NEXT_PUBLIC_ADMIN_TOKEN to the same value as ADMIN_TOKEN
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
      setStatus('');
    } catch (e) {
      setStatus(`❌ ${e.message}`);
    }
  }

  async function mutateRole(email, action) {
    setStatus(`${action === 'grant' ? 'Granting' : 'Revoking'} Pro for ${email}…`);
    try {
      const res = await fetch(`/api/admin/${action}-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setStatus(`✅ ${data.message}`);
      fetchUsers();
    } catch (e) {
      setStatus(`❌ ${e.message}`);
    }
  }

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by email or name…"
          className="border border-gray-300 p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={fetchUsers}
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 border"
        >
          Refresh
        </button>
      </div>

      {status && <p className="mb-4 text-sm">{status}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Created</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.clerk_id || u.id}>
                <td className="py-2 px-4 border-b">{u.email || '—'}</td>
                <td className="py-2 px-4 border-b">{u.name || '—'}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    u.role === 'pro'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : u.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="py-2 px-4 border-b space-x-2">
                  {u.role !== 'pro' && (
                    <button
                      onClick={() => mutateRole(u.email, 'grant')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Grant Pro
                    </button>
                  )}
                  {u.role === 'pro' && (
                    <button
                      onClick={() => mutateRole(u.email, 'revoke')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Revoke Pro
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Protected by ADMIN_TOKEN. Make sure both <code>ADMIN_TOKEN</code> and <code>NEXT_PUBLIC_ADMIN_TOKEN</code> are set (same value).
      </p>
    </div>
  );
}