from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


class ShareSessionRequest(BaseModel):
    target_user_id: str


class UpdateSessionRequest(BaseModel):
    title: str


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


@router.patch("/{collection_id}/sessions/{session_id}")
def update_session(collection_id: str, session_id: str, req: UpdateSessionRequest, user: dict = Depends(get_current_user)):
    _assert_session_owner(session_id, collection_id, user["sub"])
    title = req.title.strip()[:100]
    _db.table("chat_sessions").update({"title": title}).eq("id", session_id).execute()
    return {"updated": session_id, "title": title}


@router.delete("/{collection_id}/sessions/{session_id}")
def delete_session(collection_id: str, session_id: str, user: dict = Depends(get_current_user)):
    _assert_session_owner(session_id, collection_id, user["sub"])
    _db.table("chat_sessions").delete().eq("id", session_id).execute()
    return {"deleted": session_id}


@router.get("/{collection_id}/members")
def get_collection_members(collection_id: str, user: dict = Depends(get_current_user)):
    if not _can_query(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")

    col_res = _db.table("collections").select("user_id").eq("id", collection_id).execute()
    if not col_res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    owner_id = col_res.data[0]["user_id"]

    member_rows = _db.table("collection_members").select("user_id").eq("collection_id", collection_id).execute()
    member_user_ids = [m["user_id"] for m in (member_rows.data or [])]

    # Collect all user IDs in the collection except the caller
    candidate_ids = []
    if owner_id != user["sub"]:
        candidate_ids.append(owner_id)
    for uid in member_user_ids:
        if uid != user["sub"] and uid not in candidate_ids:
            candidate_ids.append(uid)

    if not candidate_ids:
        return []

    auth_users = _db.auth.admin.list_users()
    email_map = {u.id: (u.email or u.id) for u in auth_users if u.id in candidate_ids}

    result = []
    if owner_id != user["sub"]:
        result.append({"user_id": owner_id, "email": email_map.get(owner_id, owner_id), "role": "owner"})
    for uid in member_user_ids:
        if uid != user["sub"] and not any(r["user_id"] == uid for r in result):
            result.append({"user_id": uid, "email": email_map.get(uid, uid), "role": "member"})

    return result


@router.post("/{collection_id}/sessions/{session_id}/share")
def share_session(collection_id: str, session_id: str, req: ShareSessionRequest, user: dict = Depends(get_current_user)):
    _assert_session_owner(session_id, collection_id, user["sub"])

    col_res = _db.table("collections").select("user_id").eq("id", collection_id).execute()
    if not col_res.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    target_is_owner = col_res.data[0]["user_id"] == req.target_user_id
    if not target_is_owner:
        member_res = _db.table("collection_members").select("id").eq("collection_id", collection_id).eq("user_id", req.target_user_id).execute()
        if not member_res.data:
            raise HTTPException(
                status_code=400,
                detail="This user is not a member of the collection. Only users already in the collection can receive shared chats.",
            )

    session_res = _db.table("chat_sessions").select("title").eq("id", session_id).execute()
    title = (session_res.data[0]["title"] if session_res.data else None) or "Shared Chat"

    new_session_res = _db.table("chat_sessions").insert({
        "collection_id": collection_id,
        "user_id": req.target_user_id,
        "title": title,
    }).execute()
    new_session_id = new_session_res.data[0]["id"]

    messages_res = (
        _db.table("chat_messages")
        .select("role, content, sources, created_at")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    messages = messages_res.data or []
    if messages:
        _db.table("chat_messages").insert([
            {
                "session_id": new_session_id,
                "collection_id": collection_id,
                "user_id": req.target_user_id,
                "role": m["role"],
                "content": m["content"],
                "sources": m.get("sources"),
            }
            for m in messages
        ]).execute()

    return {"shared": True, "new_session_id": new_session_id}
