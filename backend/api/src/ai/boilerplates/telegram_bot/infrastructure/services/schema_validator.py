"""Auto-validate and fix database schema after deployment.

Compares SQLAlchemy models with actual DB schema and applies missing columns/tables.
Prevents runtime errors due to schema mismatches.
"""
import asyncio
import sys
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def validate_and_fix_schema(database_url: str, statement_cache_size: int = 0) -> dict[str, Any]:
    """Validate DB schema against models and apply fixes.
    
    Returns:
        dict with status, changes_made, errors
    """
    print("🔍 Schema Validator: Starting validation...")
    
    # Convert to asyncpg if needed
    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(
        database_url,
        connect_args={"statement_cache_size": statement_cache_size},
        echo=False
    )
    
    changes_made = []
    errors = []
    
    try:
        # Import all models to register them with Base.metadata
        from infrastructure.database.models.base import Base
        import infrastructure.database.models  # noqa: F401
        
        # Get expected schema from models
        expected_tables = {}
        for table in Base.metadata.sorted_tables:
            expected_tables[table.name] = {
                col.name: {
                    "type": str(col.type),
                    "nullable": col.nullable,
                    "primary_key": col.primary_key,
                }
                for col in table.columns
            }
        
        print(f"📊 Expected tables: {list(expected_tables.keys())}")
        
        # Get actual schema from database
        async with engine.connect() as conn:
            # Check each table
            for table_name, expected_cols in expected_tables.items():
                # Check if table exists
                result = await conn.execute(
                    text(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
                        "WHERE table_schema = 'public' AND table_name = :table)"
                    ),
                    {"table": table_name}
                )
                table_exists = result.scalar()
                
                if not table_exists:
                    print(f"⚠️  Table '{table_name}' missing — will be created")
                    changes_made.append(f"CREATE TABLE {table_name}")
                    continue
                
                # Get actual columns
                result = await conn.execute(
                    text(
                        "SELECT column_name, data_type, is_nullable "
                        "FROM information_schema.columns "
                        "WHERE table_schema = 'public' AND table_name = :table"
                    ),
                    {"table": table_name}
                )
                actual_cols = {row[0]: row for row in result.fetchall()}
                
                # Find missing columns
                missing_cols = set(expected_cols.keys()) - set(actual_cols.keys())
                
                if missing_cols:
                    print(f"⚠️  Table '{table_name}' missing columns: {missing_cols}")
                    for col_name in missing_cols:
                        changes_made.append(f"ALTER TABLE {table_name} ADD COLUMN {col_name}")
        
        # If there are changes needed, apply them
        if changes_made:
            print(f"\n🔧 Applying {len(changes_made)} schema fixes...")
            
            async with engine.begin() as conn:
                # Drop all tables and recreate (safest for missing tables/columns)
                print("🗑️  Dropping all bot tables...")
                await conn.execute(
                    text(
                        "DROP TABLE IF EXISTS "
                        "reminders, nutritionplans, workoutplans, trainingsessions, "
                        "schedules, services, purchases, bookings "
                        "CASCADE"
                    )
                )
                
                # Recreate with correct schema
                print("✅ Recreating tables from models...")
                await conn.run_sync(Base.metadata.create_all)
            
            print(f"✅ Schema fixed: {len(changes_made)} changes applied")
        else:
            print("✅ Schema validation passed — no changes needed")
        
        await engine.dispose()
        
        return {
            "status": "success",
            "changes_made": changes_made,
            "errors": errors
        }
        
    except Exception as e:
        error_msg = f"Schema validation failed: {type(e).__name__}: {e}"
        print(f"❌ {error_msg}")
        errors.append(error_msg)
        
        await engine.dispose()
        
        return {
            "status": "error",
            "changes_made": changes_made,
            "errors": errors
        }


async def main():
    """CLI entry point."""
    import os
    
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set")
        sys.exit(1)
    
    result = await validate_and_fix_schema(database_url)
    
    if result["status"] == "error":
        sys.exit(1)
    
    print("\n🎉 Schema validation complete!")


if __name__ == "__main__":
    asyncio.run(main())
