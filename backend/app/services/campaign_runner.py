import asyncio
import random
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.campaign import Campaign, CampaignRecipient
from app.models.message import MessageLog
from app.models.contact import Contact
from app.services.whatsapp_client import whatsapp_client
from typing import Dict

logger = logging.getLogger(__name__)

# In-memory registry of active campaign runner tasks
active_campaign_tasks: Dict[int, asyncio.Task] = {}

class CampaignRunner:
    @classmethod
    async def run_campaign(cls, campaign_id: int):
        """
        Execute campaign sequentially:
        - Sends personalized message to each recipient with randomized human delay.
        - Updates DB in real time.
        - Supports pause, resume, and cancellation.
        """
        logger.info(f"[CampaignRunner] Starting execution for campaign {campaign_id}")
        db: Session = SessionLocal()
        
        try:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not campaign:
                logger.error(f"[CampaignRunner] Campaign {campaign_id} not found")
                return

            campaign.status = "RUNNING"
            db.commit()

            recipients = (
                db.query(CampaignRecipient)
                .filter(CampaignRecipient.campaign_id == campaign_id)
                .order_by(CampaignRecipient.id.asc())
                .all()
            )

            min_delay = max(1, campaign.min_delay or 3)
            max_delay = max(min_delay, campaign.max_delay or 6)

            for recipient in recipients:
                # Check if campaign was paused or cancelled mid-flight
                db.refresh(campaign)
                if campaign.status in ["PAUSED", "CANCELLED"]:
                    logger.info(f"[CampaignRunner] Campaign {campaign_id} is {campaign.status}. Halting runner.")
                    break

                # Skip already processed
                if recipient.status in ["SENT", "FAILED"]:
                    continue

                # Randomized safety delay to mimic human behavior and avoid spam filters
                delay = random.uniform(min_delay, max_delay)
                await asyncio.sleep(delay)

                # Re-check status after delay
                db.refresh(campaign)
                if campaign.status in ["PAUSED", "CANCELLED"]:
                    break

                # Send via WhatsApp Gateway
                res = await whatsapp_client.send_message(
                    phone=recipient.phone_number,
                    message=recipient.personalized_text,
                    media_url=campaign.media_url,
                    media_type=campaign.media_type
                )

                if res.get("success"):
                    recipient.status = "SENT"
                    recipient.sent_at = datetime.utcnow()
                    recipient.error_message = None
                    campaign.sent_count = (campaign.sent_count or 0) + 1
                    
                    # Create MessageLog record
                    msg_log = MessageLog(
                        campaign_id=campaign.id,
                        contact_id=recipient.contact_id,
                        phone_number=recipient.phone_number,
                        contact_name=recipient.name,
                        message_text=recipient.personalized_text,
                        media_url=campaign.media_url,
                        media_type=campaign.media_type,
                        direction="OUTBOUND",
                        status="SENT",
                        whatsapp_message_id=res.get("message_id")
                    )
                    db.add(msg_log)
                else:
                    recipient.status = "FAILED"
                    recipient.error_message = res.get("error", "Failed to send")
                    campaign.failed_count = (campaign.failed_count or 0) + 1

                    # Log failed attempt
                    msg_log = MessageLog(
                        campaign_id=campaign.id,
                        contact_id=recipient.contact_id,
                        phone_number=recipient.phone_number,
                        contact_name=recipient.name,
                        message_text=recipient.personalized_text,
                        direction="OUTBOUND",
                        status="FAILED",
                        error_message=res.get("error")
                    )
                    db.add(msg_log)

                db.commit()

            # Final status update
            db.refresh(campaign)
            if campaign.status not in ["PAUSED", "CANCELLED"]:
                campaign.status = "COMPLETED"
                db.commit()
                logger.info(f"[CampaignRunner] Campaign {campaign_id} finished successfully!")

        except Exception as e:
            logger.error(f"[CampaignRunner] Unhandled error in campaign {campaign_id}: {e}", exc_info=True)
            try:
                campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                if campaign:
                    campaign.status = "FAILED"
                    db.commit()
            except Exception:
                pass
        finally:
            active_campaign_tasks.pop(campaign_id, None)
            db.close()

    @classmethod
    def start(cls, campaign_id: int):
        """Spawn asynchronous campaign execution task."""
        if campaign_id in active_campaign_tasks and not active_campaign_tasks[campaign_id].done():
            logger.warning(f"Campaign {campaign_id} is already running.")
            return
        
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(cls.run_campaign(campaign_id))
            active_campaign_tasks[campaign_id] = task
        except RuntimeError:
            try:
                loop = asyncio.get_event_loop()
                task = loop.create_task(cls.run_campaign(campaign_id))
                active_campaign_tasks[campaign_id] = task
            except Exception as e:
                logger.error(f"Failed to spawn campaign task: {e}")
                raise

    @classmethod
    def pause(cls, campaign_id: int, db: Session):
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = "PAUSED"
            db.commit()
            if campaign_id in active_campaign_tasks:
                active_campaign_tasks[campaign_id].cancel()
                active_campaign_tasks.pop(campaign_id, None)

    @classmethod
    def resume(cls, campaign_id: int, db: Session):
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign and campaign.status in ["PAUSED", "DRAFT"]:
            campaign.status = "RUNNING"
            db.commit()
            cls.start(campaign_id)

    @classmethod
    def cancel(cls, campaign_id: int, db: Session):
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = "CANCELLED"
            db.commit()
            if campaign_id in active_campaign_tasks:
                active_campaign_tasks[campaign_id].cancel()
                active_campaign_tasks.pop(campaign_id, None)

campaign_runner = CampaignRunner()
