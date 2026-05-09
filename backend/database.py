from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings

_ssl = {"ssl": "require"} if "supabase" in settings.database_url else {}
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True, connect_args=_ssl)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
