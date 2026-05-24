"""Seed initial data after schema creation.

This script is called during deployment to populate the database
with initial data. It's idempotent — safe to run multiple times.
"""
import asyncio
import os
import sys

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker


async def seed_data(database_url: str) -> None:
    """Seed initial data if tables are empty."""
    print("🌱 Seed Data: Starting...")

    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(
        database_url,
        connect_args={"statement_cache_size": 0},
        echo=False,
    )

    try:
        # Import all models
        from infrastructure.database.models.base import Base
        import infrastructure.database.models  # noqa

        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        async with session_factory() as session:
            # Check if any non-system tables have data
            tables = [t for t in Base.metadata.sorted_tables if t.name != "alembic_version" and t.name != "users"]
            
            has_data = False
            for table in tables:
                try:
                    result = await session.execute(select(text("1")).select_from(table).limit(1))
                    if result.scalar_one_or_none():
                        has_data = True
                        break
                except Exception:
                    continue

            if has_data:
                print("✅ Data already exists — skipping seed")
                await engine.dispose()
                return

            # Try to import and run project-specific seed function
            try:
                from infrastructure.services._seed_impl import run_seed
                await run_seed(session)
                await session.commit()
                print("✅ Seed data inserted successfully")
            except ImportError:
                print("ℹ️ No _seed_impl found — skipping custom seed")
            except Exception as e:
                print(f"⚠️ Seed failed: {e}")
                await session.rollback()

    except Exception as e:
        print(f"❌ Seed error: {e}")
    finally:
        await engine.dispose()


async def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set — skipping seed")
        sys.exit(0)  # Don't fail deployment
    await seed_data(database_url)


if __name__ == "__main__":
    asyncio.run(main())
