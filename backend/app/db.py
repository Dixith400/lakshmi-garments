from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, \
    RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import razorpay

# Service-role client: bypasses RLS. Only the backend may use it.
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Razorpay client (test mode keys)
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
