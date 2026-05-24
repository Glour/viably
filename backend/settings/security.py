"""Password hashing utilities using bcrypt and security validation."""

import bcrypt
from urllib.parse import urlparse

# Allowed domains for deployment URLs (SSRF prevention)
ALLOWED_DEPLOYMENT_DOMAINS = [
]


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password to hash.

    Returns:
        Hashed password string.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)  # Explicit work factor for security auditability
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.

    Args:
        plain_password: Plain text password to verify.
        hashed_password: Hashed password to compare against.

    Returns:
        True if password matches, False otherwise.
    """
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def validate_deployment_url(url: str) -> bool:
    """Validate deployment URL against allowed domains to prevent SSRF.

    Args:
        url: The URL to validate.

    Returns:
        True if URL is safe, False otherwise.

    Example:
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

    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http") or not parsed.hostname:
        return False

    hostname = parsed.hostname
    return any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in ALLOWED_DEPLOYMENT_DOMAINS
    )
