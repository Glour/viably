"""add stripe subscription fields to users

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-02-19 13:57:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'l2m3n4o5p6q7'
down_revision: Union[str, Sequence[str], None] = '7977e1c7275d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Stripe subscription fields to users table (idempotent — fields may already exist)."""
    conn = op.get_bind()
    # Use IF NOT EXISTS to handle case where add_stripe_001 already created these columns
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)"
    ))
    conn.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_stripe_customer_id ON users (stripe_customer_id)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ"
    ))
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false"
    ))


def downgrade() -> None:
    """Remove Stripe subscription fields from users table."""
    op.drop_column('users', 'subscription_cancel_at_period_end')
    op.drop_column('users', 'subscription_current_period_end')
    op.drop_column('users', 'subscription_status')
    op.drop_index('ix_users_stripe_customer_id', 'users')
    op.drop_column('users', 'stripe_customer_id')
