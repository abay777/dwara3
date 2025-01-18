from ..config import settings
import httpx
from typing import List, Dict

class MiriaClient:
    def __init__(self):
        self.base_url = settings.MIRIA_API_URL
        self.api_key = settings.MIRIA_API_KEY
        
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