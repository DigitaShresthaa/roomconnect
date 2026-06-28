"""Add locality_id column to users table."""
from sqlalchemy import text
from app.db.session import engine


def upgrade():
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = 'locality_id'"
            )
        )
        exists = result.scalar()
        if exists:
            print("Column locality_id already exists. Skipping.")
            return

        conn.execute(text("ALTER TABLE users ADD locality_id BIGINT NULL"))
        conn.execute(
            text(
                "ALTER TABLE users ADD CONSTRAINT fk_users_locality "
                "FOREIGN KEY (locality_id) REFERENCES localities(id)"
            )
        )
        conn.commit()
        print("Added locality_id column to users table.")


if __name__ == "__main__":
    upgrade()
