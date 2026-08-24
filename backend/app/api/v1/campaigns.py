from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.campaign import Campaign, CampaignRecipient
from app.models.contact import Contact
from app.models.template import Template
from app.services.template_service import template_service
from app.services.campaign_runner import campaign_runner

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

class QuickCSVCampaignRequest(BaseModel):
    name: str
    message_body: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    template_id: Optional[int] = None
    contacts: List[Dict[str, Any]]
    min_delay: Optional[int] = 3
    max_delay: Optional[int] = 6
    save_contacts_to_db: Optional[bool] = True

class CampaignControlRequest(BaseModel):
    action: str  # 'start', 'pause', 'resume', 'cancel'

@router.get("")
def list_campaigns(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "total_recipients": c.total_recipients,
            "sent_count": c.sent_count,
            "failed_count": c.failed_count,
            "progress_percent": round((((c.sent_count or 0) + (c.failed_count or 0)) / (c.total_recipients or 1)) * 100, 1),
            "min_delay": c.min_delay,
            "max_delay": c.max_delay,
            "media_url": c.media_url,
            "media_type": c.media_type,
            "message_body": c.message_body,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        }
        for c in campaigns
    ]

@router.get("/{campaign_id}")
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    recipients = (
        db.query(CampaignRecipient)
        .filter(CampaignRecipient.campaign_id == campaign_id)
        .order_by(CampaignRecipient.id.asc())
        .all()
    )

    return {
        "id": c.id,
        "name": c.name,
        "status": c.status,
        "total_recipients": c.total_recipients,
        "sent_count": c.sent_count,
        "failed_count": c.failed_count,
        "progress_percent": round((((c.sent_count or 0) + (c.failed_count or 0)) / (c.total_recipients or 1)) * 100, 1),
        "min_delay": c.min_delay,
        "max_delay": c.max_delay,
        "media_url": c.media_url,
        "media_type": c.media_type,
        "message_body": c.message_body,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "recipients": [
            {
                "id": r.id,
                "name": r.name,
                "phone_number": r.phone_number,
                "personalized_text": r.personalized_text,
                "status": r.status,
                "error_message": r.error_message,
                "sent_at": r.sent_at
            }
            for r in recipients
        ]
    }

@router.post("/quick-csv-campaign")
def create_quick_csv_campaign(req: QuickCSVCampaignRequest, db: Session = Depends(get_db)):
    """
    1. Parse contacts and message template.
    2. Render personalized message for each contact.
    3. Save Campaign and CampaignRecipients.
    4. Optionally sync contacts to database.
    5. Return campaign details + full preview of personalized messages.
    """
    if not req.contacts:
        raise HTTPException(status_code=400, detail="No contacts provided in campaign request")

    if not req.message_body:
        raise HTTPException(status_code=400, detail="Message body template cannot be empty")

    new_campaign = Campaign(
        name=req.name or f"CSV Campaign {datetime.now().strftime('%d %b %H:%M')}",
        template_id=req.template_id,
        status="DRAFT",
        total_recipients=len(req.contacts),
        sent_count=0,
        failed_count=0,
        min_delay=req.min_delay or 3,
        max_delay=req.max_delay or 6,
        media_url=req.media_url,
        media_type=req.media_type,
        message_body=req.message_body
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    preview_list = []

    for item in req.contacts:
        phone = item.get("phone_number")
        if not phone:
            continue

        name = item.get("name", "")
        
        # Optionally persist contact in DB
        contact_id = None
        if req.save_contacts_to_db:
            existing = db.query(Contact).filter(Contact.phone_number == phone).first()
            if existing:
                contact_id = existing.id
            else:
                new_c = Contact(
                    name=name,
                    phone_number=phone,
                    city=item.get("city", ""),
                    email=item.get("email", ""),
                    tags=item.get("tags", []),
                    custom_fields=item.get("custom_fields", {}),
                    opt_in_status="OPTED_IN"
                )
                db.add(new_c)
                db.commit()
                db.refresh(new_c)
                contact_id = new_c.id

        # Render custom text
        personalized_text = template_service.render_message(req.message_body, item)

        recipient = CampaignRecipient(
            campaign_id=new_campaign.id,
            contact_id=contact_id,
            name=name,
            phone_number=phone,
            personalized_text=personalized_text,
            status="PENDING"
        )
        db.add(recipient)

        preview_list.append({
            "name": name,
            "phone_number": phone,
            "personalized_text": personalized_text,
            "city": item.get("city", ""),
            "custom_fields": item.get("custom_fields", {})
        })

    db.commit()

    return {
        "success": True,
        "campaign_id": new_campaign.id,
        "campaign_name": new_campaign.name,
        "status": new_campaign.status,
        "total_recipients": len(preview_list),
        "preview": preview_list
    }

@router.post("/{campaign_id}/start")
async def start_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Start or trigger background dispatch for the campaign."""
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_runner.start(campaign_id)
    return {"success": True, "message": f"Campaign {campaign_id} started"}

@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Pause campaign execution."""
    campaign_runner.pause(campaign_id, db)
    return {"success": True, "message": f"Campaign {campaign_id} paused"}

@router.post("/{campaign_id}/resume")
async def resume_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Resume paused campaign execution."""
    campaign_runner.resume(campaign_id, db)
    return {"success": True, "message": f"Campaign {campaign_id} resumed"}

@router.post("/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Cancel campaign execution."""
    campaign_runner.cancel(campaign_id, db)
    return {"success": True, "message": f"Campaign {campaign_id} cancelled"}

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if c.status == "RUNNING":
        campaign_runner.cancel(campaign_id, db)

    db.delete(c)
    db.commit()
    return {"success": True, "message": "Campaign deleted"}
