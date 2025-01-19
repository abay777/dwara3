from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def get_restore_status():
    """Get the status of current restore operations"""
    return {"message": "No active restore operations"}