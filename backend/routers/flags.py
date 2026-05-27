from fastapi import APIRouter, HTTPException
from services import db

router = APIRouter(prefix="/flags", tags=["flags"])


@router.get("")
def list_flags():
    """Return all unresolved flags with child details."""
    return db.get_unresolved_flags()


@router.patch("/{flag_id}/resolve")
def resolve_flag(flag_id: str):
    db.resolve_flag(flag_id)
    return {"success": True}
