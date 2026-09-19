from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.config import ADMIN_USER_IDS

router = APIRouter()


@router.get("/api/me")
def me(user: dict = Depends(get_current_user)):
    """Frontend calls this to know if the logged-in user is an admin."""
    return {"user_id": user.id, "email": user.email, "is_admin": user.id in ADMIN_USER_IDS}
