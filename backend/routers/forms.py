from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Answer,
    Form,
    FormStatus,
    Question,
    QuestionOption,
    QuestionType,
    Response,
    User,
)
from schemas import (
    AnswerOut,
    FormCreate,
    FormListOut,
    FormOut,
    FormSummaryOut,
    FormUpdate,
    OptionCountOut,
    OptionIn,
    QuestionCreate,
    QuestionOut,
    QuestionUpdate,
    ReorderIn,
    ResponseOut,
    QuestionSummaryOut,
    ValueCountOut,
)
from slugs import generate_slug

router = APIRouter(prefix="/api")


# --- Shared helpers -----------------------------------------------------


def get_form_or_404(db: Session, form_id: int) -> Form:
    form = db.query(Form).filter(Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def get_question_or_404(db: Session, question_id: int) -> Question:
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.deleted_at.is_(None))
        .first()
    )
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


def _form_to_out(form: Form) -> FormOut:
    visible_questions = [q for q in form.questions if q.deleted_at is None]
    return FormOut.model_validate(
        {
            "id": form.id,
            "title": form.title,
            "slug": form.slug,
            "status": form.status,
            "welcome_title": form.welcome_title,
            "welcome_description": form.welcome_description,
            "thank_you_title": form.thank_you_title,
            "thank_you_description": form.thank_you_description,
            "theme_json": form.theme_json,
            "created_at": form.created_at,
            "updated_at": form.updated_at,
            "published_at": form.published_at,
            "questions": visible_questions,
        }
    )


def sync_options(db: Session, question: Question, option_ins: list[OptionIn]) -> None:
    existing_by_id = {option.id: option for option in question.options}
    submitted_ids = {o.id for o in option_ins if o.id is not None}

    # Options dropped from the list are deleted, but answers that already
    # picked them are not - value_option_id is nulled out (the FK target
    # is gone) while value_json keeps the original submitted choice as a
    # historical record.
    for option in list(question.options):
        if option.id not in submitted_ids:
            db.query(Answer).filter(Answer.value_option_id == option.id).update(
                {"value_option_id": None}
            )
            db.delete(option)

    for index, option_in in enumerate(option_ins):
        position = float(index * 1000)
        if option_in.id is not None and option_in.id in existing_by_id:
            existing_by_id[option_in.id].label = option_in.label
            existing_by_id[option_in.id].position = position
        else:
            db.add(
                QuestionOption(
                    question_id=question.id,
                    label=option_in.label,
                    position=position,
                )
            )


def reorder_question(db: Session, form: Form, payload: ReorderIn) -> None:
    by_id = {q.id: q for q in form.questions}
    question = by_id.get(payload.question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found in this form")

    after = by_id.get(payload.after_id) if payload.after_id is not None else None
    before = by_id.get(payload.before_id) if payload.before_id is not None else None

    # Only this one row is written - the entire point of a float position
    # column is that a drag-and-drop move never has to renumber siblings.
    if after and before:
        question.position = (after.position + before.position) / 2
    elif after:
        question.position = after.position + 1000.0
    elif before:
        question.position = before.position / 2
    else:
        question.position = 1000.0


def _answer_value(answer: Answer) -> Any:
    if answer.value_option_id is not None:
        option = answer.selected_option
        return {"option_id": answer.value_option_id, "label": option.label if option else None}
    if answer.value_number is not None:
        return answer.value_number
    if answer.value_text is not None:
        return answer.value_text
    return answer.value_json


def _response_to_out(response: Response) -> ResponseOut:
    answers = [
        AnswerOut(
            question_id=a.question_id,
            question_title=a.question.title,
            question_type=a.question.type,
            value=_answer_value(a),
        )
        for a in response.answers
    ]
    return ResponseOut(
        id=response.id,
        started_at=response.started_at,
        submitted_at=response.submitted_at,
        is_complete=response.is_complete,
        answers=answers,
    )


def _summarize_question(db: Session, question: Question) -> QuestionSummaryOut:
    total = db.query(Answer).filter(Answer.question_id == question.id).count()
    base = dict(
        question_id=question.id,
        question_title=question.title,
        question_type=question.type,
        total_answers=total,
    )

    if question.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
        # question_options is a real table (not a JSON blob) specifically
        # so this can GROUP BY option in SQL instead of counting in Python.
        rows = (
            db.query(QuestionOption.label, func.count(Answer.id))
            .outerjoin(Answer, Answer.value_option_id == QuestionOption.id)
            .filter(QuestionOption.question_id == question.id)
            .group_by(QuestionOption.id)
            .order_by(QuestionOption.position)
            .all()
        )
        options = [
            OptionCountOut(
                label=label,
                count=count,
                percentage=(count / total * 100) if total else 0.0,
            )
            for label, count in rows
        ]
        return QuestionSummaryOut(**base, options=options)

    if question.type in (QuestionType.NUMBER, QuestionType.RATING):
        average = (
            db.query(func.avg(Answer.value_number))
            .filter(Answer.question_id == question.id)
            .scalar()
        )
        rows = (
            db.query(Answer.value_number, func.count(Answer.id))
            .filter(Answer.question_id == question.id)
            .group_by(Answer.value_number)
            .order_by(Answer.value_number)
            .all()
        )
        distribution = [
            ValueCountOut(value=value, count=count) for value, count in rows if value is not None
        ]
        return QuestionSummaryOut(**base, average=average, distribution=distribution)

    # short_text, long_text, email, date: free text isn't aggregated by
    # design (see README assumptions) - just surface recent samples.
    samples = [
        a.value_text
        for a in db.query(Answer)
        .filter(Answer.question_id == question.id)
        .order_by(Answer.id.desc())
        .limit(5)
        .all()
    ]
    return QuestionSummaryOut(**base, samples=samples)


# --- Forms -----------------------------------------------------------


@router.get("/forms", response_model=list[FormListOut])
def list_forms(db: Session = Depends(get_db)):
    # Single JOIN + GROUP BY rather than one count query per form.
    rows = (
        db.query(Form, func.count(Response.id).label("response_count"))
        .outerjoin(Response, Response.form_id == Form.id)
        .group_by(Form.id)
        .order_by(Form.created_at.desc())
        .all()
    )
    return [
        FormListOut(
            id=form.id,
            title=form.title,
            slug=form.slug,
            status=form.status,
            response_count=count,
            created_at=form.created_at,
            updated_at=form.updated_at,
        )
        for form, count in rows
    ]


@router.post("/forms", response_model=FormOut, status_code=201)
def create_form(payload: FormCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    form = Form(user_id=user.id, title=payload.title, status=FormStatus.DRAFT)
    db.add(form)
    db.commit()
    db.refresh(form)
    return _form_to_out(form)


@router.get("/forms/{form_id}", response_model=FormOut)
def get_form(form_id: int, db: Session = Depends(get_db)):
    return _form_to_out(get_form_or_404(db, form_id))


@router.patch("/forms/{form_id}", response_model=FormOut)
def update_form(form_id: int, payload: FormUpdate, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(form, field, value)
    db.commit()
    db.refresh(form)
    return _form_to_out(form)


@router.delete("/forms/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    db.delete(form)
    db.commit()


@router.post("/forms/{form_id}/duplicate", response_model=FormOut, status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    original = get_form_or_404(db, form_id)
    copy = Form(
        user_id=original.user_id,
        title=f"{original.title} (copy)",
        status=FormStatus.DRAFT,
        welcome_title=original.welcome_title,
        welcome_description=original.welcome_description,
        thank_you_title=original.thank_you_title,
        thank_you_description=original.thank_you_description,
        theme_json=original.theme_json,
    )
    db.add(copy)
    db.flush()

    for question in original.questions:
        if question.deleted_at is not None:
            continue
        new_question = Question(
            form_id=copy.id,
            type=question.type,
            title=question.title,
            description=question.description,
            is_required=question.is_required,
            position=question.position,
            settings_json=question.settings_json,
        )
        db.add(new_question)
        db.flush()
        for option in question.options:
            db.add(
                QuestionOption(
                    question_id=new_question.id,
                    label=option.label,
                    position=option.position,
                )
            )

    db.commit()
    db.refresh(copy)
    return _form_to_out(copy)


@router.post("/forms/{form_id}/publish", response_model=FormOut)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    if form.slug is None:
        form.slug = generate_slug(db)
    form.status = FormStatus.PUBLISHED
    form.published_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    return _form_to_out(form)


@router.post("/forms/{form_id}/unpublish", response_model=FormOut)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    form.status = FormStatus.DRAFT
    db.commit()
    db.refresh(form)
    return _form_to_out(form)


# --- Questions -----------------------------------------------------------


@router.post("/forms/{form_id}/questions", response_model=QuestionOut, status_code=201)
def create_question(form_id: int, payload: QuestionCreate, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    visible = [q for q in form.questions if q.deleted_at is None]
    max_position = max((q.position for q in visible), default=0.0)

    question = Question(
        form_id=form.id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        is_required=payload.is_required,
        settings_json=payload.settings_json,
        position=max_position + 1000.0,
    )
    db.add(question)
    db.flush()

    if payload.options:
        sync_options(db, question, payload.options)

    db.commit()
    db.refresh(question)
    return question


@router.patch("/questions/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)):
    question = get_question_or_404(db, question_id)
    updates = payload.model_dump(exclude_unset=True, exclude={"options"})
    for field, value in updates.items():
        setattr(question, field, value)

    if payload.options is not None:
        sync_options(db, question, payload.options)

    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = get_question_or_404(db, question_id)
    question.deleted_at = datetime.utcnow()
    db.commit()


@router.patch("/forms/{form_id}/questions/reorder", response_model=list[QuestionOut])
def reorder_questions(form_id: int, payload: ReorderIn, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    reorder_question(db, form, payload)
    db.commit()
    db.refresh(form)
    return [q for q in form.questions if q.deleted_at is None]


# --- Responses & summary -------------------------------------------------


@router.get("/forms/{form_id}/responses", response_model=list[ResponseOut])
def list_responses(form_id: int, db: Session = Depends(get_db)):
    get_form_or_404(db, form_id)
    responses = (
        db.query(Response)
        .filter(Response.form_id == form_id)
        .order_by(Response.started_at.desc())
        .all()
    )
    return [_response_to_out(r) for r in responses]


@router.get("/responses/{response_id}", response_model=ResponseOut)
def get_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(Response).filter(Response.id == response_id).first()
    if response is None:
        raise HTTPException(status_code=404, detail="Response not found")
    return _response_to_out(response)


@router.get("/forms/{form_id}/summary", response_model=FormSummaryOut)
def get_summary(form_id: int, db: Session = Depends(get_db)):
    form = get_form_or_404(db, form_id)
    response_count = db.query(Response).filter(Response.form_id == form_id).count()
    # Includes soft-deleted questions on purpose: a question removed from
    # the live form should still show its historical answers here.
    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position)
        .all()
    )
    summaries = [_summarize_question(db, q) for q in questions]
    return FormSummaryOut(form_id=form.id, response_count=response_count, questions=summaries)
