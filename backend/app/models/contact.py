from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ContactTag(Base):
    __tablename__ = "contact_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    color = Column(String, default="#10b981")
    created_at = Column(DateTime, default=datetime.utcnow)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    city = Column(String, index=True, nullable=True)
    email = Column(String, nullable=True)
    tags = Column(JSON, default=list)  # list of tag names or IDs
    custom_fields = Column(JSON, default=dict)  # e.g. {"Product": "Sofa", "Discount": "20%"}
    opt_in_status = Column(String, default="OPTED_IN")  # OPTED_IN, OPTED_OUT, PENDING
    opt_in_source = Column(String, default="CSV_IMPORT")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
