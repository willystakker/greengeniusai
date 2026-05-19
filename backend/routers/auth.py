"""Auth router — signup, signin, JWT tokens."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production")
ALGORITHM = "HS256"


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    risk_profile: str = "moderate"


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup")
async def signup(req: SignupRequest):
    """Register new user. In production: save to Supabase, create Stripe customer, create Alpaca account."""
    # Validate password
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    hashed_pw = pwd_context.hash(req.password)

    # In production:
    # 1. Check if email exists in Supabase
    # 2. Create user row in Supabase
    # 3. Create Stripe customer
    # 4. Create Alpaca brokerage account via Broker API
    # 5. Send welcome email
    # 6. Return token

    user_id = f"user_{req.email.replace('@', '_').replace('.', '_')}"
    token = create_token(user_id)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "risk_profile": req.risk_profile,
            "bot_active": True,
            "subscription_status": "trialing",
            "trial_ends": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        },
    }


@router.post("/signin")
async def signin(req: SigninRequest):
    """Sign in existing user. In production: verify against Supabase."""
    # In production: look up user by email, verify password hash
    user_id = f"user_{req.email.replace('@', '_').replace('.', '_')}"
    token = create_token(user_id)
    return {
        "token": token,
        "user": {"id": user_id, "email": req.email, "bot_active": True},
    }
