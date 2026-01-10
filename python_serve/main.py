from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from routers import user, customer, process, yipan, upload, download, zhibao, process_history
from config import SERVER_CONFIG

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(customer.router)
app.include_router(process.router)
app.include_router(yipan.router)
app.include_router(upload.router)
app.include_router(download.router)
app.include_router(zhibao.router)
app.include_router(process_history.router)

public_dir = os.path.join(os.path.dirname(__file__), '..', 'serve', 'public')
if os.path.exists(public_dir):
    app.mount("/img", StaticFiles(directory=os.path.join(public_dir, "images")), name="img")

@app.get("/")
async def root():
    return {"message": "API Server Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVER_CONFIG['host'], port=SERVER_CONFIG['port'])
