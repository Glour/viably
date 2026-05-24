"""Custom database column types."""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator


class JSONBType(TypeDecorator):
    """JSON type that uses JSONB for PostgreSQL and JSON for other databases.

    This allows SQLite compatibility for tests while using JSONB in production.
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        """Load appropriate JSON type based on database dialect."""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())
