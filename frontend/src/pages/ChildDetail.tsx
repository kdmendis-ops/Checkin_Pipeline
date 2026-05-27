import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getChild, getCheckIns } from "../api";
import type { Child, CheckIn, CheckInResult } from "../types";
import AudioRecorder from "../components/AudioRecorder";
import EmotionChart from "../components/EmotionChart";
import FlagBadge from "../components/FlagBadge";

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<Child | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestResult, setLatestResult] = useState<CheckInResult | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getChild(id), getCheckIns(id)])
      .then(([c, ci]) => {
        setChild(c);
        setCheckIns(ci);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleCheckInComplete(result: CheckInResult) {
    setLatestResult(result);
    // Prepend the new check-in to the list so the chart updates immediately
    setCheckIns((prev) => [
      {
        id: result.check_in_id,
        child_id: id!,
        audio_url: result.audio_url,
        transcript: result.transcript,
        emotion_data: result.emotion_data,
        drift_score: result.drift_score,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Child not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-4">
          <Link to="/" className="text-sm text-tilli-600 hover:underline">
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{child.name}</h1>
            <p className="text-xs text-slate-500">Individual check-in history</p>
          </div>
          <div className="ml-auto">
            <Link
              to={`/child/${id}/summary`}
              className="rounded-lg border border-tilli-500 px-4 py-2 text-sm font-medium text-tilli-600 hover:bg-tilli-50 transition-colors"
            >
              Weekly Summary
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <AudioRecorder childId={id!} onComplete={handleCheckInComplete} />

        {latestResult && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-green-800">Latest Check-in Result</h3>
              {latestResult.flag_status !== "none" && (
                <FlagBadge
                  status={latestResult.flag_status}
                  reason={latestResult.flag_reason}
                />
              )}
            </div>
            <p className="text-sm text-slate-700 mb-3 italic">"{latestResult.transcript}"</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <Stat label="Sentiment" value={`${(latestResult.emotion_data.sentiment_score * 100).toFixed(0)}%`} />
              <Stat label="Tone" value={latestResult.emotion_data.tone} />
              <Stat
                label="Drift"
                value={latestResult.drift_score != null ? latestResult.drift_score.toFixed(2) : "—"}
                hint="Cosine similarity vs. baseline (1 = no drift)"
              />
              <Stat label="Topics" value={latestResult.emotion_data.topics.join(", ") || "—"} />
            </div>
          </div>
        )}

        {checkIns.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Emotion Trend (last {Math.min(checkIns.length, 30)} check-ins)
            </h3>
            <EmotionChart checkIns={checkIns.slice(0, 30)} />
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-sky-400" /> Sentiment</span>
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-red-400" style={{ backgroundImage: "repeating-linear-gradient(90deg,#f87171 0,#f87171 4px,transparent 4px,transparent 6px)" }} /> Sadness</span>
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-orange-400" style={{ backgroundImage: "repeating-linear-gradient(90deg,#fb923c 0,#fb923c 4px,transparent 4px,transparent 6px)" }} /> Anxiety</span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Check-in History
            </h3>
          </div>
          {checkIns.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No check-ins yet. Record the first one above.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkIns.map((ci) => (
                <CheckInRow key={ci.id} checkIn={ci} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function CheckInRow({ checkIn }: { checkIn: CheckIn }) {
  const [open, setOpen] = useState(false);
  const ed = checkIn.emotion_data;

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">
              {new Date(checkIn.created_at).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {ed && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ed.sentiment === "positive"
                    ? "bg-green-100 text-green-700"
                    : ed.sentiment === "negative"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {ed.sentiment}
              </span>
            )}
          </div>
          {ed && (
            <p className="text-sm text-slate-600 truncate italic">
              "{checkIn.transcript}"
            </p>
          )}
        </div>
        <span className="text-slate-400 text-xs mt-1">{open ? "▲" : "▼"}</span>
      </button>

      {open && ed && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs space-y-3">
          <p className="text-slate-700 italic">"{checkIn.transcript}"</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Sentiment" value={`${(ed.sentiment_score * 100).toFixed(0)}%`} />
            <Stat label="Sadness" value={`${(ed.distress_indicators.sadness * 100).toFixed(0)}%`} />
            <Stat label="Anxiety" value={`${(ed.distress_indicators.anxiety * 100).toFixed(0)}%`} />
            <Stat label="Tone" value={ed.tone} />
          </div>
          {ed.emotional_keywords.length > 0 && (
            <div>
              <span className="text-slate-400 uppercase tracking-wide">Keywords: </span>
              {ed.emotional_keywords.map((k) => (
                <span key={k} className="mr-1 rounded bg-slate-200 px-1.5 py-0.5 text-slate-600">
                  {k}
                </span>
              ))}
            </div>
          )}
          {checkIn.drift_score != null && (
            <p className="text-slate-500">
              Drift score: <strong>{checkIn.drift_score.toFixed(3)}</strong>
              <span className="ml-1 text-slate-400">(1.0 = no drift from baseline)</span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-slate-100 px-3 py-2" title={hint}>
      <p className="text-slate-400 uppercase tracking-wide text-xs">{label}</p>
      <p className="font-semibold text-slate-800 capitalize">{value}</p>
    </div>
  );
}
