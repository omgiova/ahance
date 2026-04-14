from sqlalchemy import create_engine, Column, String, Text, DateTime, Boolean, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import json

import os
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, default="")
    category = Column(String, default="")
    tags = Column(JSON, default=list)
    tools = Column(JSON, default=list)
    visibility = Column(String, default="public")
    published = Column(Boolean, default=False)
    blocks = Column(JSON, default=list)
    cover_image = Column(String, nullable=True)
    client_logo = Column(String, nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class FileModel(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, index=True)
    storage_path = Column(String, index=True)
    original_filename = Column(String)
    content_type = Column(String)
    size = Column(Integer)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TagModel(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    bg_color = Column(String, default="#000000")
    text_color = Column(String, default="#FFFFFF")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# Create tables
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
