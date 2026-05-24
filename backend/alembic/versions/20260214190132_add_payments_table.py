"""Add payments table.

Revision ID: add_payments_001
Revises: 
Create Date: 2026-02-14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'add_payments_001'
down_revision = '02916d9de627'
branch_labels = ('payments',)
depends_on = None


def upgrade() -> None:
    op.create_table(
        'payments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('amount', sa.Float, nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending', index=True),
        sa.Column('plan', sa.String(20), nullable=False),
        sa.Column('yookassa_id', sa.String(255), nullable=True, unique=True, index=True),
        sa.Column('yookassa_confirmation_url', sa.String(1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('payments')
