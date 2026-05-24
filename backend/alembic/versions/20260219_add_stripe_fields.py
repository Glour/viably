"""Add Stripe support fields.

Revision ID: add_stripe_001
Revises: add_payments_001
Create Date: 2026-02-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = 'add_stripe_001'
down_revision = 'add_payments_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Stripe fields to payments table
    op.add_column('payments', sa.Column('provider', sa.String(20), nullable=False, server_default='yookassa'))
    op.add_column('payments', sa.Column('stripe_payment_intent_id', sa.String(255), nullable=True, index=True))
    op.add_column('payments', sa.Column('stripe_subscription_id', sa.String(255), nullable=True, index=True))
    op.add_column('payments', sa.Column('stripe_customer_id', sa.String(255), nullable=True, index=True))
    op.add_column('payments', sa.Column('extra_data', JSONB, nullable=True))
    
    # Add Stripe fields to users table
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True, index=True, unique=True))
    op.add_column('users', sa.Column('subscription_status', sa.String(20), nullable=False, server_default='inactive'))
    op.add_column('users', sa.Column('subscription_current_period_end', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('subscription_cancel_at_period_end', sa.Boolean, nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove Stripe fields from users
    op.drop_column('users', 'subscription_cancel_at_period_end')
    op.drop_column('users', 'subscription_current_period_end')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'stripe_customer_id')
    
    # Remove Stripe fields from payments
    op.drop_column('payments', 'extra_data')
    op.drop_column('payments', 'stripe_customer_id')
    op.drop_column('payments', 'stripe_subscription_id')
    op.drop_column('payments', 'stripe_payment_intent_id')
    op.drop_column('payments', 'provider')
