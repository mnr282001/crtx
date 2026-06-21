from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY
from app.auth import get_current_user, get_optional_user

router = APIRouter()

_db = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

_DEFAULT_CONFIG = {
    "chunk_size": 1000,
    "retrieval_strategy": "similarity",
}


class CreateCollectionRequest(BaseModel):
    name: str


class PipelineConfig(BaseModel):
    chunk_size: int = 1000
    retrieval_strategy: Literal["similarity", "mmr", "threshold"] = "similarity"


class CreateShareRequest(BaseModel):
    permission: Literal["query", "ingest"] = "query"


def _assert_owner(collection_id: str, user_id: str):
    res = _db.table("collections").select("user_id").eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    if res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not the collection owner")


def _assert_admin(user: dict):
    if not user.get("app_metadata", {}).get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")


def _has_access(collection_id: str, user_id: str) -> bool:
    own = _db.table("collections").select("id").eq("id", collection_id).eq("user_id", user_id).execute()
    if own.data:
        return True
    member = _db.table("collection_members").select("id").eq("collection_id", collection_id).eq("user_id", user_id).execute()
    return bool(member.data)


# ── Collections CRUD ────────────────────────────────────────────────────────

@router.post("/")
def create_collection(req: CreateCollectionRequest, user: dict = Depends(get_current_user)):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    res = _db.table("collections").insert({
        "name": req.name.strip(),
        "config": _DEFAULT_CONFIG,
        "user_id": user["sub"],
    }).execute()
    return res.data[0]


@router.get("/")
def list_collections(user: dict = Depends(get_current_user)):
    user_id = user["sub"]
    owned = _db.table("collections").select("*").eq("user_id", user_id).order("created_at").execute()

    member_rows = _db.table("collection_members").select("collection_id, permission").eq("user_id", user_id).execute()
    member_data = member_rows.data or []
    shared_ids = [r["collection_id"] for r in member_data]
    member_permissions = {r["collection_id"]: r["permission"] for r in member_data}

    shared = []
    if shared_ids:
        shared_res = _db.table("collections").select("*").in_("id", shared_ids).order("created_at").execute()
        shared = shared_res.data or []

    seen = {c["id"] for c in owned.data or []}
    combined = list(owned.data or [])
    for c in shared:
        if c["id"] not in seen:
            combined.append({**c, "shared": True, "permission": member_permissions.get(c["id"])})

    return combined


@router.delete("/{collection_id}")
def delete_collection(collection_id: str, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    res = _db.table("collections").delete().eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"deleted": collection_id}


@router.get("/{collection_id}/config")
def get_collection_config(collection_id: str, user: dict = Depends(get_current_user)):
    _assert_admin(user)
    res = _db.table("collections").select("config").eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {**_DEFAULT_CONFIG, **res.data[0].get("config", {})}


@router.put("/{collection_id}/config")
def update_collection_config(collection_id: str, config: PipelineConfig, user: dict = Depends(get_current_user)):
    _assert_admin(user)
    res = _db.table("collections").update({"config": config.model_dump()}).eq("id", collection_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    return res.data[0]["config"]


# ── Sharing ────────────────────────────────────────────────────────────────

@router.post("/{collection_id}/shares")
def create_share(collection_id: str, req: CreateShareRequest, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    res = _db.table("collection_shares").insert({
        "collection_id": collection_id,
        "permission": req.permission,
        "created_by": user["sub"],
    }).execute()
    return res.data[0]


@router.get("/{collection_id}/shares")
def list_shares(collection_id: str, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    shares = _db.table("collection_shares").select("*").eq("collection_id", collection_id).execute()
    members = _db.table("collection_members").select("*").eq("collection_id", collection_id).execute()
    member_rows = members.data or []
    if member_rows:
        user_ids = [m["user_id"] for m in member_rows]
        auth_users = _db.auth.admin.list_users()
        email_map = {u.id: (u.email or u.id) for u in auth_users if u.id in user_ids}
        for m in member_rows:
            m["email"] = email_map.get(m["user_id"], m["user_id"])
    return {"shares": shares.data or [], "members": member_rows}


@router.delete("/{collection_id}/shares/{share_id}")
def delete_share(collection_id: str, share_id: str, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    _db.table("collection_shares").delete().eq("id", share_id).eq("collection_id", collection_id).execute()
    return {"deleted": share_id}


@router.delete("/{collection_id}/members/{member_id}")
def remove_member(collection_id: str, member_id: str, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    member_res = _db.table("collection_members").select("user_id").eq("id", member_id).eq("collection_id", collection_id).execute()
    if member_res.data:
        removed_user_id = member_res.data[0]["user_id"]
        _db.table("collection_members").delete().eq("id", member_id).eq("collection_id", collection_id).execute()
        # Delete sessions (cascades to their messages), then any sessionless messages
        _db.table("chat_sessions").delete().eq("collection_id", collection_id).eq("user_id", removed_user_id).execute()
        _db.table("chat_messages").delete().eq("collection_id", collection_id).eq("user_id", removed_user_id).execute()
    return {"removed": member_id}


@router.get("/{collection_id}/documents")
def list_documents(collection_id: str, user: dict = Depends(get_current_user)):
    if not _has_access(collection_id, user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    docs_res = _db.table("collection_documents").select("*").eq("collection_id", collection_id).order("uploaded_at", desc=True).execute()
    result = []
    for doc in docs_res.data or []:
        if doc["source_type"] == "pdf" and doc.get("storage_path"):
            try:
                signed = _db.storage.from_("documents").create_signed_url(doc["storage_path"], 3600)
                doc["open_url"] = signed.signed_url if hasattr(signed, "signed_url") else (signed.get("signedURL") or signed.get("signedUrl") or "")
            except Exception:
                doc["open_url"] = None
        elif doc["source_type"] == "url":
            doc["open_url"] = doc.get("url")
        result.append(doc)
    return result


@router.delete("/{collection_id}/documents/{document_id}")
def delete_document(collection_id: str, document_id: str, user: dict = Depends(get_current_user)):
    _assert_owner(collection_id, user["sub"])
    doc_res = _db.table("collection_documents").select("storage_path").eq("id", document_id).eq("collection_id", collection_id).execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_path = doc_res.data[0].get("storage_path")
    if storage_path:
        try:
            _db.storage.from_("documents").remove([storage_path])
        except Exception:
            pass
    _db.table("collection_documents").delete().eq("id", document_id).eq("collection_id", collection_id).execute()
    return {"deleted": document_id}


@router.post("/join/{share_token}")
def join_via_share(share_token: str, user: dict = Depends(get_current_user)):
    share_res = _db.table("collection_shares").select("*").eq("share_token", share_token).execute()
    if not share_res.data:
        raise HTTPException(status_code=404, detail="Invalid share link")
    share = share_res.data[0]

    col_res = _db.table("collections").select("id, name, user_id").eq("id", share["collection_id"]).execute()
    if not col_res.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    collection = col_res.data[0]

    if collection["user_id"] == user["sub"]:
        return {"collection": collection, "already_owner": True}

    existing = _db.table("collection_members").select("id, permission").eq("collection_id", share["collection_id"]).eq("user_id", user["sub"]).execute()
    if existing.data:
        return {"collection": collection, "permission": existing.data[0]["permission"], "already_member": True}

    _db.table("collection_members").insert({
        "collection_id": share["collection_id"],
        "user_id": user["sub"],
        "permission": share["permission"],
        "share_id": share["id"],
    }).execute()
    return {"collection": collection, "permission": share["permission"]}
