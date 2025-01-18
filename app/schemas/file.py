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