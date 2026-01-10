from fastapi import APIRouter, Request
from handlers.zhibao_handler import (
    add_zhibao, edit_zhibao, get_zhibao_detail_by_id, get_zhibao_list, get_zhibao_info
)

router = APIRouter(prefix="/api/zhibao", tags=["zhibao"])

@router.post("/add")
async def add_zhibao_route(request: Request):
    data = await request.json()
    return add_zhibao(data)

@router.post("/edit")
async def edit_zhibao_route(request: Request):
    data = await request.json()
    return edit_zhibao(data)

@router.post("/detail")
async def get_zhibao_detail_by_id_route(request: Request):
    data = await request.json()
    return get_zhibao_detail_by_id(data)

@router.post("/list")
async def get_zhibao_list_route(request: Request):
    data = await request.json()
    return get_zhibao_list(data)

@router.post("/query")
async def get_zhibao_info_route(request: Request):
    data = await request.json()
    return get_zhibao_info(data)
