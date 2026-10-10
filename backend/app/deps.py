from fastapi import Header, HTTPException, Depends
from app.db import supabase
from app.config import ADMIN_USER_IDS


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Please log in.")
    token = authorization.replace("Bearer ", "").strip()
    try:
        return supabase.auth.get_user(token).user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")


def require_admin(user=Depends(get_current_user)):
    if user.id not in ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admins only.")
    return user