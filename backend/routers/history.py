from fastapi import APIRouter, HTTPException, Depends
from core.auth import get_current_user, UserData
from core.db import get_auth_client

router = APIRouter()

@router.get("/")
async def get_history(current_user: UserData = Depends(get_current_user)):
    try:
        supabase = get_auth_client(current_user.token)
        
        # Fetch Interviews
        interviews_res = supabase.table("interviews").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        
        # Fetch Roadmaps
        roadmaps_res = supabase.table("roadmaps").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        
        return {
            "status": "success",
            "data": {
                "interviews": interviews_res.data if interviews_res.data else [],
                "roadmaps": roadmaps_res.data if roadmaps_res.data else []
            }
        }
    except Exception as e:
        print(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
