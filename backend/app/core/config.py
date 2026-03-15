import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")  # ← add default
SUPABASE_URL = os.getenv("SUPABASE_URL")             # ← add
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 