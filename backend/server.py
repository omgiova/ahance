from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Header, Query, Depends
from fastapi.responses import Response, RedirectResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import cloudinary
import cloudinary.uploader
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import ProjectModel, FileModel, TagModel, get_db, engine
from models import Base

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create tables
Base.metadata.create_all(bind=engine)

# Migrations: add new columns if they don't exist
def run_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN client_logo VARCHAR"))
            conn.commit()
        except Exception:
            pass  # column already exists
        try:
            conn.execute(text("ALTER TABLE tags ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE"))
            conn.commit()
        except Exception:
            pass  # column already exists

run_migrations()

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Local Storage (mantido para arquivos legados já no repositório)
APP_NAME = "behance-portfolio"
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Mount static file serving for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _upload_local(file_id: str, data: bytes, content_type: str, ext: str) -> dict:
    """Fallback: salva arquivo em disco local"""
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    full_path = UPLOADS_DIR / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(data)
    logger.info(f"Local upload: {path}")
    return {"public_id": path, "url": f"/api/files/{path}", "size": len(data)}


def upload_file_storage(file_id: str, data: bytes, content_type: str, ext: str) -> dict:
    """Upload para Cloudinary se configurado, senão salva localmente"""
    if os.environ.get("CLOUDINARY_CLOUD_NAME"):
        if content_type.startswith("video/"):
            resource_type = "video"
        elif content_type == "application/pdf":
            resource_type = "raw"
        else:
            resource_type = "image"
        result = cloudinary.uploader.upload(
            data,
            public_id=f"ahance/{file_id}",
            resource_type=resource_type,
            overwrite=False
        )
        logger.info(f"Cloudinary upload: {result['public_id']}")
        return {"public_id": result["public_id"], "url": result["secure_url"], "size": len(data)}
    else:
        return _upload_local(file_id, data, content_type, ext)


# Models
class Block(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # text, image, grid, carousel, video, embed, separator, spacer
    order: int
    content: Dict[str, Any] = {}  # Flexible content based on block type
    settings: Dict[str, Any] = {}  # Width, padding, etc.


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    cover_image: Optional[str] = None
    client_logo: Optional[str] = None
    category: str = ""
    tags: List[Any] = []  # Pode ser string (legado) ou objeto com name, bgColor, textColor
    tools: List[str] = []
    visibility: str = "public"
    published: bool = False
    blocks: List[Dict[str, Any]] = []  # List of content blocks
    position: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    tags: List[Any] = []  # Pode ser string (legado) ou objeto com name, bgColor, textColor
    tools: List[str] = []
    visibility: str = "public"
    published: bool = False
    blocks: List[Dict[str, Any]] = []
    cover_image: Optional[str] = None
    client_logo: Optional[str] = None
    position: int = 0


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    client_logo: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[Any]] = None
    tools: Optional[List[str]] = None
    visibility: Optional[str] = None
    published: Optional[bool] = None
    blocks: Optional[List[Dict[str, Any]]] = None
    position: Optional[int] = None


class ProjectReorder(BaseModel):
    project_ids: List[str]


@api_router.put("/projects/reorder")
async def reorder_projects(reorder_data: ProjectReorder, db: Session = Depends(get_db)):
    """Reorder projects by updating their positions"""
    try:
        for index, project_id in enumerate(reorder_data.project_ids):
            project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
            if project:
                project.position = index
                project.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        return {"message": "Projects reordered successfully"}
    except Exception as e:
        logger.error(f"Reorder projects failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class FileUploadResponse(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str
    size: int
    download_url: str


# Routes
@api_router.get("/")
async def root():
    return {"message": "Behance Portfolio API"}


@api_router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload image or video file to Cloudinary"""
    try:
        content_type = file.content_type or "application/octet-stream"
        allowed_types = [
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/quicktime", "video/webm",
            "application/pdf"
        ]
        
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        file_id = str(uuid.uuid4())
        data = await file.read()
        result = upload_file_storage(file_id, data, content_type, ext)
        
        db_file = FileModel(
            id=file_id,
            storage_path=result["public_id"],
            original_filename=file.filename,
            content_type=content_type,
            size=result["size"],
            is_deleted=False
        )
        db.add(db_file)
        db.commit()
        
        return FileUploadResponse(
            id=file_id,
            storage_path=result["public_id"],
            original_filename=file.filename,
            content_type=content_type,
            size=result["size"],
            download_url=result["url"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/files/{path:path}")
async def download_file(path: str, db: Session = Depends(get_db)):
    """Download file from local storage"""
    try:
        full_path = UPLOADS_DIR / path
        
        if not full_path.exists():
            # Fallback: redirect to Cloudinary if configured
            if os.environ.get("CLOUDINARY_CLOUD_NAME"):
                db_file = db.query(FileModel).filter(FileModel.storage_path == path).first()
                if db_file:
                    if db_file.content_type.startswith("video/"):
                        resource_type = "video"
                    elif db_file.content_type == "application/pdf":
                        resource_type = "raw"
                    else:
                        resource_type = "image"
                    cloud_url = f"https://res.cloudinary.com/{os.environ['CLOUDINARY_CLOUD_NAME']}/{resource_type}/upload/{path}"
                    return RedirectResponse(url=cloud_url)
            raise HTTPException(status_code=404, detail="File not found")
        
        # Simple content type detection
        if path.endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif path.endswith('.png'):
            content_type = "image/png"
        elif path.endswith('.webp'):
            content_type = "image/webp"
        elif path.endswith('.gif'):
            content_type = "image/gif"
        elif path.endswith('.mp4'):
            content_type = "video/mp4"
        elif path.endswith('.webm'):
            content_type = "video/webm"
        else:
            content_type = "application/octet-stream"
        
        with open(full_path, "rb") as f:
            data = f.read()
        
        logger.info(f"File downloaded: {path}")
        return Response(content=data, media_type=content_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        project_dict = project_data.model_dump()
        project_dict['id'] = str(uuid.uuid4())
        
        db_project = ProjectModel(**project_dict)
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        return Project(**{
            'id': db_project.id,
            'title': db_project.title,
            'description': db_project.description,
            'category': db_project.category,
            'tags': db_project.tags or [],
            'tools': db_project.tools or [],
            'visibility': db_project.visibility,
            'published': db_project.published,
            'blocks': db_project.blocks or [],
            'cover_image': db_project.cover_image,
            'client_logo': db_project.client_logo,
            'position': db_project.position,
            'created_at': db_project.created_at,
            'updated_at': db_project.updated_at
        })
    except Exception as e:
        logger.error(f"Create project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects", response_model=List[Project])
async def get_projects(category: Optional[str] = None, tag: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all projects with optional filters"""
    try:
        query = db.query(ProjectModel)
        
        if category:
            query = query.filter(ProjectModel.category == category)
        if tag:
            query = query.filter(ProjectModel.tags.contains(tag))
        
        projects = query.order_by(ProjectModel.position.asc(), ProjectModel.created_at.desc()).all()
        
        return [Project(**{
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'category': p.category,
            'tags': p.tags or [],
            'tools': p.tools or [],
            'visibility': p.visibility,
            'published': p.published,
            'blocks': p.blocks or [],
            'cover_image': p.cover_image,
            'client_logo': p.client_logo,
            'position': p.position,
            'created_at': p.created_at,
            'updated_at': p.updated_at
        }) for p in projects]
    except Exception as e:
        logger.error(f"Get projects failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a single project by ID"""
    try:
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return Project(**{
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'category': project.category,
            'tags': project.tags or [],
            'tools': project.tools or [],
            'visibility': project.visibility,
            'published': project.published,
            'blocks': project.blocks or [],
            'cover_image': project.cover_image,
            'client_logo': project.client_logo,
            'position': project.position,
            'created_at': project.created_at,
            'updated_at': project.updated_at
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate, db: Session = Depends(get_db)):
    """Update a project"""
    try:
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        for key, value in update_dict.items():
            setattr(project, key, value)
        
        db.commit()
        db.refresh(project)
        
        return Project(**{
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'category': project.category,
            'tags': project.tags or [],
            'tools': project.tools or [],
            'visibility': project.visibility,
            'published': project.published,
            'blocks': project.blocks or [],
            'cover_image': project.cover_image,
            'client_logo': project.client_logo,
            'position': project.position,
            'created_at': project.created_at,
            'updated_at': project.updated_at
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project"""
    try:
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        db.delete(project)
        db.commit()
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Tags endpoints
@api_router.get("/tags")
async def get_all_tags(db: Session = Depends(get_db)):
    """Get all global tags"""
    try:
        tags = db.query(TagModel).all()
        return [{"id": t.id, "name": t.name, "bgColor": t.bg_color, "textColor": t.text_color, "isPinned": bool(getattr(t, 'is_pinned', False))} for t in tags]
    except Exception as e:
        logger.error(f"Get tags failed: {e}")
        # Fallback: query without is_pinned in case migration hasn't run yet
        try:
            result = db.execute(text("SELECT id, name, bg_color, text_color FROM tags")).fetchall()
            return [{"id": r[0], "name": r[1], "bgColor": r[2], "textColor": r[3], "isPinned": False} for r in result]
        except Exception as e2:
            logger.error(f"Get tags fallback failed: {e2}")
            raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/tags")
async def create_tag(tag: dict, db: Session = Depends(get_db)):
    """Create a new global tag"""
    try:
        # Check if tag name already exists
        existing = db.query(TagModel).filter(TagModel.name == tag["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tag already exists")
        
        tag_doc = TagModel(
            id=str(uuid.uuid4()),
            name=tag["name"],
            text_color=tag.get("textColor", "#000000"),
            bg_color=tag.get("bgColor", "#ffffff")
        )
        
        db.add(tag_doc)
        db.commit()
        db.refresh(tag_doc)
        
        return {"id": tag_doc.id, "name": tag_doc.name, "textColor": tag_doc.text_color, "bgColor": tag_doc.bg_color, "isPinned": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    """Delete a global tag"""
    try:
        tag = db.query(TagModel).filter(TagModel.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        db.delete(tag)
        db.commit()
        
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/tags/{tag_id}/pin")
async def pin_tag(tag_id: str, db: Session = Depends(get_db)):
    """Set tag as pinned and add it to all existing projects"""
    try:
        tag = db.query(TagModel).filter(TagModel.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        tag.is_pinned = True
        db.commit()

        tag_obj = {"id": tag.id, "name": tag.name, "bgColor": tag.bg_color, "textColor": tag.text_color}
        projects = db.query(ProjectModel).all()
        for project in projects:
            tags = list(project.tags or [])
            already = any((t.get("id") == tag.id if isinstance(t, dict) else t == tag.name) for t in tags)
            if not already:
                tags.append(tag_obj)
                project.tags = tags
        db.commit()
        return {"message": "Tag pinned and applied to all projects"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pin tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/tags/{tag_id}/unpin")
async def unpin_tag(tag_id: str, db: Session = Depends(get_db)):
    """Unpin tag and remove it from all projects"""
    try:
        tag = db.query(TagModel).filter(TagModel.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        tag.is_pinned = False
        db.commit()

        projects = db.query(ProjectModel).all()
        for project in projects:
            tags = list(project.tags or [])
            new_tags = [t for t in tags if not (t.get("id") == tag_id if isinstance(t, dict) else t == tag.name)]
            project.tags = new_tags
        db.commit()
        return {"message": "Tag unpinned and removed from all projects"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unpin tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/tags/{tag_id}")
async def update_tag(tag_id: str, tag_update: dict, db: Session = Depends(get_db)):
    """Update a global tag - changes propagate to all projects"""
    try:
        tag = db.query(TagModel).filter(TagModel.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Build update dict
        update_dict = {}
        if "name" in tag_update:
            update_dict["name"] = tag_update["name"]
        if "textColor" in tag_update:
            update_dict["text_color"] = tag_update["textColor"]
        if "bgColor" in tag_update:
            update_dict["bg_color"] = tag_update["bgColor"]
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update the tag itself
        for key, value in update_dict.items():
            setattr(tag, key, value)
        
        db.commit()
        db.refresh(tag)
        
        # Return updated tag
        return {"id": tag.id, "name": tag.name, "textColor": tag.text_color, "bgColor": tag.bg_color}
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Root routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Backend is running!", "docs": "/docs"}


app.include_router(api_router)


# CORS: Permitir o domínio do frontend Netlify/Cloudflare
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://portfolio.giovaniamorim.com",  # seu domínio frontend
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("Backend started - Local file storage enabled")


@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Backend shutting down")