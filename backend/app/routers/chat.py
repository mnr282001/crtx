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


def _assert_session_owner(session_id: str, collection_id: str, user_id: str):
    res = _db.table("chat_sessions").select("id").eq("id", session_id).eq("collection_id", collection_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/{collection_id}/sessions")
def create_session(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_query(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    res = _db.table("chat_sessions").insert({
        "collection_id": collection_id,
        "user_id": user["sub"],
    }).execute()
    return res.data[0]


@router.get("/{collection_id}/sessions")
def list_sessions(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_query(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    res = (
        _db.table("chat_sessions")
        .select("id, title, created_at, updated_at")
        .eq("collection_id", collection_id)
        .eq("user_id", user["sub"])
        .order("updated_at", desc=True)
        .execute()
    )
    return res.data or []


@router.get("/{collection_id}/sessions/{session_id}")
def get_session_messages(collection_id: str, session_id: str, user: dict = Depends(get_current_user)):
    _assert_session_owner(session_id, collection_id, user["sub"])
    res = (
        _db.table("chat_messages")
        .select("id, role, content, sources, created_at")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return res.data or []


@router.delete("/{collection_id}/sessions/{session_id}")
def delete_session(collection_id: str, session_id: str, user: dict = Depends(get_current_user)):
    _assert_session_owner(session_id, collection_id, user["sub"])
    _db.table("chat_sessions").delete().eq("id", session_id).execute()
    return {"deleted": session_id}
