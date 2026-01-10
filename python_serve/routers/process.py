from fastapi import APIRouter, Request
from handlers.process_handler import (
    list_processes, create_process, update_process, delete_process,
    batch_delete_processes, get_process_detail, update_technician_video, update_web_video
)

router = APIRouter(prefix="/api/process", tags=["process"])

@router.post("/list")
async def list_processes_route(request: Request):
    data = await request.json()
    return list_processes(data)

@router.post("/create")
async def create_process_route(request: Request):
    data = await request.json()
    return create_process(data)

@router.post("/update")
async def update_process_route(request: Request):
    data = await request.json()
    return update_process(data)

@router.post("/delete")
async def delete_process_route(request: Request):
    data = await request.json()
    return delete_process(data)

@router.post("/batchDelete")
async def batch_delete_processes_route(request: Request):
    data = await request.json()
    return batch_delete_processes(data)

@router.post("/detail")
async def get_process_detail_route(request: Request):
    data = await request.json()
    return get_process_detail(data)

@router.post("/updateTechnicianVideo")
async def update_technician_video_route(request: Request):
    data = await request.json()
    return update_technician_video(data)

@router.post("/updateWebVideo")
async def update_web_video_route(request: Request):
    data = await request.json()
    return update_web_video(data)
