from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Header, Query
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "behance-portfolio"
storage_key = None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Object Storage functions
def init_storage():
    """Initialize storage and get session key"""
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        raise


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    """Download file from storage"""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


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
    category: str = ""
    tags: List[Any] = []  # Pode ser string (legado) ou objeto com name, bgColor, textColor
    tools: List[str] = []
    visibility: str = "public"
    published: bool = False
    blocks: List[Dict[str, Any]] = []  # List of content blocks
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


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[Any]] = None  # Pode ser string (legado) ou objeto com name, bgColor, textColor
    tools: Optional[List[str]] = None
    visibility: Optional[str] = None
    published: Optional[bool] = None
    blocks: Optional[List[Dict[str, Any]]] = None


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
async def upload_file(file: UploadFile = File(...)):
    """Upload image or video file"""
    try:
        content_type = file.content_type or "application/octet-stream"
        allowed_types = [
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/quicktime", "video/webm"
        ]
        
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        file_id = str(uuid.uuid4())
        path = f"{APP_NAME}/uploads/{file_id}.{ext}"
        
        data = await file.read()
        result = put_object(path, data, content_type)
        
        file_doc = {
            "id": file_id,
            "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": content_type,
            "size": result["size"],
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.files.insert_one(file_doc)
        
        return FileUploadResponse(
            id=file_id,
            storage_path=result["path"],
            original_filename=file.filename,
            content_type=content_type,
            size=result["size"],
            download_url=f"/api/files/{result['path']}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    """Download file from storage"""
    try:
        record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
        if not record:
            raise HTTPException(status_code=404, detail="File not found")
        
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    """Create a new project"""
    try:
        project_dict = project_data.model_dump()
        project = Project(**project_dict)
        
        doc = project.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.projects.insert_one(doc)
        
        # Return without _id
        return_doc = await db.projects.find_one({"id": project.id}, {"_id": 0})
        if isinstance(return_doc.get('created_at'), str):
            return_doc['created_at'] = datetime.fromisoformat(return_doc['created_at'])
        if isinstance(return_doc.get('updated_at'), str):
            return_doc['updated_at'] = datetime.fromisoformat(return_doc['updated_at'])
        
        return return_doc
    except Exception as e:
        logger.error(f"Create project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects", response_model=List[Project])
async def get_projects(category: Optional[str] = None, tag: Optional[str] = None):
    """Get all projects with optional filters"""
    try:
        query = {}
        if category:
            query["category"] = category
        if tag:
            query["tags"] = tag
        
        projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
        
        for project in projects:
            if isinstance(project.get('created_at'), str):
                project['created_at'] = datetime.fromisoformat(project['created_at'])
            if isinstance(project.get('updated_at'), str):
                project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        
        return projects
    except Exception as e:
        logger.error(f"Get projects failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a single project by ID"""
    try:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, update_data: ProjectUpdate):
    """Update a project"""
    try:
        existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.projects.update_one({"id": project_id}, {"$set": update_dict})
        
        updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
        
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        if isinstance(updated.get('updated_at'), str):
            updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
        
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        result = await db.projects.delete_one({"id": project_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete project failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Tags endpoints
@api_router.get("/tags")
async def get_all_tags():
    """Get all global tags"""
    try:
        tags = await db.tags.find({}, {"_id": 0}).to_list(1000)
        return tags
    except Exception as e:
        logger.error(f"Get tags failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/tags")
async def create_tag(tag: dict):
    """Create a new global tag"""
    try:
        # Check if tag name already exists
        existing = await db.tags.find_one({"name": tag["name"]})
        if existing:
            raise HTTPException(status_code=400, detail="Tag already exists")
        
        tag_doc = {
            "id": str(uuid.uuid4()),
            "name": tag["name"],
            "textColor": tag.get("textColor", "#000000"),
            "bgColor": tag.get("bgColor", "#ffffff"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.tags.insert_one(tag_doc)
        
        # Return without _id
        return_doc = await db.tags.find_one({"id": tag_doc["id"]}, {"_id": 0})
        return return_doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str):
    """Delete a global tag"""
    try:
        result = await db.tags.delete_one({"id": tag_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {"message": "Tag deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete tag failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()