import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getChild, getLatestSummary, generateSummary } from "../api";
import type { Child, WeeklySummary as Summary } from "../types";

export default function WeeklySummary() {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getChild(id),
      getLatestSummary(id).catch(() => null),
    ]).then(([c, s]) => {
      setChild(c);
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleGenerate() {
    if (!id) return;
    setGenerating(true);
    setError(null);
    try {
      const s = await generateSummary(id);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Link to={`/child/${id}`} className="text-sm text-tilli-600 hover:underline">
            ← Back to {child?.name}
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Weekly Summary</h1>
            <p className="text-xs text-slate-500">{child?.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {summary ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Week of{" "}
                  {new Date(summary.week_start).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="text-xs text-tilli-600 hover:underline disabled:opacity-50"
                >
                  {generating ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {summary.summary_text}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">
                No summary available yet. Generate one after at least one check-in this week.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-lg bg-tilli-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-tilli-600 disabled:opacity-50 transition-colors"
              >
                {generating ? "Generating..." : "Generate Summary"}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 rounded-lg bg-red-50 p-3">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}
