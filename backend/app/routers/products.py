from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.db import supabase
from app.deps import get_current_user, require_admin

router = APIRouter()


class ProductIn(BaseModel):
    name: str
    description: str = ""
    category: str = "garments"
    price: float
    stock: int = 0
    sizes: List[str] = []
    colors: List[str] = []
    image_url: str = ""


class ProductPatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    image_url: Optional[str] = None


@router.get("/api/products")
def list_products():
    return supabase.table("products").select("*").order("created_at", desc=True).execute().data


@router.get("/api/products/{product_id}")
def get_product(product_id: str, ):
    rows = supabase.table("products").select("*").eq("id", product_id).execute().data
    if not rows:
        raise HTTPException(404, "Product not found")
    return rows[0]


@router.post("/api/products")
def create_product(p: ProductIn, admin: dict = Depends(require_admin)):
    return supabase.table("products").insert(p.model_dump()).execute().data[0]


@router.patch("/api/products/{product_id}")
def update_product(product_id: str, p: ProductPatch, admin: dict = Depends(require_admin)):
    """Admin can change price and stock (and anything else) after creation."""
    updates = {k: v for k, v in p.model_dump().items() if v is not None}
    return supabase.table("products").update(updates).eq("id", product_id).execute().data[0]


@router.delete("/api/products/{product_id}")
def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    supabase.table("products").delete().eq("id", product_id).execute()
    return {"deleted": True}
