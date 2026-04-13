from __future__ import annotations

from typing import Any, Callable

from pydantic import ValidationError

from app.schemas.ai_drafts import AiDraftResult, EstimateDraftInput, empty_draft_payload

'''
This module contains the core logic for the AI pipeline, 
specifically the function to validate the AI-generated draft with one retry.
'''

def validate_with_one_retry(generator: Callable[[int], dict[str, Any]]) -> AiDraftResult:
    validation_errors: list[str] = []

    for attempt in range(2):
        payload = generator(attempt)
        try:
            draft = EstimateDraftInput.model_validate(payload)
            return AiDraftResult(
                draft=draft,
                retriesUsed=1 if attempt == 1 else 0,
                fallbackToEmptyDraft=False,
                validationErrors=validation_errors,
            )
        except ValidationError as exc:
            validation_errors.append(str(exc))

    return AiDraftResult(
        draft=empty_draft_payload(),
        retriesUsed=1,
        fallbackToEmptyDraft=True,
        validationErrors=validation_errors,
    )
