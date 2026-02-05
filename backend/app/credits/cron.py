"""Scheduled jobs for credits module."""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import async_session_maker
from app.credits.service import process_monthly_rollover

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


@scheduler.scheduled_job("cron", day=1, hour=0, minute=0, timezone="UTC")
async def monthly_rollover_job():
    """Run monthly rollover on 1st of each month at 00:00 UTC."""
    logger.info("Starting monthly rollover job")

    async with async_session_maker() as db:
        try:
            result = await process_monthly_rollover(db=db)
            await db.commit()

            logger.info(
                "Monthly rollover completed",
                extra={
                    "processed": result["processed"],
                    "total_deducted": result["total_deducted"],
                    "errors": result["errors"],
                },
            )
        except Exception as e:
            await db.rollback()
            logger.error(f"Monthly rollover failed: {e}")
            raise


def start_scheduler():
    """Start APScheduler."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Credits scheduler started")


def stop_scheduler():
    """Stop APScheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Credits scheduler stopped")
