from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.deps import get_current_user

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: str
    size: str = ""
    color: str = ""
    quantity: int = 1


class CartQtyPatch(BaseModel):
    quantity: int


def _cart_with_products(rows: list) -> list:
    """Attach current product info (name, price, stock, image) to each cart row
    so the frontend doesn't need a second round-trip per item."""
    out = []
    for r in rows:
        prod_rows = supabase.table("products").select("*").eq("id", r["product_id"]).execute().data
        if not prod_rows:
            continue  # product was deleted; skip stale cart row
        prod = prod_rows[0]
        out.append({
            **r,
            "product": {
                "id": prod["id"],
                "name": prod["name"],
                "price": prod["price"],
                "stock": prod["stock"],
                "image_url": prod["image_url"],
            }
        })
    return out


@router.get("/api/cart")
def get_cart(user: dict = Depends(get_current_user)):
    rows = supabase.table("cart_items").select("*") \
        .eq("user_id", user.id).order("created_at").execute().data
    return _cart_with_products(rows)


@router.post("/api/cart")
def add_to_cart(item: CartItemIn, user: dict = Depends(get_current_user)):
    if item.quantity < 1:
        raise HTTPException(400, "Quantity must be at least 1.")

    prod_rows = supabase.table("products").select("*").eq("id", item.product_id).execute().data
    if not prod_rows:
        raise HTTPException(404, "Product not found.")
    prod = prod_rows[0]
    if prod["sizes"] and item.size not in prod["sizes"]:
        raise HTTPException(400, "Please select a valid size.")
    if prod["colors"] and item.color not in prod["colors"]:
        raise HTTPException(400, "Please select a valid color.")

    # Same product+size+color already in cart? bump quantity instead of duplicating.
    existing = supabase.table("cart_items").select("*") \
        .eq("user_id", user.id).eq("product_id", item.product_id) \
        .eq("size", item.size).eq("color", item.color).execute().data

    if existing:
        row = existing[0]
        new_qty = row["quantity"] + item.quantity
        updated = supabase.table("cart_items").update({"quantity": new_qty}) \
            .eq("id", row["id"]).execute().data[0]
        return updated

    created = supabase.table("cart_items").insert({
        "user_id": user.id,
        "product_id": item.product_id,
        "size": item.size,
        "color": item.color,
        "quantity": item.quantity,
    }).execute().data[0]
    return created


@router.patch("/api/cart/{cart_item_id}")
def update_cart_quantity(cart_item_id: str, body: CartQtyPatch, user: dict = Depends(get_current_user)):
    if body.quantity < 1:
        raise HTTPException(400, "Quantity must be at least 1.")
    rows = supabase.table("cart_items").select("id").eq("id", cart_item_id).eq("user_id", user.id).execute().data
    if not rows:
        raise HTTPException(404, "Cart item not found.")
    updated = supabase.table("cart_items").update({"quantity": body.quantity}) \
        .eq("id", cart_item_id).execute().data[0]
    return updated


@router.delete("/api/cart/{cart_item_id}")
def remove_from_cart(cart_item_id: str, user: dict = Depends(get_current_user)):
    rows = supabase.table("cart_items").select("id").eq("id", cart_item_id).eq("user_id", user.id).execute().data
    if not rows:
        raise HTTPException(404, "Cart item not found.")
    supabase.table("cart_items").delete().eq("id", cart_item_id).execute()
    return {"deleted": True}