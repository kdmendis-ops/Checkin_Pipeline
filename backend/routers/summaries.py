from datetime import date, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import db, gemini

router = APIRouter(prefix="/summaries", tags=["summaries"])


class GenerateRequest(BaseModel):
    child_id: str


@router.post("/generate")
def generate_summary(body: GenerateRequest):
    """Generate (or regenerate) this week's summary for a child."""
    if not db.get_child(body.child_id):
        raise HTTPException(status_code=404, detail="Child not found")

    entries = db.get_recent_emotion_data(body.child_id, days=7)
    if not entries:
        raise HTTPException(status_code=422, detail="No check-ins found for the past 7 days")

    summary_text = gemini.generate_weekly_summary(entries)

    # Week starts on the most recent Monday
    today = date.today()
    week_start = (today - timedelta(days=today.weekday())).isoformat()

    summary_id = db.save_weekly_summary(body.child_id, week_start, summary_text)
    return {"id": summary_id, "week_start": week_start, "summary_text": summary_text}


@router.get("/{child_id}")
def get_latest_summary(child_id: str):
    if not db.get_child(child_id):
        raise HTTPException(status_code=404, detail="Child not found")
    summary = db.get_latest_summary(child_id)
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found")
    return summary
