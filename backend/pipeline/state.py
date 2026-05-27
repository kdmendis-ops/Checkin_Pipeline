from typing import Optional
from typing_extensions import TypedDict


class PipelineState(TypedDict):
    child_id: str
    audio_bytes_b64: str      # base64-encoded raw audio
    audio_mime_type: str      # e.g. audio/webm
    audio_url: str            # Supabase Storage URL (set after upload)
    transcript: str
    emotion_data: dict
    embedding: list[float]
    drift_score: Optional[float]
    flag_status: str          # "none" | "warning" | "alert"
    flag_reason: str
    check_in_id: str
