# Seed Reference Data

Edit seed_data.json to add categories, provinces, districts, and localities.

Schema:
- categories: ["Room", "Flat"]
- provinces: ["Bagmati"]
- districts: [{"name": "Kathmandu", "province_name": "Bagmati"}]
- localities: [{"name": "Baneshwor", "district_name": "Kathmandu", "province_name": "Bagmati"}]

Run from backend/ with the app module on PYTHONPATH:

python -m scripts.seed_reference

## Seed Admin User

Set environment variables (PowerShell example):

$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="change_me_123"
$env:ADMIN_NAME="Admin User"
$env:ADMIN_PHONE="9800000000"

To reset the password for an existing admin:

$env:ADMIN_RESET_PASSWORD="true"

Run from backend/ with the app module on PYTHONPATH:

python -m scripts.seed_admin

## Backups

Set optional environment variables:

$env:BACKUP_DIR="backups"

### Database backup

Database backup is not provided by this project. Use your preferred SQL Server backup tooling (`sqlcmd`, `bcp`, or vendor tools) to export or backup data as needed.

### SQL Server connection target

The backend currently connects with Windows Integrated Authentication to the local SQL Server LocalDB instance:

`(localdb)\MSSQLLocalDB`

This is hardcoded in `app/db/session.py` and is separate from the legacy `DB_HOST` / `DB_PORT` values.

### Media backup

Creates a zip of the media directory.

python -m scripts.backup_media
