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
    owner_photo_url: Optional[str] = None


@router.get("/api/settings")
def get_settings():
    rows = supabase.table("shop_settings").select("*").eq("id", 1).execute().data
    return rows[0] if rows else {
        "shop_name": "Lakshmi Garments and Jewelry",
        "address": "Main Bazaar Road, Your City",
        "phone": "+91 90000 00000",
        "logo_url": "https://media.base44.com/images/public/6aae82cb01188ac2783c82e6/ac99a0ac8_generated_image.png",
        "owner_photo_url": "https://sbezixsrxfzccipwupby.supabase.co/storage/v1/object/sign/owner-image/WhatsApp%20Image%202026-09-21%20at%2014.19.28.jpeg?token=eyJraWQiOiJlYzU0MGQ0Yy1hMjVmLTRhODItYjFjZS1iMzBmYmM2MmM4YmMiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJvd25lci1pbWFnZS9XaGF0c0FwcCBJbWFnZSAyMDI2LTA5LTIxIGF0IDE0LjE5LjI4LmpwZWciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkwMTc1NDA4LCJleHAiOjE4MjE3MTE0MDh9.im6A6ov8u7DBPFohhXaU7ifLhs6V_gtyiyUiBUiHGO9JDxOkicTrRbJaqpJ_nBr0qHfsrWH3HOd6lVIBIeuvcQ",  
    }


# @router.put("/api/settings")
# def update_settings(s: SettingsIn, admin: dict = Depends(require_admin)):
#     updates = {k: v for k, v in s.model_dump().items() if v is not None}
#     supabase.table("shop_settings").update(updates).eq("id", 1).execute()
#     return get_settings()

@router.put("/api/settings")
def update_settings(s: SettingsIn, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in s.model_dump().items() if v is not None}
    updates["id"] = 1  # Force ID 1
    
    # Use upsert so it inserts row 1 if it doesn't exist yet
    supabase.table("shop_settings").upsert(updates).execute()
    return get_settings()