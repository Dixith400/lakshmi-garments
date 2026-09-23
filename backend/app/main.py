from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import FRONTEND_URL
from app.routers import auth, products, orders, payments, settings, categories, images, addresses, cart, wishlist

app = FastAPI(title="Lakshmi Garments & Jewelry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, ],     # your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(settings.router)
app.include_router(categories.router)
app.include_router(images.router)
app.include_router(addresses.router)
app.include_router(cart.router)
app.include_router(wishlist.router)

@app.get("/api/health")
def health():
    return {"ok": True}
