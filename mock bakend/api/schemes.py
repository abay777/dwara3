from pydantic import BaseModel
from typing import List, Dict

# Response model
class ValidationResponseSchema(BaseModel):
    valid: bool
    files_count: int
    total_size_gb: float
    issues: List[Dict[str, str]]
