import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Comma-separated admin UUIDs from .env → e.g. ADMIN_USER_IDS=uuid1,uuid2
ADMIN_USER_IDS = {
    u.strip() for u in os.getenv("ADMIN_USER_IDS", "").split(",") if u.strip()
}
