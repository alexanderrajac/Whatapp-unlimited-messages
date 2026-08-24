from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models import Contact, ContactTag, Template, Campaign, CampaignRecipient, MessageLog, AppSetting
from app.api.v1 import contacts, templates, campaigns, messages, analytics, settings as settings_api, whatsapp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Initialize database schema
Base.metadata.create_all(bind=engine)

def seed_initial_data():
    db = SessionLocal()
    try:
        # Seed default tags
        if db.query(ContactTag).count() == 0:
            default_tags = [
                ContactTag(name="VIP Customer", color="#10b981"),
                ContactTag(name="Wholesale", color="#3b82f6"),
                ContactTag(name="Retail", color="#f59e0b"),
                ContactTag(name="Follow Up", color="#ec4899"),
                ContactTag(name="New Lead", color="#8b5cf6")
            ]
            db.add_all(default_tags)
            db.commit()

        # Seed default templates
        if db.query(Template).count() == 0:
            default_templates = [
                Template(
                    name="Exclusive Product Offer",
                    category="MARKETING",
                    body_text="Hello {{Name}}! 👋\n\nExclusive offer from CarpenterBullet! Get an additional {{Discount}} off on {{Product}} today.\n\n📍 Delivery available in {{City}}.\n\nReply 'YES' or visit our store to claim your deal! ✨",
                    variables=["Name", "Discount", "Product", "City"]
                ),
                Template(
                    name="Order Ready for Dispatch",
                    category="UTILITY",
                    body_text="Hi {{Name}},\n\nYour order for {{Product}} is packed and ready for dispatch to {{City}}! 📦\n\nOur team will contact you shortly before delivery.\n\nThank you for choosing CarpenterBullet! 🛠️",
                    variables=["Name", "Product", "City"]
                ),
                Template(
                    name="Festival Greeting & Voucher",
                    category="MARKETING",
                    body_text="Greetings {{Name}}! 🌟\n\nWishing you and your family a fantastic festive season. Here is a special {{Discount}} voucher on your next purchase of {{Product}}.\n\nValid across all {{City}} stores!",
                    variables=["Name", "Discount", "Product", "City"]
                )
            ]
            db.add_all(default_templates)
            db.commit()
    except Exception as e:
        logger.error(f"Error seeding initial data: {e}")
    finally:
        db.close()

seed_initial_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(whatsapp.router, prefix=settings.API_V1_STR)
app.include_router(contacts.router, prefix=settings.API_V1_STR)
app.include_router(templates.router, prefix=settings.API_V1_STR)
app.include_router(campaigns.router, prefix=settings.API_V1_STR)
app.include_router(messages.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
