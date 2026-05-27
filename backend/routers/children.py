from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import db

router = APIRouter(prefix="/children", tags=["children"])


class CreateChildRequest(BaseModel):
    name: str
    teacher_id: str


@router.get("")
def list_children(teacher_id: str | None = None):
    return db.get_children(teacher_id=teacher_id)


@router.get("/{child_id}")
def get_child(child_id: str):
    child = db.get_child(child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.post("")
def create_child(body: CreateChildRequest):
    return db.create_child(name=body.name, teacher_id=body.teacher_id)
