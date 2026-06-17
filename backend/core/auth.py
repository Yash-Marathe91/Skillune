from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from pydantic import BaseModel
from core.config import settings

security = HTTPBearer()

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class UserData(BaseModel):
    id: str
    email: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserData:
    """
    Validates the Supabase JWT token passed in the Authorization header.
    Returns the user data if valid, otherwise raises a 401.
    """
    token = credentials.credentials
    try:
        # Verify token using Supabase client
        # In a production environment with heavy traffic, you'd decode the JWT locally using `python-jose`
        # and the Supabase JWT secret. But calling getUser() ensures the user wasn't deleted/disabled.
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise ValueError("No user found")
            
        return UserData(
            id=user_response.user.id,
            email=user_response.user.email
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
