import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# DB_PATH defaults to a relative file for local dev. In production this is
# set to a path on Railway's mounted volume (e.g. /data/app.db) so the
# database survives restarts instead of living on the ephemeral container
# filesystem.
DB_PATH = os.environ.get("DB_PATH", "./app.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False: FastAPI runs sync route handlers in a thread
# pool, but a single SQLite connection is otherwise pinned to the thread
# that created it.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
