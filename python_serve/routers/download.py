from fastapi import APIRouter, Request
from handlers.download_handler import download_customer

router = APIRouter(prefix="/api/download", tags=["download"])

@router.post("/customer")
async def download_customer_route(request: Request):
    data = await request.json()
    return download_customer(data)
