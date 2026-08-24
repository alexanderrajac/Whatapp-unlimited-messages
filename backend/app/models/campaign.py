from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    status = Column(String, default="DRAFT", index=True)  # DRAFT, RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    min_delay = Column(Integer, default=3)
    max_delay = Column(Integer, default=6)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    message_body = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recipients = relationship("CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan")

class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), index=True, nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    name = Column(String, nullable=True)
    phone_number = Column(String, index=True, nullable=False)
    personalized_text = Column(Text, nullable=False)
    status = Column(String, default="PENDING", index=True)  # PENDING, SENT, FAILED, SKIPPED
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="recipients")
