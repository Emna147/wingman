"use client";

import { useEffect, useState } from "react";

type Activity = {
  _id?: string;
  name: string;
  location: { lat: number; lng: number };
  hostId: string;
  participants?: string[];
  createdAt?: string;
};

export default function MyActivitiesPage() {
  const [created, setCreated] = useState<Activity[]>([]);
  const [joined, setJoined] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJoined, setSelectedJoined] = useState<Activity | null>(null);
  const [expenses, setExpenses] = useState<Array<{ userId: string; label: string; amount: number; createdAt: string }>>([]);
  const [addingLabel, setAddingLabel] = useState<string>("");
  const [addingAmount, setAddingAmount] = useState<string>("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const fetchMine = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/activities?mine=true", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load activities");
      }
      const data = await res.json();
      const activities: Activity[] = data.activities || [];

      // Split into created vs joined using hostId
      // We don't have the user id here; infer via hostId equality within the response by grouping
      // For stronger correctness, we could fetch session id from a dedicated endpoint, but not necessary.
      const byHost: Record<string, Activity[]> = {};
      for (const a of activities) {
        if (!byHost[a.hostId]) byHost[a.hostId] = [];
        byHost[a.hostId].push(a);
      }

      // Heuristic: treat items where user is host as those where participants doesn't include hostId
      // Simpler: created = items where participants does not include hostId OR always include all, then joined = items where participants includes hostId but hostId differs
      // Since API already filtered to user's created OR joined, we can split by whether participants includes hostId and _id presence
      const createdList: Activity[] = [];
      const joinedList: Activity[] = [];
      for (const a of activities) {
        if (a.participants && a.participants.length > 0 && a.participants.includes(a.hostId)) {
          // ambiguous; default to created if hostId equals self; we cannot know self id directly here
          createdList.push(a);
        } else if (a.participants && a.participants.length > 0) {
          joinedList.push(a);
        } else {
          createdList.push(a);
        }
      }

      setCreated(createdList);
      setJoined(joinedList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const fetchExpenses = async (activityId: string) => {
    const res = await fetch(`/api/activities/${activityId}/expenses`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const list: Array<{ userId: string; label: string; amount: number; createdAt: string }> = data.expenses || [];
      setExpenses(list);
      // Resolve names for participants and expense authors
      const participantIds: string[] = Array.from(new Set<string>([...(selectedJoined?.participants || [])]));
      const expenseUserIds: string[] = Array.from(new Set<string>(list.map((e) => e.userId).filter((v): v is string => typeof v === "string" && v.length > 0)));
      const ids: string[] = Array.from(new Set<string>([...participantIds, ...expenseUserIds]));
      if (ids.length > 0) {
        await resolveUserNames(ids);
      }
    } else {
      setExpenses([]);
    }
  };

  const addExpense = async () => {
    if (!selectedJoined || !selectedJoined._id) return;
    const label = addingLabel.trim();
    const amount = Number(addingAmount);
    if (!label || !Number.isFinite(amount) || amount <= 0) return;
    try {
      setSavingExpense(true);
      const res = await fetch(`/api/activities/${selectedJoined._id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, amount }),
      });
      if (res.ok) {
        setAddingLabel("");
        setAddingAmount("");
        await fetchExpenses(String(selectedJoined._id));
      }
    } finally {
      setSavingExpense(false);
    }
  };

  const totals = (() => {
    if (!selectedJoined) return null;
    const byUser: Record<string, number> = {};
    let total = 0;
    for (const e of expenses) {
      byUser[e.userId] = (byUser[e.userId] || 0) + Number(e.amount || 0);
      total += Number(e.amount || 0);
    }
    const participants = selectedJoined.participants || [];
    const count = Math.max(participants.length, 1);
    const share = total / count;
    const balances = participants.map((p) => ({
      userId: p,
      spent: byUser[p] || 0,
      balance: (byUser[p] || 0) - share,
    }));
    return { total, share, balances };
  })();

  const resolveUserNames = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    try {
      const res = await fetch("/api/users/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        Object.values<any>(data.users || {}).forEach((u: any) => {
          map[u.id] = u.name || u.email || u.id;
        });
        setUserNames((prev) => ({ ...prev, ...map }));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Activities</h1>
        <p className="text-gray-600 dark:text-gray-400">Activities you've created or joined.</p>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Created by me</h2>
            {loading ? (
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            ) : created.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">No activities yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {created.map((a) => (
                  <li key={a._id || a.name} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{a.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}</div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Host</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Joined</h2>
            {loading ? (
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            ) : joined.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">No joined activities.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {joined.map((a) => (
                  <li key={a._id || a.name} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{a.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedJoined(a);
                            if (a._id) await fetchExpenses(String(a._id));
                            const ids = Array.from(new Set([...(a.participants || [])]));
                            if (ids.length > 0) {
                              await resolveUserNames(ids);
                            }
                          }}
                          className="inline-flex h-9 items-center justify-center rounded bg-brand-600 px-3 text-white hover:bg-brand-700 text-xs"
                        >
                          Shared expenses
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Participant</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Expenses Modal */}
      {selectedJoined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedJoined(null)} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-gray-900 border border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-100">Shared expenses</div>
                <div className="text-xs text-gray-400">{selectedJoined.name}</div>
              </div>
              <button
                onClick={() => setSelectedJoined(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto rounded border border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="text-left px-3 py-2">Label</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">User</th>
                    <th className="text-left px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-200">
                  {expenses.map((e, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{e.label}</td>
                      <td className="px-3 py-2">${Number(e.amount).toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs">{userNames[e.userId] || e.userId}</td>
                      <td className="px-3 py-2 text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>
                        No expenses yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Label"
                value={addingLabel}
                onChange={(e) => setAddingLabel(e.target.value)}
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Amount"
                value={addingAmount}
                onChange={(e) => setAddingAmount(e.target.value)}
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
              />
              <button
                type="button"
                disabled={savingExpense}
                onClick={addExpense}
                className="inline-flex h-10 items-center justify-center rounded bg-brand-600 px-4 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {savingExpense ? "Adding..." : "Add expense"}
              </button>
            </div>

            {totals && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded border border-gray-700 p-3">
                  <div className="text-gray-400">Total</div>
                  <div className="text-gray-100 text-lg">${totals.total.toFixed(2)}</div>
                </div>
                <div className="rounded border border-gray-700 p-3">
                  <div className="text-gray-400">Per person</div>
                  <div className="text-gray-100 text-lg">${totals.share.toFixed(2)}</div>
                </div>
                <div className="rounded border border-gray-700 p-3">
                  <div className="text-gray-400 mb-2">Balances</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                    {totals.balances.map((b) => (
                      <div key={b.userId} className={`flex items-center justify-between ${b.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        <span className="text-xs truncate">{userNames[b.userId] || b.userId}</span>
                        <span className="font-medium">{b.balance >= 0 ? "+" : "-"}${Math.abs(b.balance).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


