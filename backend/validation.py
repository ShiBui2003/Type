"""Server-side answer validation, shared by every question type.

The client validates on advance for instant feedback (exact copy mirrored
in the frontend), but nothing here trusts that check happened - the
respondent submit endpoint calls validate_answer() for every question
before writing a single row. Messages marked "verified" below are the
exact strings observed on live Typeform forms; the rest are original
copy written in the same short, casual tone since no verified source was
available for them.
"""

from datetime import date
from typing import Any, Optional

from models import Question, QuestionType

REQUIRED_MESSAGE = "Please fill this in"  # verified
NUMBERS_ONLY_MESSAGE = "Numbers only please"  # verified
INVALID_DATE_MESSAGE = (
    "That date isn't valid. Check the month and day aren't reversed."
)  # verified
INVALID_EMAIL_MESSAGE = "hmm, that email doesn't look right"  # not verified
INVALID_OPTION_MESSAGE = "Please select a valid option"  # not verified


def _is_empty(value: Any) -> bool:
    return value is None or value == "" or (isinstance(value, list) and not value)


def validate_answer(question: Question, value: Any) -> Optional[str]:
    """Returns an error message, or None if the value is acceptable."""

    if _is_empty(value):
        return REQUIRED_MESSAGE if question.is_required else None

    if question.type in (QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT):
        return None

    if question.type == QuestionType.EMAIL:
        text = str(value)
        if "@" not in text or "." not in text.split("@")[-1] or " " in text:
            return INVALID_EMAIL_MESSAGE
        return None

    if question.type == QuestionType.NUMBER:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return NUMBERS_ONLY_MESSAGE
        settings = question.settings_json or {}
        minimum, maximum = settings.get("min"), settings.get("max")
        if minimum is not None and number < minimum:
            return f"Please enter a number of at least {minimum}"
        if maximum is not None and number > maximum:
            return f"Please enter a number of at most {maximum}"
        return None

    if question.type == QuestionType.DATE:
        try:
            date.fromisoformat(str(value))
        except ValueError:
            return INVALID_DATE_MESSAGE
        return None

    if question.type == QuestionType.RATING:
        settings = question.settings_json or {}
        scale = settings.get("scale", 5)
        try:
            rating = int(value)
        except (TypeError, ValueError):
            return NUMBERS_ONLY_MESSAGE
        if rating < 1 or rating > scale:
            return f"Please choose a rating between 1 and {scale}"
        return None

    if question.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
        try:
            option_id = int(value)
        except (TypeError, ValueError):
            return INVALID_OPTION_MESSAGE
        valid_ids = {option.id for option in question.options}
        if option_id not in valid_ids:
            return INVALID_OPTION_MESSAGE
        return None

    return None


def answer_fields(question: Question, value: Any) -> dict:
    """Maps a raw (already-validated) submitted value to the Answer
    columns to set, based on question type. Shared by the public submit
    endpoint and the seed script so the two mappings can't drift apart.
    """
    fields: dict = {"value_json": value}
    if question.type in (QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT, QuestionType.EMAIL, QuestionType.DATE):
        fields["value_text"] = str(value)
    elif question.type in (QuestionType.NUMBER, QuestionType.RATING):
        fields["value_number"] = float(value)
    elif question.type in (QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN):
        fields["value_option_id"] = int(value)
    return fields
