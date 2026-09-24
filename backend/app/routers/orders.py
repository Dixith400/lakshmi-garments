from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase, razorpay_client
from app.deps import get_current_user, require_admin
from app.config import RAZORPAY_KEY_ID

router = APIRouter()


class OrderIn(BaseModel):
    product_id: str
    size: str = ""
    color: str = ""
    quantity: int = 1
    address_id: str

class StatusPatch(BaseModel):
    status: str  # pending | confirmed | delivered | cancelled

def _product_image(product_id: str, fallback: str = "") -> str:
    """First uploaded gallery image for a product, falling back to the
    product's legacy image_url field, or '' if neither exists."""
    imgs = supabase.table("product_images").select("image_url") \
        .eq("product_id", product_id).order("created_at").limit(1).execute().data
    if imgs:
        return imgs[0]["image_url"]
    return fallback or ""

def _order_with_items(order_row: dict) -> dict:
    items = supabase.table("order_items").select("*").eq("order_id", order_row["id"]).execute().data
    return {**order_row, "items": items}




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
    rows = supabase.table("orders") \
        .update({"status": body.status}).eq("id", order_id).execute().data
    if not rows:
        raise HTTPException(404, "Order not found.")
    return rows[0]


@router.post("/api/orders")
def place_order(o: OrderIn, user: dict = Depends(get_current_user)):
    rows = supabase.table("products").select("*").eq("id", o.product_id).execute().data
    if not rows:
        raise HTTPException(404, "Product not found")
    product = rows[0]

    addr_rows = supabase.table("addresses").select("*") \
        .eq("id", o.address_id).eq("user_id", user.id).execute().data
    if not addr_rows:
        raise HTTPException(400, "Please select a valid shipping address.")
    address = addr_rows[0]

    if product["sizes"] and o.size not in product["sizes"]:
        raise HTTPException(400, "Please select a valid size.")
    if product["colors"] and o.color not in product["colors"]:
        raise HTTPException(400, "Please select a valid color.")
    if o.quantity < 1:
        raise HTTPException(400, "Quantity must be at least 1.")
    if product["stock"] < o.quantity:
        raise HTTPException(400, f"Only {product['stock']} left in stock.")

    total = float(product["price"]) * o.quantity

    rzp = razorpay_client.order.create({
        "amount": int(total * 100),
        "currency": "INR",
        "receipt": f"order_{user.id[:8]}",
    })
    rzp_order_id = rzp["id"]

    order = supabase.table("orders").insert({
        "user_id": user.id,
        "user_email": user.email or "",
        "total": total,
        "payment_method": "razorpay",
        "payment_status": "unpaid",
        "status": "pending",
        "razorpay_order_id": rzp_order_id,
        "shipping_address": {
            "addressee_name": address["addressee_name"],
            "address_line1": address["address_line1"],
            "address_line2": address["address_line2"],
            "city": address["city"],
            "state": address["state"],
            "pin_code": address["pin_code"],
            "country": address["country"],
        },
    }).execute().data[0]

    supabase.table("order_items").insert({
        "order_id": order["id"],
        "product_id": product["id"],
        "product_name": product["name"],
        "size": o.size,
        "color": o.color,
        "quantity": o.quantity,
        "unit_price": float(product["price"]),
        "image_url": _product_image(product["id"], product.get("image_url", "")),
    }).execute()

    return {
        "order": _order_with_items(order),
        "razorpay": {
            "key_id": RAZORPAY_KEY_ID,
            "amount": int(total * 100),
            "razorpay_order_id": rzp_order_id,
        },
    }


# cart checkout 
@router.post("/api/orders/checkout-cart")
def checkout_cart(address_id: str, user: dict = Depends(get_current_user)):
    cart_rows = supabase.table("cart_items").select("*").eq("user_id", user.id).execute().data
    if not cart_rows:
        raise HTTPException(400, "Your cart is empty.")

    addr_rows = supabase.table("addresses").select("*") \
        .eq("id", address_id).eq("user_id", user.id).execute().data
    if not addr_rows:
        raise HTTPException(400, "Please select a valid shipping address.")
    address = addr_rows[0]

    # Validate every item and build the order_items we'll insert, before creating anything.
    line_items = []
    total = 0.0
    for c in cart_rows:
        prod_rows = supabase.table("products").select("*").eq("id", c["product_id"]).execute().data
        if not prod_rows:
            raise HTTPException(400, "One of the items in your cart no longer exists.")
        prod = prod_rows[0]
        if prod["stock"] < c["quantity"]:
            raise HTTPException(400, f"Only {prod['stock']} of \"{prod['name']}\" left in stock.")
        line_total = float(prod["price"]) * c["quantity"]
        total += line_total
        line_items.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "size": c["size"],
            "color": c["color"],
            "quantity": c["quantity"],
            "unit_price": float(prod["price"]),
            "image_url": _product_image(prod["id"], prod.get("image_url", "")),
        })

    rzp = razorpay_client.order.create({
        "amount": int(total * 100),
        "currency": "INR",
        "receipt": f"cart_{user.id[:8]}",
    })
    rzp_order_id = rzp["id"]

    order = supabase.table("orders").insert({
        "user_id": user.id,
        "user_email": user.email or "",
        "total": total,
        "payment_method": "razorpay",
        "payment_status": "unpaid",
        "status": "pending",
        "razorpay_order_id": rzp_order_id,
        "shipping_address": {
            "addressee_name": address["addressee_name"],
            "address_line1": address["address_line1"],
            "address_line2": address["address_line2"],
            "city": address["city"],
            "state": address["state"],
            "pin_code": address["pin_code"],
            "country": address["country"],
        },
    }).execute().data[0]

    for li in line_items:
        supabase.table("order_items").insert({"order_id": order["id"], **li}).execute()

    return {
        "order": _order_with_items(order),
        "razorpay": {
            "key_id": RAZORPAY_KEY_ID,
            "amount": int(total * 100),
            "razorpay_order_id": rzp_order_id,
        },
    }