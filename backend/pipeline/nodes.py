import base64

from services import db, gemini
from pipeline.state import PipelineState


def transcribe_and_analyse(state: PipelineState) -> dict:
    """Upload audio, call Gemini for transcript + emotion data, create check_in row."""
    audio_bytes = base64.b64decode(state["audio_bytes_b64"])
    mime_type = state["audio_mime_type"]

    audio_url = db.upload_audio(state["child_id"], audio_bytes, mime_type)
    emotion_data = gemini.transcribe_and_analyse(audio_bytes, mime_type)

    check_in_id = db.create_check_in(
        child_id=state["child_id"],
        audio_url=audio_url,
        transcript=emotion_data.get("transcript", ""),
        emotion_data=emotion_data,
    )

    return {
        "audio_url": audio_url,
        "transcript": emotion_data.get("transcript", ""),
        "emotion_data": emotion_data,
        "check_in_id": check_in_id,
    }


def embed_and_contextualise(state: PipelineState) -> dict:
    """Embed transcript, store it, compute drift score against child's history."""
    embedding = gemini.embed_text(state["transcript"])

    db.save_embedding(
        check_in_id=state["check_in_id"],
        child_id=state["child_id"],
        embedding=embedding,
    )

    historical = db.get_child_embeddings(state["child_id"], days=90)
    # Exclude the embedding we just saved — it was appended, so slice off last entry
    drift_score = db.compute_drift_score(embedding, historical[:-1])

    return {
        "embedding": embedding,
        "drift_score": drift_score,
    }


def flag_check(state: PipelineState) -> dict:
    """Pure Python: analyse last 7 days of check-ins and create a flag if needed."""
    recent = db.get_recent_emotion_data(state["child_id"], days=7)
    flag_status, flag_reason = _compute_flag(recent)

    if flag_status != "none":
        db.save_flag(
            child_id=state["child_id"],
            check_in_id=state["check_in_id"],
            status=flag_status,
            reason=flag_reason,
        )

    return {
        "flag_status": flag_status,
        "flag_reason": flag_reason,
    }


def save_results(state: PipelineState) -> dict:
    """Persist drift_score back to the check_in row."""
    db.update_check_in(state["check_in_id"], state.get("drift_score"))
    return {"drift_score": state.get("drift_score")}


# ── Flag logic (no LLM) ───────────────────────────────────────────────────────

def _is_distressed(entry: dict) -> bool:
    d = entry.get("distress_indicators", {})
    return (
        d.get("sadness", 0) > 0.65
        or d.get("anxiety", 0) > 0.65
        or d.get("anger", 0) > 0.70
        or d.get("isolation_language", False)
        or entry.get("sentiment") == "negative"
    )


def _compute_flag(entries: list[dict]) -> tuple[str, str]:
    if not entries:
        return "none", ""

    distressed = [_is_distressed(e) for e in entries]

    # 3+ consecutive high-distress entries
    for i in range(len(distressed) - 2):
        if all(distressed[i : i + 3]):
            return "alert", "3 consecutive high-distress check-ins detected"

    count = sum(distressed)
    if count >= 2:
        return "warning", f"{count} distress entries in the last 7 days"

    return "none", ""
