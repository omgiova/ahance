from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Header, Query, Depends, Response as FastAPIResponse
from fastapi.responses import Response, RedirectResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import cloudinary
import cloudinary.uploader
import os
import logging
import unicodedata
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
    migrations = [
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_logo VARCHAR",
        "ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE",
    ]
    for sql in migrations:
        try:
            with engine.connect() as conn:
                conn.execute(text(sql))
                conn.commit()
        except Exception as e:
            logger.warning(f"Migration skipped: {e}")

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


def _normalize_upload_content_type(filename: str, content_type: Optional[str]) -> str:
    normalized = (content_type or "application/octet-stream").lower().strip()
    extension = Path(filename or "").suffix.lower()

    if extension == ".pdf":
        return "application/pdf"

    return normalized


def _get_resource_type_for_content_type(content_type: str) -> str:
    if content_type.startswith("video/"):
        return "video"
    if content_type == "application/pdf":
        return "raw"
    return "image"

def _build_cloudinary_delivery_url(public_id: str, resource_type: str, width: Optional[int] = None) -> str:
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    if not cloud_name:
        return ""

    safe_width = max(200, min(int(width or 1280), 2400))

    if resource_type == "image":
        return f"https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto,c_limit,w_{safe_width}/{public_id}"

    if resource_type == "video":
        return f"https://res.cloudinary.com/{cloud_name}/video/upload/f_auto,q_auto:good,vc_auto,c_limit,w_{safe_width}/{public_id}"

    return f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}"


def _normalize_filename(name: str) -> str:
    return unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode("ascii").lower().strip()


RESUME_NAME_CANDIDATES = {
    "pt": [
        "Currículo - Giovani Amorim.pdf",
        "Curriculo - Giovani Amorim.pdf",
    ],
    "en": [
        "Giovani Amorim - Resume.pdf",
        "Resume - Giovani Amorim.pdf",
    ],
}


def delete_storage_files(storage_paths: list, db):
    """Delete files from Cloudinary (or local) and remove from DB"""
    if not storage_paths:
        return
    for path in storage_paths:
        if not path:
            continue
        try:
            db_file = db.query(FileModel).filter(FileModel.storage_path == path).first()
            if os.environ.get("CLOUDINARY_CLOUD_NAME"):
                resource_type = _get_resource_type_for_content_type(db_file.content_type if db_file else "image/jpeg")
                cloudinary.uploader.destroy(path, resource_type=resource_type)
                logger.info(f"Cloudinary deleted: {path}")
            else:
                full_path = UPLOADS_DIR / path
                if full_path.exists():
                    full_path.unlink()
                    logger.info(f"Local deleted: {path}")
            if db_file:
                db.delete(db_file)
        except Exception as e:
            logger.warning(f"Could not delete file {path}: {e}")
    db.commit()


def extract_storage_paths_from_blocks(blocks: list) -> set:
    """Extract all storage_path values referenced in project blocks"""
    paths = set()
    for block in (blocks or []):
        c = block.get("content", {})
        # image block
        if c.get("image"):
            paths.add(c["image"])
        # video block (upload)
        if c.get("video") and block.get("content", {}).get("type") == "upload":
            paths.add(c["video"])
        # carousel / grid items
        for item in c.get("items", []) + c.get("images", []):
            if isinstance(item, str):
                paths.add(item)
            elif isinstance(item, dict) and item.get("sourceType") == "upload" and item.get("url"):
                paths.add(item["url"])
        # pdf block
        if c.get("pdf"):
            paths.add(c["pdf"])
        # cover image stored in block (legacy)
        if c.get("cover_image"):
            paths.add(c["cover_image"])
    return paths


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
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {"message": "Giovani Amorim Portfolio API"}


@api_router.api_route("", methods=["GET", "HEAD"])
@api_router.api_route("/", methods=["GET", "HEAD"])
async def api_root():
    return {
        "message": "API is running!",
        "status": "ok",
        "docs": "/docs"
    }


@api_router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload image, video or PDF file to Cloudinary"""
    try:
        original_content_type = file.content_type or "application/octet-stream"
        content_type = _normalize_upload_content_type(file.filename, original_content_type)
        allowed_types = [
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/quicktime", "video/webm",
            "application/pdf"
        ]

        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não suportado: {original_content_type}"
            )

        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        file_id = str(uuid.uuid4())
        data = await file.read()
        logger.info(f"Upload recebido: filename={file.filename}, original_type={original_content_type}, normalized_type={content_type}, size={len(data)}")
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


@api_router.get("/resume/{lang}")
async def download_resume(lang: str, db: Session = Depends(get_db)):
    candidates = RESUME_NAME_CANDIDATES.get((lang or "").lower())
    if not candidates:
        raise HTTPException(status_code=404, detail="Invalid resume language")

    normalized_candidates = {_normalize_filename(name) for name in candidates}
    db_files = (
        db.query(FileModel)
        .filter(FileModel.content_type == "application/pdf", FileModel.is_deleted == False)
        .order_by(FileModel.created_at.desc())
        .all()
    )

    matched_file = next(
        (f for f in db_files if _normalize_filename(f.original_filename) in normalized_candidates),
        None,
    )

    if not matched_file:
        raise HTTPException(
            status_code=404,
            detail="Resume PDF not found. Upload the file in the admin with the expected name.",
        )

    if os.environ.get("CLOUDINARY_CLOUD_NAME"):
        cloud_url = f"https://res.cloudinary.com/{os.environ['CLOUDINARY_CLOUD_NAME']}/raw/upload/fl_attachment/{matched_file.storage_path}"
        return RedirectResponse(url=cloud_url)

    full_path = UPLOADS_DIR / matched_file.storage_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found")

    with open(full_path, "rb") as f:
        data = f.read()

    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{matched_file.original_filename}"'}
    )


@api_router.get("/files/{path:path}")
async def download_file(path: str, w: Optional[int] = Query(None), db: Session = Depends(get_db)):
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
                    cloud_url = _build_cloudinary_delivery_url(path, resource_type, w)
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
async def get_projects(
    response: FastAPIResponse,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    published_only: bool = False,
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all projects with optional filters"""
    try:
        query = db.query(ProjectModel)

        if category:
            query = query.filter(ProjectModel.category == category)
        if tag:
            query = query.filter(ProjectModel.tags.contains(tag))
        if published_only:
            query = query.filter(ProjectModel.published == True)

        query = query.order_by(ProjectModel.position.asc(), ProjectModel.created_at.desc())
        total_count = query.count()

        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)

        projects = query.all()
        response.headers["X-Total-Count"] = str(total_count)

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

        # Detect removed files before applying update
        old_paths = extract_storage_paths_from_blocks(project.blocks or [])
        if project.cover_image:
            old_paths.add(project.cover_image)
        if project.client_logo and not project.client_logo.startswith('http'):
            old_paths.add(project.client_logo)

        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)

        for key, value in update_dict.items():
            setattr(project, key, value)

        db.commit()
        db.refresh(project)

        # Delete files no longer referenced
        new_paths = extract_storage_paths_from_blocks(project.blocks or [])
        if project.cover_image:
            new_paths.add(project.cover_image)
        if project.client_logo and not project.client_logo.startswith('http'):
            new_paths.add(project.client_logo)
        orphaned = old_paths - new_paths
        if orphaned:
            delete_storage_files(list(orphaned), db)
        
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

        # Collect all file references before deleting
        all_paths = extract_storage_paths_from_blocks(project.blocks or [])
        if project.cover_image:
            all_paths.add(project.cover_image)
        if project.client_logo and not project.client_logo.startswith('http'):
            all_paths.add(project.client_logo)

        db.delete(project)
        db.commit()

        # Clean up storage after project is deleted
        if all_paths:
            delete_storage_files(list(all_paths), db)

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
        # Use raw SQL to avoid ORM column mismatch issues during migrations
        result = db.execute(text("SELECT id, name, bg_color, text_color FROM tags")).fetchall()
        # Try to get is_pinned if column exists
        try:
            pinned_result = db.execute(text("SELECT id, is_pinned FROM tags")).fetchall()
            pinned_map = {r[0]: bool(r[1]) for r in pinned_result}
        except Exception:
            db.rollback()
            pinned_map = {}
        return [{"id": r[0], "name": r[1], "bgColor": r[2], "textColor": r[3], "isPinned": pinned_map.get(r[0], False)} for r in result]
    except Exception as e:
        logger.error(f"Get tags failed: {e}")
        db.rollback()
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
@app.api_route("/", methods=["GET", "HEAD"])
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
    expose_headers=["X-Total-Count"],
)


@app.on_event("startup")
async def startup():
    logger.info("Backend started - Local file storage enabled")


@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Backend shutting down")