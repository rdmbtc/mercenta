class AppRouteError(Exception):
    """Base exception for all AppRoute SDK errors."""


class NetworkError(AppRouteError):
    """Raised on connection or timeout errors."""
