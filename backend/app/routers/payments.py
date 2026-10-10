import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.db import supabase
from app.deps import get_current_user
from app.config import RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

router = APIRouter()


class VerifyIn(BaseModel):
    internal_order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def _mark_paid_and_reduce_stock(order: dict) -> tuple[dict, list]:
    # Atomic claim: only matches if the order is still unpaid,
    # so exactly one caller (verify OR webhook) gets a row back.
    claimed = supabase.table("orders").update({
        "payment_status": "paid",
        "status": "confirmed",
    }).eq("id", order["id"]).eq("payment_status", "unpaid").execute().data

    if not claimed:  # the other path already processed it
        fresh = supabase.table("orders").select("*").eq("id", order["id"]).execute().data
        return (fresh[0] if fresh else order), []

    order = claimed[0]
    items = supabase.table("order_items").select("*") \
        .eq("order_id", order["id"]).execute().data

    updated_products = []
    for item in items:
        if not item["product_id"]:
            continue
        prod_rows = supabase.table("products").select("*").eq("id", item["product_id"]).execute().data
        if not prod_rows:
            continue
        prod = prod_rows[0]
        prod = supabase.table("products").update({
            "stock": max(prod["stock"] - item["quantity"], 0),
            "sold_count": prod["sold_count"] + item["quantity"],
        }).eq("id", prod["id"]).execute().data[0]
        updated_products.append(prod)

        # Remove only the lines that were actually bought, not the whole cart
        supabase.table("cart_items").delete() \
            .eq("user_id", order["user_id"]).eq("product_id", item["product_id"]) \
            .eq("size", item.get("size") or "").eq("color", item.get("color") or "").execute()

    return order, updated_products


def _result(order: dict, products: list = None):
    out = {"order": order}
    if products:
        out["products"] = [
            {"id": p["id"], "name": p["name"], "sold_count": p["sold_count"], "stock": p["stock"]}
            for p in products
        ]
    return out


@router.post("/api/payments/verify")
def verify_payment(v: VerifyIn, user: dict = Depends(get_current_user)):
    """Called by the browser right after Razorpay checkout succeeds.
    This is the fast path — but it depends on the user's device staying
    online, so the webhook below is the reliable backstop."""

    # 1. Check the signature really came from Razorpay
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{v.razorpay_order_id}|{v.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, v.razorpay_signature):
        raise HTTPException(400, "Payment verification failed.")

    # 2. Load our order and make sure it belongs to this user & matches
    rows = supabase.table("orders").select("*").eq("id", v.internal_order_id).execute().data
    if not rows:
        raise HTTPException(404, "Order not found")
    order = rows[0]
    if order["user_id"] != user.id:
        raise HTTPException(403, "Not your order.")
    if order["razorpay_order_id"] != v.razorpay_order_id:
        raise HTTPException(400, "Razorpay order mismatch.")

    # 3. Mark paid, take stock & count the sale (no-op if the webhook already did this)
    order, updated_products = _mark_paid_and_reduce_stock(order)

    return _result(order, updated_products)


@router.post("/api/payments/webhook")
async def razorpay_webhook(request: Request):
    """Called directly by Razorpay's servers, independent of the customer's
    browser/internet. This is what protects against the case where payment
    succeeds but the customer's device goes offline before /verify runs."""

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not RAZORPAY_WEBHOOK_SECRET:
        # Webhook secret not configured yet — reject rather than silently
        # accepting unsigned requests.
        raise HTTPException(500, "Webhook secret not configured.")

    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(400, "Invalid webhook signature.")

    payload = await request.json()
    event = payload.get("event")

    if event == "payment.captured":
        rzp_order_id = payload["payload"]["payment"]["entity"]["order_id"]
        rows = supabase.table("orders").select("*").eq("razorpay_order_id", rzp_order_id).execute().data
        if rows:
            _mark_paid_and_reduce_stock(rows[0])
        # If no matching order is found, it may belong to a different
        # environment (e.g. a stray test-mode event) — safe to ignore.

    return {"received": True}