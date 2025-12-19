"""
Database connection and session management for the Performance Predictor service.

Uses SQLAlchemy async for PostgreSQL connections with connection pooling.
"""

import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase

from ..config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Enable connection health checks
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """
    Initialize the database by creating all tables.

    Should be called on application startup.
    """
    try:
        async with engine.begin() as conn:
            # Import models to ensure they're registered
            from .db_models import (
                PredictionOutcome,
                RecommendationEffectiveness,
                CreatorBaseline,
                PlatformBenchmark,
            )
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}", exc_info=True)
        raise


async def close_db() -> None:
    """
    Close database connections.

    Should be called on application shutdown.
    """
    await engine.dispose()
    logger.info("Database connections closed")


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get a database session as a context manager.

    Usage:
        async with get_session() as session:
            # use session
    """
    session = async_session_maker()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Database session error: {str(e)}", exc_info=True)
        raise
    finally:
        await session.close()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency injection for FastAPI endpoints.

    Usage:
        @app.get("/endpoint")
        async def endpoint(session: AsyncSession = Depends(get_db_session)):
            # use session
    """
    async with get_session() as session:
        yield session
