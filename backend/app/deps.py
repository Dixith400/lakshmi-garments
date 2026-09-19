from fastapi import Header, HTTPException, Depends
from app.db import supabase
from app.config import ADMIN_USER_IDS


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Verifies the Supabase JWT the frontend sends as 'Authorization: Bearer …'."""
    token = authorization.replace("Bearer ", "").strip()
    try:
        resp = supabase.auth.get_user(token)
        return resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Only UUIDs listed in .env ADMIN_USER_IDS pass."""
    if user.id not in ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admins only.")
    return user
