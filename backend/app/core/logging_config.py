"""Structured logging configuration using structlog."""

import logging
import sys

import structlog

from app.core.config import settings


def setup_logging() -> None:
    """Configure structlog for structured logging.

    Uses JSON output in production (LOG_FORMAT="json") and colored
    console output in development (LOG_FORMAT="console").

    Integrates with stdlib logging so third-party libraries also
    produce structured log output. Supports request_id binding
    via structlog.contextvars for per-request correlation.
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Shared processors for all output modes
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.LOG_FORMAT == "json":
        # Production: JSON output
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        # Development: colored console output
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure stdlib logging to use structlog formatting
    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    # Reduce noise from third-party loggers
    for noisy_logger in ("uvicorn.access", "httpcore", "httpx"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)
