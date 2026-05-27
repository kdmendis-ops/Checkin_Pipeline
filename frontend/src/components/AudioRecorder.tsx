import { useState, useRef } from "react";
import type { CheckInResult } from "../types";
import { submitCheckIn } from "../api";

interface AudioRecorderProps {
  childId: string;
  onComplete: (result: CheckInResult) => void;
}

type RecordState = "idle" | "recording" | "uploading" | "done" | "error";

export default function AudioRecorder({ childId, onComplete }: AudioRecorderProps) {
  const [state, setState] = useState<RecordState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current!);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("uploading");
        try {
          const result = await submitCheckIn(childId, blob);
          setState("done");
          onComplete(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          setState("error");
        }
      };

      recorder.start();
      mediaRef.current = recorder;
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone use.");
      setState("error");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
  }

  function reset() {
    setState("idle");
    setError(null);
    setSeconds(0);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">
        New Voice Check-in
      </h3>

      {state === "idle" && (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 rounded-lg bg-tilli-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-tilli-600 active:scale-95 transition-all"
        >
          <span className="text-base">🎙️</span> Start Recording
        </button>
      )}

      {state === "recording" && (
        <div className="flex items-center gap-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="text-sm text-slate-600">
            Recording... {seconds}s
          </span>
          <button
            onClick={stopRecording}
            className="ml-auto rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {state === "uploading" && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <svg className="h-4 w-4 animate-spin text-tilli-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Processing audio...
        </div>
      )}

      {state === "done" && (
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-sm font-medium">Check-in complete</span>
          <button
            onClick={reset}
            className="text-xs text-tilli-600 underline hover:no-underline"
          >
            Record another
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={reset} className="text-xs text-tilli-600 underline">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
