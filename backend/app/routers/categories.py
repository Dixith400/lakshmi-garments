from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.deps import require_admin

router = APIRouter()


class CategoryIn(BaseModel):
    name: str


@router.get("/api/categories")
def list_categories():
    return supabase.table("categories").select("*").order("name").execute().data


@router.post("/api/categories")
def create_category(c: CategoryIn, admin: dict = Depends(require_admin)):
    existing = supabase.table("categories").select("*").eq("name", c.name).execute().data
    if existing:
        raise HTTPException(400, "Category already exists.")
    return supabase.table("categories").insert({"name": c.name}).execute().data[0]


@router.delete("/api/categories/{category_id}")
def delete_category(category_id: str, admin: dict = Depends(require_admin)):
    # Uncategorize any products using this category first.
    supabase.table("products").update({"category_id": None}).eq("category_id", category_id).execute()
    supabase.table("categories").delete().eq("id", category_id).execute()
    return {"deleted": True}