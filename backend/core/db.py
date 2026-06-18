from supabase import create_client, Client, ClientOptions
from core.config import settings

def get_auth_client(token: str) -> Client:
    """
    Creates a new Supabase client instance using the user's JWT token.
    This ensures that Row Level Security (RLS) is respected for all database operations.
    """
    options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY, options=options)
