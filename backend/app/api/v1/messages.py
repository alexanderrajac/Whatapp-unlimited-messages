from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.message import MessageLog

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.get("/history")
def get_message_history(
    search: Optional[str] = None,
    status: Optional[str] = None,
    campaign_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(MessageLog)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (MessageLog.phone_number.ilike(search_pattern)) |
            (MessageLog.contact_name.ilike(search_pattern)) |
            (MessageLog.message_text.ilike(search_pattern))
        )
    if status:
        query = query.filter(MessageLog.status == status)
    if campaign_id:
        query = query.filter(MessageLog.campaign_id == campaign_id)

    total = query.count()
    messages = query.order_by(MessageLog.id.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "messages": [
            {
                "id": m.id,
                "campaign_id": m.campaign_id,
                "contact_id": m.contact_id,
                "phone_number": m.phone_number,
                "contact_name": m.contact_name,
                "message_text": m.message_text,
                "media_url": m.media_url,
                "media_type": m.media_type,
                "direction": m.direction,
                "status": m.status,
                "error_message": m.error_message,
                "whatsapp_message_id": m.whatsapp_message_id,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }
