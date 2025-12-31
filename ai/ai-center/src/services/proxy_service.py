import httpx
from typing import Any, Dict, Optional

from ..config import settings


class ProxyService:
    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
    
    async def init(self):
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.http_timeout),
            limits=httpx.Limits(max_connections=100),
        )
    
    async def close(self):
        if self.client:
            await self.client.aclose()
    
    async def forward_request(
        self,
        service_url: str,
        path: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.client:
            raise RuntimeError("ProxyService not initialized")
        
        url = f"{service_url}{path}"
        
        try:
            if method == "GET":
                response = await self.client.get(url, params=params)
            elif method == "POST":
                response = await self.client.post(url, json=data, params=params)
            elif method == "PUT":
                response = await self.client.put(url, json=data, params=params)
            elif method == "DELETE":
                response = await self.client.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {"error": str(e), "status_code": e.response.status_code}
        except Exception as e:
            return {"error": str(e)}


proxy_service = ProxyService()
