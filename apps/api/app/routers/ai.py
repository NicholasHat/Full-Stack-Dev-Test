from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.schemas.ai_drafts import AiDraftResult
from app.services.ai_pipeline import validate_with_one_retry
from app.services.gemini import GeminiService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/voice-to-draft", response_model=AiDraftResult)
async def voice_to_draft(file: UploadFile = File(...)) -> AiDraftResult:
    data = await file.read()
    mime_type = file.content_type or "audio/webm"

    service = GeminiService()
    transcript = service.transcribe_audio(data=data, mime_type=mime_type)

    result = validate_with_one_retry(lambda _: service.draft_from_text(transcript))
    result.transcript = transcript
    return result


@router.post("/notes-image-to-draft", response_model=AiDraftResult)
async def notes_image_to_draft(file: UploadFile = File(...)) -> AiDraftResult:
    data = await file.read()
    mime_type = file.content_type or "image/jpeg"

    service = GeminiService()

    extracted_text_holder = {"value": ""}

    def _generator(_: int) -> dict:
        payload, extracted_text = service.draft_from_image(data=data, mime_type=mime_type)
        extracted_text_holder["value"] = extracted_text
        return payload

    result = validate_with_one_retry(_generator)
    result.extractedText = extracted_text_holder["value"]
    return result
