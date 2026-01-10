from fastapi import APIRouter, Request
from handlers.customer_handler import (
    list_customers, create_customer, update_customer, 
    delete_customer, batch_delete_customers, get_customer_detail
)

router = APIRouter(prefix="/api/customer", tags=["customer"])

@router.post("/list")
async def list_customers_route():
    return list_customers()

@router.post("/create")
async def create_customer_route(request: Request):
    data = await request.json()
    return create_customer(data)

@router.post("/update")
async def update_customer_route(request: Request):
    data = await request.json()
    return update_customer(data)

@router.post("/delete")
async def delete_customer_route(request: Request):
    data = await request.json()
    return delete_customer(data)

@router.post("/batchDelete")
async def batch_delete_customers_route(request: Request):
    data = await request.json()
    return batch_delete_customers(data)

@router.post("/detail")
async def get_customer_detail_route(request: Request):
    data = await request.json()
    return get_customer_detail(data)
