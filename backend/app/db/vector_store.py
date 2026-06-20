from pinecone import Pinecone
from app.config import (
    PINECONE_API_KEY,
    PINECONE_INDEX
)
from functools import lru_cache


@lru_cache
def get_index():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    return pc.Index(PINECONE_INDEX)
