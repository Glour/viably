"""merge conversation and template migrations

Revision ID: 02916d9de627
Revises: f0bc0f102528, k1l2m3n4o5p6
Create Date: 2026-02-09 19:45:30.621570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02916d9de627'
down_revision: Union[str, Sequence[str], None] = ('f0bc0f102528', 'k1l2m3n4o5p6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
