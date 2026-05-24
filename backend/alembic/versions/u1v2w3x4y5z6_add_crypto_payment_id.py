"""add crypto_payment_id to payments

Revision ID: u1v2w3x4y5z6
Revises: t0u1v2w3x4y5
Create Date: 2026-03-05 07:48:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'u1v2w3x4y5z6'
down_revision: Union[str, Sequence[str], None] = 't0u1v2w3x4y5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add crypto_payment_id column to payments table."""
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_payment_id VARCHAR(255)"
    ))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_payments_crypto_payment_id ON payments (crypto_payment_id)"
    ))


def downgrade() -> None:
    """Remove crypto_payment_id column from payments table."""
    op.drop_index('ix_payments_crypto_payment_id', 'payments')
    op.drop_column('payments', 'crypto_payment_id')
