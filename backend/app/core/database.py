from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL
from sqlalchemy.pool import NullPool
# pg_bouncer=true is required for Supabase transaction pooler
# check_same_thread is not needed for postgres, pool_pre_ping handles drops
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"},
    poolclass=NullPool
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()