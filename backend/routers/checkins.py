import base64

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pipeline.graph import pipeline
from services import db

router = APIRouter(prefix="/checkins", tags=["checkins"])


@router.post("")
async def submit_check_in(
    child_id: str = Form(...),
    audio: UploadFile = File(...),
):
    """Upload an audio file and run the full pipeline for a child."""
    if not db.get_child(child_id):
        raise HTTPException(status_code=404, detail="Child not found")

    audio_bytes = await audio.read()
    mime_type = audio.content_type or "audio/webm"

    initial_state = {
        "child_id": child_id,
        "audio_bytes_b64": base64.b64encode(audio_bytes).decode(),
        "audio_mime_type": mime_type,
        "audio_url": "",
        "transcript": "",
        "emotion_data": {},
        "embedding": [],
        "drift_score": None,
        "flag_status": "none",
        "flag_reason": "",
        "check_in_id": "",
    }

    result = await pipeline.ainvoke(initial_state)

    return {
        "check_in_id": result["check_in_id"],
        "transcript": result["transcript"],
        "emotion_data": result["emotion_data"],
        "drift_score": result["drift_score"],
        "flag_status": result["flag_status"],
        "flag_reason": result["flag_reason"],
        "audio_url": result["audio_url"],
    }


@router.get("/{child_id}")
def list_check_ins(child_id: str, limit: int = 30):
    """Return recent check-ins for a child."""
    if not db.get_child(child_id):
        raise HTTPException(status_code=404, detail="Child not found")
    return db.get_check_ins(child_id, limit=limit)
