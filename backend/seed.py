"""Idempotent seed data, run from the app's lifespan handler on every
boot (see main.py). Only runs once: if any form already exists, this is
a no-op, so it's safe to leave wired up permanently rather than needing
a separate one-time setup step that's easy to forget on a fresh deploy.
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

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
from slugs import generate_slug
from validation import answer_fields


def seed_if_empty(db: Session) -> None:
    if db.query(Form).count() > 0:
        return

    user = User(name="Demo Creator", email="creator@example.com")
    db.add(user)
    db.flush()

    _seed_feedback_form(db, user)
    _seed_event_form(db, user)
    db.commit()


def _publish(db: Session, form: Form) -> None:
    form.slug = generate_slug(db)
    form.status = FormStatus.PUBLISHED
    form.published_at = datetime.utcnow()


def _add_response(db: Session, form: Form, answers: dict[Question, object]) -> None:
    response = Response(form_id=form.id, is_complete=True, submitted_at=datetime.utcnow())
    db.add(response)
    db.flush()
    for question, value in answers.items():
        db.add(
            Answer(
                response_id=response.id,
                question_id=question.id,
                **answer_fields(question, value),
            )
        )


def _seed_feedback_form(db: Session, user: User) -> None:
    form = Form(user_id=user.id, title="Customer Feedback Survey")
    db.add(form)
    db.flush()

    name_q = Question(
        form_id=form.id, type=QuestionType.SHORT_TEXT,
        title="What's your name?", is_required=True, position=1000.0,
    )
    email_q = Question(
        form_id=form.id, type=QuestionType.EMAIL,
        title="What's your email?", is_required=True, position=2000.0,
    )
    source_q = Question(
        form_id=form.id, type=QuestionType.MULTIPLE_CHOICE,
        title="How did you hear about us?", is_required=True, position=3000.0,
    )
    country_q = Question(
        form_id=form.id, type=QuestionType.DROPDOWN,
        title="Which country are you in?", is_required=True, position=4000.0,
    )
    feedback_q = Question(
        form_id=form.id, type=QuestionType.LONG_TEXT,
        title="Any additional feedback?", is_required=False, position=5000.0,
    )
    db.add_all([name_q, email_q, source_q, country_q, feedback_q])
    db.flush()

    source_options = [
        QuestionOption(question_id=source_q.id, label=label, position=i * 1000.0)
        for i, label in enumerate(
            ["Social media", "Friend or colleague", "Search engine", "Other"]
        )
    ]
    country_options = [
        QuestionOption(question_id=country_q.id, label=label, position=i * 1000.0)
        for i, label in enumerate(
            ["United States", "Canada", "United Kingdom", "India", "Other"]
        )
    ]
    db.add_all(source_options + country_options)
    db.flush()

    _publish(db, form)

    sample_responses = [
        {
            name_q: "Amara Okafor", email_q: "amara@example.com",
            source_q: source_options[0].id, country_q: country_options[3].id,
            feedback_q: "Really enjoyed the onboarding flow.",
        },
        {
            name_q: "Diego Fernandez", email_q: "diego@example.com",
            source_q: source_options[1].id, country_q: country_options[0].id,
        },
        {
            name_q: "Priya Sharma", email_q: "priya@example.com",
            source_q: source_options[2].id, country_q: country_options[3].id,
            feedback_q: "Would love a dark mode.",
        },
        {
            name_q: "Liam O'Brien", email_q: "liam@example.com",
            source_q: source_options[0].id, country_q: country_options[2].id,
        },
        {
            name_q: "Noah Kim", email_q: "noah@example.com",
            source_q: source_options[3].id, country_q: country_options[1].id,
            feedback_q: "Great support team!",
        },
    ]
    for answers in sample_responses:
        _add_response(db, form, answers)


def _seed_event_form(db: Session, user: User) -> None:
    form = Form(user_id=user.id, title="Event RSVP")
    db.add(form)
    db.flush()

    attend_q = Question(
        form_id=form.id, type=QuestionType.MULTIPLE_CHOICE,
        title="Will you attend the event?", is_required=True,
        settings_json={"variant": "yes_no"}, position=1000.0,
    )
    guests_q = Question(
        form_id=form.id, type=QuestionType.NUMBER,
        title="How many guests will you bring?", is_required=True,
        settings_json={"min": 0, "max": 10}, position=2000.0,
    )
    date_q = Question(
        form_id=form.id, type=QuestionType.DATE,
        title="What date works best for you?", is_required=True, position=3000.0,
    )
    rating_q = Question(
        form_id=form.id, type=QuestionType.RATING,
        title="How excited are you for this event?", is_required=True,
        settings_json={"scale": 5}, position=4000.0,
    )
    db.add_all([attend_q, guests_q, date_q, rating_q])
    db.flush()

    attend_options = [
        QuestionOption(question_id=attend_q.id, label=label, position=i * 1000.0)
        for i, label in enumerate(["Yes", "No"])
    ]
    db.add_all(attend_options)
    db.flush()

    _publish(db, form)

    today = datetime.utcnow().date()
    sample_responses = [
        {
            attend_q: attend_options[0].id, guests_q: 2,
            date_q: (today + timedelta(days=14)).isoformat(), rating_q: 5,
        },
        {
            attend_q: attend_options[0].id, guests_q: 0,
            date_q: (today + timedelta(days=10)).isoformat(), rating_q: 4,
        },
        {
            attend_q: attend_options[1].id, guests_q: 0,
            date_q: (today + timedelta(days=14)).isoformat(), rating_q: 2,
        },
        {
            attend_q: attend_options[0].id, guests_q: 4,
            date_q: (today + timedelta(days=21)).isoformat(), rating_q: 5,
        },
    ]
    for answers in sample_responses:
        _add_response(db, form, answers)
