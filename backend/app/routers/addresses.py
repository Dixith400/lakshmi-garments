from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.deps import get_current_user

router = APIRouter()


class AddressIn(BaseModel):
    addressee_name: str
    address_line1: str
    address_line2: str = ""
    city: str
    state: str
    pin_code: str
    country: str = "India"


@router.get("/api/addresses")
def list_addresses(user: dict = Depends(get_current_user)):
    return supabase.table("addresses").select("*") \
        .eq("user_id", user.id).order("created_at", desc=True).execute().data


@router.post("/api/addresses")
def create_address(a: AddressIn, user: dict = Depends(get_current_user)):
    return supabase.table("addresses").insert({
        **a.model_dump(), "user_id": user.id
    }).execute().data[0]


@router.delete("/api/addresses/{address_id}")
def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    # Only allow deleting your own address.
    rows = supabase.table("addresses").select("id").eq("id", address_id).eq("user_id", user.id).execute().data
    if not rows:
        raise HTTPException(404, "Address not found.")
    supabase.table("addresses").delete().eq("id", address_id).execute()
    return {"deleted": True}