import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function UsagePage() {
  return (
    <>
      <SignedOut>
        <div className="max-w-2xl mx-auto p-6">Please sign in to view usage.</div>
      </SignedOut>
      <SignedIn>
        <UsageInner />
      </SignedIn>
    </>
  );
}

function UsageInner() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/usage');
        const data = await res.json();
        if (!abort) setRows(data.rows || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <div className="max-w-4xl mx-auto p-6">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your recent chats</h1>
      <div className="space-y-3">
        {rows.length === 0 && <div className="text-gray-500">No logs yet.</div>}
        {rows.map(r => (
          <div key={r.id} className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
            <div className="text-sm">Model: <span className="font-mono">{r.model}</span></div>
            <div className="mt-2 text-sm line-clamp-3"><strong>Q:</strong> {previewJSON(r.input)}</div>
            <div className="mt-1 text-sm line-clamp-3"><strong>A:</strong> {r.output}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function previewJSON(s) {
  try {
    const v = JSON.parse(s);
    const lastUser = Array.isArray(v) ? v.filter(m => m.role === 'user').pop() : null;
    return lastUser?.content || s;
  } catch {
    return s;
  }
}