from fastapi import APIRouter, Request
from handlers.process_history_handler import add_history, get_history

router = APIRouter(prefix="/api/process_history", tags=["process_history"])

@router.post("/add")
async def add_history_route(request: Request):
    data = await request.json()
    return add_history(data)

@router.post("/list")
async def get_history_route(request: Request):
    data = await request.json()
    return get_history(data)
