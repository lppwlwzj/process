from fastapi import APIRouter, Request
from handlers.user_handler import login, list_users, create_user, delete_user, get_access_token

router = APIRouter(prefix="/api/user", tags=["user"])

@router.post("/login")
async def login_route(request: Request):
    data = await request.json()
    result = login(data)
    return result

@router.post("/list")
async def list_users_route():
    return list_users()

@router.post("/create")
async def create_user_route(request: Request):
    data = await request.json()
    return create_user(data)

@router.post("/delete")
async def delete_user_route(request: Request):
    data = await request.json()
    return delete_user(data)

@router.post("/getQrImg")
async def get_qr_img(request: Request):
    data = await request.json()
    return await get_access_token(data)
