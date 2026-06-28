from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.health import router as health_router
from app.api.v1.inquiries import router as inquiries_router
from app.api.v1.listings import router as listings_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.reference import router as reference_router
from app.api.v1.saved import router as saved_router

router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(auth_router, tags=["auth"])
router.include_router(admin_router, tags=["admin"])
router.include_router(reference_router, tags=["reference"])
router.include_router(listings_router, tags=["listings"])
router.include_router(reviews_router, tags=["reviews"])
router.include_router(saved_router, tags=["saved"])
router.include_router(inquiries_router, tags=["inquiries"])
