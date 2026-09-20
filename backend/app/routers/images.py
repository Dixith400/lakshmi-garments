import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.db import supabase
from app.deps import require_admin

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "tif", "tiff"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/tiff"
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB per image
MAX_IMAGES_PER_PRODUCT = 6


def _validate_file(file: UploadFile, contents: bytes):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"'{file.filename}' is not a supported image type. Allowed: JPG, PNG, GIF, TIFF.")
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"'{file.filename}' has an invalid file type.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"'{file.filename}' exceeds the 5MB size limit.")
    return ext


@router.post("/api/products/{product_id}/images")
async def upload_images(product_id: str, files: list[UploadFile] = File(...),
                         admin: dict = Depends(require_admin)):
    existing = supabase.table("product_images").select("id").eq("product_id", product_id).execute().data
    if len(existing) + len(files) > MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(400, f"Maximum {MAX_IMAGES_PER_PRODUCT} images allowed per product.")

    uploaded = []
    for file in files:
        contents = await file.read()
        ext = _validate_file(file, contents)
        path = f"{product_id}/{uuid.uuid4()}.{ext}"

        supabase.storage.from_("product-images").upload(
            path, contents, {"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("product-images").get_public_url(path)

        row = supabase.table("product_images").insert({
            "product_id": product_id, "image_url": public_url
        }).execute().data[0]
        uploaded.append(row)

    return uploaded


@router.get("/api/products/{product_id}/images")
def list_images(product_id: str):
    return supabase.table("product_images").select("*") \
        .eq("product_id", product_id).order("created_at").execute().data


@router.delete("/api/products/{product_id}/images/{image_id}")
def delete_image(product_id: str, image_id: str, admin: dict = Depends(require_admin)):
    supabase.table("product_images").delete().eq("id", image_id).execute()
    return {"deleted": True}