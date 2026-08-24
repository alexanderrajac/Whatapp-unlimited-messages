from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.models.template import Template
from app.services.template_service import template_service

router = APIRouter(prefix="/templates", tags=["Templates"])

class TemplateCreate(BaseModel):
    name: str
    category: Optional[str] = "MARKETING"
    body_text: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    body_text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

class PreviewRequest(BaseModel):
    body_text: str
    sample_contact: Optional[Dict[str, Any]] = None

@router.get("")
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).order_by(Template.id.desc()).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "body_text": t.body_text,
            "media_url": t.media_url,
            "media_type": t.media_type,
            "variables": t.variables or template_service.extract_variables(t.body_text),
            "created_at": t.created_at,
            "updated_at": t.updated_at
        }
        for t in templates
    ]

@router.post("")
def create_template(tmpl: TemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(Template).filter(Template.name == tmpl.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")

    vars_found = template_service.extract_variables(tmpl.body_text)
    new_t = Template(
        name=tmpl.name,
        category=tmpl.category or "MARKETING",
        body_text=tmpl.body_text,
        media_url=tmpl.media_url,
        media_type=tmpl.media_type,
        variables=vars_found
    )
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

@router.put("/{template_id}")
def update_template(template_id: int, updates: TemplateUpdate, db: Session = Depends(get_db)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    if updates.name is not None:
        t.name = updates.name
    if updates.category is not None:
        t.category = updates.category
    if updates.body_text is not None:
        t.body_text = updates.body_text
        t.variables = template_service.extract_variables(updates.body_text)
    if updates.media_url is not None:
        t.media_url = updates.media_url
    if updates.media_type is not None:
        t.media_type = updates.media_type

    db.commit()
    db.refresh(t)
    return t

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()
    return {"success": True, "message": "Template deleted"}

@router.post("/preview")
def preview_template(req: PreviewRequest):
    """Render a dynamic preview of how the message looks for a sample contact."""
    sample = req.sample_contact or {
        "name": "Rajesh Kumar",
        "phone_number": "919876543210",
        "city": "Mumbai",
        "custom_fields": {
            "Product": "Teak Wood Dining Table",
            "Discount": "15%",
            "OrderId": "CB-9942",
            "Price": "₹34,999"
        }
    }
    rendered = template_service.render_message(req.body_text, sample)
    variables = template_service.extract_variables(req.body_text)
    return {
        "rendered_message": rendered,
        "variables_found": variables,
        "sample_contact": sample
    }
