from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
import os
import hashlib
from ..db.database import get_db
from ..db import models
from ..schemas import file as file_schemas
from ..config import settings
from ..services.miria import MiriaClient

router = APIRouter()

async def calculate_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@router.get("/scan-folders", response_model=List[Dict])
async def scan_folders():
    """Scan configured staging folders for available content"""
    available_content = []
    
    try:
        for root, dirs, files in os.walk(settings.STAGING_FOLDER):
            if files:
                total_size = sum(os.path.getsize(os.path.join(root, file)) for file in files)
                relative_path = os.path.relpath(root, settings.STAGING_FOLDER)
                
                available_content.append({
                    "path": relative_path,
                    "file_count": len(files),
                    "total_size": total_size,
                    "status": "ready"  # You can add validation logic here
                })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning folders: {str(e)}")
    
    return available_content

@router.post("/validate-folder")
async def validate_folder(folder_path: str):
    """Validate a specific folder for ingestion"""
    full_path = os.path.join(settings.STAGING_FOLDER, folder_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Add your validation logic here
    # For example: file naming conventions, minimum size requirements, etc.
    validation_results = {
        "valid": True,
        "messages": []
    }
    
    return validation_results

@router.post("/ingest", response_model=List[file_schemas.File])
async def ingest_folder(
    folder_path: str,
    db: AsyncSession = Depends(get_db)
):
    """Ingest a folder into the archival system"""
    full_path = os.path.join(settings.STAGING_FOLDER, folder_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    
    ingested_files = []
    miria_client = MiriaClient()
    
    try:
        # Create database entries for each file
        for root, _, files in os.walk(full_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, settings.STAGING_FOLDER)
                
                # Calculate file size and checksum
                size = os.path.getsize(file_path)
                checksum = await calculate_sha256(file_path)
                
                # Create database entry
                db_file = models.File(
                    path=relative_path,
                    filename=filename,
                    size=size,
                    checksum=checksum,
                    status="pending"
                )
                db.add(db_file)
                await db.flush()
                
                ingested_files.append(db_file)
        
        # Start archival process using Atempo Miria
        file_paths = [f.path for f in ingested_files]
        archive_result = await miria_client.archive_files(file_paths)
        
        # Update status based on archive result
        for file in ingested_files:
            file.status = "archiving"
        
        await db.commit()
        
        # Here you would typically trigger your Airflow DAG for further processing
        # This could include proxy generation, additional metadata extraction, etc.
        
        return ingested_files
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(e)}")

@router.get("/status/{file_id}", response_model=file_schemas.File)
async def get_ingest_status(
    file_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get the current status of an ingested file"""
    result = await db.get(models.File, file_id)
    if not result:
        raise HTTPException(status_code=404, detail="File not found")
    return result