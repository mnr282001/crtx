from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import (
    LOCAL_API_URL
)

from app.routers import (
    chat,
    collections,
    ingest,
    query
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[LOCAL_API_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    collections.router,
    prefix="/collections"
)

app.include_router(
    ingest.router,
    prefix="/ingest"
)

app.include_router(
    query.router,
    prefix="/query"
)

app.include_router(
    chat.router,
    prefix="/chat"
)