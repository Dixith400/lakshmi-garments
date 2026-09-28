import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from app.db import supabase
from app.deps import require_admin

router = APIRouter()

VIDEO_BUCKET = "guide-videos"
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "mov"}
ALLOWED_VIDEO_MIME_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB (Supabase free-plan limit)


class SettingsIn(BaseModel):
    shop_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    owner_photo_url: Optional[str] = None


@router.get("/api/settings")
def get_settings():
    rows = supabase.table("shop_settings").select("*").eq("id", 1).execute().data
    return rows[0] if rows else {
        "shop_name": "Lakshmi Garments and Jewelry",
        "address": "Main Bazaar Road, Your City",
        "phone": "+91 90000 00000",
        "logo_url": "https://media.base44.com/images/public/6aae82cb01188ac2783c82e6/ac99a0ac8_generated_image.png",
        "owner_photo_url": "",
        "guide_video_url": "",
    }


@router.put("/api/settings")
def update_settings(s: SettingsIn, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in s.model_dump().items() if v is not None}
    supabase.table("shop_settings").update(updates).eq("id", 1).execute()
    return get_settings()


def _remove_stored_video(url: str):
    """Best-effort delete of an old video file from storage given its public URL."""
    if not url or f"/{VIDEO_BUCKET}/" not in url:
        return
    path = url.split(f"/{VIDEO_BUCKET}/", 1)[1].split("?")[0]
    try:
        supabase.storage.from_(VIDEO_BUCKET).remove([path])
    except Exception:
        pass  # don't fail the request if cleanup fails


@router.post("/api/settings/guide-video")
async def upload_guide_video(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    name = file.filename or ""
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(400, "Unsupported video type. Use MP4, WebM, or MOV.")
    if file.content_type not in ALLOWED_VIDEO_MIME_TYPES:
        raise HTTPException(400, "Invalid video file type.")

    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(400, "Video is larger than 50 MB. Please compress it and try again.")

    path = f"guide/{uuid.uuid4()}.{ext}"
    try:
        supabase.storage.from_(VIDEO_BUCKET).upload(
            path, contents, {"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(500, f"Video upload failed: {e}")

    new_url = supabase.storage.from_(VIDEO_BUCKET).get_public_url(path)

    old_url = (get_settings() or {}).get("guide_video_url", "")
    supabase.table("shop_settings").update({"guide_video_url": new_url}).eq("id", 1).execute()
    _remove_stored_video(old_url)  # free up storage from the previous video

    return {"guide_video_url": new_url}


@router.delete("/api/settings/guide-video")
def delete_guide_video(admin: dict = Depends(require_admin)):
    old_url = (get_settings() or {}).get("guide_video_url", "")
    supabase.table("shop_settings").update({"guide_video_url": ""}).eq("id", 1).execute()
    _remove_stored_video(old_url)
    return {"deleted": True}