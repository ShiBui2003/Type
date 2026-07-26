import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class FormStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class QuestionType(str, enum.Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    EMAIL = "email"
    NUMBER = "number"
    DATE = "date"
    MULTIPLE_CHOICE = "multiple_choice"
    DROPDOWN = "dropdown"
    RATING = "rating"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    forms: Mapped[list["Form"]] = relationship(back_populates="user")


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    # Null until first publish. Random and permanent once assigned - see
    # generate_slug() in routers/forms.py for why it's not title-derived.
    slug: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    status: Mapped[FormStatus] = mapped_column(
        Enum(FormStatus, native_enum=False), default=FormStatus.DRAFT
    )
    welcome_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    welcome_description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    thank_you_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    thank_you_description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Type-specific / free-form config (colors, fonts) rather than a fixed
    # set of columns - see settings_json note on Question for the same
    # rationale.
    theme_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="forms")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    responses: Mapped[list["Response"]] = relationship(
        back_populates="form", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"))
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType, native_enum=False))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_required: Mapped[bool] = mapped_column(default=False)
    # Float position so drag-and-drop reorder can move one question by
    # writing a single midpoint value instead of renumbering every row.
    position: Mapped[float] = mapped_column()
    # Rating scale, number min/max, etc. Forcing eight very different
    # question types into fixed columns would make a table that's mostly
    # nulls; this keeps type-specific config out of the schema.
    settings_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Soft delete: a published form's questions may already have answers
    # attached. Hard-deleting the row would orphan those answers (or
    # cascade-delete them, silently destroying response history). Editors
    # only ever see deleted_at IS NULL; summary/export can still join back
    # to a removed question's historical answers.
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    form: Mapped["Form"] = relationship(back_populates="questions")
    options: Mapped[list["QuestionOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.position",
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    label: Mapped[str] = mapped_column(String)
    position: Mapped[float] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    question: Mapped["Question"] = relationship(back_populates="options")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_complete: Mapped[bool] = mapped_column(default=False)
    meta_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    form: Mapped["Form"] = relationship(back_populates="responses")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="response", cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    response_id: Mapped[int] = mapped_column(ForeignKey("responses.id"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    value_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    value_number: Mapped[Optional[float]] = mapped_column(nullable=True)
    value_option_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("question_options.id"), nullable=True
    )
    # Raw submitted value, kept alongside the typed columns above. The
    # typed columns exist so SQL can AVG()/GROUP BY directly; this JSON
    # column is the fallback of record - e.g. when an option is deleted
    # from the builder, value_option_id is nulled out but this still shows
    # what was actually chosen at submission time.
    value_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    response: Mapped["Response"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship()
    selected_option: Mapped[Optional["QuestionOption"]] = relationship()
