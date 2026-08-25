from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.whatsapp_client import whatsapp_client

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Device"])

class SendTestRequest(BaseModel):
    phone: str
    message: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None

class ToggleSimRequest(BaseModel):
    enable: Optional[bool] = None
    phone: Optional[str] = None
    name: Optional[str] = None

@router.get("/status")
async def get_whatsapp_status():
    """Retrieve WhatsApp connection status, QR code, and linked device profile."""
    return await whatsapp_client.get_status()

@router.post("/send-test")
async def send_test_message(req: SendTestRequest):
    """Send an immediate test WhatsApp message to verify connection."""
    res = await whatsapp_client.send_message(
        phone=req.phone,
        message=req.message,
        media_url=req.media_url,
        media_type=req.media_type
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to send message"))
    return res

@router.post("/disconnect")
async def disconnect_whatsapp():
    """Log out and disconnect linked WhatsApp account."""
    return await whatsapp_client.disconnect()

class PairCodeRequest(BaseModel):
    phone: str

@router.post("/pair-code")
async def request_pairing_code(req: PairCodeRequest):
    """Request 8-character pairing code for mobile browser linking ('Link with phone number')."""
    res = await whatsapp_client.request_pairing_code(phone=req.phone)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to generate pairing code"))
    return res

@router.post("/reset-session")
async def reset_session():
    """Reset and clean stale session credentials."""
    return await whatsapp_client.reset_session()

@router.post("/toggle-simulation")
async def toggle_simulation_mode(req: ToggleSimRequest):
    """Toggle simulated demo mode for testing UI & workflows without physical phone."""
    return await whatsapp_client.toggle_simulation(enable=req.enable, phone=req.phone, name=req.name)

