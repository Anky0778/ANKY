from fastapi import FastAPI
from app.api import auth, projects, uploads
from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router
from app.api.training import router as training_router
from app.core.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Incident Intelligence API")

try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
except Exception as e:
    print(f"⚠️ Could not connect to database on startup: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(uploads.router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(training_router)