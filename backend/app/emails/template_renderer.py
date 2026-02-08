"""React Email template renderer for Python backend.

This module provides functionality to render React Email templates
from the frontend/emails directory into HTML strings that can be
sent via the EmailService.

Architecture:
    - React Email templates are in frontend/emails/
    - Python backend calls Node.js to render templates
    - Rendered HTML is passed to EmailService for sending

Usage:
    renderer = EmailTemplateRenderer()
    html = await renderer.render_template(
        'welcome',
        {'userName': 'Alex', 'credits': 100}
    )
"""

import asyncio
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.emails.template_fallback import render_fallback_template

logger = logging.getLogger(__name__)


class EmailTemplateRenderer:
    """Renders React Email templates to HTML using Node.js."""

    def __init__(self):
        """Initialize the template renderer.

        Determines paths to frontend emails directory and render script.
        """
        # Find backend directory (current file is in backend/app/emails/)
        backend_dir = Path(__file__).parent.parent.parent

        # Frontend is sibling to backend
        self.frontend_dir = backend_dir.parent / "frontend"
        self.emails_dir = self.frontend_dir / "emails"
        self.render_script = backend_dir / "scripts" / "render_email.js"

        # Validate paths
        if not self.emails_dir.exists():
            logger.warning(
                "Frontend emails directory not found",
                extra={"path": str(self.emails_dir)},
            )

    async def render_template(
        self,
        template_name: str,
        props: dict[str, Any],
    ) -> str:
        """Render a React Email template to HTML.

        Args:
            template_name: Template name (e.g., 'welcome', 'generation-complete').
            props: Template props as dictionary.

        Returns:
            Rendered HTML string.

        Raises:
            RuntimeError: If rendering fails (script error, missing template, etc.).
        """
        # Validate template exists
        template_file = self.emails_dir / f"{template_name}.tsx"
        if not template_file.exists():
            raise RuntimeError(
                f"Email template not found: {template_name}.tsx"
            )

        # Ensure render script exists
        if not self.render_script.exists():
            raise RuntimeError(
                f"Render script not found: {self.render_script}"
            )

        try:
            # Prepare command
            # Node.js script will be: node scripts/render_email.js <template> <props_json>
            props_json = json.dumps(props)

            cmd = [
                "node",
                str(self.render_script),
                template_name,
                props_json,
            ]

            logger.info(
                "Rendering email template",
                extra={
                    "template": template_name,
                    "props_keys": list(props.keys()),
                },
            )

            # Run Node.js subprocess asynchronously
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.frontend_dir),
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode().strip()
                logger.error(
                    "Email template rendering failed",
                    extra={
                        "template": template_name,
                        "return_code": process.returncode,
                        "error": error_msg,
                    },
                )
                raise RuntimeError(
                    f"Template rendering failed: {error_msg}"
                )

            html = stdout.decode().strip()

            logger.info(
                "Email template rendered successfully",
                extra={
                    "template": template_name,
                    "html_length": len(html),
                },
            )

            return html

        except subprocess.SubprocessError as e:
            logger.warning(
                "Node.js render script failed, using fallback HTML template",
                extra={
                    "template": template_name,
                    "error": str(e),
                },
            )
            # Use fallback template instead of failing
            try:
                return render_fallback_template(template_name, props)
            except KeyError:
                raise RuntimeError(
                    f"Template '{template_name}' not found in React Email or fallback templates"
                )
        except Exception as e:
            logger.warning(
                "Template rendering error, attempting fallback",
                extra={
                    "template": template_name,
                    "error": str(e),
                },
            )
            # Attempt fallback on any error
            try:
                return render_fallback_template(template_name, props)
            except KeyError:
                raise RuntimeError(f"Failed to render template: {e}")

    def get_available_templates(self) -> list[str]:
        """Get list of available email templates.

        Returns:
            List of template names (without .tsx extension).
        """
        if not self.emails_dir.exists():
            return []

        templates = []
        for file in self.emails_dir.glob("*.tsx"):
            # Exclude preview files
            if not file.name.endswith(".preview.tsx"):
                templates.append(file.stem)

        return sorted(templates)
