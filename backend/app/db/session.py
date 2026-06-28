from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

from app.core.config import settings


def _build_db_url() -> str:
    # Build connection string for SQL Server LocalDB via pyodbc (driver hardcoded)
    connection_string = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        r"SERVER=(localdb)\MSSQLLocalDB;"
        f"DATABASE={settings.db_name};"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )
    return f"mssql+pyodbc:///?odbc_connect={quote_plus(connection_string)}"


engine = create_engine(_build_db_url(), pool_pre_ping=True)

# SQLAlchemy 2.0.34 does not recognize SQL Server 17 and may emit
# non-T-SQL pagination syntax (FETCH FIRST). Clamp to SQL Server 16
# behavior until the dependency is upgraded.
if engine.dialect.name == "mssql":
    _original_get_server_version_info = engine.dialect._get_server_version_info

    def _compat_get_server_version_info(connection):
        version_info = _original_get_server_version_info(connection)
        if version_info and version_info[0] >= 17:
            return (16, 0, 0, 0)
        return version_info

    engine.dialect._get_server_version_info = _compat_get_server_version_info

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
