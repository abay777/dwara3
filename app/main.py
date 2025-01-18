from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.routers import ingest, restore, files
from app.config import Settings
from app.db.database import init_db

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

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")