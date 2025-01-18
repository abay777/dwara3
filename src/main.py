# # src/main.py
# from fastapi import FastAPI
# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"Hello": "World"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# app/main.py
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

# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    STAGING_FOLDER: str
    PROXY_OUTPUT_FOLDER: str
    ATEMPO_API_URL: str
    ATEMPO_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()

# app/db/models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, index=True)
    filename = Column(String)
    size = Column(Integer)
    checksum = Column(String)
    status = Column(String)  # e.g., "pending", "archived", "restoring"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Archive locations
    copy1_location = Column(String, nullable=True)
    copy2_location = Column(String, nullable=True)
    copy3_location = Column(String, nullable=True)

class ProxyFile(Base):
    __tablename__ = "proxy_files"
    
    id = Column(Integer, primary_key=True, index=True)
    original_file_id = Column(Integer, ForeignKey("files.id"))
    proxy_type = Column(String)  # "hd" or "preview"
    path = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from ..config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except:
            await session.rollback()
            raise
        finally:
            await session.close()

# app/schemas/file.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class FileBase(BaseModel):
    path: str
    filename: str
    size: int
    checksum: Optional[str] = None
    status: str

class FileCreate(FileBase):
    pass

class File(FileBase):
    id: int
    created_at: datetime
    updated_at: datetime
    copy1_location: Optional[str] = None
    copy2_location: Optional[str] = None
    copy3_location: Optional[str] = None

    class Config:
        from_attributes = True

# app/services/atempo.py
from ..config import settings
import httpx
from typing import List, Dict

class AtempoClient:
    def __init__(self):
        self.base_url = settings.ATEMPO_API_URL
        self.api_key = settings.ATEMPO_API_KEY
        
    async def archive_files(self, files: List[str]) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/archive",
                json={"files": files},
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            return response.json()
    
    async def restore_files(self, files: List[str], destination: str) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/restore",
                json={
                    "files": files,
                    "destination": destination
                },
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            return response.json()