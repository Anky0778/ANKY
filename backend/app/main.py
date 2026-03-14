from fastapi import FastAPI
from app.api import auth
from app.core.database import Base, engine
from app.api import auth, projects, uploads
from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.training import router as training_router
app = FastAPI(title="Incident Intelligence API")


Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
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