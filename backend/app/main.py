import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth,
    properties,
    enquiries,
    wishlists,
    admin,
    intelligence,
    geocoding,
    routing,
    uploads,
    feature_intelligence
)

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

# Seed demonstration data if configured
db = SessionLocal()
try:
    if settings.DEMO_MODE:
        seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="HI IN Property Directory — Phase 2 Location Intelligence API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folders
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount assets directory from workspace root if present
root_assets = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "assets")
if os.path.exists(root_assets):
    app.mount("/assets", StaticFiles(directory=root_assets), name="assets")

# Include Routers with API prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(properties.router, prefix=settings.API_V1_PREFIX)
app.include_router(enquiries.router, prefix=settings.API_V1_PREFIX)
app.include_router(wishlists.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(intelligence.router, prefix=settings.API_V1_PREFIX)
app.include_router(geocoding.router, prefix=settings.API_V1_PREFIX)
app.include_router(routing.router, prefix=settings.API_V1_PREFIX)
app.include_router(uploads.router, prefix=settings.API_V1_PREFIX)
app.include_router(feature_intelligence.router, prefix=settings.API_V1_PREFIX)
app.include_router(feature_intelligence.router, prefix="/api/v1")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "phase": "Phase 2: Real Location Intelligence",
        "demo_mode": settings.DEMO_MODE
    }

