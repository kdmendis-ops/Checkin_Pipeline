import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChildren, getFlags, createChild } from "../api";
import type { Child, Flag } from "../types";
import FlagBadge from "../components/FlagBadge";

export default function Dashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const TEACHER_ID = "11111111-1111-1111-1111-111111111111"; // matches seed migration

  useEffect(() => {
    Promise.all([getChildren(), getFlags()])
      .then(([c, f]) => {
        setChildren(c);
        setFlags(f);
      })
      .finally(() => setLoading(false));
  }, []);

  const flagMap: Record<string, Flag> = {};
  for (const f of flags) {
    if (!flagMap[f.child_id] || f.status === "alert") {
      flagMap[f.child_id] = f;
    }
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const child = await createChild(newName.trim(), TEACHER_ID);
      setChildren((prev) => [...prev, child]);
      setNewName("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  }

  const alertCount = flags.filter((f) => f.status === "alert").length;
  const warningCount = flags.filter((f) => f.status === "warning").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tilli Kids</h1>
            <p className="text-xs text-slate-500">Voice Emotion Check-in Dashboard</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {alertCount > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 font-medium">
                {alertCount} alert{alertCount > 1 ? "s" : ""}
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 font-medium">
                {warningCount} warning{warningCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Your Class ({children.length})
          </h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg bg-tilli-500 px-4 py-2 text-sm font-medium text-white hover:bg-tilli-600 transition-colors"
          >
            + Add Child
          </button>
        </div>

        {showAdd && (
          <form
            onSubmit={handleAddChild}
            className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <input
              type="text"
              placeholder="Child's first name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-tilli-500 focus:ring-1 focus:ring-tilli-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-tilli-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">👧</p>
            <p className="text-sm">No children added yet. Click "+ Add Child" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const flag = flagMap[child.id];
              const flagStatus = flag?.status ?? "none";
              const borderColor =
                flagStatus === "alert"
                  ? "border-red-300 bg-red-50"
                  : flagStatus === "warning"
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white";

              return (
                <Link
                  key={child.id}
                  to={`/child/${child.id}`}
                  className={`block rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 text-3xl">
                        {flagStatus === "alert" ? "😟" : flagStatus === "warning" ? "😐" : "😊"}
                      </div>
                      <p className="font-semibold text-slate-900">{child.name}</p>
                    </div>
                    {flag && (
                      <FlagBadge status={flagStatus as "warning" | "alert"} reason={flag.reason} />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Added {new Date(child.created_at).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
