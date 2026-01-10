from fastapi import APIRouter, UploadFile, File, Request
from handlers.upload_handler import upload_file, delete_image

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("")
async def upload_file_route(file: UploadFile = File(...)):
    return await upload_file(file)

@router.post("/delete")
async def delete_image_route(request: Request):
    data = await request.json()
    return delete_image(data)
