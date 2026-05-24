"""Base HTTP client with retry logic for external services."""

import logging
from typing import Any, Optional

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from infrastructure.services.common.exceptions import (
    ExternalServiceError,
    ExternalServiceTimeout,
)

logger = logging.getLogger(__name__)


class BaseExternalClient:
    """Base HTTP client with retry logic and error handling.

    Features:
    - Automatic retry with exponential backoff
    - Timeout configuration
    - Request/response logging
    - Standardized error handling

    Example:
        class AnthropicClient(BaseExternalClient):
            def __init__(self, api_key: str):
                super().__init__(
                    base_url="https://api.anthropic.com",
                    headers={"x-api-key": api_key},
                    timeout=60.0
                )
    """

    def __init__(
        self,
        base_url: str,
        headers: Optional[dict[str, str]] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        service_name: str = "ExternalService",
    ):
        """Initialize client.

        Args:
            base_url: Base URL for the service
            headers: Default headers for all requests
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            service_name: Service name for logging and errors
        """
        self.base_url = base_url.rstrip('/')
        self.headers = headers or {}
        self.timeout = timeout
        self.max_retries = max_retries
        self.service_name = service_name

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.headers,
            timeout=self.timeout,
        )

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make HTTP request with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (relative to base_url)
            **kwargs: Additional arguments for httpx request

        Returns:
            HTTP response

        Raises:
            ExternalServiceTimeout: On timeout
            ExternalServiceError: On other errors
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        logger.debug(
            f"{self.service_name} request",
            extra={
                "method": method,
                "url": url,
                "service": self.service_name,
            },
        )

        try:
            response = await self._client.request(method, endpoint, **kwargs)
            response.raise_for_status()

            logger.debug(
                f"{self.service_name} response",
                extra={
                    "status_code": response.status_code,
                    "service": self.service_name,
                },
            )

            return response

        except httpx.TimeoutException as e:
            logger.error(
                f"{self.service_name} timeout",
                extra={"url": url, "service": self.service_name},
            )
            raise ExternalServiceTimeout(
                self.service_name,
                f"Request timed out after {self.timeout}s",
            ) from e

        except httpx.HTTPStatusError as e:
            logger.error(
                f"{self.service_name} HTTP error",
                extra={
                    "status_code": e.response.status_code,
                    "url": url,
                    "service": self.service_name,
                },
            )
            raise ExternalServiceError(
                self.service_name,
                f"HTTP {e.response.status_code}: {e.response.text}",
                status_code=e.response.status_code,
            ) from e

        except Exception as e:
            logger.error(
                f"{self.service_name} error",
                extra={"url": url, "service": self.service_name, "error": str(e)},
            )
            raise ExternalServiceError(
                self.service_name,
                str(e),
            ) from e

    async def get(self, endpoint: str, **kwargs: Any) -> httpx.Response:
        """Make GET request.

        Args:
            endpoint: API endpoint
            **kwargs: Additional arguments

        Returns:
            HTTP response
        """
        return await self._request("GET", endpoint, **kwargs)

    async def post(self, endpoint: str, **kwargs: Any) -> httpx.Response:
        """Make POST request.

        Args:
            endpoint: API endpoint
            **kwargs: Additional arguments

        Returns:
            HTTP response
        """
        return await self._request("POST", endpoint, **kwargs)

    async def put(self, endpoint: str, **kwargs: Any) -> httpx.Response:
        """Make PUT request.

        Args:
            endpoint: API endpoint
            **kwargs: Additional arguments

        Returns:
            HTTP response
        """
        return await self._request("PUT", endpoint, **kwargs)

    async def patch(self, endpoint: str, **kwargs: Any) -> httpx.Response:
        """Make PATCH request.

        Args:
            endpoint: API endpoint
            **kwargs: Additional arguments

        Returns:
            HTTP response
        """
        return await self._request("PATCH", endpoint, **kwargs)

    async def delete(self, endpoint: str, **kwargs: Any) -> httpx.Response:
        """Make DELETE request.

        Args:
            endpoint: API endpoint
            **kwargs: Additional arguments

        Returns:
            HTTP response
        """
        return await self._request("DELETE", endpoint, **kwargs)
