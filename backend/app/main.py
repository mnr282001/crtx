from fastapi import FastAPI

from app.routers import (
    ingest,
    query
)

app = FastAPI()

app.include_router(
    ingest.router,
    prefix="/ingest"
)

app.include_router(
    query.router,
    prefix="/query"
)