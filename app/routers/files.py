# app/routers/files.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/list")
async def list_files():
    """List all files in the system"""
    return {"message": "File listing will be implemented here"}