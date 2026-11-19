from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if user_in.role not in ["seller", "buyer", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be seller, buyer, or admin")

    user = models.User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit entry
    audit = models.AuditLog(
        user_id=user.id,
        action="USER_REGISTERED",
        target_type="User",
        target_id=user.id,
        details=f"User registered with role {user.role}"
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return schemas.Token(access_token=token, token_type="bearer", user=schemas.UserOut.model_validate(user))

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return schemas.Token(access_token=token, token_type="bearer", user=schemas.UserOut.model_validate(user))

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.model_validate(current_user)

@router.post("/demo-login", response_model=schemas.Token)
def demo_login(req: schemas.DemoLoginRequest, db: Session = Depends(get_db)):
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demo login is disabled in production")

    role = req.role.lower()
    if role not in ["seller", "buyer", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid demo role")

    demo_email = f"{role}@hi-in.demo"
    user = db.query(models.User).filter(models.User.email == demo_email).first()
    if not user:
        # Create on demand if not yet seeded
        user = models.User(
            email=demo_email,
            hashed_password=hash_password("demopass123"),
            full_name=f"Demo {role.capitalize()}",
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return schemas.Token(access_token=token, token_type="bearer", user=schemas.UserOut.model_validate(user))

