from pydantic import BaseModel, ConfigDict


class FieldErrorDetail(BaseModel):
    field: str
    code: str
    message: str


class Envelope(BaseModel):
    status: str
    code: str
    message: str
    trace_id: str | None = None
    data: dict[str, object] | list[object] | None = None
    errors: list[FieldErrorDetail] | None = None

    model_config = ConfigDict(alias_generator=lambda s: s, populate_by_name=True)
