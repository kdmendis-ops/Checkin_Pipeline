import base64
import json
import os
import re
import tempfile

import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

_flash = genai.GenerativeModel("gemini-2.5-flash")

_TRANSCRIBE_PROMPT = """You are analysing a voice recording from a child's daily emotional check-in.

Listen carefully. Return ONLY a valid JSON object — no markdown, no explanation, no extra text:
{
  "transcript": "<verbatim transcription>",
  "sentiment": "positive|neutral|negative",
  "sentiment_score": <0.0-1.0, where 1.0 is most positive>,
  "emotional_keywords": ["<word>"],
  "distress_indicators": {
    "sadness": <0.0-1.0>,
    "anxiety": <0.0-1.0>,
    "isolation_language": <true|false>,
    "anger": <0.0-1.0>
  },
  "vocabulary_richness": <0.0-1.0>,
  "topics": ["school"|"home"|"friends"|"family"|"other"],
  "tone": "calm|excited|upset|withdrawn|flat|other"
}"""

_SUMMARY_PROMPT = """You are generating a weekly emotional well-being summary for a teacher about one of their students.

Below are the child's daily check-in analyses from the past 7 days (JSON array).
Write a concise, professional summary (3-5 sentences) covering:
- Overall emotional tone this week
- Notable patterns or changes
- Topics the child mentioned most
- Any concerns the teacher should be aware of

Tone: warm, objective, professional. No jargon.

Check-ins:
{entries}"""


def transcribe_and_analyse(audio_bytes: bytes, mime_type: str) -> dict:
    """Send audio to Gemini 2.0 Flash; return parsed emotion_data dict."""
    audio_b64 = base64.b64encode(audio_bytes).decode()
    audio_part = {"inline_data": {"mime_type": mime_type, "data": audio_b64}}
    response = _flash.generate_content([_TRANSCRIBE_PROMPT, audio_part])
    raw = response.text.strip()
    # Strip markdown fences if model wraps in ```json
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def embed_text(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
        output_dimensionality=768,
    )
    return result["embedding"]


def generate_weekly_summary(emotion_entries: list[dict]) -> str:
    """Generate a weekly plain-text summary from a list of emotion_data dicts."""
    prompt = _SUMMARY_PROMPT.format(entries=json.dumps(emotion_entries, indent=2))
    response = _flash.generate_content(prompt)
    return response.text.strip()
