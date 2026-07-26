from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from models import FormStatus, QuestionType

# --- Options -----------------------------------------------------------


class OptionIn(BaseModel):
    # id present -> update that row; id omitted -> create a new one. Any
    # existing option not present in the submitted list gets deleted. See
    # sync_options() in routers/forms.py.
    id: Optional[int] = None
    label: str


class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    position: float


# --- Questions -----------------------------------------------------------


class QuestionCreate(BaseModel):
    type: QuestionType
    title: str
    description: Optional[str] = None
    is_required: bool = False
    settings_json: Optional[dict] = None
    options: Optional[list[OptionIn]] = None


class QuestionUpdate(BaseModel):
    # Every field optional: PATCH only touches what's provided.
    title: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    settings_json: Optional[dict] = None
    options: Optional[list[OptionIn]] = None


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: QuestionType
    title: str
    description: Optional[str]
    is_required: bool
    position: float
    settings_json: Optional[dict] = None
    options: list[OptionOut] = []


# --- Forms -----------------------------------------------------------


class FormCreate(BaseModel):
    title: str


class FormUpdate(BaseModel):
    title: Optional[str] = None
    welcome_title: Optional[str] = None
    welcome_description: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_description: Optional[str] = None
    theme_json: Optional[dict] = None


class FormListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: Optional[str]
    status: FormStatus
    response_count: int
    created_at: datetime
    updated_at: datetime


class FormOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: Optional[str]
    status: FormStatus
    welcome_title: Optional[str]
    welcome_description: Optional[str]
    thank_you_title: Optional[str]
    thank_you_description: Optional[str]
    theme_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    questions: list[QuestionOut] = []


class ReorderIn(BaseModel):
    question_id: int
    # The question that should end up immediately before/after it in the
    # new order. Null means "start of list" / "end of list". Only the
    # moved question's position is recomputed - see reorder_question() in
    # routers/forms.py for why.
    after_id: Optional[int] = None
    before_id: Optional[int] = None


# --- Responses -----------------------------------------------------------


class AnswerOut(BaseModel):
    question_id: int
    question_title: str
    question_type: QuestionType
    value: Any


class ResponseOut(BaseModel):
    id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    is_complete: bool
    answers: list[AnswerOut]


# --- Summary -----------------------------------------------------------


class OptionCountOut(BaseModel):
    label: str
    count: int
    percentage: float


class ValueCountOut(BaseModel):
    value: float
    count: int


class QuestionSummaryOut(BaseModel):
    question_id: int
    question_title: str
    question_type: QuestionType
    total_answers: int
    # Populated depending on question_type; the rest stay null. Forcing
    # choice/rating/text summaries into one flat shape would mean mostly
    # empty columns either way, so this mirrors the settings_json call.
    options: Optional[list[OptionCountOut]] = None
    average: Optional[float] = None
    distribution: Optional[list[ValueCountOut]] = None
    samples: Optional[list[str]] = None


class FormSummaryOut(BaseModel):
    form_id: int
    response_count: int
    questions: list[QuestionSummaryOut]


# --- Public (respondent-facing) -----------------------------------------
# Deliberately separate from FormOut/QuestionOut above rather than the
# same schema with fields filtered out after the fact - this way a
# forgotten field can't leak draft/internal data to respondents.


class PublicOptionOut(BaseModel):
    id: int
    label: str


class PublicQuestionOut(BaseModel):
    id: int
    type: QuestionType
    title: str
    description: Optional[str]
    is_required: bool
    settings_json: Optional[dict] = None
    options: list[PublicOptionOut] = []


class PublicFormOut(BaseModel):
    title: str
    welcome_title: Optional[str]
    welcome_description: Optional[str]
    thank_you_title: Optional[str]
    thank_you_description: Optional[str]
    theme_json: Optional[dict] = None
    questions: list[PublicQuestionOut]


class PublicAnswerIn(BaseModel):
    question_id: int
    value: Any = None


class PublicSubmitIn(BaseModel):
    answers: list[PublicAnswerIn]


class PublicSubmitOut(BaseModel):
    thank_you_title: Optional[str]
    thank_you_description: Optional[str]
