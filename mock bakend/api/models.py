from pydantic import BaseModel
from typing import List, Dict, Any

# File Model
class FileModel(BaseModel):
    name: str
    size_gb: float
    type: str

# Folder Validation Request Model
class FolderValidationRequest(BaseModel):
    folderName: str
    type: str
    nasLocation: str
    path: str
    files: List[FileModel]
    subfolders: Dict[str, Any]

# Validation Response Model
class ValidationResponse(BaseModel):
    valid: bool
    files_count: int
    total_size_gb: float
    issues: List[Dict[str, str]]
