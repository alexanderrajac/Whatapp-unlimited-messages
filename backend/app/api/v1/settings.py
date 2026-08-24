from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
from app.core.database import get_db
from app.models.settings import AppSetting
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    min_delay_seconds: Optional[int] = None
    max_delay_seconds: Optional[int] = None
    default_country_code: Optional[str] = None
    auto_save_contacts: Optional[bool] = None

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    db_settings = {s.key: s.value for s in db.query(AppSetting).all()}
    
    return {
        "min_delay_seconds": int(db_settings.get("min_delay_seconds", settings.DEFAULT_MIN_DELAY_SECONDS)),
        "max_delay_seconds": int(db_settings.get("max_delay_seconds", settings.DEFAULT_MAX_DELAY_SECONDS)),
        "default_country_code": db_settings.get("default_country_code", settings.DEFAULT_COUNTRY_CODE),
        "auto_save_contacts": db_settings.get("auto_save_contacts", "true").lower() == "true",
        "whatsapp_gateway_url": settings.WHATSAPP_GATEWAY_URL
    }

@router.post("")
def update_settings(updates: SettingsUpdate, db: Session = Depends(get_db)):
    def set_val(k, v):
        item = db.query(AppSetting).filter(AppSetting.key == k).first()
        if not item:
            item = AppSetting(key=k, value=str(v))
            db.add(item)
        else:
            item.value = str(v)

    if updates.min_delay_seconds is not None:
        set_val("min_delay_seconds", updates.min_delay_seconds)
    if updates.max_delay_seconds is not None:
        set_val("max_delay_seconds", updates.max_delay_seconds)
    if updates.default_country_code is not None:
        set_val("default_country_code", updates.default_country_code)
    if updates.auto_save_contacts is not None:
        set_val("auto_save_contacts", "true" if updates.auto_save_contacts else "false")

    db.commit()
    return get_settings(db)
