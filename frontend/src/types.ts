export interface Child {
  id: string;
  name: string;
  teacher_id: string;
  created_at: string;
}

export interface DistressIndicators {
  sadness: number;
  anxiety: number;
  isolation_language: boolean;
  anger: number;
}

export interface EmotionData {
  transcript: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  emotional_keywords: string[];
  distress_indicators: DistressIndicators;
  vocabulary_richness: number;
  topics: string[];
  tone: string;
}

export interface CheckIn {
  id: string;
  child_id: string;
  audio_url: string | null;
  transcript: string | null;
  emotion_data: EmotionData | null;
  drift_score: number | null;
  created_at: string;
}

export interface Flag {
  id: string;
  child_id: string;
  check_in_id: string;
  status: "warning" | "alert";
  reason: string;
  resolved: boolean;
  created_at: string;
  children?: { name: string; teacher_id: string };
}

export interface WeeklySummary {
  id: string;
  child_id: string;
  week_start: string;
  summary_text: string;
  created_at: string;
}

export interface CheckInResult {
  check_in_id: string;
  transcript: string;
  emotion_data: EmotionData;
  drift_score: number | null;
  flag_status: "none" | "warning" | "alert";
  flag_reason: string;
  audio_url: string;
}
