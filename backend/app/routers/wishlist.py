from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.deps import get_current_user

router = APIRouter()


class WishlistIn(BaseModel):
    product_id: str


@router.get("/api/wishlist")
def get_wishlist(user: dict = Depends(get_current_user)):
    rows = supabase.table("wishlist_items").select("*") \
        .eq("user_id", user.id).order("created_at", desc=True).execute().data
    out = []
    for r in rows:
        prod_rows = supabase.table("products").select("*").eq("id", r["product_id"]).execute().data
        if not prod_rows:
            continue
        out.append({**r, "product": prod_rows[0]})
    return out


@router.post("/api/wishlist")
def add_to_wishlist(item: WishlistIn, user: dict = Depends(get_current_user)):
    existing = supabase.table("wishlist_items").select("id") \
        .eq("user_id", user.id).eq("product_id", item.product_id).execute().data
    if existing:
        return existing[0]  # already wishlisted, no-op
    created = supabase.table("wishlist_items").insert({
        "user_id": user.id, "product_id": item.product_id
    }).execute().data[0]
    return created


@router.delete("/api/wishlist/{product_id}")
def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    supabase.table("wishlist_items").delete() \
        .eq("user_id", user.id).eq("product_id", product_id).execute()
    return {"deleted": True}