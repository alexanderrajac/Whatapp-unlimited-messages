import httpx
import logging
from app.core.config import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class WhatsAppClient:
    def __init__(self):
        self.gateway_url = settings.WHATSAPP_GATEWAY_URL.rstrip('/')

    async def get_status(self) -> Dict[str, Any]:
        """Fetch WhatsApp connection status, QR code, and user profile."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.gateway_url}/status")
                if res.status_code == 200:
                    return res.json()
                return {
                    "status": "DISCONNECTED",
                    "isConnected": False,
                    "error": f"Gateway returned status {res.status_code}",
                    "qrCode": None
                }
        except Exception as e:
            logger.error(f"Error checking WhatsApp status: {e}")
            return {
                "status": "UNREACHABLE",
                "isConnected": False,
                "error": f"Cannot connect to WhatsApp Gateway at {self.gateway_url}",
                "qrCode": None
            }

    async def send_message(
        self,
        phone: str,
        message: str,
        media_url: Optional[str] = None,
        media_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a WhatsApp message through the linked device gateway."""
        try:
            payload = {
                "phone": phone,
                "message": message,
                "mediaUrl": media_url,
                "mediaType": media_type
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(f"{self.gateway_url}/send-message", json=payload)
                data = res.json()
                if res.status_code == 200 and data.get("success"):
                    return {
                        "success": True,
                        "message_id": data.get("messageId"),
                        "status": "SENT",
                        "to": phone,
                        "simulated": data.get("simulated", False)
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("error", "Failed to send message"),
                        "status": "FAILED"
                    }
        except Exception as e:
            logger.error(f"Error sending WhatsApp message to {phone}: {e}")
            return {
                "success": False,
                "error": str(e),
                "status": "FAILED"
            }

    async def disconnect(self) -> Dict[str, Any]:
        """Log out the current WhatsApp session."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.gateway_url}/logout")
                return res.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def toggle_simulation(self, enable: Optional[bool] = None, phone: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        """Toggle simulation/demo mode for rapid preview and testing."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.gateway_url}/toggle-simulation", json={
                    "enable": enable,
                    "phone": phone,
                    "name": name
                })
                return res.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

whatsapp_client = WhatsAppClient()
