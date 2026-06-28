import json
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.reference import Category, District, Locality, Province

DATA_PATH = Path(__file__).with_name("seed_data.json")


def load_data():
    with DATA_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def get_or_create(session, model, **kwargs):
    existing = session.execute(select(model).filter_by(**kwargs)).scalar_one_or_none()
    if existing:
        return existing
    obj = model(**kwargs)
    session.add(obj)
    session.flush()
    return obj


def seed():
    payload = load_data()
    with SessionLocal() as session:
        for category_name in payload.get("categories", []):
            get_or_create(session, Category, name=category_name, is_active=True)

        for province_name in payload.get("provinces", []):
            get_or_create(session, Province, name=province_name, is_active=True)

        for item in payload.get("districts", []):
            province_name = item.get("province_name")
            district_name = item.get("name")
            if not province_name or not district_name:
                continue
            province = session.execute(
                select(Province).where(Province.name == province_name)
            ).scalar_one_or_none()
            if not province:
                continue
            get_or_create(
                session,
                District,
                name=district_name,
                province_id=province.id,
                is_active=True,
            )

        for item in payload.get("localities", []):
            province_name = item.get("province_name")
            district_name = item.get("district_name")
            locality_name = item.get("name")
            if not province_name or not district_name or not locality_name:
                continue
            district = session.execute(
                select(District)
                .join(Province, Province.id == District.province_id)
                .where(Province.name == province_name)
                .where(District.name == district_name)
            ).scalar_one_or_none()
            if not district:
                continue
            get_or_create(
                session,
                Locality,
                name=locality_name,
                district_id=district.id,
                is_active=True,
            )

        session.commit()


if __name__ == "__main__":
    if not settings.db_name:
        raise SystemExit("Database not configured")
    seed()
    print("Seed completed")
