"""Add daily_bonuses table and related_user_id column

Revision ID: b2c3d4e5f6g7
Revises: 4064d14c6ac4
Create Date: 2026-02-05 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = '4064d14c6ac4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add related_user_id column to credit_transactions
    op.add_column(
        'credit_transactions',
        sa.Column('related_user_id', sa.UUID(), nullable=True)
    )
    op.create_foreign_key(
        'fk_credit_transactions_related_user',
        'credit_transactions',
        'users',
        ['related_user_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add extra_data column to credit_transactions
    op.add_column(
        'credit_transactions',
        sa.Column('extra_data', sa.JSON(), nullable=True, server_default='{}')
    )

    # Add index on transaction_type for filtering
    op.create_index(
        'ix_credit_transactions_type',
        'credit_transactions',
        ['transaction_type'],
        unique=False
    )

    # Create daily_bonuses table
    op.create_table(
        'daily_bonuses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('credits_awarded', sa.Integer(), nullable=False),
        sa.Column('bonus_date', sa.Date(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=True,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'bonus_date', name='unique_daily_bonus')
    )
    op.create_index('ix_daily_bonuses_user_id', 'daily_bonuses', ['user_id'], unique=False)
    op.create_index('ix_daily_bonuses_bonus_date', 'daily_bonuses', ['bonus_date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop daily_bonuses table
    op.drop_index('ix_daily_bonuses_bonus_date', table_name='daily_bonuses')
    op.drop_index('ix_daily_bonuses_user_id', table_name='daily_bonuses')
    op.drop_table('daily_bonuses')

    # Drop index on transaction_type
    op.drop_index('ix_credit_transactions_type', table_name='credit_transactions')

    # Drop extra_data column
    op.drop_column('credit_transactions', 'extra_data')

    # Drop related_user_id column
    op.drop_constraint(
        'fk_credit_transactions_related_user',
        'credit_transactions', type_='foreignkey',
    )
    op.drop_column('credit_transactions', 'related_user_id')
