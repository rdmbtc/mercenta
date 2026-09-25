from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class FieldError:
    """Describes a single field-level validation error."""

    field: str
    code: str
    message: str


@dataclass
class ApiError(Exception):
    """Raised when the API returns an error response."""

    code: str
    message: str
    trace_id: str
    status_code: int
    errors: list[FieldError] = field(default_factory=list)

    def __str__(self) -> str:
        parts = [f"[{self.code}] {self.message} (trace_id={self.trace_id})"]
        for err in self.errors:
            parts.append(f"  - {err.field}: {err.code} — {err.message}")
        return "\n".join(parts)
