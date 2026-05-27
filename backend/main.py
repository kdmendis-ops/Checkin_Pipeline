import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import checkins, children, flags, summaries

app = FastAPI(title="Tilli Voice Emotion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(checkins.router)
app.include_router(children.router)
app.include_router(flags.router)
app.include_router(summaries.router)

print("Tilli Voice Emotion API is running...")

@app.get("/health")
def health():
    return {"status": "ok"}
