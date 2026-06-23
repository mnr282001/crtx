from contextlib import asynccontextmanager

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS, REDIS_URL
from app.routers import chat, collections, evals, ingest, query


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.arq_pool = await create_pool(RedisSettings.from_dsn(REDIS_URL))
    except Exception:
        app.state.arq_pool = None
    yield
    if app.state.arq_pool is not None:
        await app.state.arq_pool.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(collections.router, prefix="/collections")
app.include_router(ingest.router, prefix="/ingest")
app.include_router(query.router, prefix="/query")
app.include_router(chat.router, prefix="/chat")
app.include_router(evals.router, prefix="/evals")
