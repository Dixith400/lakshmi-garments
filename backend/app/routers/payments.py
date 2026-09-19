import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.deps import get_current_user
from app.config import RAZORPAY_KEY_SECRET

router = APIRouter()


class VerifyIn(BaseModel):
    internal_order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/api/payments/verify")
def verify_payment(v: VerifyIn, user: dict = Depends(get_current_user)):
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
    if order["payment_status"] == "paid":
        return _result(order)  # already verified (idempotent)

    # 3. Mark paid, then take stock & count the sale
    order = supabase.table("orders").update({
        "payment_status": "paid",
        "status": "confirmed",
    }).eq("id", order["id"]).execute().data[0]

    item = supabase.table("order_items").select("*") \
        .eq("order_id", order["id"]).execute().data[0]

    prod = supabase.table("products").select("*").eq("id", item["product_id"]).execute().data[0]
    prod = supabase.table("products").update({
        "stock": max(prod["stock"] - item["quantity"], 0),
        "sold_count": prod["sold_count"] + item["quantity"],
    }).eq("id", prod["id"]).execute().data[0]

    return _result(order, prod)


def _result(order: dict, prod: dict = None):
    out = {"order": order}
    if prod:
        out["product"] = {"id": prod["id"], "name": prod["name"],
                          "sold_count": prod["sold_count"], "stock": prod["stock"]}
    return out
