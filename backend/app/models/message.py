from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from datetime import datetime
from app.core.database import Base

class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True, index=True)
    phone_number = Column(String, index=True, nullable=False)
    contact_name = Column(String, nullable=True)
    message_text = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    direction = Column(String, default="OUTBOUND")  # OUTBOUND, INBOUND
    status = Column(String, default="SENT", index=True)  # PENDING, SENT, DELIVERED, READ, FAILED
    error_message = Column(Text, nullable=True)
    whatsapp_message_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
