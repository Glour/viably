"""Fallback HTML email templates when Node.js rendering is unavailable.

These templates provide basic HTML email functionality without requiring
React Email rendering. They maintain similar structure and styling to the
React Email templates but are simpler static HTML templates.

Usage:
    When EmailTemplateRenderer fails to render via Node.js, these fallback
    templates are used to ensure emails can still be sent.
"""

from typing import Any


def render_welcome_fallback(props: dict[str, Any]) -> str:
    """Render welcome email using simple HTML template.

    Args:
        props: Template props (userName, userEmail, credits, dashboardUrl).

    Returns:
        HTML string.
    """
    user_name = props.get("userName", "User")
    credits = props.get("credits", 100)
    dashboard_url = props.get("dashboardUrl", "https://viably.dev/dashboard")

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Viably</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e6ebf1;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #7C3AED; padding: 32px 20px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Viably</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="color: #1a1a1a; font-size: 28px; margin: 0 0 16px; text-align: center;">
                                Welcome to Viably, {user_name}! 🎉
                            </h2>
                            <p style="color: #404040; font-size: 18px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
                                You're all set! Your account is ready, and we're excited to help you create amazing educational content with AI.
                            </p>
                            <!-- Credits Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4ff; border: 2px solid #7C3AED; border-radius: 12px; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 32px 24px; text-align: center;">
                                        <p style="color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 8px;">Your Starting Credits</p>
                                        <p style="color: #7C3AED; font-size: 56px; font-weight: 700; margin: 0 0 12px;">{credits}</p>
                                        <p style="color: #6b7280; font-size: 15px; margin: 0;">Use credits to generate courses, lessons, and deploy your content.</p>
                                    </td>
                                </tr>
                            </table>
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 24px 0;">
                                        <a href="{dashboard_url}" style="background-color: #7C3AED; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                            Go to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; border-top: 1px solid #e6ebf1;">
                            <p style="color: #8898aa; font-size: 14px; text-align: center; margin: 0;">
                                © 2024 Viably. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def render_generation_complete_fallback(props: dict[str, Any]) -> str:
    """Render generation complete email using simple HTML template."""
    user_name = props.get("userName", "User")
    project_name = props.get("projectName", "Your Project")
    project_url = props.get("projectUrl", "#")
    credits_used = props.get("creditsUsed", 10)
    credits_remaining = props.get("creditsRemaining", 0)

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generation Complete</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                    <tr>
                        <td style="padding: 40px 32px; text-align: center;">
                            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0 0 16px;">
                                Your bot is ready, {user_name}! 🎉
                            </h1>
                            <p style="color: #404040; font-size: 16px; margin: 0 0 24px;">
                                Great news! Your project "{project_name}" has been successfully generated.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">Credits Used: <strong>{credits_used}</strong></p>
                                        <p style="color: #6b7280; font-size: 12px; margin: 0;">Remaining: <strong>{credits_remaining}</strong></p>
                                    </td>
                                </tr>
                            </table>
                            <a href="{project_url}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
                                View Project
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def render_deploy_success_fallback(props: dict[str, Any]) -> str:
    """Render deploy success email using simple HTML template."""
    user_name = props.get("userName", "User")
    project_name = props.get("projectName", "Your Bot")
    deployment_url = props.get("deploymentUrl", "#")
    platform = props.get("platform", "Railway")

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Success</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                    <tr>
                        <td style="padding: 40px 32px; text-align: center; background-color: #f0fdf4;">
                            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0 0 8px;">Your Bot is Live! 🎉</h1>
                            <p style="color: #404040; font-size: 16px; margin: 0;">
                                Congratulations! "{project_name}" has been successfully deployed to {platform}.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Deployment URL</p>
                                        <p style="color: #3b82f6; font-size: 14px; font-family: monospace; word-break: break-all; margin: 0;">
                                            {deployment_url}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 24px 0;">
                                        <a href="{deployment_url}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
                                            View Live Bot
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def render_low_credits_fallback(props: dict[str, Any]) -> str:
    """Render low credits warning email using simple HTML template."""
    user_name = props.get("userName", "User")
    current_credits = props.get("currentCredits", 15)
    threshold = props.get("threshold", 20)
    buy_credits_url = props.get("buyCreditsUrl", "#")

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Low Credits Warning</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                    <tr>
                        <td style="padding: 32px; text-align: center; background-color: #fef3c7;">
                            <p style="font-size: 48px; margin: 0 0 16px;">⚠️</p>
                            <h1 style="color: #92400e; font-size: 28px; margin: 0 0 12px;">Low Credits Warning</h1>
                            <p style="color: #78350f; font-size: 18px; margin: 0;">
                                Hi {user_name}, your credit balance is running low.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 2px solid #fbbf24; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 24px; text-align: center;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Current Balance</p>
                                        <p style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 0;">{current_credits} credits</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #404040; font-size: 16px; text-align: center; margin: 24px 0;">
                                You're running low on credits! Once your balance reaches zero, you won't be able to generate new projects.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{buy_credits_url}" style="background-color: #7C3AED; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                            Buy Credits Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


# Template mapping
FALLBACK_TEMPLATES = {
    "welcome": render_welcome_fallback,
    "generation-complete": render_generation_complete_fallback,
    "deploy-success": render_deploy_success_fallback,
    "low-credits": render_low_credits_fallback,
}


def render_fallback_template(template_name: str, props: dict[str, Any]) -> str:
    """Render fallback HTML template.

    Args:
        template_name: Template name.
        props: Template props.

    Returns:
        HTML string.

    Raises:
        KeyError: If template not found.
    """
    renderer = FALLBACK_TEMPLATES.get(template_name)
    if not renderer:
        raise KeyError(
            f"Fallback template '{template_name}' not found. "
            f"Available: {', '.join(FALLBACK_TEMPLATES.keys())}"
        )

    return renderer(props)
