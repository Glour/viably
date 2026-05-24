"""Auto-create database tables if they don't exist.

This script is injected into deployed bots to ensure tables exist
before the bot starts, even if Alembic migrations are missing.
"""
import asyncio
import os
import sys

async def create_tables_if_missing():
    """Create tables using SQLAlchemy metadata if they don't exist."""
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from infrastructure.database.models import Base
        
        db_url = os.environ.get("DATABASE_URL", "")
        if not db_url:
            print("WARNING: DATABASE_URL not set, skipping table creation")
            return
            
        # Convert postgresql:// to postgresql+asyncpg://
        if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        print(f"Checking/creating tables...")
        
        # For pgbouncer/pooler: disable statement cache
        engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        await engine.dispose()
        print("✅ Tables ready")
        
    except Exception as e:
        print(f"⚠️  Table creation skipped: {e}")
        # Don't fail deployment if this fails

if __name__ == "__main__":
    asyncio.run(create_tables_if_missing())
