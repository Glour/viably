"""AI code generation module.

This module provides AI-powered code generation for Telegram bots
using Claude Sonnet 4 API.

Components:
- client.py: AnthropicClient wrapper for API calls
- prompts.py: Prompt building and code extraction
- service.py: AIGenerationService for generation workflow
- worker.py: Celery tasks for async processing
- routes.py: Admin API endpoints
- schemas.py: Pydantic response schemas
"""
