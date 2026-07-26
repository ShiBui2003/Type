from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Answer, Form, FormStatus, Response
from schemas import (
    PublicFormOut,
    PublicOptionOut,
    PublicQuestionOut,
    PublicSubmitIn,
    PublicSubmitOut,
)
from validation import answer_fields, validate_answer

router = APIRouter(prefix="/api/public")


def _get_published_form_or_404(db: Session, slug: str) -> Form:
    form = db.query(Form).filter(Form.slug == slug).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.status != FormStatus.PUBLISHED:
        # Same 404 status the spec calls for, but a distinguishable detail
        # so the frontend can render "no longer accepting responses"
        # instead of a generic not-found page for a link that used to work.
        raise HTTPException(
            status_code=404, detail="This form is no longer accepting responses"
        )
    return form


@router.get("/forms/{slug}", response_model=PublicFormOut)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = _get_published_form_or_404(db, slug)
    questions = [q for q in form.questions if q.deleted_at is None]
    return PublicFormOut(
        title=form.title,
        welcome_title=form.welcome_title,
        welcome_description=form.welcome_description,
        thank_you_title=form.thank_you_title,
        thank_you_description=form.thank_you_description,
        theme_json=form.theme_json,
        questions=[
            PublicQuestionOut(
                id=q.id,
                type=q.type,
                title=q.title,
                description=q.description,
                is_required=q.is_required,
                settings_json=q.settings_json,
                options=[PublicOptionOut(id=o.id, label=o.label) for o in q.options],
            )
            for q in questions
        ],
    )


@router.post("/forms/{slug}/responses", response_model=PublicSubmitOut)
def submit_response(slug: str, payload: PublicSubmitIn, db: Session = Depends(get_db)):
    form = _get_published_form_or_404(db, slug)
    # Only the form's current live questions are ever considered - a
    # stray question_id in the payload (stale client, tampering) is
    # silently ignored rather than trusted.
    questions_by_id = {q.id: q for q in form.questions if q.deleted_at is None}
    submitted = {a.question_id: a.value for a in payload.answers}

    errors: dict[int, str] = {}
    for question_id, question in questions_by_id.items():
        error = validate_answer(question, submitted.get(question_id))
        if error:
            errors[question_id] = error
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    response = Response(form_id=form.id, is_complete=True, submitted_at=datetime.utcnow())
    db.add(response)
    db.flush()

    for question_id, question in questions_by_id.items():
        value = submitted.get(question_id)
        if value is None or value == "":
            continue  # optional question left blank
        db.add(
            Answer(
                response_id=response.id,
                question_id=question_id,
                **answer_fields(question, value),
            )
        )

    db.commit()
    return PublicSubmitOut(
        thank_you_title=form.thank_you_title,
        thank_you_description=form.thank_you_description,
    )
