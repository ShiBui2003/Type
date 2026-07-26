import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from routers import forms, public
from seed import seed_if_empty

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # No Alembic: a single create_all is enough for a schema that only
    # ever grows via this file, and is far simpler to explain.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(lifespan=lifespan)

# Origins come from an env var (never hardcoded) so the same code works
# unchanged against localhost in dev and the real Vercel domain in prod.
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(public.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
