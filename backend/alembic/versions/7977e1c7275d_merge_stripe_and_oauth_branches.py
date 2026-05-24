"""merge stripe and oauth branches

Revision ID: 7977e1c7275d
Revises: add_oauth_fields_001, add_stripe_001
Create Date: 2026-02-19 08:19:28.922882

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7977e1c7275d'
down_revision: Union[str, Sequence[str], None] = ('add_oauth_fields_001', 'add_stripe_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
