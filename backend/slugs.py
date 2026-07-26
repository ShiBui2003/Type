import secrets
import string

from sqlalchemy.orm import Session

from models import Form

_ALPHABET = string.ascii_lowercase + string.digits


def generate_slug(db: Session, length: int = 10) -> str:
    """Random URL-safe token, not derived from the title.

    A title-derived slug ("my-survey") collides across users and leaks
    the form's name into a URL meant to be shared publicly. Real Typeform
    uses random tokens for the same reason. Collisions are astronomically
    unlikely at this length, but we check anyway since it's one query.
    """
    while True:
        candidate = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        exists = db.query(Form).filter(Form.slug == candidate).first()
        if not exists:
            return candidate
