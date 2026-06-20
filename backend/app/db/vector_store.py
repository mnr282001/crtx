from pinecone import Pinecone
from pinecone.exceptions import (
    ForbiddenException,
    NotFoundException,
    PineconeApiException,
    UnauthorizedException,
)
from fastapi import HTTPException
from app.config import (
    PINECONE_API_KEY,
    PINECONE_INDEX
)
from functools import lru_cache


@lru_cache
def get_index():
    if not PINECONE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="PINECONE_API_KEY is not configured."
        )

    if not PINECONE_INDEX:
        raise HTTPException(
            status_code=500,
            detail="PINECONE_INDEX is not configured."
        )

    pc = Pinecone(api_key=PINECONE_API_KEY)
    try:
        return pc.Index(PINECONE_INDEX)
    except NotFoundException as error:
        raise HTTPException(
            status_code=404,
            detail=(
                f'Pinecone index "{PINECONE_INDEX}" was not found. '
                "Create it in Pinecone or update PINECONE_INDEX in .env."
            )
        ) from error
    except UnauthorizedException as error:
        raise HTTPException(
            status_code=401,
            detail="Pinecone authentication failed. Check PINECONE_API_KEY."
        ) from error
    except ForbiddenException as error:
        raise HTTPException(
            status_code=403,
            detail=(
                "Pinecone API key does not have access to "
                f'the "{PINECONE_INDEX}" index.'
            )
        ) from error
    except PineconeApiException as error:
        raise HTTPException(
            status_code=502,
            detail="Pinecone request failed. Try again later."
        ) from error
