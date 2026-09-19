from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase, razorpay_client
from app.deps import get_current_user, require_admin
from app.config import RAZORPAY_KEY_ID

router = APIRouter()


class OrderIn(BaseModel):
    product_id: str
    size: str
    color: str
    quantity: int = 1
    payment_method: str  # 'cod' | 'razorpay'


class StatusPatch(BaseModel):
    status: str  # pending | confirmed | delivered | cancelled


def _order_with_items(order_row: dict) -> dict:
    items = supabase.table("order_items").select("*").eq("order_id", order_row["id"]).execute().data
    return {**order_row, "items": items}


@router.post("/api/orders")
def place_order(o: OrderIn, user: dict = Depends(get_current_user)):
    # 1. Load product and validate size/color/stock
    rows = supabase.table("products").select("*").eq("id", o.product_id).execute().data
    if not rows:
        raise HTTPException(404, "Product not found")
    product = rows[0]

    if o.size not in product["sizes"]:
        raise HTTPException(400, f"Size '{o.size}' is not available for this product.")
    if o.color not in product["colors"]:
        raise HTTPException(400, f"Color '{o.color}' is not available for this product.")
    if o.quantity < 1:
        raise HTTPException(400, "Quantity must be at least 1.")
    if product["stock"] < o.quantity:
        raise HTTPException(400, f"Only {product['stock']} left in stock.")
    if o.payment_method not in ("cod", "razorpay"):
        raise HTTPException(400, "payment_method must be 'cod' or 'razorpay'.")

    total = float(product["price"]) * o.quantity

    # 2. Razorpay online payment → create the Razorpay order first
    rzp_order_id = None
    if o.payment_method == "razorpay":
        rzp = razorpay_client.order.create({
            "amount": int(total * 100),  # paise
            "currency": "INR",
            "receipt": f"order_{user.id[:8]}",
        })
        rzp_order_id = rzp["id"]

    # 3. Save the order + item
    order = supabase.table("orders").insert({
        "user_id": user.id,
        "user_email": user.email or "",
        "total": total,
        "payment_method": o.payment_method,
        "payment_status": "cod_pending" if o.payment_method == "cod" else "unpaid",
        "status": "confirmed" if o.payment_method == "cod" else "pending",
        "razorpay_order_id": rzp_order_id,
    }).execute().data[0]

    supabase.table("order_items").insert({
        "order_id": order["id"],
        "product_id": product["id"],
        "product_name": product["name"],
        "size": o.size,
        "color": o.color,
        "quantity": o.quantity,
        "unit_price": float(product["price"]),
    }).execute()

    # 4. COD: take stock & count the sale immediately.
    #    Razorpay: stock is taken only AFTER payment is verified (payments.py).
    if o.payment_method == "cod":
        product = _apply_sale(product["id"], product["stock"], product["sold_count"], o.quantity)

    result = {
        "order": _order_with_items(order),
        "product": {"id": product["id"], "name": product["name"],
                     "sold_count": product["sold_count"], "stock": product["stock"]},
    }
    if o.payment_method == "razorpay":
        result["razorpay"] = {
            "key_id": RAZORPAY_KEY_ID,
            "amount": int(total * 100),
            "razorpay_order_id": rzp_order_id,
        }
    return result


def _apply_sale(product_id: str, current_stock: int, current_sold: int, qty: int) -> dict:
    """Decrease stock, increase sold_count. Returns the updated product row."""
    return supabase.table("products").update({
        "stock": current_stock - qty,
        "sold_count": current_sold + qty,
    }).eq("id", product_id).execute().data[0]


@router.get("/api/orders")
def my_orders(user: dict = Depends(get_current_user)):
    rows = supabase.table("orders").select("*") \
        .eq("user_id", user.id).order("created_at", desc=True).execute().data
    return [_order_with_items(r) for r in rows]


@router.get("/api/orders/all")
def all_orders(admin: dict = Depends(require_admin)):
    return [_order_with_items(r) for r in
            supabase.table("orders").select("*").order("created_at", desc=True).execute().data]


@router.patch("/api/orders/{order_id}/status")
def update_status(order_id: str, body: StatusPatch, admin: dict = Depends(require_admin)):
    if body.status not in ("pending", "confirmed", "delivered", "cancelled"):
        raise HTTPException(400, "Invalid status.")
    return supabase.table("orders") \
        .update({"status": body.status}).eq("id", order_id).execute().data[0]
