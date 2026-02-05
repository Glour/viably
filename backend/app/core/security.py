"""Security utility functions for SSRF prevention and URL validation."""

# Allowed domains for deployment URLs (SSRF prevention)
ALLOWED_DEPLOYMENT_DOMAINS = [
    "railway.app",
    "up.railway.app",
    "railway.internal",
]


def validate_deployment_url(url: str) -> bool:
    """Validate deployment URL against allowed domains to prevent SSRF.

    Args:
        url: The URL to validate.

    Returns:
        True if URL is safe, False otherwise.

    Example:
        >>> validate_deployment_url("https://myapp.up.railway.app")
        True
        >>> validate_deployment_url("https://evil.com")
        False
        >>> validate_deployment_url("")
        False

    Note:
        This prevents Server-Side Request Forgery (SSRF) attacks by
        ensuring URLs only point to trusted deployment domains.
    """
    if not url:
        return False

    # Check if URL contains any allowed domain
    return any(domain in url for domain in ALLOWED_DEPLOYMENT_DOMAINS)
