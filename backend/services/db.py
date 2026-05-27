import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
from supabase import create_client, Client

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


# ── Check-ins ──────────────────────────────────────────────────────────────────

def create_check_in(child_id: str, audio_url: str, transcript: str, emotion_data: dict) -> str:
    row = (
        get_client()
        .table("check_ins")
        .insert({
            "child_id": child_id,
            "audio_url": audio_url,
            "transcript": transcript,
            "emotion_data": emotion_data,
        })
        .execute()
    )
    return row.data[0]["id"]


def update_check_in(check_in_id: str, drift_score: Optional[float]) -> None:
    get_client().table("check_ins").update({"drift_score": drift_score}).eq("id", check_in_id).execute()


def get_check_ins(child_id: str, limit: int = 30) -> list[dict]:
    rows = (
        get_client()
        .table("check_ins")
        .select("*")
        .eq("child_id", child_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return rows.data


def get_recent_emotion_data(child_id: str, days: int = 7) -> list[dict]:
    """Return emotion_data dicts for the last `days` days, oldest first."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    rows = (
        get_client()
        .table("check_ins")
        .select("emotion_data, created_at")
        .eq("child_id", child_id)
        .gte("created_at", since)
        .order("created_at", desc=False)
        .execute()
    )
    return [r["emotion_data"] for r in rows.data if r["emotion_data"]]


# ── Embeddings ────────────────────────────────────────────────────────────────

def save_embedding(check_in_id: str, child_id: str, embedding: list[float]) -> None:
    get_client().table("embeddings").insert({
        "check_in_id": check_in_id,
        "child_id": child_id,
        "embedding": embedding,
    }).execute()


def get_child_embeddings(child_id: str, days: int = 90) -> list[list[float]]:
    """Fetch stored embeddings for a child from the last `days` days."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    rows = (
        get_client()
        .table("embeddings")
        .select("embedding")
        .eq("child_id", child_id)
        .gte("created_at", since)
        .execute()
    )
    return [r["embedding"] for r in rows.data if r["embedding"]]


def compute_drift_score(current: list[float], historical: list[list[float]]) -> Optional[float]:
    """Cosine similarity of current embedding vs. mean of historical. None if < 5 entries."""
    if len(historical) < 5:
        return None
    a = np.array(current)
    b = np.mean(np.array(historical), axis=0)
    sim = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))
    return round(sim, 4)


# ── Flags ─────────────────────────────────────────────────────────────────────

def save_flag(child_id: str, check_in_id: str, status: str, reason: str) -> str:
    row = get_client().table("flags").insert({
        "child_id": child_id,
        "check_in_id": check_in_id,
        "status": status,
        "reason": reason,
    }).execute()
    return row.data[0]["id"]


def get_unresolved_flags() -> list[dict]:
    return (
        get_client()
        .table("flags")
        .select("*, children(name, teacher_id)")
        .eq("resolved", False)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def resolve_flag(flag_id: str) -> None:
    get_client().table("flags").update({"resolved": True}).eq("id", flag_id).execute()


# ── Weekly summaries ──────────────────────────────────────────────────────────

def save_weekly_summary(child_id: str, week_start: str, summary_text: str) -> str:
    row = get_client().table("weekly_summaries").upsert({
        "child_id": child_id,
        "week_start": week_start,
        "summary_text": summary_text,
    }, on_conflict="child_id,week_start").execute()
    return row.data[0]["id"]


def get_latest_summary(child_id: str) -> Optional[dict]:
    rows = (
        get_client()
        .table("weekly_summaries")
        .select("*")
        .eq("child_id", child_id)
        .order("week_start", desc=True)
        .limit(1)
        .execute()
    )
    return rows.data[0] if rows.data else None


# ── Children ──────────────────────────────────────────────────────────────────

def get_children(teacher_id: Optional[str] = None) -> list[dict]:
    query = get_client().table("children").select("*").order("name")
    if teacher_id:
        query = query.eq("teacher_id", teacher_id)
    return query.execute().data


def create_child(name: str, teacher_id: str) -> dict:
    row = get_client().table("children").insert({
        "name": name,
        "teacher_id": teacher_id,
    }).execute()
    return row.data[0]


def get_child(child_id: str) -> Optional[dict]:
    rows = get_client().table("children").select("*").eq("id", child_id).execute()
    return rows.data[0] if rows.data else None


# ── Audio storage ─────────────────────────────────────────────────────────────

def upload_audio(child_id: str, audio_bytes: bytes, mime_type: str) -> str:
    """Upload audio to Supabase Storage; return public URL."""
    ext = mime_type.split("/")[-1].split(";")[0]  # webm, ogg, wav, etc.
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    path = f"{child_id}/{ts}.{ext}"
    get_client().storage.from_("audio-recordings").upload(
        path=path,
        file=audio_bytes,
        file_options={"content-type": mime_type},
    )
    res = get_client().storage.from_("audio-recordings").get_public_url(path)
    return res
