from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.core.database import get_db
from app.models.contact import Contact
from app.models.campaign import Campaign
from app.models.message import MessageLog

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_contacts = db.query(Contact).count()
    total_campaigns = db.query(Campaign).count()
    
    total_sent = db.query(MessageLog).filter(MessageLog.status == "SENT").count()
    total_failed = db.query(MessageLog).filter(MessageLog.status == "FAILED").count()
    total_all_messages = total_sent + total_failed

    # Today's sent
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_sent = (
        db.query(MessageLog)
        .filter(MessageLog.status == "SENT", MessageLog.created_at >= today_start)
        .count()
    )

    # Active campaigns count
    active_campaigns = db.query(Campaign).filter(Campaign.status.in_(["RUNNING", "DRAFT", "PAUSED"])).count()

    # Success rate
    success_rate = round((total_sent / total_all_messages * 100), 1) if total_all_messages > 0 else 100.0

    # Recent 5 campaigns
    recent_campaigns = db.query(Campaign).order_by(Campaign.id.desc()).limit(5).all()

    # Recent 10 messages
    recent_messages = db.query(MessageLog).order_by(MessageLog.id.desc()).limit(10).all()

    return {
        "total_contacts": total_contacts,
        "total_campaigns": total_campaigns,
        "total_sent": total_sent,
        "today_sent": today_sent,
        "total_failed": total_failed,
        "success_rate": success_rate,
        "active_campaigns": active_campaigns,
        "recent_campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "total_recipients": c.total_recipients,
                "sent_count": c.sent_count,
                "failed_count": c.failed_count,
                "progress_percent": round((((c.sent_count or 0) + (c.failed_count or 0)) / (c.total_recipients or 1)) * 100, 1),
                "created_at": c.created_at
            }
            for c in recent_campaigns
        ],
        "recent_messages": [
            {
                "id": m.id,
                "phone_number": m.phone_number,
                "contact_name": m.contact_name,
                "message_text": m.message_text,
                "status": m.status,
                "created_at": m.created_at
            }
            for m in recent_messages
        ]
    }
