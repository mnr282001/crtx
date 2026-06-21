from arq.connections import RedisSettings

from app.config import REDIS_URL
from app.jobs.ingest_job import ingest_document


class WorkerSettings:
    functions = [ingest_document]
    redis_settings = RedisSettings.from_dsn(REDIS_URL)
    max_jobs = 10
    job_timeout = 600  # 10 minutes per job
