from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RoomConnect API"
    env: str = "local"
    api_v1_prefix: str = "/api/v1"

    db_host: str = "localhost"
    db_port: int = 1433
    db_name: str = "roomconnect"
    db_user: str = "roomconnect"
    db_password: str = "change_me"

    jwt_secret: str = "change_me"
    jwt_access_ttl_minutes: int = 60 * 24 * 2
    jwt_refresh_ttl_days: int = 7
    email_verification_ttl_hours: int = 24

    smtp_host: str = "smtp.example.com"
    smtp_port: int = 587
    smtp_username: str = "your_user"
    smtp_password: str = "your_password"
    smtp_from_email: str = "no-reply@example.com"

    public_app_url: str = "http://localhost:5173"

    cors_origins: str = "http://localhost:5173"

    media_root: str = "media"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
