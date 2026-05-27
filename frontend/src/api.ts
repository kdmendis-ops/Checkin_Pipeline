import type { Child, CheckIn, Flag, WeeklySummary, CheckInResult } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// Children
export const getChildren = (teacherId?: string): Promise<Child[]> => {
  const qs = teacherId ? `?teacher_id=${teacherId}` : "";
  return request<Child[]>(`/children${qs}`);
};

export const getChild = (id: string): Promise<Child> =>
  request<Child>(`/children/${id}`);

export const createChild = (name: string, teacher_id: string): Promise<Child> =>
  request<Child>("/children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, teacher_id }),
  });

// Check-ins
export const getCheckIns = (childId: string): Promise<CheckIn[]> =>
  request<CheckIn[]>(`/checkins/${childId}`);

export const submitCheckIn = (childId: string, audioBlob: Blob): Promise<CheckInResult> => {
  const form = new FormData();
  form.append("child_id", childId);
  form.append("audio", audioBlob, "recording.webm");
  return request<CheckInResult>("/checkins", { method: "POST", body: form });
};

// Flags
export const getFlags = (): Promise<Flag[]> => request<Flag[]>("/flags");

export const resolveFlag = (flagId: string): Promise<{ success: boolean }> =>
  request<{ success: boolean }>(`/flags/${flagId}/resolve`, { method: "PATCH" });

// Summaries
export const getLatestSummary = (childId: string): Promise<WeeklySummary> =>
  request<WeeklySummary>(`/summaries/${childId}`);

export const generateSummary = (childId: string): Promise<WeeklySummary> =>
  request<WeeklySummary>("/summaries/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ child_id: childId }),
  });
