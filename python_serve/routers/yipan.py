from fastapi import APIRouter, Request
from handlers.yipan_handler import (
    add_yipan, get_yipan_detail, update_yipan, list_yipan,
    start_chairside, complete_chairside, get_yipan_history, update_chairside_video
)

router = APIRouter(prefix="/api/yipan", tags=["yipan"])

@router.post("/add")
async def add_yipan_route(request: Request):
    data = await request.json()
    return add_yipan(data)

@router.post("/detail")
async def get_yipan_detail_route(request: Request):
    data = await request.json()
    return get_yipan_detail(data)

@router.post("/update")
async def update_yipan_route(request: Request):
    data = await request.json()
    return update_yipan(data)

@router.post("/list")
async def list_yipan_route(request: Request):
    data = await request.json()
    return list_yipan(data)

@router.post("/start")
async def start_chairside_route(request: Request):
    data = await request.json()
    return start_chairside(data)

@router.post("/complete")
async def complete_chairside_route(request: Request):
    data = await request.json()
    return complete_chairside(data)

@router.post("/history")
async def get_yipan_history_route(request: Request):
    data = await request.json()
    return get_yipan_history(data)

@router.post("/updateChairsideVideo")
async def update_chairside_video_route(request: Request):
    data = await request.json()
    return update_chairside_video(data)
