import smtplib
from email.message import EmailMessage
import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


def _smtp_is_configured() -> bool:
    host = (settings.smtp_host or "").strip()
    if not host:
        return False

    # Treat the scaffold/default placeholder as disabled for local development.
    if host == "smtp.example.com":
        return False

    return True


def send_email(to_email: str, subject: str, body: str) -> None:
    if not _smtp_is_configured():
        logger.info("SMTP is not configured; skipping email to %s", to_email)
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


def send_verification_email(to_email: str, token: str) -> None:
    link = f"{settings.public_app_url}/verify-email?token={token}"
    body = (
        "Welcome to RoomConnect.\n\n"
        "Please verify your email address using the link below:\n"
        f"{link}\n\n"
        "If you did not request this, you can ignore this email."
    )
    send_email(to_email, "Verify your RoomConnect email", body)
