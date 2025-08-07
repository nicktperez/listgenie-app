// pages/usage.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

function fmtNumber(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(n);
}

function fmtDate(s) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s || "—";
  }
}

function RoleBadge({ role }) {
  const color =
    role === "admin"
      ? "bg-purple-100 text-purple-800 ring-purple-200"
      : role === "pro"
      ? "bg-green-100 text-green-800 ring-green-200"
      : "bg-gray-100 text-gray-800 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${color}`}>
      {role?.toUpperCase() || "UNKNOWN"}
    </span>
  );
}

export default function UsagePage() {
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState({
    role: "",
    totals: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    rows: [],
  });

  useEffect(() => {
    let abort = false;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/usage");
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!abort) setData(json);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load usage.");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    // Only fetch when Clerk has loaded (prevents flicker)
    if (isLoaded) run();
    return () => {
      abort = true;
    };
  }, [isLoaded]);

  const rows = useMemo(() => {
    // Add total_tokens per row for display convenience
    return (data?.rows || []).map((r) => ({
      ...r,
      total_tokens: (r.prompt_tokens || 0) + (r.completion_tokens || 0),
    }));
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Usage & Billing</h1>
      <p className="mb-8 text-gray-600">
        Track your token usage and recent chats. Upgrade to Pro for higher limits and faster models.
      </p>

      <SignedOut>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Sign in to view usage</h2>
          <p className="mb-4 text-gray-600">
            You need to be signed in to see your stats and history.
          </p>
          <SignInButton mode="modal">
            <button className="rounded-md bg-black px-4 py-2 text-white">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Role + quick stats */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <RoleBadge role={data?.role} />
            <div className="text-sm text-gray-500">
              {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Tokens" value={fmtNumber(data?.totals?.total_tokens)} />
            <StatCard label="Prompt Tokens" value={fmtNumber(data?.totals?.prompt_tokens)} />
            <StatCard label="Completion Tokens" value={fmtNumber(data?.totals?.completion_tokens)} />
          </div>
        </div>

        {/* Content states */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
            Loading usage…
          </div>
        )}

        {!loading && err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            <div className="mb-1 font-semibold">Failed to load usage</div>
            <div className="text-sm">{err}</div>
          </div>
        )}

        {!loading && !err && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
            <div className="mb-2 text-lg font-semibold">No chats yet</div>
            <div className="mb-4 text-sm">Your chat history will appear here after your first conversation.</div>
            <a href="/chat" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white">
              Start a chat
            </a>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-0 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <Th>Date</Th>
                    <Th>Model</Th>
                    <Th className="text-right">Prompt</Th>
                    <Th className="text-right">Completion</Th>
                    <Th className="text-right">Total</Th>
                    <Th>Prompt Excerpt</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td>{fmtDate(r.created_at)}</Td>
                      <Td className="font-medium">{r.model || "—"}</Td>
                      <Td className="text-right tabular-nums">{fmtNumber(r.prompt_tokens)}</Td>
                      <Td className="text-right tabular-nums">{fmtNumber(r.completion_tokens)}</Td>
                      <Td className="text-right font-semibold tabular-nums">{fmtNumber(r.total_tokens)}</Td>
                      <Td className="max-w-xl truncate text-gray-600">
                        {r.input ? String(r.input).slice(0, 160) : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Optional footer */}
            <div className="flex items-center justify-between border-t border-gray-100 p-4 text-xs text-gray-500">
              <span>Showing {rows.length} {rows.length === 1 ? "entry" : "entries"}</span>
              <a href="/chat" className="underline">Open chat</a>
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}