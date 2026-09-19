from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.db import supabase
from app.deps import require_admin

router = APIRouter()


class SettingsIn(BaseModel):
    shop_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None


@router.get("/api/settings")
def get_settings():
    rows = supabase.table("shop_settings").select("*").eq("id", 1).execute().data
    return rows[0] if rows else {
        "shop_name": "Lakshmi Garments and Jewelry",
        "address": "Main Bazaar Road, Your City",
        "phone": "+91 90000 00000",
        "logo_url": "https://media.base44.com/images/public/6aae82cb01188ac2783c82e6/ac99a0ac8_generated_image.png",
    }


@router.put("/api/settings")
def update_settings(s: SettingsIn, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in s.model_dump().items() if v is not None}
    supabase.table("shop_settings").update(updates).eq("id", 1).execute()
    return get_settings()
