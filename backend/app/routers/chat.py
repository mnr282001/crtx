from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


def _can_query(collection_id: str, user_id: str) -> bool:
    own = _db.table("collections").select("id").eq("id", collection_id).eq("user_id", user_id).execute()
    if own.data:
        return True
    member = _db.table("collection_members").select("id").eq("collection_id", collection_id).eq("user_id", user_id).execute()
    return bool(member.data)


@router.get("/{collection_id}/history")
def get_history(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_query(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    res = (
        _db.table("chat_messages")
        .select("id, role, content, sources, created_at")
        .eq("collection_id", collection_id)
        .eq("user_id", user["sub"])
        .order("created_at")
        .execute()
    )
    return res.data or []


@router.delete("/{collection_id}/history")
def clear_history(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_query(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    _db.table("chat_messages").delete().eq("collection_id", collection_id).eq("user_id", user["sub"]).execute()
    return {"cleared": True}
