from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.models.contact import Contact, ContactTag
from app.services.csv_service import csv_service

router = APIRouter(prefix="/contacts", tags=["Contacts"])

class ContactCreate(BaseModel):
    name: Optional[str] = None
    phone_number: str
    city: Optional[str] = None
    email: Optional[str] = None
    tags: Optional[List[str]] = []
    custom_fields: Optional[Dict[str, Any]] = {}
    opt_in_status: Optional[str] = "OPTED_IN"

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    email: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    opt_in_status: Optional[str] = None

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#10b981"

class ImportBulkRequest(BaseModel):
    contacts: List[Dict[str, Any]]
    tags: Optional[List[str]] = []

@router.get("")
def list_contacts(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    city: Optional[str] = None,
    opt_in: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Contact)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Contact.name.ilike(search_pattern)) | 
            (Contact.phone_number.ilike(search_pattern)) |
            (Contact.city.ilike(search_pattern))
        )
    if city:
        query = query.filter(Contact.city.ilike(f"%{city}%"))
    if opt_in:
        query = query.filter(Contact.opt_in_status == opt_in)
    
    total = query.count()
    contacts = query.order_by(Contact.id.desc()).offset(skip).limit(limit).all()

    # Filter by tag in python if requested (JSON list)
    if tag:
        contacts = [c for c in contacts if tag in (c.tags or [])]

    return {
        "total": total,
        "contacts": [
            {
                "id": c.id,
                "name": c.name,
                "phone_number": c.phone_number,
                "city": c.city,
                "email": c.email,
                "tags": c.tags or [],
                "custom_fields": c.custom_fields or {},
                "opt_in_status": c.opt_in_status,
                "created_at": c.created_at
            }
            for c in contacts
        ]
    }

@router.post("")
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    cleaned_phone = csv_service.normalize_phone(contact.phone_number)
    if not cleaned_phone:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    existing = db.query(Contact).filter(Contact.phone_number == cleaned_phone).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Contact with phone {cleaned_phone} already exists")

    new_contact = Contact(
        name=contact.name,
        phone_number=cleaned_phone,
        city=contact.city,
        email=contact.email,
        tags=contact.tags or [],
        custom_fields=contact.custom_fields or {},
        opt_in_status=contact.opt_in_status or "OPTED_IN"
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.put("/{contact_id}")
def update_contact(contact_id: int, updates: ContactUpdate, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    if updates.phone_number is not None:
        cleaned_phone = csv_service.normalize_phone(updates.phone_number)
        if not cleaned_phone:
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        contact.phone_number = cleaned_phone

    if updates.name is not None:
        contact.name = updates.name
    if updates.city is not None:
        contact.city = updates.city
    if updates.email is not None:
        contact.email = updates.email
    if updates.tags is not None:
        contact.tags = updates.tags
    if updates.custom_fields is not None:
        contact.custom_fields = updates.custom_fields
    if updates.opt_in_status is not None:
        contact.opt_in_status = updates.opt_in_status

    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"success": True, "message": "Contact deleted"}

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload CSV or Excel file, auto-detect columns, and return mapped records for preview.
    Does not save to DB until user confirms import or launches campaign.
    """
    content = await file.read()
    try:
        records, columns, mapping = csv_service.parse_file(content, file.filename)
        return {
            "success": True,
            "filename": file.filename,
            "total_rows": len(records),
            "columns": columns,
            "mapping": mapping,
            "sample_contacts": records[:50],  # preview first 50
            "all_contacts": records
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import-bulk")
def import_bulk_contacts(req: ImportBulkRequest, db: Session = Depends(get_db)):
    """Save imported CSV contacts into database with deduplication."""
    inserted = 0
    updated = 0

    for item in req.contacts:
        phone = item.get("phone_number")
        if not phone:
            continue
        
        existing = db.query(Contact).filter(Contact.phone_number == phone).first()
        merged_tags = list(set((existing.tags if existing and existing.tags else []) + (item.get("tags") or []) + req.tags))
        
        if existing:
            if item.get("name"):
                existing.name = item.get("name")
            if item.get("city"):
                existing.city = item.get("city")
            if item.get("email"):
                existing.email = item.get("email")
            existing.tags = merged_tags
            existing.custom_fields = {**(existing.custom_fields or {}), **(item.get("custom_fields") or {})}
            updated += 1
        else:
            new_c = Contact(
                name=item.get("name", ""),
                phone_number=phone,
                city=item.get("city", ""),
                email=item.get("email", ""),
                tags=merged_tags,
                custom_fields=item.get("custom_fields", {}),
                opt_in_status="OPTED_IN"
            )
            db.add(new_c)
            inserted += 1

    db.commit()
    return {
        "success": True,
        "inserted": inserted,
        "updated": updated,
        "total": inserted + updated
    }

@router.get("/tags")
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(ContactTag).all()
    return tags

@router.post("/tags")
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    existing = db.query(ContactTag).filter(ContactTag.name == tag.name).first()
    if existing:
        return existing
    new_tag = ContactTag(name=tag.name, color=tag.color or "#10b981")
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag
