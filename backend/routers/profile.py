from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from core.auth import get_current_user, UserData
from core.db import get_auth_client

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    current_job: Optional[str] = None
    target_role: Optional[str] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

@router.get("/")
async def get_profile(current_user: UserData = Depends(get_current_user)):
    try:
        supabase = get_auth_client(current_user.token)
        response = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        
        if not response.data:
            # If profile doesn't exist, we can return an empty structure
            return {
                "id": current_user.id,
                "full_name": "",
                "bio": "",
                "current_job": "",
                "target_role": "",
                "skills": []
            }
            
        return response.data[0]
    except Exception as e:
        print(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/")
async def update_profile(profile: ProfileUpdate, current_user: UserData = Depends(get_current_user)):
    try:
        supabase = get_auth_client(current_user.token)
        
        # Clean up data to only include provided fields
        update_data = profile.dict(exclude_unset=True)
        
        if not update_data:
            return {"status": "success", "message": "No fields to update"}
            
        response = supabase.table("profiles").upsert(
            {"id": current_user.id, **update_data}
        ).execute()
        
        return {"status": "success", "data": response.data[0] if response.data else None}
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
