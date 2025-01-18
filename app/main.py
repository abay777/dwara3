from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ingest, restore, files
from .config import Settings
from .db import init_db

app = FastAPI(title="Dwara3 API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(restore.router, prefix="/api/restore", tags=["restore"])
app.include_router(files.router, prefix="/api/files", tags=["files"])

@app.on_event("startup")
async def startup_event():
    await init_db()

